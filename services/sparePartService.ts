import { FilterQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { PartUsageModel } from "../models/partUsageModel";
import { SparePartModel } from "../models/sparePartModel";
import { StockMovementModel } from "../models/stockMovementModel";
import { AssetRepository } from "../repositories/assetRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { MaintenanceRepository } from "../repositories/maintenanceRepository";
import { PartUsageRepository } from "../repositories/partUsageRepository";
import { SparePartRepository } from "../repositories/sparePartRepository";
import { StockMovementRepository } from "../repositories/stockMovementRepository";
import { UserRepository } from "../repositories/userRepository";
import {
  AddStockRequest,
  AdjustStockRequest,
  CreateSparePartRequest,
  DeductStockRequest,
  RecordPartUsageRequest,
  ReservePartRequest,
  StockStatus,
  UpdateSparePartRequest,
} from "../types/sparePart";
import { NotificationService } from "./notificationService";

type StockOperationResult = {
  sparePart: SparePartModel;
  movement: StockMovementModel;
};

type PartUsageResult = {
  sparePart: SparePartModel;
  usage: PartUsageModel;
  movement: StockMovementModel;
};

// *Purpose: This spare part class is responsible for handling the business logic of the spare part entity. It interacts with the spare part repositories to perform inventory operations.
export class SparePartService {
  private sparePartRepository: SparePartRepository;
  private stockMovementRepository: StockMovementRepository;
  private partUsageRepository: PartUsageRepository;
  private categoryRepository: CategoryRepository;
  private assetRepository: AssetRepository;
  private maintenanceRepository: MaintenanceRepository;
  private userRepository: UserRepository;
  private notificationService: NotificationService;

  constructor() {
    this.sparePartRepository = new SparePartRepository();
    this.stockMovementRepository = new StockMovementRepository();
    this.partUsageRepository = new PartUsageRepository();
    this.categoryRepository = new CategoryRepository();
    this.assetRepository = new AssetRepository();
    this.maintenanceRepository = new MaintenanceRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
  }

  private getAvailableStock(sparePart: SparePartModel): number {
    return sparePart.stockOnHand - sparePart.reservedStock;
  }

  private calculateStatus(
    stockOnHand: number,
    reservedStock: number,
    reorderPoint: number,
  ): StockStatus {
    const availableStock = stockOnHand - reservedStock;

    if (stockOnHand <= 0) return "Out of Stock";
    if (availableStock <= 0 || stockOnHand <= Math.ceil(reorderPoint / 2)) return "Critical";
    if (stockOnHand <= reorderPoint) return "Low Stock";
    return "In Stock";
  }

  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findActiveCategoryById(categoryId);
    if (!category) throw new AppError("Category not found or inactive", 400);
  }

  private async validateCompatibleAssets(assetIds: string[] = []): Promise<void> {
    for (const assetId of assetIds) {
      const asset = await this.assetRepository.searchAsset({ _id: assetId });
      if (!asset) throw new AppError("Compatible asset not found", 400);
    }
  }

  private async validateUser(userId: string, message = "User not found"): Promise<void> {
    const user = await this.userRepository.searchUser({ _id: userId });
    if (!user) throw new AppError(message, 400);
  }

  private async getSparePartOrFail(id: string): Promise<SparePartModel> {
    const sparePart = await this.sparePartRepository.getSparePart(id);
    if (!sparePart) throw new AppError("Spare part not found", 404);
    return sparePart;
  }

  private async updateStockSnapshot(
    sparePart: SparePartModel,
    stockOnHand: number,
    reservedStock: number,
    reorderPoint = sparePart.reorderPoint,
  ): Promise<SparePartModel> {
    if (stockOnHand < 0) throw new AppError("Stock on hand cannot be negative", 400);
    if (reservedStock < 0) throw new AppError("Reserved stock cannot be negative", 400);
    if (reservedStock > stockOnHand)
      throw new AppError("Reserved stock cannot exceed stock on hand", 400);

    const updatedSparePart = await this.sparePartRepository.updateSparePart(sparePart._id, {
      stockOnHand,
      reservedStock,
      reorderPoint,
      status: this.calculateStatus(stockOnHand, reservedStock, reorderPoint),
    });

    if (!updatedSparePart) throw new AppError("Spare part not found", 404);
    return updatedSparePart;
  }

  private async notifyLowStock(sparePart: SparePartModel): Promise<void> {
    if (!["Low Stock", "Critical", "Out of Stock"].includes(sparePart.status)) return;

    await this.notificationService.notifyRoles(["admin", "head_technician", "warehouse_staff"], {
      title: `Spare part ${sparePart.status}`,
      message: `${sparePart.name} is now ${sparePart.status}. Stock on hand: ${sparePart.stockOnHand}.`,
      type: "Spare Parts",
      relatedModel: "SparePart",
      relatedId: sparePart._id.toString(),
      link: `/spare-parts/${sparePart._id.toString()}`,
    });
  }

  async getSparePart(id: string, options?: ParsedQueryOptions): Promise<SparePartModel | null> {
    const sparePart = await this.sparePartRepository.getSparePart(id, options);
    if (!sparePart) throw new AppError("Spare part not found", 404);
    return sparePart;
  }

  async getSpareParts(options?: ParsedQueryOptions): Promise<SparePartModel[]> {
    return this.sparePartRepository.getSpareParts(options);
  }

  async createSparePart(
    data: CreateSparePartRequest,
    actorId: string,
  ): Promise<StockOperationResult> {
    await this.validateUser(actorId, "Actor not found");
    await this.validateCategory(data.category);
    await this.validateCompatibleAssets(data.compatibleAssets);

    const existingPart = await this.sparePartRepository.searchSparePart({
      partNumber: data.partNumber,
    });
    if (existingPart)
      throw new AppError("Spare part with the same part number already exists", 400);

    const reservedStock = data.reservedStock || 0;
    const sparePart = await this.sparePartRepository.createSparePart({
      ...data,
      compatibleAssets: data.compatibleAssets || [],
      reservedStock,
      status: this.calculateStatus(data.stockOnHand, reservedStock, data.reorderPoint),
    });

    const movement = await this.stockMovementRepository.createStockMovement({
      sparePart: sparePart._id,
      type: "Received",
      quantity: data.stockOnHand,
      reference: "Initial Stock",
      note: "Initial spare part stock registration",
      createdBy: actorId,
    });

    await this.notifyLowStock(sparePart);

    return { sparePart, movement };
  }

  async updateSparePart(
    data: Partial<UpdateSparePartRequest> & { _id: string },
  ): Promise<SparePartModel | null> {
    if (!data._id) throw new AppError("Spare part ID is required", 400);

    const sparePart = await this.getSparePartOrFail(data._id);

    if (data.category) await this.validateCategory(data.category);
    if (data.compatibleAssets) await this.validateCompatibleAssets(data.compatibleAssets);

    const stockOnHand = data.stockOnHand ?? sparePart.stockOnHand;
    const reservedStock = data.reservedStock ?? sparePart.reservedStock;
    const reorderPoint = data.reorderPoint ?? sparePart.reorderPoint;

    if (reservedStock > stockOnHand)
      throw new AppError("Reserved stock cannot exceed stock on hand", 400);

    const updatedSparePart = await this.sparePartRepository.updateSparePart(data._id, {
      ...data,
      status: this.calculateStatus(stockOnHand, reservedStock, reorderPoint),
    });
    if (!updatedSparePart) throw new AppError("Spare part not found", 404);
    await this.notifyLowStock(updatedSparePart);
    return updatedSparePart;
  }

  async addStock(
    id: string,
    data: AddStockRequest,
    actorId: string,
  ): Promise<StockOperationResult> {
    await this.validateUser(actorId, "Actor not found");
    const sparePart = await this.getSparePartOrFail(id);
    const updatedSparePart = await this.updateStockSnapshot(
      sparePart,
      sparePart.stockOnHand + data.quantity,
      sparePart.reservedStock,
    );

    const movement = await this.stockMovementRepository.createStockMovement({
      sparePart: id,
      type: "Received",
      quantity: data.quantity,
      reference: data.reference,
      note: data.note,
      createdBy: actorId,
    });

    await this.notifyLowStock(updatedSparePart);

    return { sparePart: updatedSparePart, movement };
  }

  async deductStock(
    id: string,
    data: DeductStockRequest,
    actorId: string,
  ): Promise<StockOperationResult> {
    await this.validateUser(actorId, "Actor not found");
    const sparePart = await this.getSparePartOrFail(id);

    if (data.quantity > this.getAvailableStock(sparePart)) {
      throw new AppError("Insufficient available stock", 400);
    }

    const updatedSparePart = await this.updateStockSnapshot(
      sparePart,
      sparePart.stockOnHand - data.quantity,
      sparePart.reservedStock,
    );

    const movement = await this.stockMovementRepository.createStockMovement({
      sparePart: id,
      type: "Issued",
      quantity: -data.quantity,
      reference: data.reference,
      note: data.note,
      createdBy: actorId,
    });

    await this.notifyLowStock(updatedSparePart);

    return { sparePart: updatedSparePart, movement };
  }

  async adjustStock(
    id: string,
    data: AdjustStockRequest,
    actorId: string,
  ): Promise<StockOperationResult> {
    await this.validateUser(actorId, "Actor not found");
    if (data.quantity === 0) throw new AppError("Adjustment quantity cannot be zero", 400);

    const sparePart = await this.getSparePartOrFail(id);
    const nextStockOnHand = sparePart.stockOnHand + data.quantity;
    const updatedSparePart = await this.updateStockSnapshot(
      sparePart,
      nextStockOnHand,
      sparePart.reservedStock,
    );

    const movement = await this.stockMovementRepository.createStockMovement({
      sparePart: id,
      type: "Adjusted",
      quantity: data.quantity,
      reference: data.reference,
      note: data.note,
      createdBy: actorId,
    });

    await this.notifyLowStock(updatedSparePart);

    return { sparePart: updatedSparePart, movement };
  }

  async reservePart(
    id: string,
    data: ReservePartRequest,
    actorId: string,
  ): Promise<StockOperationResult> {
    await this.validateUser(actorId, "Actor not found");
    const sparePart = await this.getSparePartOrFail(id);

    if (data.quantity > this.getAvailableStock(sparePart)) {
      throw new AppError("Insufficient available stock for reservation", 400);
    }

    const updatedSparePart = await this.updateStockSnapshot(
      sparePart,
      sparePart.stockOnHand,
      sparePart.reservedStock + data.quantity,
    );

    const movement = await this.stockMovementRepository.createStockMovement({
      sparePart: id,
      type: "Reserved",
      quantity: data.quantity,
      reference: data.reference,
      note: data.note,
      createdBy: actorId,
    });

    await this.notifyLowStock(updatedSparePart);

    return { sparePart: updatedSparePart, movement };
  }

  async recordPartUsage(
    id: string,
    data: RecordPartUsageRequest,
    actorId: string,
  ): Promise<PartUsageResult> {
    await this.validateUser(actorId, "Actor not found");
    const sparePart = await this.getSparePartOrFail(id);
    const maintenance = await this.maintenanceRepository.getMaintenance(data.maintenanceJob);
    if (!maintenance) throw new AppError("Maintenance job not found", 400);

    const asset = data.asset || String(maintenance.asset);
    const technician = data.technician || String(maintenance.assignment.technician);
    await this.validateCompatibleAssets([asset]);
    await this.validateUser(technician, "Technician not found");

    if (data.quantity > sparePart.stockOnHand) {
      throw new AppError("Insufficient stock on hand", 400);
    }

    const reservedQuantityUsed = Math.min(sparePart.reservedStock, data.quantity);
    const availableQuantityUsed = data.quantity - reservedQuantityUsed;

    if (availableQuantityUsed > this.getAvailableStock(sparePart)) {
      throw new AppError("Insufficient available stock", 400);
    }

    const updatedSparePart = await this.updateStockSnapshot(
      sparePart,
      sparePart.stockOnHand - data.quantity,
      sparePart.reservedStock - reservedQuantityUsed,
    );

    const usage = await this.partUsageRepository.createPartUsage({
      sparePart: id,
      maintenanceJob: data.maintenanceJob,
      asset,
      technician,
      quantity: data.quantity,
      unit: sparePart.unit,
      note: data.note,
      usedAt: data.usedAt || new Date(),
      recordedBy: actorId,
    });

    const movement = await this.stockMovementRepository.createStockMovement({
      sparePart: id,
      maintenanceJob: data.maintenanceJob,
      type: "Issued",
      quantity: -data.quantity,
      reference: String(maintenance.workOrder || data.maintenanceJob),
      note: data.note || "Part usage recorded for maintenance job",
      createdBy: actorId,
    });

    await this.notifyLowStock(updatedSparePart);

    return { sparePart: updatedSparePart, usage, movement };
  }

  async getStockMovementHistory(
    sparePartId: string,
    options?: ParsedQueryOptions,
  ): Promise<StockMovementModel[]> {
    await this.getSparePartOrFail(sparePartId);

    return this.stockMovementRepository.getStockMovements({
      ...options,
      filter: {
        ...(options?.filter || {}),
        sparePart: sparePartId,
      },
    } as ParsedQueryOptions);
  }

  async getPartUsageHistory(
    sparePartId: string,
    options?: ParsedQueryOptions,
  ): Promise<PartUsageModel[]> {
    await this.getSparePartOrFail(sparePartId);

    return this.partUsageRepository.getPartUsages({
      ...options,
      filter: {
        ...(options?.filter || {}),
        sparePart: sparePartId,
      },
    } as ParsedQueryOptions);
  }

  async getLowStockItems(options?: ParsedQueryOptions): Promise<SparePartModel[]> {
    return this.sparePartRepository.getSpareParts({
      ...options,
      filter: {
        ...(options?.filter || {}),
        status: { $in: ["Low Stock", "Critical", "Out of Stock"] },
      },
    } as ParsedQueryOptions);
  }

  async deleteSparePart(id: string): Promise<SparePartModel | null> {
    const sparePart = await this.sparePartRepository.deleteSparePart(id);
    if (!sparePart) throw new AppError("Spare part not found", 404);
    return sparePart;
  }

  async searchSparePart(query: FilterQuery<SparePartModel>): Promise<SparePartModel | null> {
    const sparePart = await this.sparePartRepository.searchSparePart(query);
    if (!sparePart) throw new AppError("Spare part not found", 404);
    return sparePart;
  }
}

import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, AuthenticatedRequest, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { SparePartService } from "../services/sparePartService";
import {
  addStockSchema,
  adjustStockSchema,
  createSparePartSchema,
  deductStockSchema,
  recordPartUsageSchema,
  reservePartSchema,
  sparePartHistorySchema,
  sparePartIdSchema,
  sparePartListSchema,
  updateSparePartSchema,
} from "../types/sparePart";

// Purpose: This controller class is responsible for handling spare part inventory related requests.
@route("/spare-parts")
export class SparePartController {
  private sparePartService: SparePartService;

  constructor() {
    this.sparePartService = new SparePartService();
  }

  private getActorId(req: Request): string {
    const actorId = (req as AuthenticatedRequest).authUser?.sub;
    if (!actorId) throw new AppError("Authentication required", 401);
    return actorId;
  }

  @route.get("/low-stock")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff", "management"]))
  @UseMiddleware(validate(sparePartListSchema))
  async getLowStockItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const spareParts = await this.sparePartService.getLowStockItems(parsedOptions);
      sendSuccess(res, "Low-stock spare parts fetched successfully", spareParts);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id/movements")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff", "management"]))
  @UseMiddleware(validate(sparePartHistorySchema))
  async getStockMovementHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const movements = await this.sparePartService.getStockMovementHistory(
        req.params.id,
        parsedOptions,
      );
      sendSuccess(res, "Stock movement history fetched successfully", movements);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id/usage")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff", "management"]))
  @UseMiddleware(validate(sparePartHistorySchema))
  async getPartUsageHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const usage = await this.sparePartService.getPartUsageHistory(req.params.id, parsedOptions);
      sendSuccess(res, "Part usage history fetched successfully", usage);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff", "management"]))
  @UseMiddleware(validate(sparePartIdSchema))
  async getSparePart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const sparePart = await this.sparePartService.getSparePart(req.params.id, parsedOptions);
      sendSuccess(res, "Spare part fetched successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff", "management"]))
  @UseMiddleware(validate(sparePartListSchema))
  async getSpareParts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const spareParts = await this.sparePartService.getSpareParts(parsedOptions);
      sendSuccess(res, "Spare parts fetched successfully", spareParts);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff"]))
  @UseMiddleware(validate(createSparePartSchema))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.createSparePart(req.body, this.getActorId(req));
      sendSuccess(res, "Spare part created successfully", sparePart, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/stock/add")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff"]))
  @UseMiddleware(validate(addStockSchema))
  async addStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.addStock(
        req.params.id,
        req.body,
        this.getActorId(req),
      );
      sendSuccess(res, "Spare part stock added successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/stock/deduct")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff"]))
  @UseMiddleware(validate(deductStockSchema))
  async deductStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.deductStock(
        req.params.id,
        req.body,
        this.getActorId(req),
      );
      sendSuccess(res, "Spare part stock deducted successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/stock/adjust")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff"]))
  @UseMiddleware(validate(adjustStockSchema))
  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.adjustStock(
        req.params.id,
        req.body,
        this.getActorId(req),
      );
      sendSuccess(res, "Spare part stock adjusted successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/reserve")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff"]))
  @UseMiddleware(validate(reservePartSchema))
  async reservePart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.reservePart(
        req.params.id,
        req.body,
        this.getActorId(req),
      );
      sendSuccess(res, "Spare part reserved successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/:id/usage")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "technician", "warehouse_staff"]))
  @UseMiddleware(validate(recordPartUsageSchema))
  async recordPartUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usage = await this.sparePartService.recordPartUsage(
        req.params.id,
        req.body,
        this.getActorId(req),
      );
      sendSuccess(res, "Part usage recorded successfully", usage, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.put("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "warehouse_staff"]))
  @UseMiddleware(validate(updateSparePartSchema))
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.updateSparePart(req.body);
      sendSuccess(res, "Spare part updated successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.sparePartService.deleteSparePart(req.params.id);
      sendSuccess(res, "Spare part deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sparePart = await this.sparePartService.searchSparePart(req.body);
      sendSuccess(res, "Spare part fetched successfully", sparePart);
    } catch (error) {
      next(error);
    }
  }
}

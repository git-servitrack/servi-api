import { FilterQuery, UpdateQuery } from "mongoose";
import { sanitizeSelect } from "../helpers/common";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { StockMovement, StockMovementModel } from "../models/stockMovementModel";

// Purpose: This file is responsible for handling all the database operations related to the stock movement model.
export class StockMovementRepository {
  async getStockMovement(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<StockMovementModel | null> {
    let query: any = StockMovement.findById(id);

    if (options?.select) {
      const sanitizedSelect = sanitizeSelect(options.select);
      query = query.select(sanitizedSelect);
    } else {
      query = query.select("-password");
    }

    if (options?.populate && options.populate.length > 0) {
      options.populate.forEach((instruction) => {
        query = query.populate(instruction as any);
      });
    }

    return query.exec();
  }

  async getStockMovements(options?: ParsedQueryOptions): Promise<StockMovementModel[]> {
    let query: any = StockMovement.find(options?.filter || {});

    if (options?.select) {
      const sanitizedSelect = sanitizeSelect(options.select);
      query = query.select(sanitizedSelect);
    } else {
      query = query.select("-password");
    }

    if (options?.sort) query = query.sort(options.sort);

    if (options?.limit) query = query.limit(options.limit);

    if (options?.populate && options.populate.length > 0) {
      options.populate.forEach((instruction) => {
        query = query.populate(instruction as any);
      });
    }

    return query.exec();
  }

  async createStockMovement(data: Partial<StockMovementModel>): Promise<StockMovementModel> {
    return StockMovement.create(data);
  }

  async updateStockMovement(
    id: string,
    data: UpdateQuery<StockMovementModel>,
  ): Promise<StockMovementModel | null> {
    return StockMovement.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteStockMovement(id: string): Promise<StockMovementModel | null> {
    return StockMovement.findByIdAndDelete(id);
  }

  async searchStockMovement(
    query: FilterQuery<StockMovementModel>,
  ): Promise<StockMovementModel | null> {
    return StockMovement.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<StockMovementModel>,
    update?: UpdateQuery<StockMovementModel>,
    options?: { multi?: boolean },
  ): Promise<StockMovementModel | null | { modifiedCount: number }> {
    if (!update) {
      return StockMovement.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await StockMovement.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return StockMovement.findOneAndUpdate(query, update, { new: true }).exec();
  }
}

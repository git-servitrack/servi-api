import { FilterQuery, UpdateQuery } from "mongoose";
import { sanitizeSelect } from "../helpers/common";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { PartUsage, PartUsageModel } from "../models/partUsageModel";

// Purpose: This file is responsible for handling all the database operations related to the part usage model.
export class PartUsageRepository {
  async getPartUsage(id: string, options?: ParsedQueryOptions): Promise<PartUsageModel | null> {
    let query: any = PartUsage.findById(id);

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

  async getPartUsages(options?: ParsedQueryOptions): Promise<PartUsageModel[]> {
    let query: any = PartUsage.find(options?.filter || {});

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

  async createPartUsage(data: Partial<PartUsageModel>): Promise<PartUsageModel> {
    return PartUsage.create(data);
  }

  async updatePartUsage(
    id: string,
    data: UpdateQuery<PartUsageModel>,
  ): Promise<PartUsageModel | null> {
    return PartUsage.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deletePartUsage(id: string): Promise<PartUsageModel | null> {
    return PartUsage.findByIdAndDelete(id);
  }

  async searchPartUsage(query: FilterQuery<PartUsageModel>): Promise<PartUsageModel | null> {
    return PartUsage.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<PartUsageModel>,
    update?: UpdateQuery<PartUsageModel>,
    options?: { multi?: boolean },
  ): Promise<PartUsageModel | null | { modifiedCount: number }> {
    if (!update) {
      return PartUsage.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await PartUsage.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return PartUsage.findOneAndUpdate(query, update, { new: true }).exec();
  }
}

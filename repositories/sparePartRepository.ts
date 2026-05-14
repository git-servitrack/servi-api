import { SparePart, SparePartModel } from "../models/sparePartModel";
import { FilterQuery, UpdateQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { sanitizeSelect } from "../helpers/common";
import { CreateSparePartRequest, UpdateSparePartRequest } from "../types/sparePart";

// Purpose: This file is responsible for handling all the database operations related to the spare part model.
export class SparePartRepository {
  async getSparePart(id: string, options?: ParsedQueryOptions): Promise<SparePartModel | null> {
    let query: any = SparePart.findById(id);

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

  async getSpareParts(options?: ParsedQueryOptions): Promise<SparePartModel[]> {
    let query: any = SparePart.find(options?.filter || {});

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

  async createSparePart(data: CreateSparePartRequest): Promise<SparePartModel> {
    return SparePart.create(data);
  }

  async updateSparePart(
    id: string,
    data: Partial<UpdateSparePartRequest>,
  ): Promise<SparePartModel | null> {
    return SparePart.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateSparePartQuery(
    id: string,
    data: UpdateQuery<SparePartModel>,
  ): Promise<SparePartModel | null> {
    return SparePart.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteSparePart(id: string): Promise<SparePartModel | null> {
    return SparePart.findByIdAndDelete(id);
  }

  async searchSparePart(query: FilterQuery<SparePartModel>): Promise<SparePartModel | null> {
    return SparePart.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<SparePartModel>,
    update?: UpdateQuery<SparePartModel>,
    options?: { multi?: boolean },
  ): Promise<SparePartModel | null | { modifiedCount: number }> {
    if (!update) {
      return SparePart.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await SparePart.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return SparePart.findOneAndUpdate(query, update, { new: true }).exec();
  }
}

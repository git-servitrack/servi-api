import { FilterQuery } from "mongoose";
import { sanitizeSelect } from "../helpers/common";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import {
  DamageDetection,
  DamageDetectionModel,
} from "../models/damageDetectionModel";

// Purpose: This file is responsible for handling database operations related to damage detection results.
export class DamageDetectionRepository {
  async getDetection(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<DamageDetectionModel | null> {
    let query: any = DamageDetection.findById(id);

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

  async getDetections(
    options?: ParsedQueryOptions,
  ): Promise<DamageDetectionModel[]> {
    let query: any = DamageDetection.find(options?.filter || {});

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

  async createDetection(
    data: Partial<DamageDetectionModel>,
  ): Promise<DamageDetectionModel> {
    return DamageDetection.create(data);
  }

  async deleteDetection(id: string): Promise<DamageDetectionModel | null> {
    return DamageDetection.findByIdAndDelete(id);
  }

  async searchDetection(
    query: FilterQuery<DamageDetectionModel>,
  ): Promise<DamageDetectionModel | null> {
    return DamageDetection.findOne(query).exec();
  }
}

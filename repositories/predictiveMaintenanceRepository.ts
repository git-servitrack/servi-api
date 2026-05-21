import { FilterQuery } from "mongoose";
import { sanitizeSelect } from "../helpers/common";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import {
  PredictiveMaintenance,
  PredictiveMaintenanceModel,
} from "../models/predictiveMaintenanceModel";

// Purpose: This file is responsible for handling database operations related to predictive maintenance forecasts.
export class PredictiveMaintenanceRepository {
  async getPrediction(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<PredictiveMaintenanceModel | null> {
    let query: any = PredictiveMaintenance.findById(id);

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

  async getPredictions(
    options?: ParsedQueryOptions,
  ): Promise<PredictiveMaintenanceModel[]> {
    let query: any = PredictiveMaintenance.find(options?.filter || {});

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

  async createPrediction(
    data: Partial<PredictiveMaintenanceModel>,
  ): Promise<PredictiveMaintenanceModel> {
    return PredictiveMaintenance.create(data);
  }

  async deletePrediction(
    id: string,
  ): Promise<PredictiveMaintenanceModel | null> {
    return PredictiveMaintenance.findByIdAndDelete(id);
  }

  async searchPrediction(
    query: FilterQuery<PredictiveMaintenanceModel>,
  ): Promise<PredictiveMaintenanceModel | null> {
    return PredictiveMaintenance.findOne(query).exec();
  }
}

import { Maintenance, MaintenanceModel } from "../models/maintenanceModel";
import { FilterQuery, UpdateQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { sanitizeSelect } from "../helpers/common";
import { CreateMaintenanceRequest, UpdateMaintenanceRequest } from "../types/maintenance";

// Purpose: This file is responsible for handling all the database operations related to the maintenance model.
export class MaintenanceRepository {
  async getMaintenance(id: string, options?: ParsedQueryOptions): Promise<MaintenanceModel | null> {
    let query: any = Maintenance.findById(id);

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

  async getMaintenances(options?: ParsedQueryOptions): Promise<MaintenanceModel[]> {
    let query: any = Maintenance.find(options?.filter || {});

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

  async createMaintenance(data: CreateMaintenanceRequest): Promise<MaintenanceModel> {
    return Maintenance.create(data);
  }

  async updateMaintenance(
    id: string,
    data: Partial<UpdateMaintenanceRequest>,
  ): Promise<MaintenanceModel | null> {
    return Maintenance.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateMaintenanceQuery(
    id: string,
    data: UpdateQuery<MaintenanceModel>,
  ): Promise<MaintenanceModel | null> {
    return Maintenance.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteMaintenance(id: string): Promise<MaintenanceModel | null> {
    return Maintenance.findByIdAndDelete(id);
  }

  async searchMaintenance(query: FilterQuery<MaintenanceModel>): Promise<MaintenanceModel | null> {
    return Maintenance.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<MaintenanceModel>,
    update?: UpdateQuery<MaintenanceModel>,
    options?: { multi?: boolean },
  ): Promise<MaintenanceModel | null | { modifiedCount: number }> {
    if (!update) {
      return Maintenance.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await Maintenance.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Maintenance.findOneAndUpdate(query, update, { new: true }).exec();
  }
}

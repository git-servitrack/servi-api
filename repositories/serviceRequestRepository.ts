import { ServiceRequest, ServiceRequestModel } from "../models/serviceRequestModel";
import { FilterQuery, UpdateQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { sanitizeSelect } from "../helpers/common";
import { CreateServiceRequest, UpdateServiceRequest } from "../types/serviceRequest";

// Purpose: This file is responsible for handling all the database operations related to the service request model.
export class ServiceRequestRepository {
  async getServiceRequest(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<ServiceRequestModel | null> {
    let query: any = ServiceRequest.findById(id);

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

  async getServiceRequests(options?: ParsedQueryOptions): Promise<ServiceRequestModel[]> {
    let query: any = ServiceRequest.find(options?.filter || {});

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

  async createServiceRequest(data: CreateServiceRequest): Promise<ServiceRequestModel> {
    return ServiceRequest.create(data);
  }

  async updateServiceRequest(
    id: string,
    data: Partial<UpdateServiceRequest>,
  ): Promise<ServiceRequestModel | null> {
    return ServiceRequest.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteServiceRequest(id: string): Promise<ServiceRequestModel | null> {
    return ServiceRequest.findByIdAndDelete(id);
  }

  async searchServiceRequest(
    query: FilterQuery<ServiceRequestModel>,
  ): Promise<ServiceRequestModel | null> {
    return ServiceRequest.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<ServiceRequestModel>,
    update?: UpdateQuery<ServiceRequestModel>,
    options?: { multi?: boolean },
  ): Promise<ServiceRequestModel | null | { modifiedCount: number }> {
    if (!update) {
      return ServiceRequest.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await ServiceRequest.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return ServiceRequest.findOneAndUpdate(query, update, { new: true }).exec();
  }
}

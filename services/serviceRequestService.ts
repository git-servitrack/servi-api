import { FilterQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { ServiceRequestModel } from "../models/serviceRequestModel";
import { AssetRepository } from "../repositories/assetRepository";
import { ServiceRequestRepository } from "../repositories/serviceRequestRepository";
import { UserRepository } from "../repositories/userRepository";
import { CreateServiceRequest, UpdateServiceRequest } from "../types/serviceRequest";

// *Purpose: This service class is responsible for handling the business logic of the service request entity. It interacts with the service request repository to perform CRUD operations on the service request entity.
export class ServiceRequestService {
  private serviceRequestRepository: ServiceRequestRepository;
  private userRepository: UserRepository;
  private assetRepository: AssetRepository;

  constructor() {
    this.serviceRequestRepository = new ServiceRequestRepository();
    this.userRepository = new UserRepository();
    this.assetRepository = new AssetRepository();
  }

  async getServiceRequest(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<ServiceRequestModel | null> {
    const serviceRequest = await this.serviceRequestRepository.getServiceRequest(id, options);
    if (!serviceRequest) throw new AppError("Service request not found", 404);
    return serviceRequest;
  }

  async getServiceRequests(options?: ParsedQueryOptions): Promise<ServiceRequestModel[]> {
    return this.serviceRequestRepository.getServiceRequests(options);
  }

  async createServiceRequest(data: CreateServiceRequest): Promise<ServiceRequestModel> {
    const requester = await this.userRepository.searchAndUpdate({ _id: data.requester });
    if (!requester) throw new AppError("Requester or User not found", 400);

    const asset = await this.assetRepository.searchAndUpdate({ _id: data.asset });
    if (!asset) throw new AppError("Asset not found", 400);

    const existingServiceRequestTitle = await this.serviceRequestRepository.searchServiceRequest({
      title: data.title,
    });

    if (existingServiceRequestTitle) {
      throw new AppError("Service request with the same title already exists", 400);
    }

    return await this.serviceRequestRepository.createServiceRequest({ ...data });
  }

  async updateServiceRequest(
    data: Partial<UpdateServiceRequest> & { _id: string },
  ): Promise<ServiceRequestModel | null> {
    if (!data._id) throw new AppError("Service request ID is required", 400);

    const requester = await this.userRepository.searchAndUpdate({ _id: data.requester });
    if (data.requester && !requester) throw new AppError("Requester or User not found", 400);

    const asset = await this.assetRepository.searchAndUpdate({ _id: data.asset });
    if (data.asset && !asset) throw new AppError("Asset not found", 400);

    const serviceRequest = await this.serviceRequestRepository.updateServiceRequest(data._id, data);
    if (!serviceRequest) throw new AppError("Service request not found", 404);
    return serviceRequest;
  }

  async deleteServiceRequest(id: string): Promise<ServiceRequestModel | null> {
    const serviceRequest = await this.serviceRequestRepository.deleteServiceRequest(id);
    if (!serviceRequest) throw new AppError("Service request not found", 404);
    return serviceRequest;
  }

  async searchServiceRequest(
    query: FilterQuery<ServiceRequestModel>,
  ): Promise<ServiceRequestModel | null> {
    const serviceRequest = await this.serviceRequestRepository.searchServiceRequest(query);
    if (!serviceRequest) throw new AppError("Service request not found", 404);
    return serviceRequest;
  }
}

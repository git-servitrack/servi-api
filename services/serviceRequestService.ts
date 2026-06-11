import { FilterQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { ServiceRequestModel } from "../models/serviceRequestModel";
import { AssetRepository } from "../repositories/assetRepository";
import { ServiceRequestRepository } from "../repositories/serviceRequestRepository";
import { UserRepository } from "../repositories/userRepository";
import { CreateServiceRequest, UpdateServiceRequest } from "../types/serviceRequest";
import { NotificationService } from "./notificationService";

// *Purpose: This service class is responsible for handling the business logic of the service request entity. It interacts with the service request repository to perform CRUD operations on the service request entity.
export class ServiceRequestService {
  private serviceRequestRepository: ServiceRequestRepository;
  private userRepository: UserRepository;
  private assetRepository: AssetRepository;
  private notificationService: NotificationService;

  constructor() {
    this.serviceRequestRepository = new ServiceRequestRepository();
    this.userRepository = new UserRepository();
    this.assetRepository = new AssetRepository();
    this.notificationService = new NotificationService();
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

    const serviceRequest = await this.serviceRequestRepository.createServiceRequest({ ...data });
    const relatedId = serviceRequest._id.toString();

    await this.notificationService.notifyUsers([
      {
        recipient: String(serviceRequest.requester),
        title: "Service request created",
        message: `${serviceRequest.title} was created with ${serviceRequest.priority} priority.`,
        type: "Service Request",
        relatedModel: "ServiceRequest",
        relatedId,
        link: `/service-requests/${relatedId}`,
      },
    ]);
    await this.notificationService.notifyRoles(["admin", "head_technician"], {
      title: "New service request",
      message: `${serviceRequest.title} was submitted and needs review.`,
      type: "Service Request",
      relatedModel: "ServiceRequest",
      relatedId,
      link: `/service-requests/${relatedId}`,
    });

    return serviceRequest;
  }

  async updateServiceRequest(
    data: Partial<UpdateServiceRequest> & { _id: string },
  ): Promise<ServiceRequestModel | null> {
    if (!data._id) throw new AppError("Service request ID is required", 400);

    const requester = await this.userRepository.searchAndUpdate({ _id: data.requester });
    if (data.requester && !requester) throw new AppError("Requester or User not found", 400);

    const asset = await this.assetRepository.searchAndUpdate({ _id: data.asset });
    if (data.asset && !asset) throw new AppError("Asset not found", 400);

    const existingServiceRequest =
      await this.serviceRequestRepository.getServiceRequest(data._id);
    if (!existingServiceRequest) throw new AppError("Service request not found", 404);

    const serviceRequest = await this.serviceRequestRepository.updateServiceRequest(data._id, data);
    if (!serviceRequest) throw new AppError("Service request not found", 404);

    if (data.status && data.status !== existingServiceRequest.status) {
      await this.notificationService.notifyUser({
        recipient: String(serviceRequest.requester),
        title: "Service request status updated",
        message: `${serviceRequest.title} moved to ${serviceRequest.status}.`,
        type: "Service Request",
        relatedModel: "ServiceRequest",
        relatedId: serviceRequest._id.toString(),
        link: `/service-requests/${serviceRequest._id.toString()}`,
      });
    }

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

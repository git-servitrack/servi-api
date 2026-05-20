import { FilterQuery } from "mongoose";
import { Cloudinary } from "../helpers/cloudinary";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import {
  MediaFileModel,
  MediaFileRelatedModel,
} from "../models/mediaFileModel";
import { AssetRepository } from "../repositories/assetRepository";
import { DocumentationRepository } from "../repositories/documentationRepository";
import { MaintenanceRepository } from "../repositories/maintenanceRepository";
import { ServiceRequestRepository } from "../repositories/serviceRequestRepository";
import { UserRepository } from "../repositories/userRepository";
import { UploadMediaFileRequest } from "../types/documentation";

// *Purpose: This service class is responsible for handling documentation media uploads and metadata.
export class DocumentationService {
  private documentationRepository: DocumentationRepository;
  private userRepository: UserRepository;
  private assetRepository: AssetRepository;
  private serviceRequestRepository: ServiceRequestRepository;
  private maintenanceRepository: MaintenanceRepository;
  private cloudinary: Cloudinary;

  constructor() {
    this.documentationRepository = new DocumentationRepository();
    this.userRepository = new UserRepository();
    this.assetRepository = new AssetRepository();
    this.serviceRequestRepository = new ServiceRequestRepository();
    this.maintenanceRepository = new MaintenanceRepository();
    this.cloudinary = new Cloudinary();
  }

  private getRelatedFolder(model: MediaFileRelatedModel): string {
    const folders: Record<MediaFileRelatedModel, string> = {
      Asset: "assets",
      ServiceRequest: "service-requests",
      Maintenance: "maintenance-jobs",
    };

    return folders[model];
  }

  private getPurposeFolder(purpose: string): string {
    return purpose
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private async validateUser(
    userId: string,
    message = "User not found",
  ): Promise<void> {
    const user = await this.userRepository.searchUser({ _id: userId });
    if (!user) throw new AppError(message, 400);
  }

  private async validateRelatedRecord(
    model: MediaFileRelatedModel,
    id: string,
  ): Promise<void> {
    if (model === "Asset") {
      const asset = await this.assetRepository.searchAsset({ _id: id });
      if (!asset) throw new AppError("Related asset not found", 400);
      return;
    }

    if (model === "ServiceRequest") {
      const serviceRequest =
        await this.serviceRequestRepository.searchServiceRequest({ _id: id });
      if (!serviceRequest)
        throw new AppError("Related service request not found", 400);
      return;
    }

    const maintenance = await this.maintenanceRepository.searchMaintenance({
      _id: id,
    });
    if (!maintenance)
      throw new AppError("Related maintenance job not found", 400);
  }

  async getMediaFile(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<MediaFileModel | null> {
    const mediaFile = await this.documentationRepository.getMediaFile(
      id,
      options,
    );
    if (!mediaFile) throw new AppError("Media file not found", 404);
    return mediaFile;
  }

  async getMediaFiles(options?: ParsedQueryOptions): Promise<MediaFileModel[]> {
    return this.documentationRepository.getMediaFiles(options);
  }

  async uploadMediaFile(
    file: Express.Multer.File,
    data: UploadMediaFileRequest,
    actorId: string,
  ): Promise<MediaFileModel> {
    await this.validateUser(actorId, "Actor not found");
    await this.validateRelatedRecord(data.relatedModel, data.relatedId);

    const folderPath = [
      "documentation",
      this.getRelatedFolder(data.relatedModel),
      data.relatedId,
      this.getPurposeFolder(data.purpose),
      actorId,
    ];
    const upload = await this.cloudinary.uploadImage(file, { folderPath });

    return this.documentationRepository.createMediaFile({
      title: data.title || file.originalname,
      fileName: file.originalname,
      originalName: file.originalname,
      type: "Image",
      mimeType: file.mimetype,
      size: file.size,
      url: upload.secureUrl,
      publicId: upload.publicId,
      folder: upload.folder,
      uploadedBy: actorId,
      status: data.status || "Pending Review",
      summary: data.summary,
      purpose: data.purpose,
      tags: data.tags || [],
      relatedTo: {
        model: data.relatedModel,
        id: data.relatedId,
      },
    });
  }

  async deleteMediaFile(id: string): Promise<MediaFileModel | null> {
    const mediaFile = await this.documentationRepository.getMediaFile(id);
    if (!mediaFile) throw new AppError("Media file not found", 404);

    await this.cloudinary.deleteImage(mediaFile.publicId);

    return this.documentationRepository.deleteMediaFile(id);
  }

  async searchMediaFile(
    query: FilterQuery<MediaFileModel>,
  ): Promise<MediaFileModel | null> {
    const mediaFile = await this.documentationRepository.searchMediaFile(query);
    if (!mediaFile) throw new AppError("Media file not found", 404);
    return mediaFile;
  }
}

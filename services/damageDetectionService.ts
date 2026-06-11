import { FilterQuery } from "mongoose";
import { env } from "../config/env";
import {
  DamageDetectionInferenceResult,
  DamageDetectionModel as TeachableMachineDamageDetectionModel,
} from "../helpers/damageDetectionModel";
import { logger } from "../helpers/logger";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import {
  DamageDetectionModel,
  DamageDetectionStatus,
  DamageSeverityLevel,
} from "../models/damageDetectionModel";
import { MediaFileModel } from "../models/mediaFileModel";
import { DamageDetectionRepository } from "../repositories/damageDetectionRepository";
import { DocumentationRepository } from "../repositories/documentationRepository";
import { UserRepository } from "../repositories/userRepository";

interface DetectionLinks {
  asset?: string;
  serviceRequest?: string;
  maintenance?: string;
}

interface DamageClassification {
  severityLevel: DamageSeverityLevel;
  status: DamageDetectionStatus;
  detectedDamageLabels: string[];
  suggestedMaintenanceAction: string;
}

const severityByLabel: Record<string, DamageSeverityLevel> = {
  no_damages: "Low",
  with_general_damages: "Medium",
  with_corrosion_damages: "Medium",
  with_lubrication_failures: "Medium",
  with_defective_component: "High",
  with_faulty_wiring: "High",
  with_overheating: "High",
  with_fracture_and_cracks: "Critical",
};

const actionBySeverity: Record<DamageSeverityLevel, string> = {
  Low: "Continue regular monitoring",
  Medium: "Schedule inspection and preventive maintenance",
  High: "Prioritize technician inspection and corrective maintenance",
  Critical: "Stop-use review and urgent maintenance required",
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Damage detection failed";

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new AppError(message, 500, false)), timeoutMs);
    }),
  ]);

// *Purpose: This service class is responsible for analyzing documentation images with the Teachable Machine damage model.
export class DamageDetectionService {
  private damageDetectionRepository: DamageDetectionRepository;
  private documentationRepository: DocumentationRepository;
  private userRepository: UserRepository;
  private damageDetectionModel: TeachableMachineDamageDetectionModel;

  constructor() {
    this.damageDetectionRepository = new DamageDetectionRepository();
    this.documentationRepository = new DocumentationRepository();
    this.userRepository = new UserRepository();
    this.damageDetectionModel = new TeachableMachineDamageDetectionModel();
  }

  private async validateUser(
    userId: string,
    message = "User not found",
  ): Promise<void> {
    const user = await this.userRepository.searchUser({ _id: userId });
    if (!user) throw new AppError(message, 400);
  }

  private getLinks(mediaFile: MediaFileModel): DetectionLinks {
    const relatedId = mediaFile.relatedTo.id.toString();

    if (mediaFile.relatedTo.model === "Asset") {
      return { asset: relatedId };
    }

    if (mediaFile.relatedTo.model === "ServiceRequest") {
      return { serviceRequest: relatedId };
    }

    return { maintenance: relatedId };
  }

  private classifyDetection(
    result: DamageDetectionInferenceResult,
  ): DamageClassification {
    if (result.confidenceScore < env.DAMAGE_DETECTION_MIN_CONFIDENCE) {
      return {
        severityLevel: "Low",
        status: "Low Confidence",
        detectedDamageLabels: [],
        suggestedMaintenanceAction: "Manual inspection required",
      };
    }

    if (result.topLabel === "no_damages") {
      return {
        severityLevel: "Low",
        status: "No Damage",
        detectedDamageLabels: [],
        suggestedMaintenanceAction: "Continue regular monitoring",
      };
    }

    const severityLevel = severityByLabel[result.topLabel] || "Medium";

    return {
      severityLevel,
      status: "Detected",
      detectedDamageLabels: [result.topLabel],
      suggestedMaintenanceAction: actionBySeverity[severityLevel],
    };
  }

  private async analyzeBuffer(
    imageBuffer: Buffer,
  ): Promise<DamageDetectionInferenceResult> {
    return withTimeout(
      this.damageDetectionModel.predict(imageBuffer),
      env.DAMAGE_DETECTION_TIMEOUT_MS,
      "Damage detection timed out",
    );
  }

  private async fetchMediaBuffer(mediaFile: MediaFileModel): Promise<Buffer> {
    const response = await fetch(mediaFile.url);
    if (!response.ok) {
      throw new AppError("Unable to fetch media file for analysis", 400);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async createFailedDetection(
    mediaFile: MediaFileModel,
    actorId: string,
    error: unknown,
  ): Promise<DamageDetectionModel> {
    const errorMessage = getErrorMessage(error);
    logger.error({
      message: "Damage detection failed",
      error: errorMessage,
      mediaFile: mediaFile._id,
    });

    return this.damageDetectionRepository.createDetection({
      mediaFile: mediaFile._id,
      ...this.getLinks(mediaFile),
      modelName: "tm-my-image-model",
      modelVersion: "unknown",
      modelPath: env.DAMAGE_DETECTION_MODEL_DIR,
      topLabel: "analysis_failed",
      confidenceScore: 0,
      allPredictions: [],
      severityLevel: "Low",
      detectedDamageLabels: [],
      suggestedMaintenanceAction: "Manual inspection required",
      status: "Failed",
      errorMessage,
      createdBy: actorId,
    });
  }

  private async createSuccessfulDetection(
    mediaFile: MediaFileModel,
    actorId: string,
    result: DamageDetectionInferenceResult,
  ): Promise<DamageDetectionModel> {
    const classification = this.classifyDetection(result);

    return this.damageDetectionRepository.createDetection({
      mediaFile: mediaFile._id,
      ...this.getLinks(mediaFile),
      modelName: result.modelName,
      modelVersion: result.modelVersion,
      modelPath: result.modelPath,
      topLabel: result.topLabel,
      confidenceScore: result.confidenceScore,
      allPredictions: result.allPredictions,
      severityLevel: classification.severityLevel,
      detectedDamageLabels: classification.detectedDamageLabels,
      suggestedMaintenanceAction: classification.suggestedMaintenanceAction,
      status: classification.status,
      createdBy: actorId,
    });
  }

  async getDetection(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<DamageDetectionModel | null> {
    const detection = await this.damageDetectionRepository.getDetection(
      id,
      options,
    );
    if (!detection) throw new AppError("Damage detection result not found", 404);
    return detection;
  }

  async getDetections(
    options?: ParsedQueryOptions,
  ): Promise<DamageDetectionModel[]> {
    return this.damageDetectionRepository.getDetections(options);
  }

  async analyzeUploadedMediaFile(
    file: Express.Multer.File,
    mediaFile: MediaFileModel,
    actorId: string,
  ): Promise<DamageDetectionModel> {
    try {
      await this.validateUser(actorId, "Actor not found");
      const result = await this.analyzeBuffer(file.buffer);
      return this.createSuccessfulDetection(mediaFile, actorId, result);
    } catch (error) {
      return this.createFailedDetection(mediaFile, actorId, error);
    }
  }

  async analyzeExistingMediaFile(
    mediaFileId: string,
    actorId: string,
  ): Promise<DamageDetectionModel> {
    await this.validateUser(actorId, "Actor not found");
    const mediaFile = await this.documentationRepository.getMediaFile(mediaFileId);
    if (!mediaFile) throw new AppError("Media file not found", 404);

    try {
      const imageBuffer = await this.fetchMediaBuffer(mediaFile);
      const result = await this.analyzeBuffer(imageBuffer);
      return this.createSuccessfulDetection(mediaFile, actorId, result);
    } catch (error) {
      return this.createFailedDetection(mediaFile, actorId, error);
    }
  }

  async deleteDetection(id: string): Promise<DamageDetectionModel | null> {
    const detection = await this.damageDetectionRepository.deleteDetection(id);
    if (!detection) throw new AppError("Damage detection result not found", 404);
    return detection;
  }

  async searchDetection(
    query: FilterQuery<DamageDetectionModel>,
  ): Promise<DamageDetectionModel | null> {
    const detection =
      await this.damageDetectionRepository.searchDetection(query);
    if (!detection) throw new AppError("Damage detection result not found", 404);
    return detection;
  }
}

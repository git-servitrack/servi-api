import { FilterQuery } from "mongoose";
import {
  PredictiveMaintenanceTree,
  TrainedPredictiveMaintenanceModel,
} from "../helpers/predictiveMaintenanceTree";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { PredictiveMaintenanceModel } from "../models/predictiveMaintenanceModel";
import { AssetRepository } from "../repositories/assetRepository";
import { MaintenanceRepository } from "../repositories/maintenanceRepository";
import { PredictiveMaintenanceRepository } from "../repositories/predictiveMaintenanceRepository";
import { ServiceRequestRepository } from "../repositories/serviceRequestRepository";
import { UserRepository } from "../repositories/userRepository";
import {
  CreateAssetPredictionRequest,
  CreatePredictionRequest,
  TrainPredictiveMaintenanceRequest,
} from "../types/predictiveMaintenance";

// *Purpose: This service class is responsible for training and using the predictive maintenance decision tree model.
export class PredictiveMaintenanceService {
  private predictiveMaintenanceRepository: PredictiveMaintenanceRepository;
  private userRepository: UserRepository;
  private assetRepository: AssetRepository;
  private maintenanceRepository: MaintenanceRepository;
  private serviceRequestRepository: ServiceRequestRepository;
  private predictiveMaintenanceTree: PredictiveMaintenanceTree;

  constructor() {
    this.predictiveMaintenanceRepository =
      new PredictiveMaintenanceRepository();
    this.userRepository = new UserRepository();
    this.assetRepository = new AssetRepository();
    this.maintenanceRepository = new MaintenanceRepository();
    this.serviceRequestRepository = new ServiceRequestRepository();
    this.predictiveMaintenanceTree = new PredictiveMaintenanceTree();
  }

  private async validateUser(
    userId: string,
    message = "User not found",
  ): Promise<void> {
    const user = await this.userRepository.searchUser({ _id: userId });
    if (!user) throw new AppError(message, 400);
  }

  private async validateAsset(assetId?: string): Promise<void> {
    if (!assetId) return;

    const asset = await this.assetRepository.searchAsset({ _id: assetId });
    if (!asset) throw new AppError("Asset not found", 400);
  }

  private async validateMaintenance(maintenanceId?: string): Promise<void> {
    if (!maintenanceId) return;

    const maintenance = await this.maintenanceRepository.searchMaintenance({
      _id: maintenanceId,
    });
    if (!maintenance) throw new AppError("Maintenance job not found", 400);
  }

  private async validateServiceRequest(
    serviceRequestId?: string,
  ): Promise<void> {
    if (!serviceRequestId) return;

    const serviceRequest =
      await this.serviceRequestRepository.searchServiceRequest({
        _id: serviceRequestId,
      });
    if (!serviceRequest) throw new AppError("Service request not found", 400);
  }

  async train(
    data: TrainPredictiveMaintenanceRequest,
  ): Promise<TrainedPredictiveMaintenanceModel> {
    try {
      return this.predictiveMaintenanceTree.train(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to train decision tree";
      throw new AppError(message, 400);
    }
  }

  async getPrediction(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<PredictiveMaintenanceModel | null> {
    const prediction = await this.predictiveMaintenanceRepository.getPrediction(
      id,
      options,
    );
    if (!prediction)
      throw new AppError("Predictive maintenance result not found", 404);
    return prediction;
  }

  async getPredictions(
    options?: ParsedQueryOptions,
  ): Promise<PredictiveMaintenanceModel[]> {
    return this.predictiveMaintenanceRepository.getPredictions(options);
  }

  async createPrediction(
    data: CreatePredictionRequest,
    actorId: string,
  ): Promise<PredictiveMaintenanceModel> {
    await this.validateUser(actorId, "Actor not found");
    await this.validateAsset(data.asset);
    await this.validateMaintenance(data.maintenance);
    await this.validateServiceRequest(data.serviceRequest);

    const prediction = this.predictiveMaintenanceTree.predict(data);

    return this.predictiveMaintenanceRepository.createPrediction({
      asset: data.asset,
      maintenance: data.maintenance,
      serviceRequest: data.serviceRequest,
      modelVersion: prediction.modelVersion,
      sourceDataset: prediction.sourceDataset,
      inputFeatures: {
        type: data.type,
        airTemperature: data.airTemperature,
        processTemperature: data.processTemperature,
        rotationalSpeed: data.rotationalSpeed,
        torque: data.torque,
        toolWear: data.toolWear,
      },
      prediction: {
        target: prediction.target,
        hasFailureRisk: prediction.hasFailureRisk,
        failureType: prediction.failureType,
        riskLevel: prediction.riskLevel,
        riskScore: prediction.riskScore,
        failureLikelihood: prediction.failureLikelihood,
        recommendedMaintenanceWindow: prediction.recommendedMaintenanceWindow,
        nextMaintenanceRecommendation: prediction.nextMaintenanceRecommendation,
      },
      explanation: {
        summary: prediction.explanation.summary,
        factors: prediction.explanation.factors,
        modelMetrics: prediction.modelMetrics,
      },
      featureSnapshot: {
        ...data,
        modelFeatures: {
          type: data.type,
          airTemperature: data.airTemperature,
          processTemperature: data.processTemperature,
          rotationalSpeed: data.rotationalSpeed,
          torque: data.torque,
          toolWear: data.toolWear,
        },
      },
      createdBy: actorId,
    });
  }

  async createAssetPrediction(
    assetId: string,
    data: CreateAssetPredictionRequest,
    actorId: string,
  ): Promise<PredictiveMaintenanceModel> {
    return this.createPrediction({ ...data, asset: assetId }, actorId);
  }

  async deletePrediction(
    id: string,
  ): Promise<PredictiveMaintenanceModel | null> {
    const prediction =
      await this.predictiveMaintenanceRepository.deletePrediction(id);
    if (!prediction)
      throw new AppError("Predictive maintenance result not found", 404);
    return prediction;
  }

  async searchPrediction(
    query: FilterQuery<PredictiveMaintenanceModel>,
  ): Promise<PredictiveMaintenanceModel | null> {
    const prediction =
      await this.predictiveMaintenanceRepository.searchPrediction(query);
    if (!prediction)
      throw new AppError("Predictive maintenance result not found", 404);
    return prediction;
  }
}

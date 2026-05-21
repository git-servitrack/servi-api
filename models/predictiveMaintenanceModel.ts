import mongoose from "mongoose";

export const predictiveRiskLevels = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

export type PredictiveRiskLevel = (typeof predictiveRiskLevels)[number];

export interface PredictiveMaintenanceFeatureSnapshot {
  type: "L" | "M" | "H";
  airTemperature: number;
  processTemperature: number;
  rotationalSpeed: number;
  torque: number;
  toolWear: number;
}

export interface PredictiveMaintenanceModel extends mongoose.Document {
  asset?: mongoose.Schema.Types.ObjectId | string;
  maintenance?: mongoose.Schema.Types.ObjectId | string;
  serviceRequest?: mongoose.Schema.Types.ObjectId | string;
  modelVersion: string;
  sourceDataset: string;
  inputFeatures: PredictiveMaintenanceFeatureSnapshot;
  prediction: {
    target: 0 | 1;
    hasFailureRisk: boolean;
    failureType: string;
    riskLevel: PredictiveRiskLevel;
    riskScore: number;
    failureLikelihood: number;
    recommendedMaintenanceWindow: string;
    nextMaintenanceRecommendation: string;
  };
  explanation: {
    summary: string;
    factors: string[];
    modelMetrics?: Record<string, unknown>;
  };
  featureSnapshot: Record<string, unknown>;
  createdBy: mongoose.Schema.Types.ObjectId | string;
}

const PredictiveMaintenanceSchema =
  new mongoose.Schema<PredictiveMaintenanceModel>(
    {
      asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Asset",
      },
      maintenance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Maintenance",
      },
      serviceRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceRequest",
      },
      modelVersion: {
        type: String,
        required: true,
      },
      sourceDataset: {
        type: String,
        required: true,
      },
      inputFeatures: {
        type: {
          type: String,
          enum: ["L", "M", "H"],
          required: true,
        },
        airTemperature: {
          type: Number,
          required: true,
        },
        processTemperature: {
          type: Number,
          required: true,
        },
        rotationalSpeed: {
          type: Number,
          required: true,
        },
        torque: {
          type: Number,
          required: true,
        },
        toolWear: {
          type: Number,
          required: true,
        },
      },
      prediction: {
        target: {
          type: Number,
          enum: [0, 1],
          required: true,
        },
        hasFailureRisk: {
          type: Boolean,
          required: true,
        },
        failureType: {
          type: String,
          required: true,
        },
        riskLevel: {
          type: String,
          enum: predictiveRiskLevels,
          required: true,
        },
        riskScore: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        failureLikelihood: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        recommendedMaintenanceWindow: {
          type: String,
          required: true,
        },
        nextMaintenanceRecommendation: {
          type: String,
          required: true,
        },
      },
      explanation: {
        summary: {
          type: String,
          required: true,
        },
        factors: {
          type: [String],
          default: [],
        },
        modelMetrics: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
      featureSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: true },
  );

export const PredictiveMaintenance = mongoose.model<PredictiveMaintenanceModel>(
  "PredictiveMaintenance",
  PredictiveMaintenanceSchema,
);

import mongoose from "mongoose";

export const damageSeverityLevels = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export const damageDetectionStatuses = [
  "Detected",
  "No Damage",
  "Low Confidence",
  "Failed",
] as const;

export type DamageSeverityLevel = (typeof damageSeverityLevels)[number];
export type DamageDetectionStatus = (typeof damageDetectionStatuses)[number];

export interface DamageDetectionScore {
  label: string;
  confidence: number;
}

export interface DamageDetectionModel extends mongoose.Document {
  mediaFile: mongoose.Schema.Types.ObjectId | string;
  asset?: mongoose.Schema.Types.ObjectId | string;
  serviceRequest?: mongoose.Schema.Types.ObjectId | string;
  maintenance?: mongoose.Schema.Types.ObjectId | string;
  modelName: string;
  modelVersion: string;
  modelPath: string;
  topLabel: string;
  confidenceScore: number;
  allPredictions: DamageDetectionScore[];
  severityLevel: DamageSeverityLevel;
  detectedDamageLabels: string[];
  suggestedMaintenanceAction: string;
  status: DamageDetectionStatus;
  errorMessage?: string;
  createdBy: mongoose.Schema.Types.ObjectId | string;
}

const DamageDetectionSchema = new mongoose.Schema<DamageDetectionModel>(
  {
    mediaFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
    },
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
    },
    maintenance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
    },
    modelName: {
      type: String,
      required: true,
    },
    modelVersion: {
      type: String,
      required: true,
    },
    modelPath: {
      type: String,
      required: true,
    },
    topLabel: {
      type: String,
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    allPredictions: [
      {
        label: {
          type: String,
          required: true,
        },
        confidence: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
      },
    ],
    severityLevel: {
      type: String,
      enum: damageSeverityLevels,
      required: true,
    },
    detectedDamageLabels: {
      type: [String],
      default: [],
    },
    suggestedMaintenanceAction: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: damageDetectionStatuses,
      required: true,
    },
    errorMessage: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const DamageDetection = mongoose.model<DamageDetectionModel>(
  "DamageDetection",
  DamageDetectionSchema,
);

import mongoose from "mongoose";

export interface PartUsageModel extends mongoose.Document {
  sparePart: mongoose.Schema.Types.ObjectId | string;
  maintenanceJob: mongoose.Schema.Types.ObjectId | string;
  asset: mongoose.Schema.Types.ObjectId | string;
  technician: mongoose.Schema.Types.ObjectId | string;
  quantity: number;
  unit: string;
  note?: string;
  usedAt: Date;
  recordedBy: mongoose.Schema.Types.ObjectId | string;
}

const PartUsageSchema = new mongoose.Schema<PartUsageModel>(
  {
    sparePart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SparePart",
      required: true,
    },
    maintenanceJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const PartUsage = mongoose.model<PartUsageModel>("PartUsage", PartUsageSchema);

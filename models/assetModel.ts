import mongoose from "mongoose";

export interface AssetModel {
  _id?: string;
  name: string;
  code?: string;
  category: mongoose.Schema.Types.ObjectId | string;
  assetType?: string;
  site: string;
  assignedTeam: string;
  status: "Active" | "Operational" | "Maintenance Due" | "Under Repair" | "Decommissioned";
  criticality: "Critical" | "High" | "Medium" | "Low";
  condition?: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  quantity?: number;
  unitOfMeasure?: string;
  supplier?: string;
  acquisitionDate?: Date;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  notes?: string;
}

const AssetSchema = new mongoose.Schema<AssetModel>(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    assetType: {
      type: String,
    },
    site: {
      type: String,
      required: true,
    },
    assignedTeam: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Operational", "Maintenance Due", "Under Repair", "Decommissioned"],
      required: true,
    },
    criticality: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      required: true,
    },
    condition: {
      type: String,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    unitOfMeasure: {
      type: String,
    },
    supplier: {
      type: String,
    },
    acquisitionDate: {
      type: Date,
    },
    lastServiceDate: {
      type: Date,
      default: Date.now,
    },
    nextServiceDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Asset = mongoose.model<AssetModel>("Asset", AssetSchema);

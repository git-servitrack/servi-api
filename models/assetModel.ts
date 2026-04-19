import mongoose from "mongoose";

export interface AssetModel {
  _id?: string;
  name: string;
  code?: string;
  category: mongoose.Schema.Types.ObjectId | string;
  site: string;
  assignedTeam: string;
  status: "Operational" | "Maintenance Due" | "Under Repair" | "Decommissioned";
  criticality: "Critical" | "High" | "Medium" | "Low";
  condition?: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
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
      enum: ["Operational", "Maintenance Due", "Under Repair", "Decommissioned"],
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

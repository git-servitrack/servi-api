import mongoose from "mongoose";

export interface ServiceRequestModel extends mongoose.Document {
  title: string;
  requester: mongoose.Schema.Types.ObjectId | string;
  site: string;
  asset: mongoose.Schema.Types.ObjectId | string;
  status: "New" | "Under Review" | "Scheduled" | "In Progress" | "Resolved" | "Closed";
  priority: "Critical" | "High" | "Medium" | "Low";
  scheduledFor?: Date;
  summary: string;
}

const ServiceRequestSchema = new mongoose.Schema<ServiceRequestModel>(
  {
    title: {
      type: String,
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    site: {
      type: String,
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Under Review", "Scheduled", "In Progress", "Resolved", "Closed"],
      default: "New",
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    summary: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ServiceRequest = mongoose.model<ServiceRequestModel>(
  "ServiceRequest",
  ServiceRequestSchema,
);

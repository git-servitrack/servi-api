import mongoose from "mongoose";

export const mediaFileRelatedModels = ["Asset", "ServiceRequest", "Maintenance"] as const;
export const mediaFilePurposes = [
  "Damage Photo",
  "Repair Completion Photo",
  "Asset Photo",
  "General",
] as const;
export const mediaFileStatuses = ["Verified", "Pending Review"] as const;

export type MediaFileRelatedModel = (typeof mediaFileRelatedModels)[number];
export type MediaFilePurpose = (typeof mediaFilePurposes)[number];
export type MediaFileStatus = (typeof mediaFileStatuses)[number];

export interface MediaFileModel extends mongoose.Document {
  title: string;
  fileName: string;
  originalName: string;
  type: "Image";
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  folder: string;
  uploadedBy: mongoose.Schema.Types.ObjectId | string;
  status: MediaFileStatus;
  summary?: string;
  purpose: MediaFilePurpose;
  tags: string[];
  relatedTo: {
    model: MediaFileRelatedModel;
    id: mongoose.Schema.Types.ObjectId | string;
  };
}

const MediaFileSchema = new mongoose.Schema<MediaFileModel>(
  {
    title: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Image"],
      default: "Image",
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    folder: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: mediaFileStatuses,
      default: "Pending Review",
    },
    summary: {
      type: String,
    },
    purpose: {
      type: String,
      enum: mediaFilePurposes,
      default: "General",
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedTo: {
      model: {
        type: String,
        enum: mediaFileRelatedModels,
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "relatedTo.model",
        required: true,
      },
    },
  },
  { timestamps: true },
);

export const MediaFile = mongoose.model<MediaFileModel>("MediaFile", MediaFileSchema);

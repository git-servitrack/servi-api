import mongoose from "mongoose";

export const notificationTypes = [
  "Damage Detection",
  "Documentation",
  "Maintenance",
  "Service Request",
  "Spare Parts",
] as const;

export const notificationRelatedModels = [
  "DamageDetection",
  "MediaFile",
  "Maintenance",
  "ServiceRequest",
  "SparePart",
] as const;

export type NotificationType = (typeof notificationTypes)[number];
export type NotificationRelatedModel = (typeof notificationRelatedModels)[number];

export interface NotificationModel extends mongoose.Document {
  recipient: mongoose.Schema.Types.ObjectId | string;
  title: string;
  message: string;
  type: NotificationType;
  relatedModel?: NotificationRelatedModel;
  relatedId?: mongoose.Schema.Types.ObjectId | string;
  link?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<NotificationModel>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
      index: true,
    },
    relatedModel: {
      type: String,
      enum: notificationRelatedModels,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    link: {
      type: String,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model<NotificationModel>("Notification", NotificationSchema);

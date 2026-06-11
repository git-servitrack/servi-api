import mongoose from "mongoose";
import { z } from "zod";
import {
  notificationRelatedModels,
  notificationTypes,
} from "../models/notificationModel";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const notificationQuerySchema = z.object({
  fields: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  filter: z.string().optional(),
  populate: z.string().optional(),
});

export const notificationListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: notificationQuerySchema,
});

export const notificationIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const createNotificationSchema = z.object({
  body: z.object({
    recipient: objectIdSchema,
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.enum(notificationTypes),
    relatedModel: z.enum(notificationRelatedModels).optional(),
    relatedId: objectIdSchema.optional(),
    link: z.string().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export type CreateNotificationRequest = z.infer<
  typeof createNotificationSchema
>["body"];

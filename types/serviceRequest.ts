import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const serviceRequestStatusEnum = z.enum([
  "New",
  "Under Review",
  "Scheduled",
  "In Progress",
  "Resolved",
  "Closed",
]);

const serviceRequestPriorityEnum = z.enum(["Critical", "High", "Medium", "Low"]);

export const createServiceRequestSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    requester: objectIdSchema,
    site: z.string().min(1),
    asset: objectIdSchema,
    status: serviceRequestStatusEnum.optional(),
    priority: serviceRequestPriorityEnum.optional(),
    scheduledFor: z.coerce.date().optional(),
    summary: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateServiceRequestSchema = z.object({
  body: z
    .object({
      _id: z.string().min(1, "Service Request ID is required"),
      title: z.string().min(1).optional(),
      requester: objectIdSchema.optional(),
      site: z.string().min(1).optional(),
      asset: objectIdSchema.optional(),
      status: serviceRequestStatusEnum.optional(),
      priority: serviceRequestPriorityEnum.optional(),
      scheduledFor: z.coerce.date().optional(),
      summary: z.string().min(1).optional(),
    })
    .refine((data) => Object.keys(data).some((key) => key !== "_id"), {
      message: "At least one field to update is required",
    }),
  params: z.object({}),
  query: z.object({}),
});

export type CreateServiceRequest = z.infer<typeof createServiceRequestSchema>["body"];
export type UpdateServiceRequest = z.infer<typeof updateServiceRequestSchema>["body"];

import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const assetStatusEnum = z.enum([
  "Operational",
  "Maintenance Due",
  "Under Repair",
  "Decommissioned",
]);

const assetCriticalityEnum = z.enum(["Critical", "High", "Medium", "Low"]);

export const createAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    code: z.string().min(1).optional(),
    category: objectIdSchema,
    site: z.string().min(1),
    assignedTeam: z.string().min(1),
    status: z.enum(["Operational", "Maintenance Due", "Under Repair", "Decommissioned"]),
    criticality: z.enum(["Critical", "High", "Medium", "Low"]),
    condition: z.string().optional(),
    manufacturer: z.string().min(1),
    model: z.string().min(1),
    serialNumber: z.string().min(1),
    lastServiceDate: z.coerce.date().optional(),
    nextServiceDate: z.coerce.date().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateAssetSchema = z.object({
  body: z
    .object({
      _id: z.string().min(1, "Asset ID is required"),
      name: z.string().min(1).optional(),
      code: z.string().min(1).optional(),
      category: objectIdSchema.optional(),
      site: z.string().min(1).optional(),
      assignedTeam: z.string().min(1).optional(),
      status: assetStatusEnum.optional(),
      criticality: assetCriticalityEnum.optional(),
      condition: z.string().optional(),
      manufacturer: z.string().min(1).optional(),
      model: z.string().min(1).optional(),
      serialNumber: z.string().min(1).optional(),
      lastServiceDate: z.coerce.date().optional(),
      nextServiceDate: z.coerce.date().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => Object.keys(data).some((key) => key !== "_id"), {
      message: "At least one field to update is required",
    }),
  params: z.object({}),
  query: z.object({}),
});

export type CreateAssetRequest = z.infer<typeof createAssetSchema>["body"];
export type UpdateAssetRequest = z.infer<typeof updateAssetSchema>["body"];

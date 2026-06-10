import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const assetStatusEnum = z.enum([
  "Active",
  "Operational",
  "Maintenance Due",
  "Under Repair",
  "Decommissioned",
]);

const assetCriticalityEnum = z.enum(["Critical", "High", "Medium", "Low"]);
const optionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().optional(),
);
const optionalNonNegativeNumberSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.coerce.number().nonnegative().optional(),
);
const optionalDateSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.coerce.date().optional(),
);

export const createAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    code: z.string().min(1).optional(),
    category: objectIdSchema,
    assetType: optionalStringSchema,
    site: z.string().min(1),
    assignedTeam: z.string().min(1),
    status: assetStatusEnum,
    criticality: z.enum(["Critical", "High", "Medium", "Low"]),
    condition: optionalStringSchema,
    manufacturer: z.string().min(1),
    model: z.string().min(1),
    serialNumber: z.string().min(1),
    quantity: optionalNonNegativeNumberSchema,
    unitOfMeasure: optionalStringSchema,
    supplier: optionalStringSchema,
    acquisitionDate: optionalDateSchema,
    lastServiceDate: optionalDateSchema,
    nextServiceDate: optionalDateSchema,
    notes: optionalStringSchema,
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
      assetType: optionalStringSchema,
      site: z.string().min(1).optional(),
      assignedTeam: z.string().min(1).optional(),
      status: assetStatusEnum.optional(),
      criticality: assetCriticalityEnum.optional(),
      condition: optionalStringSchema,
      manufacturer: z.string().min(1).optional(),
      model: z.string().min(1).optional(),
      serialNumber: z.string().min(1).optional(),
      quantity: optionalNonNegativeNumberSchema,
      unitOfMeasure: optionalStringSchema,
      supplier: optionalStringSchema,
      acquisitionDate: optionalDateSchema,
      lastServiceDate: optionalDateSchema,
      nextServiceDate: optionalDateSchema,
      notes: optionalStringSchema,
    })
    .refine((data) => Object.keys(data).some((key) => key !== "_id"), {
      message: "At least one field to update is required",
    }),
  params: z.object({}),
  query: z.object({}),
});

export type CreateAssetRequest = z.infer<typeof createAssetSchema>["body"];
export type UpdateAssetRequest = z.infer<typeof updateAssetSchema>["body"];

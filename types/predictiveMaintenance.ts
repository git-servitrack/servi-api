import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const predictiveMaintenanceQuerySchema = z.object({
  fields: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  filter: z.string().optional(),
  populate: z.string().optional(),
});

const decisionTreeFeatureSchema = z.object({
  type: z.enum(["L", "M", "H"]),
  airTemperature: z.coerce.number(),
  processTemperature: z.coerce.number(),
  rotationalSpeed: z.coerce.number().positive(),
  torque: z.coerce.number().nonnegative(),
  toolWear: z.coerce.number().nonnegative(),
});

export const trainPredictiveMaintenanceSchema = z.object({
  body: z.object({
    datasetPath: z.string().min(1).optional(),
    validationRatio: z.coerce.number().min(0.05).max(0.5).optional(),
    maxDepth: z.coerce.number().int().positive().optional(),
    minNumSamples: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const createPredictionSchema = z.object({
  body: decisionTreeFeatureSchema.extend({
    asset: objectIdSchema.optional(),
    maintenance: objectIdSchema.optional(),
    serviceRequest: objectIdSchema.optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const createAssetPredictionSchema = z.object({
  body: decisionTreeFeatureSchema.extend({
    maintenance: objectIdSchema.optional(),
    serviceRequest: objectIdSchema.optional(),
  }),
  params: z.object({
    assetId: objectIdSchema,
  }),
  query: z.object({}),
});

export const predictiveMaintenanceListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: predictiveMaintenanceQuerySchema,
});

export const predictiveMaintenanceIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    fields: z.string().optional(),
    populate: z.string().optional(),
  }),
});

export type TrainPredictiveMaintenanceRequest = z.infer<
  typeof trainPredictiveMaintenanceSchema
>["body"];
export type CreatePredictionRequest = z.infer<
  typeof createPredictionSchema
>["body"];
export type CreateAssetPredictionRequest = z.infer<
  typeof createAssetPredictionSchema
>["body"];
export type DecisionTreeFeatureRequest = z.infer<
  typeof decisionTreeFeatureSchema
>;

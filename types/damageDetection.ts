import mongoose from "mongoose";
import { z } from "zod";
import {
  mediaFileRelatedModels,
  mediaFileStatuses,
} from "../models/mediaFileModel";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const damageDetectionQuerySchema = z.object({
  fields: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  filter: z.string().optional(),
  populate: z.string().optional(),
});

const tagsSchema = z
  .preprocess(
    (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value !== "string") return [];

      return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    },
    z.array(z.string().min(1)),
  )
  .optional();

export const analyzeMediaFileSchema = z.object({
  body: z.object({}),
  params: z.object({
    mediaFileId: objectIdSchema,
  }),
  query: z.object({}),
});

export const uploadAnalyzeDamageSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    summary: z.string().optional(),
    tags: tagsSchema,
    relatedModel: z.enum(mediaFileRelatedModels),
    relatedId: objectIdSchema,
    status: z.enum(mediaFileStatuses).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const damageDetectionListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: damageDetectionQuerySchema,
});

export const damageDetectionIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    fields: z.string().optional(),
    populate: z.string().optional(),
  }),
});

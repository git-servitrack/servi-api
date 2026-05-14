import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

const positiveQuantitySchema = z.coerce.number().int().positive();
const nonNegativeQuantitySchema = z.coerce.number().int().min(0);

export const stockStatusOptions = ["In Stock", "Low Stock", "Critical", "Out of Stock"] as const;

export const stockMovementTypes = ["Received", "Issued", "Adjusted", "Reserved"] as const;

const sparePartQuerySchema = z.object({
  fields: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  filter: z.string().optional(),
  populate: z.string().optional(),
});

export const createSparePartSchema = z.object({
  body: z
    .object({
      partNumber: z.string().min(1),
      name: z.string().min(1),
      category: objectIdSchema,
      site: z.string().min(1),
      compatibleAssets: z.array(objectIdSchema).optional(),
      unit: z.string().min(1),
      stockOnHand: nonNegativeQuantitySchema,
      reservedStock: nonNegativeQuantitySchema.optional(),
      reorderPoint: nonNegativeQuantitySchema,
      status: z.enum(stockStatusOptions).optional(),
      binLocation: z.string().min(1),
      supplier: z.string().min(1),
      notes: z.string().optional(),
    })
    .refine((data) => (data.reservedStock || 0) <= data.stockOnHand, {
      message: "Reserved stock cannot exceed stock on hand",
      path: ["reservedStock"],
    }),
  params: z.object({}),
  query: z.object({}),
});

export const updateSparePartSchema = z.object({
  body: z
    .object({
      _id: objectIdSchema,
      partNumber: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      category: objectIdSchema.optional(),
      site: z.string().min(1).optional(),
      compatibleAssets: z.array(objectIdSchema).optional(),
      unit: z.string().min(1).optional(),
      stockOnHand: nonNegativeQuantitySchema.optional(),
      reservedStock: nonNegativeQuantitySchema.optional(),
      reorderPoint: nonNegativeQuantitySchema.optional(),
      status: z.enum(stockStatusOptions).optional(),
      binLocation: z.string().min(1).optional(),
      supplier: z.string().min(1).optional(),
      notes: z.string().optional(),
    })
    .refine((data) => Object.keys(data).some((key) => key !== "_id"), {
      message: "At least one field to update is required",
    }),
  params: z.object({}),
  query: z.object({}),
});

export const sparePartListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: sparePartQuerySchema,
});

export const sparePartIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    fields: z.string().optional(),
    populate: z.string().optional(),
  }),
});

export const sparePartHistorySchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: sparePartQuerySchema,
});

export const addStockSchema = z.object({
  body: z.object({
    quantity: positiveQuantitySchema,
    reference: z.string().min(1),
    note: z.string().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const deductStockSchema = addStockSchema;

export const adjustStockSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int(),
    reference: z.string().min(1),
    note: z.string().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const reservePartSchema = z.object({
  body: z.object({
    quantity: positiveQuantitySchema,
    reference: z.string().min(1),
    note: z.string().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const recordPartUsageSchema = z.object({
  body: z.object({
    maintenanceJob: objectIdSchema,
    asset: objectIdSchema.optional(),
    technician: objectIdSchema.optional(),
    quantity: positiveQuantitySchema,
    note: z.string().optional(),
    usedAt: z.coerce.date().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export type CreateSparePartRequest = z.infer<typeof createSparePartSchema>["body"];
export type UpdateSparePartRequest = z.infer<typeof updateSparePartSchema>["body"];
export type AddStockRequest = z.infer<typeof addStockSchema>["body"];
export type DeductStockRequest = z.infer<typeof deductStockSchema>["body"];
export type AdjustStockRequest = z.infer<typeof adjustStockSchema>["body"];
export type ReservePartRequest = z.infer<typeof reservePartSchema>["body"];
export type RecordPartUsageRequest = z.infer<typeof recordPartUsageSchema>["body"];
export type StockStatus = (typeof stockStatusOptions)[number];
export type StockMovementType = (typeof stockMovementTypes)[number];

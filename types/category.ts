import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateCategorySchema = z.object({
  body: z
    .object({
      _id: z.string().min(1, "Category ID is required"),
      name: z.string().min(1).optional(),
      code: z.string().min(1).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).some((key) => key !== "_id"), {
      message: "At least one field to update is required",
    }),
  params: z.object({}),
  query: z.object({}),
});

export type CreateCategoryRequest = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>["body"];

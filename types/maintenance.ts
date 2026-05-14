import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1, "Object ID is required")
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });

export const maintenanceStatuses = [
  "Assigned",
  "Diagnosing",
  "Awaiting Parts",
  "Repair In Progress",
  "On Hold",
  "Ready for QA",
  "Completed",
] as const;

const maintenanceStatusEnum = z.enum(maintenanceStatuses);

const repairActionStatusEnum = z.enum(["Pending", "In Progress", "Done"]);

const maintenanceAssignmentSchema = z.object({
  technician: objectIdSchema,
  team: z.string().min(1),
  shift: z.string().min(1),
  eta: z.string().min(1),
});

const repairActionSchema = z.object({
  title: z.string().min(1),
  owner: z.string().min(1),
  status: repairActionStatusEnum.optional(),
  note: z.string().optional(),
});

const maintenanceTimelineSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  createdAt: z.coerce.date().optional(),
  actor: z.string().min(1),
});

const maintenanceCompletionSchema = z.object({
  resolution: z.string().optional(),
  partsUsed: z.string().optional(),
  verifiedBy: z.string().optional(),
  completedAt: z.coerce.date().optional(),
});

export const createMaintenanceSchema = z.object({
  body: z.object({
    workOrder: z.string().min(1).optional(),
    asset: objectIdSchema,
    serviceRequest: objectIdSchema,
    status: maintenanceStatusEnum.optional(),
    diagnosisNotes: z.string().optional(),
    assignment: maintenanceAssignmentSchema,
    repairActions: z.array(repairActionSchema).optional(),
    timeline: z.array(maintenanceTimelineSchema).optional(),
    completion: maintenanceCompletionSchema.optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateMaintenanceSchema = z.object({
  body: z
    .object({
      _id: z.string().min(1, "Maintenance ID is required"),
      workOrder: z.string().min(1).optional(),
      asset: objectIdSchema.optional(),
      serviceRequest: objectIdSchema.optional(),
      status: maintenanceStatusEnum.optional(),
      diagnosisNotes: z.string().optional(),
      assignment: maintenanceAssignmentSchema.optional(),
      repairActions: z.array(repairActionSchema).optional(),
      timeline: z.array(maintenanceTimelineSchema).optional(),
      completion: maintenanceCompletionSchema.optional(),
    })
    .refine((data) => Object.keys(data).some((key) => key !== "_id"), {
      message: "At least one field to update is required",
    }),
  params: z.object({}),
  query: z.object({}),
});

export const openMaintenanceFromRequestSchema = z.object({
  body: z.object({
    serviceRequest: objectIdSchema,
    workOrder: z.string().min(1).optional(),
    assignment: maintenanceAssignmentSchema,
    diagnosisNotes: z.string().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const assignTechnicianSchema = z.object({
  body: maintenanceAssignmentSchema,
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const startMaintenanceSchema = z.object({
  body: z.object({
    actor: z.string().min(1),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const diagnosisNotesSchema = z.object({
  body: z.object({
    diagnosisNotes: z.string().min(1),
    actor: z.string().min(1),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const repairActionLogSchema = z.object({
  body: repairActionSchema.extend({
    actor: z.string().min(1),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const holdMaintenanceSchema = z.object({
  body: z.object({
    reason: z.string().min(1),
    actor: z.string().min(1),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const completeMaintenanceSchema = z.object({
  body: z.object({
    resolution: z.string().min(1),
    partsUsed: z.string().min(1),
    verifiedBy: z.string().min(1),
    actor: z.string().min(1),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const maintenanceHistorySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    fields: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    filter: z.string().optional(),
    populate: z.string().optional(),
  }),
});

export const assetMaintenanceHistorySchema = z.object({
  body: z.object({}),
  params: z.object({
    assetId: objectIdSchema,
  }),
  query: maintenanceHistorySchema.shape.query,
});

export const technicianMaintenanceHistorySchema = z.object({
  body: z.object({}),
  params: z.object({
    technicianId: objectIdSchema,
  }),
  query: maintenanceHistorySchema.shape.query,
});

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date",
});

export const technicianWorkloadSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: maintenanceHistorySchema.shape.query,
});

export const technicianScorecardSummarySchema = z.object({
  body: z.object({}),
  params: z.object({
    technicianId: objectIdSchema,
  }),
  query: z.object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
  }),
});

export type CreateMaintenanceRequest = z.infer<typeof createMaintenanceSchema>["body"];
export type UpdateMaintenanceRequest = z.infer<typeof updateMaintenanceSchema>["body"];
export type OpenMaintenanceFromRequest = z.infer<typeof openMaintenanceFromRequestSchema>["body"];
export type AssignTechnicianRequest = z.infer<typeof assignTechnicianSchema>["body"];
export type StartMaintenanceRequest = z.infer<typeof startMaintenanceSchema>["body"];
export type DiagnosisNotesRequest = z.infer<typeof diagnosisNotesSchema>["body"];
export type RepairActionLogRequest = z.infer<typeof repairActionLogSchema>["body"];
export type HoldMaintenanceRequest = z.infer<typeof holdMaintenanceSchema>["body"];
export type CompleteMaintenanceRequest = z.infer<typeof completeMaintenanceSchema>["body"];
export type MaintenanceStatusValue = (typeof maintenanceStatuses)[number];
export type TechnicianScorecardSummaryQuery = z.infer<
  typeof technicianScorecardSummarySchema
>["query"];

export interface MaintenanceStatusCount {
  status: MaintenanceStatusValue;
  count: number;
}

export interface TechnicianWorkloadCountRow {
  technician: string;
  total: number;
  counts: MaintenanceStatusCount[];
}

export interface TechnicianWorkloadSummary {
  technician: Record<string, unknown>;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  statusBreakdown: MaintenanceStatusCount[];
}

export interface TechnicianScorecardSummary {
  technician: Record<string, unknown>;
  dateRange: {
    from?: string;
    to?: string;
  };
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  completionRate: number;
  repairActions: number;
  completedRepairActions: number;
  repairActionCompletionRate: number;
  lastCompletedAt: Date | null;
  statusBreakdown: MaintenanceStatusCount[];
}

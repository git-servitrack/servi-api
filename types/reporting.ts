import { z } from "zod";

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  });

export const reportQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
    period: z.string().min(1).optional(),
    site: z.string().min(1).optional(),
    team: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>["query"];

export interface ReportDateRange {
  from: Date;
  to: Date;
}

export interface ReportingFilter {
  from: Date;
  to: Date;
  site?: string;
  team?: string;
  limit: number;
}

export interface ReportMetric {
  label: string;
  value: string;
  hint: string;
  color?: string;
}

export interface MaintenanceHistoryReportRow {
  id: string;
  workOrder: string;
  asset: string;
  site: string;
  status: string;
  completedAt: string;
}

export interface TechnicianPerformanceReportRow {
  id: string;
  technician: string;
  team: string;
  completedJobs: string;
  responseTime: string;
  slaRate: string;
}

export interface SparePartsUsageReportRow {
  id: string;
  part: string;
  category: string;
  issuedUnits: string;
  linkedWorkOrders: string;
  site: string;
}

export interface DowntimeReportRow {
  id: string;
  asset: string;
  site: string;
  incidents: string;
  downtimeHours: string;
  lastDowntimeAt: string;
}

export interface HighRiskEquipmentReportRow {
  id: string;
  asset: string;
  site: string;
  riskLevel: string;
  riskScore: string;
  recommendation: string;
  forecastedAt: string;
}

export interface RequestVolumeReportRow {
  id: string;
  category: string;
  newRequests: string;
  inProgress: string;
  resolved: string;
  site: string;
}

export interface CompletionRateReportRow {
  id: string;
  team: string;
  completed: string;
  overdue: string;
  completionRate: string;
  qaReady: string;
}

export interface ReportingOverview {
  metrics: ReportMetric[];
  maintenanceHistory: MaintenanceHistoryReportRow[];
  technicianPerformance: TechnicianPerformanceReportRow[];
  sparePartsUsage: SparePartsUsageReportRow[];
  downtime: DowntimeReportRow[];
  highRiskEquipment: HighRiskEquipmentReportRow[];
  requestVolume: RequestVolumeReportRow[];
  completionRate: CompletionRateReportRow[];
}

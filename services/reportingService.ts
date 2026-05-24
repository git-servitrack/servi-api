import { AppError } from "../middleware/errorHandler";
import { ReportingRepository } from "../repositories/reportingRepository";
import {
  CompletionRateReportRow,
  DowntimeReportRow,
  HighRiskEquipmentReportRow,
  MaintenanceHistoryReportRow,
  ReportMetric,
  ReportQuery,
  ReportingFilter,
  ReportingOverview,
  RequestVolumeReportRow,
  SparePartsUsageReportRow,
  TechnicianPerformanceReportRow,
} from "../types/reporting";

const DEFAULT_REPORT_LIMIT = 10;
const DEFAULT_PERIOD_DAYS = 30;

// *Purpose: This reporting class is responsible for handling derived reporting and analytics views.
export class ReportingService {
  private reportingRepository: ReportingRepository;

  constructor() {
    this.reportingRepository = new ReportingRepository();
  }

  private normalizeFilterValue(value?: string): string | undefined {
    if (!value) return undefined;
    if (value.toLowerCase().startsWith("all ")) return undefined;
    return value;
  }

  private getPeriodStart(period?: string, to = new Date()): Date {
    const lowerPeriod = period?.trim().toLowerCase();

    if (lowerPeriod === "this month") {
      return new Date(to.getFullYear(), to.getMonth(), 1);
    }

    if (lowerPeriod === "this year") {
      return new Date(to.getFullYear(), 0, 1);
    }

    const dayMatch = lowerPeriod?.match(/last\s+(\d+)\s+days?/);
    const days = dayMatch ? Number(dayMatch[1]) : DEFAULT_PERIOD_DAYS;
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return from;
  }

  private getStartOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getEndOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private buildFilter(query: ReportQuery): ReportingFilter {
    const requestedTo = query.to ? new Date(query.to) : new Date();
    const requestedFrom = query.from
      ? new Date(query.from)
      : this.getPeriodStart(query.period, requestedTo);
    const from = this.getStartOfDay(requestedFrom);
    const to = this.getEndOfDay(requestedTo);

    if (from > to) throw new AppError("Report from date cannot be later than to date", 400);

    return {
      from,
      to,
      site: this.normalizeFilterValue(query.site),
      team: this.normalizeFilterValue(query.team),
      limit: query.limit || DEFAULT_REPORT_LIMIT,
    };
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  private formatHours(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return "0h";
    return `${Number(value.toFixed(1))}h`;
  }

  private formatPercent(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return "0%";
    return `${Math.round(value)}%`;
  }

  private formatAssetName(name?: string, code?: string): string {
    if (name && code) return `${name} ${code}`;
    return name || code || "Unassigned asset";
  }

  private calculateRate(count: number, total: number): number {
    if (total === 0) return 0;
    return (count / total) * 100;
  }

  async getReportMetrics(query: ReportQuery): Promise<ReportMetric[]> {
    const filter = this.buildFilter(query);
    const [completedMaintenance, partsIssued, requestIntake, slaSummary] = await Promise.all([
      this.reportingRepository.countCompletedMaintenance(filter),
      this.reportingRepository.countPartsIssued(filter),
      this.reportingRepository.countRequestIntake(filter),
      this.reportingRepository.getSlaSummary(filter),
    ]);

    return [
      {
        label: "Maintenance completed",
        value: String(completedMaintenance),
        hint: "Closed work orders in the current reporting window",
        color: "#145d66",
      },
      {
        label: "Average SLA rate",
        value: this.formatPercent(
          this.calculateRate(slaSummary.completedWithinSla, slaSummary.completedJobs),
        ),
        hint: "Combined technician and maintenance completion target adherence",
        color: "#059669",
      },
      {
        label: "Parts issued",
        value: String(partsIssued),
        hint: "Spare-part issue transactions tied to maintenance work",
        color: "#d97706",
      },
      {
        label: "Request intake",
        value: String(requestIntake),
        hint: "New service requests logged during the active period",
        color: "#1e293b",
      },
    ];
  }

  async getMaintenanceHistory(query: ReportQuery): Promise<MaintenanceHistoryReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getMaintenanceHistory(filter);

    return rows.map((row) => ({
      id: String(row._id),
      workOrder: row.workOrder || "N/A",
      asset: this.formatAssetName(row.assetName, row.assetCode),
      site: row.site || "Unassigned site",
      status: row.status || "N/A",
      completedAt: this.formatDate(row.completedAt),
    }));
  }

  async getTechnicianPerformance(query: ReportQuery): Promise<TechnicianPerformanceReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getTechnicianPerformance(filter);

    return rows.map((row) => {
      const completedJobs = Number(row.completedJobs || 0);
      const averageCompletionMs =
        completedJobs > 0 ? Number(row.totalCompletionMs || 0) / completedJobs : 0;
      const averageCompletionHours = averageCompletionMs / 1000 / 60 / 60;
      const technicianName = `${row.firstName || ""} ${row.lastName || ""}`.trim();

      return {
        id: `${String(row._id.technician || "unassigned")}-${row._id.team || "team"}`,
        technician: technicianName || row.username || "Unassigned technician",
        team: row._id.team || "Unassigned team",
        completedJobs: String(completedJobs),
        responseTime: this.formatHours(averageCompletionHours),
        slaRate: this.formatPercent(
          this.calculateRate(Number(row.completedWithinSla || 0), completedJobs),
        ),
      };
    });
  }

  async getSparePartsUsage(query: ReportQuery): Promise<SparePartsUsageReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getSparePartsUsage(filter);

    return rows.map((row) => ({
      id: String(row._id.sparePart || row.part || "part"),
      part: row.part || "Unassigned part",
      category: row.category || "Uncategorized",
      issuedUnits: `${Number(row.issuedUnits || 0)} ${row.unit || "unit"}`,
      linkedWorkOrders: String(row.linkedWorkOrders?.length || 0),
      site: row.site || "Unassigned site",
    }));
  }

  async getDowntime(query: ReportQuery): Promise<DowntimeReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getDowntime(filter);

    return rows.map((row) => ({
      id: String(row._id || row.assetName || "asset"),
      asset: this.formatAssetName(row.assetName, row.assetCode),
      site: row.site || "Unassigned site",
      incidents: String(row.incidents || 0),
      downtimeHours: this.formatHours(Number(row.downtimeMs || 0) / 1000 / 60 / 60),
      lastDowntimeAt: this.formatDate(row.lastDowntimeAt),
    }));
  }

  async getHighRiskEquipment(query: ReportQuery): Promise<HighRiskEquipmentReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getHighRiskEquipment(filter);

    return rows.map((row) => ({
      id: String(row.predictionId || row._id || "prediction"),
      asset: this.formatAssetName(row.asset?.name, row.asset?.code),
      site: row.asset?.site || "Unassigned site",
      riskLevel: row.riskLevel || "N/A",
      riskScore: String(row.riskScore || 0),
      recommendation: row.recommendation || "Review asset condition and maintenance history",
      forecastedAt: this.formatDate(row.forecastedAt),
    }));
  }

  async getRequestVolume(query: ReportQuery): Promise<RequestVolumeReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getRequestVolume(filter);

    return rows.map((row) => ({
      id: `${row.category || "category"}-${row.site || "site"}`,
      category: row.category || "Uncategorized",
      newRequests: String(row.newRequests || 0),
      inProgress: String(row.inProgress || 0),
      resolved: String(row.resolved || 0),
      site: row.site || "Unassigned site",
    }));
  }

  async getCompletionRate(query: ReportQuery): Promise<CompletionRateReportRow[]> {
    const filter = this.buildFilter(query);
    const rows = await this.reportingRepository.getCompletionRate(filter);

    return rows.map((row) => ({
      id: String(row._id || "team"),
      team: row._id || "Unassigned team",
      completed: String(row.completed || 0),
      overdue: String(row.overdue || 0),
      completionRate: this.formatPercent(
        this.calculateRate(Number(row.completed || 0), Number(row.total || 0)),
      ),
      qaReady: String(row.qaReady || 0),
    }));
  }

  async getOverview(query: ReportQuery): Promise<ReportingOverview> {
    const [
      metrics,
      maintenanceHistory,
      technicianPerformance,
      sparePartsUsage,
      downtime,
      highRiskEquipment,
      requestVolume,
      completionRate,
    ] = await Promise.all([
      this.getReportMetrics(query),
      this.getMaintenanceHistory(query),
      this.getTechnicianPerformance(query),
      this.getSparePartsUsage(query),
      this.getDowntime(query),
      this.getHighRiskEquipment(query),
      this.getRequestVolume(query),
      this.getCompletionRate(query),
    ]);

    return {
      metrics,
      maintenanceHistory,
      technicianPerformance,
      sparePartsUsage,
      downtime,
      highRiskEquipment,
      requestVolume,
      completionRate,
    };
  }
}

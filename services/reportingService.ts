import { AppError } from "../middleware/errorHandler";
import { buildCsv, buildCsvFilename, CsvSection } from "../helpers/csv";
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
  ReportSummary,
  ReportExportResult,
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

  private getMetricValue(metrics: ReportMetric[], label: string, fallback = "0"): string {
    return metrics.find((metric) => metric.label === label)?.value ?? fallback;
  }

  private getTopTechnician(rows: TechnicianPerformanceReportRow[]): TechnicianPerformanceReportRow | null {
    return [...rows].sort(
      (a, b) => Number(b.completedJobs || 0) - Number(a.completedJobs || 0),
    )[0] ?? null;
  }

  private getTopPartUsage(rows: SparePartsUsageReportRow[]): SparePartsUsageReportRow | null {
    return [...rows].sort(
      (a, b) => Number.parseInt(b.issuedUnits, 10) - Number.parseInt(a.issuedUnits, 10),
    )[0] ?? null;
  }

  private getHighestRisk(rows: HighRiskEquipmentReportRow[]): HighRiskEquipmentReportRow | null {
    return [...rows].sort(
      (a, b) => Number(b.riskScore || 0) - Number(a.riskScore || 0),
    )[0] ?? null;
  }

  async generateSummary(query: ReportQuery): Promise<ReportSummary> {
    const overview = await this.getOverview(query);
    const completed = this.getMetricValue(overview.metrics, "Maintenance completed");
    const slaRate = this.getMetricValue(overview.metrics, "Average SLA rate");
    const partsIssued = this.getMetricValue(overview.metrics, "Parts issued");
    const requestIntake = this.getMetricValue(overview.metrics, "Request intake");
    const topTechnician = this.getTopTechnician(overview.technicianPerformance);
    const topPart = this.getTopPartUsage(overview.sparePartsUsage);
    const highestRisk = this.getHighestRisk(overview.highRiskEquipment);
    const overdueTeams = overview.completionRate.filter((row) => Number(row.overdue || 0) > 0);

    const highlights = [
      `${completed} maintenance jobs were completed with an average SLA rate of ${slaRate}.`,
      `${requestIntake} service requests entered the queue and ${partsIssued} spare-part units were issued.`,
      topTechnician
        ? `${topTechnician.technician} led technician output with ${topTechnician.completedJobs} completed jobs.`
        : "No technician performance rows are available for this filter.",
      topPart
        ? `${topPart.part} had the highest recorded part usage at ${topPart.issuedUnits}.`
        : "No spare-parts usage rows are available for this filter.",
    ];

    if (highestRisk) {
      highlights.push(
        `${highestRisk.asset} is the highest risk equipment item with a ${highestRisk.riskLevel} risk level.`,
      );
    }

    const recommendations = [
      overdueTeams.length > 0
        ? `Review overdue work for ${overdueTeams.map((row) => row.team).join(", ")}.`
        : "Maintain current completion controls; no overdue team rows were returned.",
      highestRisk
        ? `Prioritize inspection for ${highestRisk.asset}: ${highestRisk.recommendation}.`
        : "Continue monitoring predictive risk results as new maintenance data arrives.",
      topPart
        ? `Check reorder planning for ${topPart.part} because it is the top issued part in this report.`
        : "Validate spare-part usage once more work orders include part issue logs.",
    ];

    return {
      headline: `Reporting summary for ${query.period || "selected period"}`,
      generatedAt: new Date().toISOString(),
      periodLabel: query.period || "Custom period",
      highlights,
      recommendations,
    };
  }

  async exportReportPack(query: ReportQuery): Promise<ReportExportResult> {
    const overview = await this.getOverview(query);
    const sections: CsvSection[] = [
      {
        title: "Report Metrics",
        headers: ["Label", "Value", "Hint"],
        rows: overview.metrics.map((row) => [row.label, row.value, row.hint]),
      },
      {
        title: "Maintenance History",
        headers: ["Work Order", "Asset", "Site", "Status", "Completed At"],
        rows: overview.maintenanceHistory.map((row) => [
          row.workOrder,
          row.asset,
          row.site,
          row.status,
          row.completedAt,
        ]),
      },
      {
        title: "Technician Performance",
        headers: ["Technician", "Team", "Completed Jobs", "Response Time", "SLA Rate"],
        rows: overview.technicianPerformance.map((row) => [
          row.technician,
          row.team,
          row.completedJobs,
          row.responseTime,
          row.slaRate,
        ]),
      },
      {
        title: "Spare Parts Usage",
        headers: ["Part", "Category", "Issued Units", "Linked Work Orders", "Site"],
        rows: overview.sparePartsUsage.map((row) => [
          row.part,
          row.category,
          row.issuedUnits,
          row.linkedWorkOrders,
          row.site,
        ]),
      },
      {
        title: "Downtime",
        headers: ["Asset", "Site", "Incidents", "Downtime Hours", "Last Downtime At"],
        rows: overview.downtime.map((row) => [
          row.asset,
          row.site,
          row.incidents,
          row.downtimeHours,
          row.lastDowntimeAt,
        ]),
      },
      {
        title: "High Risk Equipment",
        headers: ["Asset", "Site", "Risk Level", "Risk Score", "Recommendation", "Forecasted At"],
        rows: overview.highRiskEquipment.map((row) => [
          row.asset,
          row.site,
          row.riskLevel,
          row.riskScore,
          row.recommendation,
          row.forecastedAt,
        ]),
      },
      {
        title: "Request Volume",
        headers: ["Category", "New Requests", "In Progress", "Resolved", "Site"],
        rows: overview.requestVolume.map((row) => [
          row.category,
          row.newRequests,
          row.inProgress,
          row.resolved,
          row.site,
        ]),
      },
      {
        title: "Completion Rate",
        headers: ["Team", "Completed", "Overdue", "Completion Rate", "QA Ready"],
        rows: overview.completionRate.map((row) => [
          row.team,
          row.completed,
          row.overdue,
          row.completionRate,
          row.qaReady,
        ]),
      },
    ];

    return {
      filename: buildCsvFilename("servi-report-pack"),
      contentType: "text/csv",
      content: buildCsv(sections),
    };
  }
}

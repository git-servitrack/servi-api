import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { UserRole } from "../config/constants";
import { sendSuccess } from "../helpers/response";
import { authenticate, authorize } from "../middleware/auth";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { ReportingService } from "../services/reportingService";
import { ReportQuery, reportQuerySchema } from "../types/reporting";

const dashboardReportRoles: UserRole[] = [
  "admin",
  "head_technician",
  "technician",
  "project_site_staff",
  "warehouse_staff",
  "management",
];
const reportPageRoles: UserRole[] = ["admin", "head_technician", "warehouse_staff", "management"];

// Purpose: This controller class is responsible for handling reporting and analytics requests.
@route("/reports")
export class ReportingController {
  private reportingService: ReportingService;

  constructor() {
    this.reportingService = new ReportingService();
  }

  private getReportQuery(req: Request): ReportQuery {
    return req.query as unknown as ReportQuery;
  }

  @route.get("/overview")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(dashboardReportRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await this.reportingService.getOverview(this.getReportQuery(req));
      sendSuccess(res, "Reporting overview fetched successfully", overview);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/metrics")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getReportMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await this.reportingService.getReportMetrics(this.getReportQuery(req));
      sendSuccess(res, "Report metrics fetched successfully", metrics);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/maintenance-history")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getMaintenanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getMaintenanceHistory(this.getReportQuery(req));
      sendSuccess(res, "Maintenance history report fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/technician-performance")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getTechnicianPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getTechnicianPerformance(this.getReportQuery(req));
      sendSuccess(res, "Technician performance report fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/spare-parts-usage")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getSparePartsUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getSparePartsUsage(this.getReportQuery(req));
      sendSuccess(res, "Spare parts usage report fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/downtime")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getDowntime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getDowntime(this.getReportQuery(req));
      sendSuccess(res, "Downtime report fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/high-risk-equipment")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getHighRiskEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getHighRiskEquipment(this.getReportQuery(req));
      sendSuccess(res, "High-risk equipment report fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/request-volume")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getRequestVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getRequestVolume(this.getReportQuery(req));
      sendSuccess(res, "Request volume summary fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/completion-rate")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(reportPageRoles))
  @UseMiddleware(validate(reportQuerySchema))
  async getCompletionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportingService.getCompletionRate(this.getReportQuery(req));
      sendSuccess(res, "Completion rate summary fetched successfully", report);
    } catch (error) {
      next(error);
    }
  }
}

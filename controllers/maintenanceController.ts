import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, authorize } from "../middleware/auth";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { MaintenanceService } from "../services/maintenanceService";
import {
  assetMaintenanceHistorySchema,
  assignTechnicianSchema,
  completeMaintenanceSchema,
  createMaintenanceSchema,
  diagnosisNotesSchema,
  holdMaintenanceSchema,
  maintenanceHistorySchema,
  openMaintenanceFromRequestSchema,
  repairActionLogSchema,
  startMaintenanceSchema,
  technicianMaintenanceHistorySchema,
  updateMaintenanceSchema,
} from "../types/maintenance";

// Purpose: This controller class is responsible for handling the maintenance related requests.
@route("/maintenance")
export class MaintenanceController {
  private maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  @route.get("/history")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(maintenanceHistorySchema))
  async getMaintenanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const maintenance = await this.maintenanceService.getMaintenanceHistory(parsedOptions);
      sendSuccess(res, "Maintenance history fetched successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/history/asset/:assetId")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(assetMaintenanceHistorySchema))
  async getAssetMaintenanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const maintenance = await this.maintenanceService.getAssetMaintenanceHistory(
        req.params.assetId,
        parsedOptions,
      );
      sendSuccess(res, "Asset maintenance history fetched successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/history/technician/:technicianId")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(technicianMaintenanceHistorySchema))
  async getTechnicianMaintenanceHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const maintenance = await this.maintenanceService.getTechnicianMaintenanceHistory(
        req.params.technicianId,
        parsedOptions,
      );
      sendSuccess(res, "Technician maintenance history fetched successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const maintenance = await this.maintenanceService.getMaintenance(
        req.params.id,
        parsedOptions,
      );
      sendSuccess(res, "Maintenance fetched successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getMaintenances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        limit: req.query.limit as unknown as number,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        filter: req.query.filter as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const maintenance = await this.maintenanceService.getMaintenances(parsedOptions);
      sendSuccess(res, "Maintenance fetched successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/from-request")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(openMaintenanceFromRequestSchema))
  async openFromRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.openMaintenanceFromRequest(req.body);
      sendSuccess(res, "Maintenance opened from request successfully", maintenance, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(createMaintenanceSchema))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.createMaintenance(req.body);
      sendSuccess(res, "Maintenance created successfully", maintenance, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/assign-technician")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(assignTechnicianSchema))
  async assignTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.assignTechnician(req.params.id, req.body);
      sendSuccess(res, "Maintenance technician assigned successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/start")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "technician"]))
  @UseMiddleware(validate(startMaintenanceSchema))
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.startMaintenance(req.params.id, req.body);
      sendSuccess(res, "Maintenance started successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/diagnosis")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "technician"]))
  @UseMiddleware(validate(diagnosisNotesSchema))
  async addDiagnosisNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.addDiagnosisNotes(req.params.id, req.body);
      sendSuccess(res, "Maintenance diagnosis notes added successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/:id/repair-actions")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "technician"]))
  @UseMiddleware(validate(repairActionLogSchema))
  async addRepairActionLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.addRepairActionLog(req.params.id, req.body);
      sendSuccess(res, "Maintenance repair action added successfully", maintenance, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/hold")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "technician"]))
  @UseMiddleware(validate(holdMaintenanceSchema))
  async hold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.holdMaintenance(req.params.id, req.body);
      sendSuccess(res, "Maintenance put on hold successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/complete")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(completeMaintenanceSchema))
  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.completeMaintenance(
        req.params.id,
        req.body,
      );
      sendSuccess(res, "Maintenance completed successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.put("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(updateMaintenanceSchema))
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.updateMaintenance(req.body);
      sendSuccess(res, "Maintenance updated successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.maintenanceService.deleteMaintenance(req.params.id);
      sendSuccess(res, "Maintenance deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.searchMaintenance(req.body);
      sendSuccess(res, "Maintenance fetched successfully", maintenance);
    } catch (error) {
      next(error);
    }
  }
}

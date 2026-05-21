import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import {
  authenticate,
  AuthenticatedRequest,
  authorize,
} from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { PredictiveMaintenanceService } from "../services/predictiveMaintenanceService";
import {
  createAssetPredictionSchema,
  createPredictionSchema,
  predictiveMaintenanceIdSchema,
  predictiveMaintenanceListSchema,
  trainPredictiveMaintenanceSchema,
} from "../types/predictiveMaintenance";

// Purpose: This controller class is responsible for handling predictive maintenance decision tree requests.
@route("/predictive-maintenance")
export class PredictiveMaintenanceController {
  private predictiveMaintenanceService: PredictiveMaintenanceService;

  constructor() {
    this.predictiveMaintenanceService = new PredictiveMaintenanceService();
  }

  private getActorId(req: Request): string {
    const actorId = (req as AuthenticatedRequest).authUser?.sub;
    if (!actorId) throw new AppError("Authentication required", 401);
    return actorId;
  }

  @route.post("/train")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician", "management"]))
  @UseMiddleware(validate(trainPredictiveMaintenanceSchema))
  async train(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.predictiveMaintenanceService.train(req.body);
      sendSuccess(
        res,
        "Predictive maintenance model trained successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  @route.post("/predict")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(createPredictionSchema))
  async predict(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const prediction =
        await this.predictiveMaintenanceService.createPrediction(
          req.body,
          this.getActorId(req),
        );
      sendSuccess(
        res,
        "Predictive maintenance result created successfully",
        prediction,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  @route.post("/assets/:assetId/predict")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(createAssetPredictionSchema))
  async predictAsset(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const prediction =
        await this.predictiveMaintenanceService.createAssetPrediction(
          req.params.assetId,
          req.body,
          this.getActorId(req),
        );
      sendSuccess(
        res,
        "Asset predictive maintenance result created successfully",
        prediction,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(predictiveMaintenanceIdSchema))
  async getPrediction(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const prediction = await this.predictiveMaintenanceService.getPrediction(
        req.params.id,
        parsedOptions,
      );
      sendSuccess(
        res,
        "Predictive maintenance result fetched successfully",
        prediction,
      );
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(predictiveMaintenanceListSchema))
  async getPredictions(
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
      const predictions =
        await this.predictiveMaintenanceService.getPredictions(parsedOptions);
      sendSuccess(
        res,
        "Predictive maintenance results fetched successfully",
        predictions,
      );
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(predictiveMaintenanceIdSchema))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.predictiveMaintenanceService.deletePrediction(req.params.id);
      sendSuccess(
        res,
        "Predictive maintenance result deleted successfully",
        null,
      );
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prediction =
        await this.predictiveMaintenanceService.searchPrediction(req.body);
      sendSuccess(
        res,
        "Predictive maintenance result fetched successfully",
        prediction,
      );
    } catch (error) {
      next(error);
    }
  }
}

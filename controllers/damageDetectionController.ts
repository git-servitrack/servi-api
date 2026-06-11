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
import { upload } from "../middleware/multer";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { DamageDetectionService } from "../services/damageDetectionService";
import { DocumentationService } from "../services/documentationService";
import {
  analyzeMediaFileSchema,
  damageDetectionIdSchema,
  damageDetectionListSchema,
  uploadAnalyzeDamageSchema,
} from "../types/damageDetection";

// Purpose: This controller class is responsible for handling damage detection analysis requests.
@route("/damage-detection")
export class DamageDetectionController {
  private damageDetectionService: DamageDetectionService;
  private documentationService: DocumentationService;

  constructor() {
    this.damageDetectionService = new DamageDetectionService();
    this.documentationService = new DocumentationService();
  }

  private getActorId(req: Request): string {
    const actorId = (req as AuthenticatedRequest).authUser?.sub;
    if (!actorId) throw new AppError("Authentication required", 401);
    return actorId;
  }

  @route.post("/media/:mediaFileId/analyze")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(analyzeMediaFileSchema))
  async analyzeMediaFile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const detection =
        await this.damageDetectionService.analyzeExistingMediaFile(
          req.params.mediaFileId,
          this.getActorId(req),
        );
      sendSuccess(res, "Damage detection result created successfully", detection, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/upload-analyze")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "project_site_staff"]),
  )
  @UseMiddleware(upload.single("image"))
  @UseMiddleware(validate(uploadAnalyzeDamageSchema))
  async uploadAndAnalyze(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) throw new AppError("Please upload an image", 400);

      const result = await this.documentationService.uploadMediaFile(
        req.file,
        {
          ...req.body,
          purpose: "Damage Photo",
        },
        this.getActorId(req),
      );
      sendSuccess(res, "Damage image uploaded and analyzed successfully", result, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(damageDetectionIdSchema))
  async getDetection(
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
      const detection = await this.damageDetectionService.getDetection(
        req.params.id,
        parsedOptions,
      );
      sendSuccess(res, "Damage detection result fetched successfully", detection);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "management"]),
  )
  @UseMiddleware(validate(damageDetectionListSchema))
  async getDetections(
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
      const detections =
        await this.damageDetectionService.getDetections(parsedOptions);
      sendSuccess(res, "Damage detection results fetched successfully", detections);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(damageDetectionIdSchema))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.damageDetectionService.deleteDetection(req.params.id);
      sendSuccess(res, "Damage detection result deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const detection =
        await this.damageDetectionService.searchDetection(req.body);
      sendSuccess(res, "Damage detection result fetched successfully", detection);
    } catch (error) {
      next(error);
    }
  }
}

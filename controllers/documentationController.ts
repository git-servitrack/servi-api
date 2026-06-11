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
import { DocumentationService } from "../services/documentationService";
import {
  documentationIdSchema,
  documentationListSchema,
  updateMediaFileStatusSchema,
  uploadMediaFileSchema,
} from "../types/documentation";

// Purpose: This controller class is responsible for handling documentation media uploads and file records.
@route("/documentation")
export class DocumentationController {
  private documentationService: DocumentationService;

  constructor() {
    this.documentationService = new DocumentationService();
  }

  private getActorId(req: Request): string {
    const actorId = (req as AuthenticatedRequest).authUser?.sub;
    if (!actorId) throw new AppError("Authentication required", 401);
    return actorId;
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize([
      "admin",
      "head_technician",
      "technician",
      "project_site_staff",
      "management",
    ]),
  )
  @UseMiddleware(validate(documentationIdSchema))
  async getMediaFile(
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
      const mediaFile = await this.documentationService.getMediaFile(
        req.params.id,
        parsedOptions,
      );
      sendSuccess(res, "Media file fetched successfully", mediaFile);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize([
      "admin",
      "head_technician",
      "technician",
      "project_site_staff",
      "management",
    ]),
  )
  @UseMiddleware(validate(documentationListSchema))
  async getMediaFiles(
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
      const mediaFiles =
        await this.documentationService.getMediaFiles(parsedOptions);
      sendSuccess(res, "Media files fetched successfully", mediaFiles);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/upload")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "project_site_staff"]),
  )
  @UseMiddleware(upload.single("image"))
  @UseMiddleware(validate(uploadMediaFileSchema))
  async uploadMediaFile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) throw new AppError("Please upload an image", 400);

      const mediaFile = await this.documentationService.uploadMediaFile(
        req.file,
        req.body,
        this.getActorId(req),
      );
      sendSuccess(res, "Media file uploaded successfully", mediaFile, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(documentationIdSchema))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.documentationService.deleteMediaFile(req.params.id);
      sendSuccess(res, "Media file deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/status")
  @UseMiddleware(authenticate)
  @UseMiddleware(
    authorize(["admin", "head_technician", "technician", "project_site_staff"]),
  )
  @UseMiddleware(validate(updateMediaFileStatusSchema))
  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const mediaFile = await this.documentationService.updateMediaFileStatus(
        req.params.id,
        req.body,
      );
      sendSuccess(res, "Media file status updated successfully", mediaFile);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mediaFile = await this.documentationService.searchMediaFile(
        req.body,
      );
      sendSuccess(res, "Media file fetched successfully", mediaFile);
    } catch (error) {
      next(error);
    }
  }
}

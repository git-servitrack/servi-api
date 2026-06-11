import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { UserRole } from "../config/constants";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, authorize } from "../middleware/auth";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { AssetService } from "../services/assetService";
import { createAssetSchema, updateAssetSchema } from "../types/asset";

const assetReadRoles: UserRole[] = [
  "admin",
  "head_technician",
  "technician",
  "project_site_staff",
  "warehouse_staff",
  "management",
];

// Purpose: This controller class is responsible for handling the asset related requests.
@route("/asset")
export class AssetController {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(assetReadRoles))
  async getAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const asset = await this.assetService.getAsset(req.params.id, parsedOptions);
      sendSuccess(res, "Asset fetched successfully", asset);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(assetReadRoles))
  async getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const assets = await this.assetService.getAssets(parsedOptions);
      sendSuccess(res, "Assets fetched successfully", assets);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(createAssetSchema))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await this.assetService.createAsset(req.body);
      sendSuccess(res, "Asset created successfully", asset, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.put("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(updateAssetSchema))
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await this.assetService.updateAsset(req.body);
      sendSuccess(res, "Asset updated successfully", asset);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.assetService.deleteAsset(req.params.id);
      sendSuccess(res, "Asset deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await this.assetService.searchAsset(req.body);
      sendSuccess(res, "Asset fetched successfully", asset);
    } catch (error) {
      next(error);
    }
  }
}

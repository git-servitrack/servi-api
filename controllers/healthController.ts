import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { sendSuccess } from "../helpers/response";
import { HealthService } from "../services/healthService";

@route("/health")
export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  @route.get("/")
  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = this.healthService.getStatus();
      sendSuccess(res, "Health check successful", health);
    } catch (error) {
      next(error);
    }
  };
}

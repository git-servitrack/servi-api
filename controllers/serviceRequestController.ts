import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, authorize } from "../middleware/auth";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { ServiceRequestService } from "../services/serviceRequestService";
import { createServiceRequestSchema, updateServiceRequestSchema } from "../types/serviceRequest";

// Purpose: This controller class is responsible for handling the service request related requests.
@route("/service-requests")
export class ServiceRequestController {
  private serviceRequestService: ServiceRequestService;

  constructor() {
    this.serviceRequestService = new ServiceRequestService();
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getServiceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const serviceRequest = await this.serviceRequestService.getServiceRequest(
        req.params.id,
        parsedOptions,
      );
      sendSuccess(res, "Service request fetched successfully", serviceRequest);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getServiceRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const serviceRequests = await this.serviceRequestService.getServiceRequests(parsedOptions);
      sendSuccess(res, "Service requests fetched successfully", serviceRequests);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(createServiceRequestSchema))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceRequest = await this.serviceRequestService.createServiceRequest(req.body);
      sendSuccess(res, "Service request created successfully", serviceRequest, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.put("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(updateServiceRequestSchema))
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceRequest = await this.serviceRequestService.updateServiceRequest(req.body);
      sendSuccess(res, "Service request updated successfully", serviceRequest);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.serviceRequestService.deleteServiceRequest(req.params.id);
      sendSuccess(res, "Service request deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceRequest = await this.serviceRequestService.searchServiceRequest(req.body);
      sendSuccess(res, "Service request fetched successfully", serviceRequest);
    } catch (error) {
      next(error);
    }
  }
}

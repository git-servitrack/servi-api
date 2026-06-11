import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, AuthenticatedRequest, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { NotificationService } from "../services/notificationService";
import {
  createNotificationSchema,
  notificationIdSchema,
  notificationListSchema,
} from "../types/notification";

// Purpose: This controller class is responsible for current-user in-app notifications.
@route("/notifications")
export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  private getActorId(req: Request): string {
    const actorId = (req as AuthenticatedRequest).authUser?.sub;
    if (!actorId) throw new AppError("Authentication required", 401);
    return actorId;
  }

  @route.get("/unread-count")
  @UseMiddleware(authenticate)
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await this.notificationService.getUnreadCount(this.getActorId(req));
      sendSuccess(res, "Unread notification count fetched successfully", count);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(notificationListSchema))
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const notifications = await this.notificationService.getNotifications(
        this.getActorId(req),
        parsedOptions,
      );
      sendSuccess(res, "Notifications fetched successfully", notifications);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  @UseMiddleware(validate(createNotificationSchema))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await this.notificationService.createNotification(req.body);
      sendSuccess(res, "Notification created successfully", notification, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/read-all")
  @UseMiddleware(authenticate)
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.notificationService.markAllAsRead(this.getActorId(req));
      sendSuccess(res, "Notifications marked as read successfully", result);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/:id/read")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(notificationIdSchema))
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await this.notificationService.markAsRead(
        req.params.id,
        this.getActorId(req),
      );
      sendSuccess(res, "Notification marked as read successfully", notification);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(notificationIdSchema))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.notificationService.deleteNotification(req.params.id, this.getActorId(req));
      sendSuccess(res, "Notification deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }
}

import { FilterQuery } from "mongoose";
import { UserRole } from "../config/constants";
import { logger } from "../helpers/logger";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import {
  NotificationModel,
  NotificationRelatedModel,
  NotificationType,
} from "../models/notificationModel";
import { NotificationRepository } from "../repositories/notificationRepository";
import { UserRepository } from "../repositories/userRepository";
import { CreateNotificationRequest } from "../types/notification";

export interface NotifyInput {
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedModel?: NotificationRelatedModel;
  relatedId?: string;
  link?: string;
}

// Purpose: This service class handles user-facing in-app notifications and best-effort domain event notifications.
export class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  async getNotifications(
    recipient: string,
    options?: ParsedQueryOptions,
  ): Promise<NotificationModel[]> {
    return this.notificationRepository.getNotifications({
      ...options,
      filter: {
        ...(options?.filter || {}),
        recipient,
      },
    } as ParsedQueryOptions);
  }

  async getUnreadCount(recipient: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(recipient);
    return { count };
  }

  async createNotification(data: CreateNotificationRequest): Promise<NotificationModel> {
    const user = await this.userRepository.searchUser({ _id: data.recipient });
    if (!user) throw new AppError("Notification recipient not found", 400);

    return this.notificationRepository.createNotification(data);
  }

  async markAsRead(id: string, recipient: string): Promise<NotificationModel> {
    const notification = await this.notificationRepository.markAsRead(id, recipient);
    if (!notification) throw new AppError("Notification not found", 404);
    return notification;
  }

  async markAllAsRead(recipient: string): Promise<{ modifiedCount: number }> {
    return this.notificationRepository.markAllAsRead(recipient);
  }

  async deleteNotification(id: string, recipient: string): Promise<NotificationModel | null> {
    const notification = await this.notificationRepository.deleteNotification(id, recipient);
    if (!notification) throw new AppError("Notification not found", 404);
    return notification;
  }

  async searchNotification(
    query: FilterQuery<NotificationModel>,
  ): Promise<NotificationModel | null> {
    const notification = await this.notificationRepository.searchNotification(query);
    if (!notification) throw new AppError("Notification not found", 404);
    return notification;
  }

  async notifyUser(input: NotifyInput): Promise<void> {
    try {
      await this.notificationRepository.createNotification(input);
    } catch (error) {
      logger.error({
        message: "Notification creation failed",
        recipient: input.recipient,
        type: input.type,
        error: error instanceof Error ? error.message : "Unknown notification error",
      });
    }
  }

  async notifyUsers(inputs: NotifyInput[]): Promise<void> {
    const deduped = new Map<string, NotifyInput>();
    inputs.forEach((input) => {
      deduped.set(`${input.recipient}:${input.title}:${input.relatedId || ""}`, input);
    });

    await Promise.all(Array.from(deduped.values()).map((input) => this.notifyUser(input)));
  }

  async notifyRoles(
    roles: UserRole[],
    notification: Omit<NotifyInput, "recipient">,
  ): Promise<void> {
    try {
      const users = await this.userRepository.getUsers({
        select: "",
        limit: 0,
        sort: { createdAt: -1 },
        filter: { role: { $in: roles } },
      });

      await this.notifyUsers(
        users.map((user) => ({
          ...notification,
          recipient: user._id.toString(),
        })),
      );
    } catch (error) {
      logger.error({
        message: "Role notification creation failed",
        roles,
        type: notification.type,
        error: error instanceof Error ? error.message : "Unknown notification error",
      });
    }
  }
}

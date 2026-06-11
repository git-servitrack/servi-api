import { FilterQuery } from "mongoose";
import { sanitizeSelect } from "../helpers/common";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { Notification, NotificationModel } from "../models/notificationModel";

// Purpose: This file is responsible for handling all database operations related to in-app notifications.
export class NotificationRepository {
  async getNotifications(options?: ParsedQueryOptions): Promise<NotificationModel[]> {
    let query: any = Notification.find(options?.filter || {});

    if (options?.select) {
      const sanitizedSelect = sanitizeSelect(options.select);
      query = query.select(sanitizedSelect);
    }

    query = query.sort(options?.sort || "-createdAt");

    if (options?.limit) query = query.limit(options.limit);

    if (options?.populate && options.populate.length > 0) {
      options.populate.forEach((instruction) => {
        query = query.populate(instruction as any);
      });
    }

    return query.exec();
  }

  async countUnread(recipient: string): Promise<number> {
    return Notification.countDocuments({ recipient, readAt: null }).exec();
  }

  async createNotification(data: Partial<NotificationModel>): Promise<NotificationModel> {
    return Notification.create(data);
  }

  async markAsRead(id: string, recipient: string): Promise<NotificationModel | null> {
    return Notification.findOneAndUpdate(
      { _id: id, recipient },
      { readAt: new Date() },
      { new: true },
    ).exec();
  }

  async markAllAsRead(recipient: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      { recipient, readAt: null },
      { readAt: new Date() },
    );
    return { modifiedCount: result.modifiedCount };
  }

  async deleteNotification(id: string, recipient: string): Promise<NotificationModel | null> {
    return (Notification.findOneAndDelete({ _id: id, recipient }) as any).exec();
  }

  async searchNotification(
    query: FilterQuery<NotificationModel>,
  ): Promise<NotificationModel | null> {
    return Notification.findOne(query).exec();
  }
}

import { FilterQuery } from "mongoose";
import { sanitizeSelect } from "../helpers/common";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { MediaFile, MediaFileModel } from "../models/mediaFileModel";

// Purpose: This file is responsible for handling all database operations related to documentation media files.
export class DocumentationRepository {
  async getMediaFile(
    id: string,
    options?: ParsedQueryOptions,
  ): Promise<MediaFileModel | null> {
    let query: any = MediaFile.findById(id);

    if (options?.select) {
      const sanitizedSelect = sanitizeSelect(options.select);
      query = query.select(sanitizedSelect);
    } else {
      query = query.select("-password");
    }

    if (options?.populate && options.populate.length > 0) {
      options.populate.forEach((instruction) => {
        query = query.populate(instruction as any);
      });
    }

    return query.exec();
  }

  async getMediaFiles(options?: ParsedQueryOptions): Promise<MediaFileModel[]> {
    let query: any = MediaFile.find(options?.filter || {});

    if (options?.select) {
      const sanitizedSelect = sanitizeSelect(options.select);
      query = query.select(sanitizedSelect);
    } else {
      query = query.select("-password");
    }

    if (options?.sort) query = query.sort(options.sort);

    if (options?.limit) query = query.limit(options.limit);

    if (options?.populate && options.populate.length > 0) {
      options.populate.forEach((instruction) => {
        query = query.populate(instruction as any);
      });
    }

    return query.exec();
  }

  async createMediaFile(
    data: Partial<MediaFileModel>,
  ): Promise<MediaFileModel> {
    return MediaFile.create(data);
  }

  async deleteMediaFile(id: string): Promise<MediaFileModel | null> {
    return MediaFile.findByIdAndDelete(id);
  }

  async searchMediaFile(
    query: FilterQuery<MediaFileModel>,
  ): Promise<MediaFileModel | null> {
    return MediaFile.findOne(query).exec();
  }
}

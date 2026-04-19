import { Asset, AssetModel } from "../models/assetModel";
import { FilterQuery, UpdateQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { sanitizeSelect } from "../helpers/common";
import { CreateAssetRequest, UpdateAssetRequest } from "../types/asset";

// Purpose: This file is responsible for handling all the database operations related to the asset model.
export class AssetRepository {
  async getAsset(id: string, options?: ParsedQueryOptions): Promise<AssetModel | null> {
    let query: any = Asset.findById(id);

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

  async getAssets(options?: ParsedQueryOptions): Promise<AssetModel[]> {
    let query: any = Asset.find(options?.filter || {});

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

  async createAsset(data: CreateAssetRequest): Promise<AssetModel> {
    return Asset.create(data);
  }

  async updateAsset(id: string, data: Partial<UpdateAssetRequest>): Promise<AssetModel | null> {
    return Asset.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteAsset(id: string): Promise<AssetModel | null> {
    return Asset.findByIdAndDelete(id);
  }

  async searchAsset(query: FilterQuery<AssetModel>): Promise<AssetModel | null> {
    return Asset.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<AssetModel>,
    update?: UpdateQuery<AssetModel>,
    options?: { multi?: boolean },
  ): Promise<AssetModel | null | { modifiedCount: number }> {
    if (!update) {
      return Asset.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await Asset.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Asset.findOneAndUpdate(query, update, { new: true }).exec();
  }
}

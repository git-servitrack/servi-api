import { FilterQuery } from "mongoose";
import { generateUniqueCode } from "../helpers/generateCode";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { AssetModel } from "../models/assetModel";
import { AssetRepository } from "../repositories/assetRepository";
import { CreateAssetRequest } from "../types/asset";

// *Purpose: This service class is responsible for handling the business logic of the asset entity. It interacts with the asset repository to perform CRUD operations on the asset entity.
export class AssetService {
  private assetRepository: AssetRepository;

  constructor() {
    this.assetRepository = new AssetRepository();
  }

  async getAsset(id: string, options?: ParsedQueryOptions): Promise<AssetModel | null> {
    const asset = await this.assetRepository.getAsset(id, options);
    if (!asset) throw new AppError("Asset not found", 404);
    return asset;
  }

  async getAssets(options?: ParsedQueryOptions): Promise<AssetModel[]> {
    return this.assetRepository.getAssets(options);
  }

  async createAsset(data: CreateAssetRequest): Promise<AssetModel> {
    const provideCode = data.code?.trim();

    let finalCode: string;
    if (provideCode && provideCode.length > 0) {
      finalCode = provideCode;
    } else {
      try {
        finalCode = await generateUniqueCode({
          prefix: "AST",
          exists: async (code) => Boolean(await this.assetRepository.searchAsset({ code })),
        });
      } catch (error) {
        throw new AppError("Unable to generate unique asset code", 500);
      }
    }
    return await this.assetRepository.createAsset({ ...data, code: finalCode });
  }

  async updateAsset(data: Partial<AssetModel>): Promise<AssetModel | null> {
    if (!data._id) throw new AppError("Asset ID is required", 400);

    const asset = await this.assetRepository.updateAsset(data._id, data);
    if (!asset) throw new AppError("Asset not found", 404);
    return asset;
  }

  async deleteAsset(id: string): Promise<AssetModel | null> {
    const asset = await this.assetRepository.deleteAsset(id);
    if (!asset) throw new AppError("Asset not found", 404);
    return asset;
  }

  async searchAsset(query: FilterQuery<AssetModel>): Promise<AssetModel | null> {
    const asset = await this.assetRepository.searchAsset(query);
    if (!asset) throw new AppError("Asset not found", 404);
    return asset;
  }
}

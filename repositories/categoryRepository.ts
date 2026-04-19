import { Category, CategoryModel } from "../models/categoryModel";
import { FilterQuery, UpdateQuery } from "mongoose";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { sanitizeSelect } from "../helpers/common";
import { CreateCategoryRequest, UpdateCategoryRequest } from "../types/category";

// Purpose: This file is responsible for handling all the database operations related to the category model.
export class CategoryRepository {
  async getCategory(id: string, options?: ParsedQueryOptions): Promise<CategoryModel | null> {
    let query: any = Category.findById(id);

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

  async getCategories(options?: ParsedQueryOptions): Promise<CategoryModel[]> {
    let query: any = Category.find(options?.filter || {});

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

  async createCategory(data: CreateCategoryRequest): Promise<CategoryModel> {
    return Category.create(data);
  }

  async updateCategory(
    id: string,
    data: Partial<UpdateCategoryRequest>,
  ): Promise<CategoryModel | null> {
    return Category.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteCategory(id: string): Promise<CategoryModel | null> {
    return Category.findByIdAndDelete(id);
  }

  async searchCategory(query: FilterQuery<CategoryModel>): Promise<CategoryModel | null> {
    return Category.findOne(query).exec();
  }

  async searchAndUpdate(
    query: FilterQuery<CategoryModel>,
    update?: UpdateQuery<CategoryModel>,
    options?: { multi?: boolean },
  ): Promise<CategoryModel | null | { modifiedCount: number }> {
    if (!update) {
      return Category.findOne(query).exec();
    }

    if (options?.multi) {
      const result = await Category.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Category.findOneAndUpdate(query, update, { new: true }).exec();
  }

  async findActiveCategoryById(id: string): Promise<CategoryModel | null> {
    return Category.findOne({ _id: id, isActive: true }).exec();
  }
}

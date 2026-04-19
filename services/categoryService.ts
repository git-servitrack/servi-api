import { FilterQuery } from "mongoose";
import { generateUniqueCode } from "../helpers/generateCode";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { CategoryModel } from "../models/categoryModel";
import { CategoryRepository } from "../repositories/categoryRepository";
import { CreateCategoryRequest, UpdateCategoryRequest } from "../types/category";

// *Purpose: This service class is responsible for handling the business logic of the category entity. It interacts with the category repository to perform CRUD operations on the category entity.
export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategory(id: string, options?: ParsedQueryOptions): Promise<CategoryModel | null> {
    const category = await this.categoryRepository.getCategory(id, options);
    if (!category) throw new AppError("Category not found", 404);
    return category;
  }

  async getCategories(options?: ParsedQueryOptions): Promise<CategoryModel[]> {
    return this.categoryRepository.getCategories(options);
  }

  async createCategory(data: CreateCategoryRequest): Promise<CategoryModel> {
    const provideCode = data.code?.trim();

    let finalCode: string;
    if (provideCode && provideCode.length > 0) {
      finalCode = provideCode;
    } else {
      try {
        finalCode = await generateUniqueCode({
          prefix: "CAT",
          exists: async (code) => Boolean(await this.categoryRepository.searchCategory({ code })),
        });
      } catch (error) {
        throw new AppError("Unable to generate unique category code", 500);
      }
    }

    return await this.categoryRepository.createCategory({ ...data, code: finalCode });
  }

  async updateCategory(
    data: Partial<UpdateCategoryRequest> & { _id: string },
  ): Promise<CategoryModel | null> {
    if (!data._id) throw new AppError("Category ID is required", 400);

    const category = await this.categoryRepository.updateCategory(data._id, data);
    if (!category) throw new AppError("Category not found", 404);
    return category;
  }

  async deleteCategory(id: string): Promise<CategoryModel | null> {
    const category = await this.categoryRepository.deleteCategory(id);
    if (!category) throw new AppError("Category not found", 404);
    return category;
  }

  async searchCategory(query: FilterQuery<CategoryModel>): Promise<CategoryModel | null> {
    const category = await this.categoryRepository.searchCategory(query);
    if (!category) throw new AppError("Category not found", 404);
    return category;
  }
}

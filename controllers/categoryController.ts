import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, authorize } from "../middleware/auth";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { CategoryService } from "../services/categoryService";
import { createCategorySchema, updateCategorySchema } from "../types/category";

// Purpose: This controller class is responsible for handling the category related requests.
@route("/category")
export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const category = await this.categoryService.getCategory(req.params.id, parsedOptions);
      sendSuccess(res, "Category fetched successfully", category);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const categories = await this.categoryService.getCategories(parsedOptions);
      sendSuccess(res, "Categories fetched successfully", categories);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(createCategorySchema))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await this.categoryService.createCategory(req.body);
      sendSuccess(res, "Category created successfully", category, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.put("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(validate(updateCategorySchema))
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await this.categoryService.updateCategory(req.body);
      sendSuccess(res, "Category updated successfully", category);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.categoryService.deleteCategory(req.params.id);
      sendSuccess(res, "Category deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  @UseMiddleware(authenticate)
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await this.categoryService.searchCategory(req.body);
      sendSuccess(res, "Category fetched successfully", category);
    } catch (error) {
      next(error);
    }
  }
}

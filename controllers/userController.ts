import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { Cloudinary } from "../helpers/cloudinary";
import { QueryBuilder, QueryOptions } from "../helpers/queryBuilder";
import { sendSuccess } from "../helpers/response";
import { authenticate, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { upload } from "../middleware/multer";
import { UseMiddleware } from "../middleware/useMiddleware";
import { UserService } from "../services/userService";

// Purpose: This controller class is responsible for handling the user related requests.
@route("/user")
export class UserController {
  private userService: UserService;
  private cloudinary: Cloudinary;

  constructor() {
    this.userService = new UserService();
    this.cloudinary = new Cloudinary();
  }

  @route.get("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const queryOptions: QueryOptions = {
        fields: req.query.fields as string,
        populate: req.query.populate as string,
      };
      const parsedOptions = QueryBuilder.parse(queryOptions);
      const user = await this.userService.getUser(req.params.id, parsedOptions);
      sendSuccess(res, "User fetched successfully", user);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin", "head_technician"]))
  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
      const users = await this.userService.getUsers(parsedOptions);
      sendSuccess(res, "Users fetched successfully", users);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      sendSuccess(res, "User created successfully", user, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.put("/")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.updateUser(req.body);
      sendSuccess(res, "User updated successfully", user);
    } catch (error) {
      next(error);
    }
  }

  @route.delete("/:id")
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(["admin"]))
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.userService.deleteUser(req.params.id);
      sendSuccess(res, "User deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/search")
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.searchUser(req.body);
      sendSuccess(res, "User fetched successfully", user);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/upload-image/:id")
  @UseMiddleware(upload.single("image"))
  async uploadImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) throw new AppError("Please upload an image", 400);

      const image = await this.cloudinary.uploadImage(req.file, {
        folderPath: ["user-avatars", req.params.id],
      });
      const user = await this.userService.updateUser({
        _id: req.params.id,
        avatar: image.secureUrl,
      });
      sendSuccess(res, "User image uploaded successfully", user);
    } catch (error) {
      next(error);
    }
  }
}

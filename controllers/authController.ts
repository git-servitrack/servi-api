import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { sendError, sendSuccess } from "../helpers/response";
import { AuthenticatedRequest, authenticate } from "../middleware/auth";
import { UseMiddleware } from "../middleware/useMiddleware";
import { validate } from "../middleware/validate";
import { AuthService } from "../services/authService";
import { loginSchema, registerSchema } from "../types/auth";

@route("/auth")
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  @route.post("/register")
  @UseMiddleware(validate(registerSchema))
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.register(req.body);
      sendSuccess(res, "User registered successfully", result, 201);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/login")
  @UseMiddleware(validate(loginSchema))
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.login(req.body);
      sendSuccess(res, "Login successful", result);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/me")
  @UseMiddleware(authenticate)
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).authUser;

      if (!authUser) {
        sendError(res, "Unauthorized", 401);
        return;
      }

      const user = await this.authService.getMe(authUser.sub);
      sendSuccess(res, "User fetched successfully", user);
    } catch (error) {
      next(error);
    }
  }
}

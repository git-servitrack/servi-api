import { extract } from "express-extract-routes";
//used relative path to get the controller during runtime
import { UserController } from "../controllers/userController";
import { HealthController } from "../controllers/healthController";
import { AuthController } from "../controllers/authController";

// Extract all routes from the controllers.
export const routes = extract(UserController, HealthController, AuthController);

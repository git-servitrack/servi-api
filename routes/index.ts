import { extract } from "express-extract-routes";
//used relative path to get the controller during runtime
import { UserController } from "../controllers/userController";
import { HealthController } from "../controllers/healthController";
import { AuthController } from "../controllers/authController";
import { AssetController } from "../controllers/assetController";
import { CategoryController } from "../controllers/categoryController";
import { ServiceRequestController } from "../controllers/serviceRequestController";
import { MaintenanceController } from "../controllers/maintenanceController";
import { SparePartController } from "../controllers/sparePartController";
import { DocumentationController } from "../controllers/documentationController";
import { PredictiveMaintenanceController } from "../controllers/predictiveMaintenanceController";

// Extract all routes from the controllers.
export const routes = extract(
  UserController,
  HealthController,
  AuthController,
  AssetController,
  CategoryController,
  ServiceRequestController,
  MaintenanceController,
  SparePartController,
  DocumentationController,
  PredictiveMaintenanceController,
);

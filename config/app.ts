import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createController } from "express-extract-routes";
import { API_BASE_PATH, env } from "./env";
import { setupSwagger } from "./swagger";
import { routes } from "../routes";
import { errorHandler, notFound } from "../middleware/errorHandler";
import { requestLogger } from "../middleware/requestLogger";

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, "");

const parseCorsOrigins = (value: string) =>
  value
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);

export const createApp = (): express.Application => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : parseCorsOrigins(env.CORS_ORIGIN),
    }),
  );
  app.use(requestLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  routes.forEach((route) => {
    app[route.method](`${API_BASE_PATH}${route.path}`, createController(route));
  });

  setupSwagger(app);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

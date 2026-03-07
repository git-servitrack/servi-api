import { Application } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import { API_BASE_PATH, env } from "./env";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SERVI TRACK API",
      version: "1.0.0",
      description: "A robust and scalable SERVI TRACK API using Express.js and TypeScript",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${API_BASE_PATH}`,
      },
    ],
  },
  // Path to the API docs
  apis: ["./controllers/*.ts", "./routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);
const theme = new SwaggerTheme();

export const setupSwagger = (app: Application) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
    }),
  );
};

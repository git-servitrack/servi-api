import { createApp } from "./config/app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { logger } from "./helpers/logger";
import "reflect-metadata";

const startServer = async () => {
  try {
    await connectDatabase();

    const app = createApp();
    const port = env.PORT;

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", {error});
    process.exit(1);
  }
};

startServer();

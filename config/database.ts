import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../helpers/logger";

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) return;

  await mongoose.connect(env.MONGO_URI);
  isConnected = true;
  logger.info("MongoDB connected");
};

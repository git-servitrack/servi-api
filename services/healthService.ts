import mongoose from "mongoose";

export interface HealthStatus {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
  database: "connected" | "disconnected";
}

export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: mongoose.connection.readyState === 1 ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    };
  }
}

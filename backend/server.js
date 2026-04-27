import "dotenv/config";
import { validateEnv } from "./src/config/env.js";
validateEnv();

import app from "./src/app.js";
import prisma from "./src/config/prisma.js";
import redis from "./src/utils/redis.js";
import { startCronJobs } from "./src/services/cron.service.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    await redis.ping();

    const server = app.listen(PORT, () => {
      console.log(`🚀 HRMS API running on http://localhost:${PORT}`);
      console.log(`📋 Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      startCronJobs();
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        console.log("✅ Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

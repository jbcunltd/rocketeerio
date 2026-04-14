/**
 * Vercel Serverless Function entry point.
 *
 * This file re-exports the Express app so Vercel can handle it
 * as a serverless function. All /api/* routes are handled here.
 */
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { processFollowUps } from "../server/follow-up-worker";
import { createContext } from "../server/_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Auth routes
registerAuthRoutes(app);

// Follow-up cron endpoint
app.post("/api/cron/follow-ups", async (_req, res) => {
  try {
    await processFollowUps();
    res.json({ success: true });
  } catch (error) {
    console.error("[Cron] Follow-up processing failed:", error);
    res.status(500).json({ error: "Follow-up processing failed" });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;

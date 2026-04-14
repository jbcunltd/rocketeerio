import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { registerAuthRoutes } from "../../server/_core/oauth";
import express from "express";

const app = express();
app.use(express.json({ limit: "50mb" }));
registerAuthRoutes(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  return app(req, res);
}

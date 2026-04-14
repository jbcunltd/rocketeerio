import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { registerAuthRoutes } from "../../server/_core/oauth";
import express from "express";

const app = express();
app.use(express.json({ limit: "50mb" }));
registerAuthRoutes(app);

// Extract the signup handler
const signupHandler = app._router.stack.find(
  (layer: any) => layer.route && layer.route.path === "/api/auth/signup"
)?.route.methods.post[0];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  // Call the signup handler
  return app(req, res);
}

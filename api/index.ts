import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const steps: string[] = [];
  try {
    steps.push("start");
    await import("dotenv/config");
    steps.push("dotenv ok");
    const { default: express } = await import("express");
    steps.push("express ok");
    const app = express();
    app.use(express.json({ limit: "50mb" }));
    steps.push("app created");
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
    steps.push("trpc adapter ok");
    const { registerAuthRoutes } = await import("../server/_core/oauth");
    steps.push("oauth import ok");
    registerAuthRoutes(app);
    steps.push("auth routes registered");
    const { appRouter } = await import("../server/routers");
    steps.push("routers import ok");
    const { createContext } = await import("../server/_core/context");
    steps.push("context import ok");
    app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
    steps.push("trpc mounted");
    return app(req as any, res as any);
  } catch (error: any) {
    return res.status(500).json({
      steps,
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5),
    });
  }
}

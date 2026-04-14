import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const steps: string[] = [];
  try {
    steps.push("start");

    // Step 1: dotenv
    await import("dotenv/config");
    steps.push("dotenv ok");

    // Step 2: express
    const { default: express } = await import("express");
    steps.push("express ok");

    // Step 3: create app
    const app = express();
    app.use(express.json({ limit: "50mb" }));
    steps.push("app created");

    // Step 4: tRPC adapter
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
    steps.push("trpc adapter ok");

    // Step 5: auth routes
    const { registerAuthRoutes } = await import("../../server/_core/oauth");
    steps.push("oauth import ok");

    // Step 6: register auth
    registerAuthRoutes(app);
    steps.push("auth routes registered");

    // Step 7: routers
    const { appRouter } = await import("../../server/routers");
    steps.push("routers import ok");

    // Step 8: context
    const { createContext } = await import("../../server/_core/context");
    steps.push("context import ok");

    // Step 9: mount tRPC
    app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
    steps.push("trpc mounted");

    // Step 10: handle request
    return app(req as any, res as any);
  } catch (error: any) {
    return res.status(500).json({
      steps,
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5),
      name: error.constructor.name,
    });
  }
}

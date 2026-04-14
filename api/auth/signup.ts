import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Step 1: Can we even import dotenv?
    await import("dotenv/config");
    
    // Step 2: Can we import postgres?
    const { default: postgres } = await import("postgres");
    
    // Step 3: Can we connect?
    const sql = postgres(process.env.DATABASE_URL || "");
    const result = await sql`SELECT 1 as test`;
    await sql.end();
    
    return res.status(200).json({ 
      ok: true, 
      db: "connected",
      result: result[0]
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      name: error.constructor.name
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { leadCaptureTable } from "@/lib/db/schema";

export const runtime = "nodejs";

const leadSchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  const { email, source } = parsed.data;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  console.log(
    `[leads] capture email=${email} source=${source ?? "n/a"} ip=${ip ?? "n/a"}`,
  );

  try {
    await db
      .insert(leadCaptureTable)
      .values({
        email: email.toLowerCase(),
        source: source ?? "unknown",
        ip,
        userAgent: ua,
      })
      .onConflictDoNothing();
  } catch (err) {
    // DB unavailable — still treat as success since we logged it
    console.error("[leads] db insert failed (non-fatal)", err);
  }

  return NextResponse.json({ ok: true });
}

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveAppUrl } from "@/lib/auth/facebook";

export const runtime = "nodejs";

type DataDeletionRequestBody = {
  signed_request?: unknown;
};

async function readSignedRequest(req: NextRequest): Promise<string | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as DataDeletionRequestBody | null;
    return typeof body?.signed_request === "string" ? body.signed_request : null;
  }

  const formData = await req.formData().catch(() => null);
  const signedRequest = formData?.get("signed_request");
  return typeof signedRequest === "string" ? signedRequest : null;
}

function createConfirmationCode(signedRequest: string): string {
  return createHash("sha256")
    .update(signedRequest)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  const signedRequest = await readSignedRequest(req);

  if (!signedRequest) {
    return NextResponse.json(
      { error: "Missing signed_request parameter" },
      { status: 400 },
    );
  }

  const origin = resolveAppUrl(new URL(req.url).origin);
  const confirmationCode = createConfirmationCode(signedRequest);
  const statusUrl = new URL("/api/auth/facebook/data-deletion/status", origin);
  statusUrl.searchParams.set("id", confirmationCode);

  return NextResponse.json({
    url: statusUrl.toString(),
    confirmation_code: confirmationCode,
  });
}

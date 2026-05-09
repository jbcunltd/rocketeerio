import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/cookies";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";

const DEFAULT_API_URL = "https://rocketeerio-server-production.up.railway.app";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyHandbookRequest(req: NextRequest, context: RouteContext) {
  const { user, session } = await getCurrentSession();
  if (!user || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  if (!path?.length) {
    return NextResponse.json({ error: "Missing handbook path" }, { status: 400 });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
  const targetUrl = `${baseUrl}/api/handbook/${path.map(encodeURIComponent).join("/")}`;

  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE_NAME)?.value;
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("X-Rocketeerio-User-Id", user.id);
  headers.set("X-User-Id", user.id);
  headers.set("X-Rocketeerio-Session-Id", session.id);

  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`);
  }

  const inboundContentType = req.headers.get("content-type");
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.text();
    if (inboundContentType) headers.set("Content-Type", inboundContentType);
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseText = await upstream.text();
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
    responseHeaders.set("Content-Type", contentType);

    return new NextResponse(responseText || null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[handbook proxy] request failed", err);
    return NextResponse.json(
      { error: "Unable to reach the handbook backend. Please try again." },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return proxyHandbookRequest(req, context);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return proxyHandbookRequest(req, context);
}

export async function POST(req: NextRequest, context: RouteContext) {
  return proxyHandbookRequest(req, context);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return proxyHandbookRequest(req, context);
}

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const revalidate = 86400; // 24h

const BRAND = "#0084FF";
const BRAND_DARK = "#006BD1";
const INK_900 = "#0B1220";

/**
 * Dynamic OG image generator.
 *
 * Usage:
 *   /api/og                                  -> default homepage card
 *   /api/og?title=...&eyebrow=...&kicker=... -> per-page card
 *
 * Always returns 1200x630 PNG suitable for og:image and twitter:image.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title =
    searchParams.get("title")?.slice(0, 140) ||
    "AI-Powered Facebook Lead Conversion";
  const eyebrow =
    searchParams.get("eyebrow")?.slice(0, 60) || "ROCKETEERIO";
  const kicker =
    searchParams.get("kicker")?.slice(0, 80) ||
    "Auto-reply, qualify, and close — in under 60 seconds.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${INK_900} 0%, #0E1A33 55%, ${BRAND_DARK} 100%)`,
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative blob */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: `radial-gradient(closest-side, ${BRAND}55, transparent 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: `radial-gradient(closest-side, ${BRAND}33, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Header / brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 12px 32px ${BRAND}55`,
              fontSize: 32,
              fontWeight: 800,
              color: "white",
            }}
          >
            R
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.4,
              display: "flex",
            }}
          >
            Rocketeerio
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#9DC8FF",
              display: "flex",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.82)",
              display: "flex",
              maxWidth: 920,
            }}
          >
            {kicker}
          </div>
        </div>

        {/* Footer pill row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {[
            "Sub-60s response",
            "500+ businesses",
            "98% uptime",
          ].map((s) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                fontSize: 22,
                fontWeight: 600,
                color: "white",
              }}
            >
              {s}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            rocketeerio.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

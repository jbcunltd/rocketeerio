"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          color: "#0B1220",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            textAlign: "center",
            background: "#FFFFFF",
            border: "1px solid #E5E9F0",
            borderRadius: 16,
            padding: "2.5rem 1.75rem",
            boxShadow: "0 10px 30px rgba(11,18,32,0.06)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#475569",
              margin: 0,
            }}
          >
            Rocketeerio
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              margin: "12px 0 0",
            }}
          >
            We&apos;re having a moment.
          </h1>
          <p style={{ marginTop: 12, color: "#475569", lineHeight: 1.55 }}>
            Our team has been pinged. Please refresh the page — if it keeps
            happening, head back to the homepage and we&apos;ll get you sorted.
          </p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                appearance: "none",
                border: "none",
                cursor: "pointer",
                background: "#006BD1",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 20px",
                borderRadius: 12,
                boxShadow: "0 4px 14px rgba(0,107,209,0.30)",
              }}
            >
              Refresh
            </button>
            <a
              href="/"
              style={{
                background: "#FFFFFF",
                color: "#0B1220",
                fontWeight: 600,
                fontSize: 14,
                padding: "11px 19px",
                borderRadius: 12,
                border: "1px solid #E5E9F0",
                textDecoration: "none",
              }}
            >
              Back to homepage
            </a>
          </div>
          {error?.digest && (
            <p
              style={{
                marginTop: 22,
                fontSize: 11,
                color: "#94A3B8",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

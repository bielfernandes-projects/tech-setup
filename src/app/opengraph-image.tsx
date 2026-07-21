import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "oklch(0.141 0.004 285)",
          fontFamily: "Geist, system-ui, sans-serif",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 20,
            background: "#18181b",
            color: "#0d9488",
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          TS
        </div>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "oklch(0.98 0.001 286)",
            textAlign: "center",
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}
        >
          Tech Setup
        </h1>
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "oklch(0.552 0.015 286)",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Practical guides for developers — troubleshooting, setup, and tools
        </p>
      </div>
    ),
    { ...size },
  );
}

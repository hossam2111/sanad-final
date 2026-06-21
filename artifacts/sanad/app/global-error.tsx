"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#111",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            boxShadow: "0 8px 32px rgba(0,0,0,.08)",
            padding: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            حدث خطأ في التطبيق / Application error
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
            يتعذّر تشغيل المنصة. حاول مرة أخرى.
            <br />
            The platform could not start. Please retry.
          </p>
          {error.digest && (
            <p style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginBottom: 16 }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              background: "#007AFF",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة / Retry
          </button>
        </div>
      </body>
    </html>
  );
}

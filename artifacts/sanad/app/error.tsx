"use client";

import React, { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console so the dev can inspect during demos without opening DevTools
    console.error("[SANAD] Unhandled error:", error);
  }, [error]);

  const isAr =
    typeof window !== "undefined" &&
    (localStorage.getItem("sanad_locale") === "ar" ||
      document.documentElement.dir === "rtl");

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6"
    >
      <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-xl p-8 text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center text-3xl">
          ⚠️
        </div>

        {/* Headline */}
        <h1 className="text-xl font-bold text-foreground">
          {isAr ? "حدث خطأ غير متوقع" : "Something went wrong"}
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للرئيسية."
            : "This page failed to load. Try again or return to the home screen."}
        </p>

        {/* Error digest (safe to show — no stack, just a reference) */}
        {error.digest && (
          <p className="text-[10px] font-mono text-muted-foreground/60">
            ref: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {isAr ? "إعادة المحاولة" : "Try again"}
          </button>
          <a
            href="/"
            className="px-5 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            {isAr ? "الرئيسية" : "Home"}
          </a>
        </div>

        {/* Branding */}
        <p className="text-[10px] text-muted-foreground/50 pt-2">
          SANAD Health · {isAr ? "المنصة الوطنية للذكاء الصحي" : "National Health Intelligence"}
        </p>
      </div>
    </div>
  );
}

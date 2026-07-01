"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function EmergencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SANAD EMERGENCY] Critical UI Error:", error);
  }, [error]);

  const isAr =
    typeof window !== "undefined" &&
    (localStorage.getItem("sanad_locale") === "ar" || document.documentElement.dir === "rtl");

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-6"
    >
      <div className="max-w-xl w-full bg-white border border-red-200 rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="flex items-center gap-4 text-red-600">
          <div className="p-3 bg-red-100 rounded-full animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">
            {isAr ? "انقطاع في نظام الطوارئ" : "Emergency System Interruption"}
          </h1>
        </div>

        <p className="text-base text-red-800 leading-relaxed">
          {isAr
            ? "تعذر تحميل هذه الصفحة بسبب خطأ في الشبكة أو الخادم. في الحالات الحرجة، يرجى الاستمرار في تقديم الرعاية المباشرة واستخدام السجلات الورقية إذا لزم الأمر، ثم إعادة المحاولة."
            : "This page failed to load due to a network or server error. In critical cases, please proceed with direct patient care using paper records if necessary, then try again."}
        </p>

        <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-sm font-mono text-red-700/80 break-all">
          {error.message || (isAr ? "خطأ غير معروف" : "Unknown Error")}
          {error.digest && <div className="mt-2 text-xs">ref: {error.digest}</div>}
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
          >
            <RefreshCcw className="w-5 h-5" />
            {isAr ? "إعادة المحاولة فوراً" : "Retry Immediately"}
          </button>
          <a
            href="/emergency"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-red-200 text-red-800 font-semibold hover:bg-red-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            {isAr ? "لوحة الطوارئ" : "Emergency Dashboard"}
          </a>
        </div>
      </div>
    </div>
  );
}

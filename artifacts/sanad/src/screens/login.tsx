"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowLeft, ArrowRight, BedDouble, Brain, Building2,
  ChevronDown, Eye, EyeOff, FlaskConical, HeartPulse, Languages, Lock,
  Microscope, Package, Pill, Shield, ShieldAlert, User, Users,
} from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";

/* ────────────────────────────────────────────────────────────────────────────
   SANAD — Portal access
   Real credential-based authentication. The threshold between the public
   story (/) and the role-scoped workspaces.
──────────────────────────────────────────────────────────────────────────── */

type DemoAccount = {
  role: UserRole;
  username: string;
  password: string;
  icon: React.ElementType;
  en: string;
  ar: string;
  href: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "doctor",       username: "dr.rashidi",      password: "Doctor@2026",    icon: HeartPulse,   en: "Physician",    ar: "طبيب",        href: "/doctor" },
  { role: "emergency",    username: "emergency_unit7",  password: "Emergency@2026", icon: ShieldAlert,  en: "Emergency",    ar: "طوارئ",       href: "/emergency" },
  { role: "citizen",      username: "citizen_demo",     password: "Citizen@2026",   icon: User,         en: "Citizen",      ar: "مواطن",       href: "/citizen" },
  { role: "admin",        username: "admin.saad",       password: "Admin@2026",     icon: Building2,    en: "Ministry",     ar: "الوزارة",     href: "/admin" },
  { role: "lab",          username: "lab.sara",         password: "Lab@2026",       icon: FlaskConical, en: "Laboratory",   ar: "مختبر",       href: "/lab" },
  { role: "pharmacy",     username: "pharm.hassan",     password: "Pharmacy@2026",  icon: Pill,         en: "Pharmacy",     ar: "صيدلية",      href: "/pharmacy" },
  { role: "hospital",     username: "hosp.ops",         password: "Hospital@2026",  icon: BedDouble,    en: "Hospital",     ar: "مستشفى",      href: "/hospital" },
  { role: "insurance",    username: "ins.nora",         password: "Insurance@2026", icon: Shield,       en: "Insurance",    ar: "تأمين",       href: "/insurance" },
  { role: "ai-control",   username: "ai.khalid",        password: "AiControl@2026", icon: Brain,        en: "AI Control",   ar: "مركز الذكاء", href: "/ai-control" },
  { role: "research",     username: "research.reem",    password: "Research@2026",  icon: Microscope,   en: "Research",     ar: "أبحاث",       href: "/research" },
  { role: "family",       username: "family.fatima",    password: "Family@2026",    icon: Users,        en: "Family",       ar: "أسرة",        href: "/family" },
  { role: "supply-chain", username: "supply.ibrahim",   password: "Supply@2026",    icon: Package,      en: "Supply Chain", ar: "إمداد",       href: "/supply-chain" },
];

const PORTAL_HREFS: Record<string, string> = Object.fromEntries(
  DEMO_ACCOUNTS.map((a) => [a.role, a.href]),
);

function SanadMark({ size = 30 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[9px]"
      style={{ width: size, height: size, background: "linear-gradient(135deg, #0A84FF 0%, #0048C0 100%)" }}
    >
      <Activity className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.4} />
    </div>
  );
}

export default function PortalAccess() {
  const { login } = useAuth();
  const { text, dir, locale, toggleLocale } = useLanguage();
  const router = useRouter();
  const reduce = useReducedMotion();
  const isAr = locale === "ar";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  // Auto-fill from deep-link: /login?role=doctor
  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role) {
      const match = DEMO_ACCOUNTS.find((a) => a.role === role);
      if (match) {
        setUsername(match.username);
        setPassword(match.password);
      }
    }
  }, []);

  const fillAccount = (account: DemoAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setError(null);
    setShowDemo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const p = password.trim();
    if (!u || !p || loading) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(u, p);
      router.push(PORTAL_HREFS[user.role] ?? "/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : text("Authentication failed. Please try again.", "فشل التحقق. حاول مرة أخرى."),
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#05070C] text-[#F4F6FA] antialiased selection:bg-[#0A84FF]/30">

      {/* ─── Brand panel ─── */}
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-e border-white/[0.06] p-10 lg:flex xl:p-14">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 90% 70% at 30% 20%, black 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 30% 20%, black 20%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -start-40 -top-40 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(10,132,255,0.14), transparent)" }}
        />

        <Link href="/" className="relative flex items-center gap-3">
          <SanadMark />
          <span className="text-[16px] font-bold tracking-tight text-white">{text("SANAD", "سند")}</span>
        </Link>

        <div className="relative">
          <h1
            className="mb-6 font-semibold text-white"
            style={{
              fontSize: "clamp(1.9rem, 2.6vw, 2.5rem)",
              lineHeight: isAr ? 1.4 : 1.15,
              letterSpacing: isAr ? "0" : "-0.03em",
            }}
          >
            {text("One nation.", "وطن واحد.")}
            <br />
            {text("One record.", "سجل واحد.")}
            <br />
            {text("One intelligence.", "ذكاء واحد.")}
          </h1>
          <p className="mb-10 max-w-[380px] text-[14px] leading-relaxed text-white/55">
            {text(
              "Every workspace draws on the same sovereign intelligence layer — scoped precisely to your role.",
              "تستند كل مساحة عمل إلى طبقة الذكاء السيادية نفسها — ضمن حدود دورك بدقة.",
            )}
          </p>
          <div className={`flex items-center gap-5 text-[11px] text-white/45 ${isAr ? "font-semibold" : "font-mono"}`} dir={dir}>
            <span className="flex items-center gap-1.5 text-success/90">
              <span className="beacon h-1.5 w-1.5 rounded-full bg-success" />
              {text("OPERATIONAL", "تعمل")}
            </span>
            <span>9 {text("ENGINES", "محركات")}</span>
            <span>13 {text("REGIONS", "منطقة")}</span>
            <span>24/7</span>
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-[11px] text-white/30">
          <Lock className="h-3 w-3" />
          {text(
            "RBAC-governed · Encrypted sessions · Audited per MOH Circular 42/1445",
            "وصول مُدار بالصلاحيات · جلسات مشفّرة · تدقيق وفق تعميم وزارة الصحة 42/1445",
          )}
        </p>
      </aside>

      {/* ─── Access panel ─── */}
      <main className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.06] px-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2 rounded-md text-[12.5px] font-medium text-white/60 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#4D9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070C]">
            <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
            <span className="lg:hidden"><SanadMark size={24} /></span>
            <span className="hidden lg:inline">{text("What is SANAD?", "ما هو سند؟")}</span>
          </Link>
          <button
            type="button"
            onClick={toggleLocale}
            className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[12px] font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white"
          >
            <Languages className="h-3.5 w-3.5" />
            {locale === "ar" ? "EN" : "عربي"}
          </button>
        </header>

        <motion.div
          className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-6 py-12 lg:px-8"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="mb-10">
            <p className={`mb-3 text-[#4D9FFF] ${isAr ? "text-[12px] font-bold" : "text-[11px] font-mono uppercase tracking-[0.22em]"}`}>
              {text("Portal access", "الدخول إلى البوابات")}
            </p>
            <h2
              className="mb-2 font-semibold text-white"
              style={{ fontSize: "clamp(1.7rem, 3vw, 2.2rem)", letterSpacing: isAr ? "0" : "-0.03em", lineHeight: isAr ? 1.4 : 1.15 }}
            >
              {text("Sign in", "تسجيل الدخول")}
            </h2>
            <p className="text-[13.5px] leading-relaxed text-white/45">
              {text(
                "Enter your SANAD credentials to access your workspace.",
                "أدخل بيانات اعتمادك للوصول إلى مساحة عملك.",
              )}
            </p>
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="sanad-username"
                className={`mb-1.5 block text-[12px] font-medium text-white/55 ${isAr ? "" : "uppercase tracking-[0.12em]"}`}
              >
                {text("Username", "اسم المستخدم")}
              </label>
              <input
                id="sanad-username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder={text("e.g. dr.rashidi", "مثال: dr.rashidi")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[14px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#4D9FFF]/60 focus:bg-white/[0.05]"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="sanad-password"
                className={`mb-1.5 block text-[12px] font-medium text-white/55 ${isAr ? "" : "uppercase tracking-[0.12em]"}`}
              >
                {text("Password", "كلمة المرور")}
              </label>
              <div className="relative">
                <input
                  id="sanad-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 pe-11 text-[14px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#4D9FFF]/60 focus:bg-white/[0.05]"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/45 outline-none hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[#4D9FFF]"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-danger/25 bg-danger/[0.08] px-4 py-3 text-[13px] font-medium text-danger"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!username.trim() || !password.trim() || loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-bold text-[#05070C] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#05070C]/25 border-t-[#05070C]" />
                  {text("Signing in…", "جاري الدخول…")}
                </>
              ) : (
                <>
                  {text("Sign in", "تسجيل الدخول")}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] px-4 py-3 text-start text-[12.5px] text-white/55 outline-none transition-colors hover:border-white/15 hover:text-white/75 focus-visible:ring-2 focus-visible:ring-[#4D9FFF]"
            >
              <span>
                {text("Demo accounts — click to auto-fill", "حسابات تجريبية — انقر للملء التلقائي")}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showDemo ? "rotate-180" : ""}`} />
            </button>

            {showDemo && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 overflow-hidden rounded-xl border border-white/[0.07]"
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-white/[0.06]">
                  {DEMO_ACCOUNTS.map((account) => {
                    const Icon = account.icon;
                    const isActive = username === account.username;
                    return (
                      <button
                        key={account.role}
                        type="button"
                        onClick={() => fillAccount(account)}
                        className={`flex flex-col items-center gap-1.5 bg-[#070B12] px-2 py-3 transition-colors hover:bg-[#0A1220] ${
                          isActive ? "bg-[#0A84FF]/10" : ""
                        }`}
                      >
                        <Icon
                          className={`h-[15px] w-[15px] ${isActive ? "text-[#7CB9FF]" : "text-white/40"}`}
                          strokeWidth={1.8}
                        />
                        <span className={`text-center text-[10.5px] font-medium leading-tight ${isActive ? "text-white" : "text-white/50"}`}>
                          {isAr ? account.ar : account.en}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="bg-[#070B12] px-4 py-2.5">
                  <p className="font-mono text-[10.5px] text-white/30" dir="ltr">
                    {username
                      ? `${username}  ·  ${DEMO_ACCOUNTS.find((a) => a.username === username)?.password ?? "·····"}`
                      : text("Select a role to fill credentials", "اختر دوراً لملء بيانات الاعتماد")}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <p className="mt-8 flex items-center gap-2 text-[11px] text-white/45">
            <Lock className="h-3 w-3 shrink-0" />
            {text(
              "Access is provisioned by the Ministry of Health. All sessions are audited.",
              "يُمنح الوصول عبر وزارة الصحة. جميع الجلسات مُدقَّقة.",
            )}
          </p>
        </motion.div>
      </main>
    </div>
  );
}

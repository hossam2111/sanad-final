"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, ArrowUpRight, Eye, Landmark, Languages,
  Lock, Menu, ScrollText, ShieldCheck, UserCheck, X as XIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const EASE = [0.22, 1, 0.36, 1] as const;
const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#4D9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070C]";

/* ─── Primitives ─── */

function Reveal({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ en, ar }: { en: string; ar: string }) {
  const { text, locale } = useLanguage();
  return (
    <p className={`text-[#4D9FFF] mb-6 flex items-center gap-3 ${locale === "en" ? "text-[11px] font-mono uppercase tracking-[0.22em]" : "text-[12px] font-bold"}`}>
      <span className="inline-block h-px w-7 bg-[#4D9FFF]/50" />
      {text(en, ar)}
    </p>
  );
}

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 overflow-x-hidden ${className}`}>
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

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

function Wordmark() {
  const { text } = useLanguage();
  return (
    <Link href="/" className={`flex items-center gap-3 rounded-md ${FOCUS}`}>
      <SanadMark />
      <span className="flex items-baseline gap-2.5">
        <span className="text-[16px] font-bold tracking-tight text-white">{text("SANAD", "سند")}</span>
        <span className="hidden text-[11px] font-medium text-white/50 sm:inline">
          {text("Sovereign Health Intelligence", "الذكاء الصحي السيادي")}
        </span>
      </span>
    </Link>
  );
}

/* ─── Decision Trace ─── */

type TraceRow = { tag: string; accent?: boolean; seal?: boolean; main: string; note: string; time: string };
type TraceCase = { id: string; en: string; ar: string; rows: TraceRow[] };

const TRACE_CASES: TraceCase[] = [
  {
    id: "case #a3f9-2210",
    en: "One decision, traced end to end — a potassium result becomes an amended prescription in 41 seconds, with its chain of trust sealed.",
    ar: "قرار واحد متتبَّع من طرفه إلى طرفه — نتيجة بوتاسيوم تتحوّل إلى وصفة معدَّلة خلال 41 ثانية، بسلسلة ثقة موثَّقة.",
    rows: [
      { tag: "SIGNAL", main: "lab.result.created — K⁺ 6.1 mmol/L", note: "flagged: severe hyperkalemia", time: "14:02:31" },
      { tag: "ENGINE", accent: true, main: "03 · Risk Stratification", note: "risk CRITICAL · confidence 0.94 · reasoning attached", time: "+212 ms" },
      { tag: "ENGINE", accent: true, main: "02 · Drug Interaction", note: "conflict: active spironolactone", time: "+367 ms" },
      { tag: "DECIDE", main: "alert routed → attending physician", note: "advise: hold diuretic · recheck K⁺ in 2 h", time: "+408 ms" },
      { tag: "ACTION", main: "e-prescription amended — physician confirmed", note: "AI advised · the decision was human", time: "14:03:12" },
      { tag: "ISNĀD", seal: true, main: "chain of trust recorded", note: "5 attestations · immutable", time: "sealed" },
    ],
  },
  {
    id: "case #e120-0418",
    en: "An unconscious patient's critical profile reaches the paramedic in under a second — and the ER is ready before the ambulance moves.",
    ar: "الملف الحرج لمريضٍ فاقد للوعي يصل إلى المسعف في أقل من ثانية — وقسم الطوارئ جاهز قبل أن تتحرك سيارة الإسعاف.",
    rows: [
      { tag: "SIGNAL", main: "ems.scan — citizen ID verified", note: "unconscious patient · response unit 7", time: "09:14:02" },
      { tag: "ENGINE", accent: true, main: "01 · Clinical Decision Support", note: "blood O− · allergy: penicillin · anticoagulant active", time: "+118 ms" },
      { tag: "DECIDE", main: "critical profile → paramedic display", note: "bleed-risk protocol · avoid penicillin", time: "+342 ms" },
      { tag: "ACTION", main: "ER pre-armed — trauma bay 4 reserved", note: "ETA 11 min · team paged", time: "09:14:05" },
      { tag: "ISNĀD", seal: true, main: "chain of trust recorded", note: "4 attestations · immutable", time: "sealed" },
    ],
  },
  {
    id: "case #s774-1109",
    en: "A demand spike becomes a redistribution plan — a stockout averted nine days before it happens.",
    ar: "قفزة في الطلب تتحوّل إلى خطة إعادة توزيع — ونقصٌ دوائي يُتفادى قبل حدوثه بتسعة أيام.",
    rows: [
      { tag: "SIGNAL", main: "rx.fill_rate — amoxicillin, Eastern Region", note: "7-day demand +38% vs baseline", time: "21:40:11" },
      { tag: "ENGINE", accent: true, main: "08 · Shortage Prediction", note: "stockout in 9 days · confidence 0.91", time: "+1.2 s" },
      { tag: "ENGINE", accent: true, main: "05 · Epidemic Radar", note: "paediatric RTI cluster — 3 districts", time: "+1.9 s" },
      { tag: "DECIDE", main: "redistribution plan → supply ops", note: "2 warehouses · 14 pharmacies", time: "+2.4 s" },
      { tag: "ACTION", main: "transfer orders issued — human approved", note: "stockout averted · loop closed", time: "21:42:05" },
      { tag: "ISNĀD", seal: true, main: "chain of trust recorded", note: "6 attestations · immutable", time: "sealed" },
    ],
  },
];

function TraceRows({ rows, animate }: { rows: TraceRow[]; animate: boolean }) {
  return (
    <div aria-hidden className="overflow-hidden px-3 sm:px-5 py-4">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={animate ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: animate ? 0.2 + i * 0.26 : 0, ease: EASE }}
          className="flex min-w-0 items-baseline gap-2 sm:gap-4 border-b border-white/[0.04] py-2.5 font-mono text-[12px] last:border-b-0"
        >
          <span className={`w-12 sm:w-14 shrink-0 text-[10px] sm:text-[10.5px] tracking-[0.1em] ${r.accent ? "text-[#7CB9FF]" : r.seal ? "text-[#22c55e]" : "text-white/50"}`}>
            {r.tag}
          </span>
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate text-white/90">{r.main}</span>
            <span className="block truncate text-[11px] text-white/40">{r.note}</span>
          </span>
          <span className="shrink-0 tabular-nums text-[10px] sm:text-[11px] text-white/35">{r.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

function DecisionTrace() {
  const { text, locale } = useLanguage();
  const reduce = useReducedMotion();
  const [caseIdx, setCaseIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setCaseIdx((i) => (i + 1) % TRACE_CASES.length), 14000);
    return () => clearInterval(t);
  }, [reduce]);

  const c = TRACE_CASES[caseIdx]!;
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div
        dir="ltr"
        role="img"
        aria-label="Decision Trace Visualization"
        className="overflow-hidden rounded-2xl border border-white/[0.12] text-left shadow-[0_32px_120px_rgba(10,132,255,0.15)] backdrop-blur-2xl"
        style={{ background: "rgba(10, 15, 25, 0.6)" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 font-mono text-[10.5px] tracking-[0.12em] text-white/45">
          <span>DECISION TRACE</span>
          <span className="flex items-center gap-3">
            <span aria-hidden className="text-white/30">{c.id}</span>
            <span className="flex items-center gap-1.5">
              {TRACE_CASES.map((tc, i) => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setCaseIdx(i)}
                  aria-label={`Case ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${FOCUS} ${i === caseIdx ? "w-4 bg-[#7CB9FF]" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
                />
              ))}
            </span>
          </span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={caseIdx}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <TraceRows rows={c.rows} animate={!reduce} />
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={`${caseIdx}-${locale}`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mt-4 text-center text-[13px] leading-relaxed text-white/50"
        >
          {text(c.en, c.ar)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/* ─── Live Metrics Panel (hero right column) ─── */

function LiveMetricsPanel() {
  const { text } = useLanguage();
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick((n) => n + 1), 3200);
    return () => clearInterval(t);
  }, [reduce]);

  const decisionCount = (1247 + (tick % 7)).toLocaleString();

  const metrics = [
    { label: text("AI Decisions / hr", "قرارات ذكاء / ساعة"), value: decisionCount, color: "#4D9FFF", live: true },
    { label: text("Avg Response", "متوسط الاستجابة"), value: "< 400ms", color: "#22c55e", live: false },
    { label: text("Country Profiles", "ملفات الدول"), value: "6+", color: "#a78bfa", live: false },
    { label: text("Chain Integrity", "سلامة السلسلة"), value: "100%", color: "#22c55e", live: false },
  ];

  const events = [
    { tag: "DECIDE", note: "risk · K⁺ 6.1 · escalate", t: "14:03" },
    { tag: "DISPENSE", note: "RX-2026-00142 · cleared", t: "14:02" },
    { tag: "ISNĀD", note: "chain sealed · 5 attestations", t: "14:01" },
  ];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      className="hidden lg:block"
    >
      <div
        className="overflow-hidden rounded-2xl border border-white/[0.1] shadow-[0_24px_80px_rgba(10,132,255,0.12)]"
        style={{ background: "rgba(8,12,20,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <span className="font-mono text-[10px] tracking-widest text-white/40">SANAD · LIVE</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-[#22c55e]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e]" />
            OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.05]">
          {metrics.map((m, i) => (
            <div key={i} className="p-4">
              <p className="mb-1 font-mono text-[9px] tracking-wider text-white/35">{m.label}</p>
              <p key={m.live ? tick : 0} className="font-mono text-[20px] font-bold tabular-nums" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] px-5 py-3">
          <p className="mb-2 font-mono text-[9px] tracking-widest text-white/30">{text("RECENT EVENTS", "أحداث أخيرة")}</p>
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-1 font-mono text-[11px]">
              <span className={`w-14 shrink-0 text-[9px] tracking-widest ${e.tag === "ISNĀD" ? "text-[#22c55e]/70" : e.tag === "DECIDE" ? "text-[#7CB9FF]" : "text-white/40"}`}>
                {e.tag}
              </span>
              <span className="flex-1 truncate text-white/50">{e.note}</span>
              <span className="shrink-0 text-white/25">{e.t}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] px-5 py-3">
          <p className="mb-2 font-mono text-[9px] tracking-widest text-white/30">{text("ACTIVE PORTALS", "البوابات النشطة")}</p>
          <div className="flex flex-wrap gap-1.5">
            {["Doctor", "Pharmacy", "Lab", "Emergency", "AI Control", "Insurance"].map((p) => (
              <span key={p} className="rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-white/40">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Navigation ─── */

function Nav() {
  const { text, locale, toggleLocale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { href: "#why", en: "Why SANAD", ar: "لماذا سند" },
    { href: "#intelligence", en: "Intelligence", ar: "الذكاء" },
    { href: "#trust", en: "Trust", ar: "الثقة" },
    { href: "#ecosystem", en: "Ecosystem", ar: "المنظومة" },
  ];
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(5,7,12,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={`rounded-md text-[13px] font-medium text-white/60 transition-colors hover:text-white ${FOCUS}`}>
              {text(l.en, l.ar)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLocale}
            className={`flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[12px] font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white ${FOCUS}`}
          >
            <Languages className="h-3.5 w-3.5" />
            {locale === "ar" ? "EN" : "عربي"}
          </button>
          <Link
            href="/login"
            className={`flex h-8 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-bold text-[#05070C] transition-opacity hover:opacity-85 ${FOCUS}`}
          >
            {text("Sign in", "تسجيل الدخول")}
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/25 hover:text-white md:hidden ${FOCUS}`}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <XIcon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-white/[0.06] md:hidden" style={{ background: "rgba(5,7,12,0.95)" }}>
          <nav className="mx-auto flex flex-col gap-1 px-6 py-4 max-w-[1120px]">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-3 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white ${FOCUS}`}
              >
                {text(l.en, l.ar)}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─── Hero — split layout ─── */

function Hero() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="relative overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#05070C] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[300px] left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-[#0A84FF]/18 to-transparent blur-3xl"
        />
      </div>

      <Section className="relative z-10 pb-0 pt-20 sm:pt-24 lg:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
          {/* Left: copy */}
          <div>
            <Reveal>
              <div className={`mb-8 inline-flex items-center gap-2 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 px-5 py-2.5 text-[#7CB9FF] shadow-[0_0_20px_rgba(10,132,255,0.2)] backdrop-blur-md ${isAr ? "text-[12px] font-bold" : "text-[11px] font-mono uppercase tracking-[0.2em]"}`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A84FF] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0A84FF]" />
                </span>
                {text("Sovereign Health Intelligence Platform", "منصة الذكاء الصحي السيادي")}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1
                className="mb-6 bg-clip-text font-extrabold tracking-tight text-transparent"
                style={{
                  backgroundImage: "linear-gradient(to bottom, #ffffff, #E2E8F0, #94A3B8)",
                  fontSize: "clamp(2.6rem, 6vw, 4.8rem)",
                  lineHeight: isAr ? 1.3 : 1.05,
                  letterSpacing: isAr ? "0" : "-0.04em",
                }}
              >
                {text("Designed for Governments.", "مصمَّمة للحكومات.")}
                <br />
                <span style={{ backgroundImage: "linear-gradient(to right, #4D9FFF, #0A84FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {text("Trusted by Clinicians.", "موثوقة من الأطباء.")}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mb-10 max-w-[560px] text-[16px] leading-relaxed text-[#94A3B8] lg:text-[18px]">
                {text(
                  "SANAD is the sovereign intelligence backbone of national healthcare — unifying clinical data, coordinating AI across nine engines, and ensuring every decision is traceable, justified, and human-confirmed.",
                  "سند هي العمود الفقري السيادي للذكاء الصحي الوطني — توحّد البيانات السريرية، وتنسّق الذكاء الاصطناعي عبر تسعة محركات، وتضمن أن كل قرار قابل للتتبع ومُبرَّر ومؤكَّد بشريًا.",
                )}
              </p>
            </Reveal>

            <Reveal delay={0.3} className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link
                href="/login"
                className={`group flex h-12 items-center justify-center gap-2.5 rounded-full bg-white px-8 text-[15px] font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(255,255,255,0.25)] ${FOCUS}`}
              >
                {text("Enter Workspace", "دخول مساحة العمل")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
              </Link>
              <a
                href="#intelligence"
                className={`flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 ${FOCUS}`}
              >
                {text("Explore the Engine", "استكشف المحرك")}
              </a>
            </Reveal>
          </div>

          {/* Right: live dashboard panel */}
          <LiveMetricsPanel />
        </div>

        <Reveal delay={0.5} className="mt-20 lg:mt-28">
          <DecisionTrace />
        </Reveal>
      </Section>

      <DeploymentStrip />
    </div>
  );
}

function DeploymentStrip() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="mt-16 border-y border-white/[0.06] lg:mt-20">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-4 lg:px-8">
        <p className={`text-center leading-relaxed text-white/50 ${isAr ? "text-[11.5px] font-semibold" : "text-[11px] font-mono uppercase tracking-[0.14em]"}`}>
          {text(
            "Global Health Intelligence Backbone · KSA Reference Dataset · Configurable for National Deployments",
            "طبقة ذكاء صحي عالمية · بيانات سعودية مرجعية للعرض · قابلة للتهيئة للنشر الوطني",
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── National Intelligence Fabric ─── */

function NationalFabric() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  const reduce = useReducedMotion();

  const nodes = [
    { label: "Citizen", label_ar: "المواطن", sub: "National-ID verified access", sub_ar: "دخول موثَّق بالهوية الوطنية", highlight: false },
    { label: "National ID Resolution", label_ar: "تحقيق الهوية الوطنية", sub: "Master Patient Index · zero-collision matching", sub_ar: "فهرس المريض الرئيسي · تطابق بلا تعارض", highlight: false },
    { label: "FHIR Interoperability Layer", label_ar: "طبقة التوافق FHIR", sub: "Structured clinical data · national schema", sub_ar: "بيانات سريرية منظمة · مخطط وطني موحد", highlight: false },
    { label: "AI Orchestrator", label_ar: "المنسّق بالذكاء الاصطناعي", sub: "9 engines · confidence-scored · reasoning attached", sub_ar: "9 محركات · مدرجة بالثقة · مرفق بها التعليل", highlight: true },
    { label: "Clinical Decision + Isnād", label_ar: "القرار السريري + الإسناد", sub: "Human confirmed · immutable audit chain sealed", sub_ar: "مؤكَّد بشريًا · سلسلة تدقيق غير قابلة للمحو", highlight: false },
  ];

  const outlets = [
    { en: "Hospital", ar: "المستشفى" },
    { en: "Pharmacy", ar: "الصيدلية" },
    { en: "Insurance", ar: "التأمين" },
    { en: "Lab", ar: "المختبر" },
    { en: "Emergency", ar: "الطوارئ" },
    { en: "Ministry", ar: "الوزارة" },
  ];

  return (
    <Section className="border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mb-16 text-center">
        <Reveal>
          <Eyebrow en="National Intelligence Fabric" ar="النسيج الوطني للذكاء" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="font-extrabold text-white"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: isAr ? 1.4 : 1.15, letterSpacing: isAr ? "0" : "-0.025em" }}
          >
            {text("How one signal moves the entire system.", "كيف تحرّك إشارة واحدة المنظومة بأكملها.")}
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            {text(
              "From citizen identity to sealed clinical decision — under one second, nine engines, one trusted record.",
              "من هوية المواطن إلى القرار السريري المختوم — في أقل من ثانية، عبر تسعة محركات، وسجل واحد موثوق.",
            )}
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <div className="mx-auto max-w-[500px]">
          <div className="flex flex-col items-center">
            {nodes.map((n, i) => (
              <React.Fragment key={n.label}>
                <motion.div
                  initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: EASE }}
                  className={`w-full rounded-2xl border px-6 py-4 text-center transition-all ${n.highlight ? "border-[#0A84FF]/40 shadow-[0_0_40px_rgba(10,132,255,0.18)]" : "border-white/[0.08] hover:border-white/[0.14]"}`}
                  style={{ background: n.highlight ? "rgba(10,132,255,0.07)" : "rgba(8,12,20,0.75)" }}
                >
                  <p className={`text-[13.5px] font-bold ${n.highlight ? "text-[#7CB9FF]" : "text-white"}`}>
                    {text(n.label, n.label_ar)}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/38">{text(n.sub, n.sub_ar)}</p>
                </motion.div>
                {i < nodes.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="h-5 w-px bg-gradient-to-b from-white/20 to-white/5" />
                    <span className="text-[10px] text-white/20">▼</span>
                  </div>
                )}
              </React.Fragment>
            ))}

            <div className="mt-2 w-full">
              <div className="mx-auto h-4 w-px bg-gradient-to-b from-white/20 to-white/5" />
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {outlets.map((o, i) => (
                  <motion.span
                    key={o.en}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + i * 0.07, duration: 0.4, ease: EASE }}
                    className="rounded-xl border border-white/[0.08] px-4 py-2 text-[12px] font-semibold text-white/50"
                    style={{ background: "rgba(8,12,20,0.6)" }}
                  >
                    {text(o.en, o.ar)}
                  </motion.span>
                ))}
              </div>
              <p className="mt-3 text-center font-mono text-[10px] tracking-widest text-white/28">
                {text("ALL ENDPOINTS · ONE TRUSTED SOURCE", "جميع نقاط الاتصال · مصدر واحد موثوق")}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ─── Thesis ─── */

function Thesis() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  const gaps = [
    {
      en: "Data Fragmentation", ar: "تشتت البيانات",
      enBody: "Medical histories are trapped in isolated silos. When critical context is lost during a transfer of care, outcomes suffer. Intelligence requires unified data.",
      arBody: "تاريخ المريض محتجز في أنظمة معزولة. عندما يضيع السياق الطبي بين المستشفيات، تتأثر النتائج. الذكاء الحقيقي يبدأ بتوحيد البيانات.",
    },
    {
      en: "Latent Signals", ar: "إشارات خفية",
      enBody: "Epidemics, supply chain vulnerabilities, and patient anomalies hide in plain sight. SANAD detects these patterns in milliseconds, long before human observation.",
      arBody: "المؤشرات الوبائية وتدهور الحالات ونقص الأدوية تختبئ في طيات البيانات. سند يلتقط هذه الأنماط في أجزاء من الثانية، قبل أن تدركها الملاحظة البشرية.",
    },
    {
      en: "Decision Isolation", ar: "قرارات معزولة",
      enBody: "Clinicians are often forced to make life-altering decisions with incomplete intelligence. SANAD closes the loop, ensuring the system learns from every outcome.",
      arBody: "يُجبر الأطباء أحياناً على اتخاذ قرارات مصيرية بصورة غير مكتملة. سند يغلق هذه الفجوة، ويضمن أن المنظومة تتعلم وتتطور بعد كل قرار.",
    },
  ];
  return (
    <Section id="why" className="py-28 lg:py-36">
      <Reveal>
        <Eyebrow en="The Fundamental Challenge" ar="التحدي الجوهري" />
      </Reveal>
      <Reveal delay={0.1}>
        <h2
          className="mb-16 max-w-[800px] bg-clip-text font-extrabold text-transparent"
          style={{ backgroundImage: "linear-gradient(to right, #ffffff, #94A3B8)", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: isAr ? 1.4 : 1.15, letterSpacing: isAr ? "0" : "-0.025em" }}
        >
          {text(
            "Healthcare has never lacked data. It lacked a sovereign operating system.",
            "لم تفتقر الرعاية الصحية يوماً للبيانات. بل افتقرت لنظام تشغيل سيادي يوظفها.",
          )}
        </h2>
      </Reveal>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.2fr_1fr] lg:grid-rows-2">
        <Reveal delay={0.15} className="lg:row-span-2">
          <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-6 text-[20px] sm:text-[22px] font-bold text-white">{text(gaps[0]!.en, gaps[0]!.ar)}</h3>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#94A3B8]">{text(gaps[0]!.enBody, gaps[0]!.arBody)}</p>
            <div className="mt-12"><BrokenTrace /></div>
          </div>
        </Reveal>
        <Reveal delay={0.25} className="h-full">
          <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-bl from-white/[0.04] to-transparent p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.06]">
            <h3 className="mb-4 text-[20px] font-bold text-[#7CB9FF]">{text(gaps[1]!.en, gaps[1]!.ar)}</h3>
            <p className="text-[15px] leading-relaxed text-[#94A3B8]">{text(gaps[1]!.enBody, gaps[1]!.arBody)}</p>
          </div>
        </Reveal>
        <Reveal delay={0.35} className="h-full">
          <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-tl from-white/[0.04] to-transparent p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.06]">
            <h3 className="mb-4 text-[20px] font-bold text-[#7CB9FF]">{text(gaps[2]!.en, gaps[2]!.ar)}</h3>
            <p className="text-[15px] leading-relaxed text-[#94A3B8]">{text(gaps[2]!.enBody, gaps[2]!.arBody)}</p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.4}>
        <div className="mt-16 rounded-full border border-[#0A84FF]/20 bg-[#0A84FF]/5 px-8 py-4 text-center backdrop-blur-md">
          <p className="text-[16px] font-semibold text-[#4D9FFF]">
            {text(
              "SANAD brings order to fragmented data — complete interoperability, one trusted source.",
              "سند يخلق النظام من الفوضى — تكامل تام، ومصدر واحد موثوق للجميع.",
            )}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function BrokenTrace() {
  const { text } = useLanguage();
  const rows = [
    { tag: "SIGNAL", main: "lab.result — K⁺ 6.1 mmol/L", note: "printed · placed in a queue", time: "day 0", dead: false },
    { tag: "HANDOVER", main: "patient transferred — context lost", note: "history unavailable at receiving ward", time: "day 2", dead: true },
    { tag: "DECIDE", main: "prescription issued — blind to history", note: "interaction unseen", time: "day 4", dead: true },
    { tag: "OUTCOME", main: "readmission · cause never linked", note: "the system learned nothing", time: "day 9", dead: true },
  ];
  return (
    <div>
      <div
        dir="ltr"
        role="img"
        aria-label="Timeline without a trace"
        className="overflow-hidden rounded-2xl border border-white/[0.08] text-left shadow-[0_16px_64px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        style={{ background: "rgba(6, 9, 15, 0.7)" }}
      >
        <div aria-hidden className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3 font-mono text-[10.5px] tracking-[0.12em] text-white/35">
          <span>WITHOUT A TRACE</span>
          <span className="text-white/25">no record</span>
        </div>
        <div aria-hidden className="overflow-hidden px-3 sm:px-5 py-4">
          {rows.map((r) => (
            <div key={r.tag} className="flex min-w-0 items-baseline gap-2 sm:gap-4 border-b border-white/[0.03] py-2.5 font-mono text-[12px] last:border-b-0">
              <span className={`w-16 shrink-0 text-[10px] sm:text-[10.5px] tracking-[0.1em] ${r.tag === "OUTCOME" ? "text-[#ef4444]/70" : "text-white/30"}`}>{r.tag}</span>
              <span className="min-w-0 flex-1 overflow-hidden">
                <span className={`block truncate ${r.dead ? "text-white/40" : "text-white/65"}`}>{r.main}</span>
                <span className="block truncate text-[11px] text-white/25">{r.note}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[10px] sm:text-[11px] text-white/25">{r.time}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-white/50">
        {text(
          "The same signal — in a system without memory. Nine days, no loop, nothing learned.",
          "الإشارة نفسها — في نظام بلا ذاكرة. تسعة أيام، بلا دائرة تكتمل، وبلا درس يُتعلَّم.",
        )}
      </p>
    </div>
  );
}

/* ─── Intelligence — Bento grid ─── */

function Intelligence() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";

  type Engine = { en: string; ar: string; out: string; span?: 2 };
  const engines: Engine[] = [
    { en: "Clinical Decision Support",  ar: "دعم القرار السريري",          out: "ddx: DKA 0.81 · sepsis 0.12 — reasoning attached",          span: 2 },
    { en: "Drug Interaction Analysis",  ar: "تحليل التعارض الدوائي",        out: "warfarin × ciprofloxacin — INR risk · hold advised" },
    { en: "Risk Stratification",        ar: "تصنيف المخاطر",                out: "deterioration 0.87 · ward 4 — escalate now" },
    { en: "Digital Twin Forecasting",   ar: "التوأم الرقمي",                out: "HbA1c 7.1% → 8.3% by Q3 — intervene early",                 span: 2 },
    { en: "Epidemic Radar",             ar: "رادار الأوبئة",                out: "RTI cluster · 3 districts · Rt 1.4 — alert issued" },
    { en: "Lab Intelligence",           ar: "ذكاء المختبرات",               out: "eGFR 41 ↓ 6-mo trend — stage 3b · refer nephrology" },
    { en: "Fraud Detection",            ar: "كشف الاحتيال",                 out: "claim #88412 — duplicate billing pattern · hold" },
    { en: "Shortage Prediction",        ar: "التنبؤ بالنواقص",              out: "amoxicillin — stockout T−9 days · reorder issued" },
    { en: "Hereditary Risk Mapping",    ar: "خرائط المخاطر الوراثية",       out: "BRCA1 lineage · 3 relatives — screening due ×2",             span: 2 },
  ];

  return (
    <Section id="intelligence" className="relative overflow-hidden border-t border-white/[0.06] py-28 lg:py-36">
      <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0A84FF]/[0.08] blur-[120px] pointer-events-none" />

      <div className="relative z-10 mb-20 flex flex-col items-center text-center">
        <Reveal>
          <Eyebrow en="The Core Intelligence Layer" ar="طبقة الذكاء الأساسية" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="mb-6 font-extrabold text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: isAr ? 1.4 : 1.15, letterSpacing: isAr ? "0" : "-0.025em" }}
          >
            {text("Nine autonomous engines. ", "تسعة محركات ذاتية. ")}
            <span className="text-[#4D9FFF]">{text("One clinical mind.", "عقل سريري واحد.")}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="max-w-[600px] text-[16px] leading-relaxed text-[#94A3B8]">
            {text(
              "Every output carries a confidence score, an immutable reasoning trace, and a human override. The AI processes at scale; clinicians decide with precision.",
              "كل مخرجات الذكاء تحمل درجة ثقة، وسلسلة تعليل غير قابلة للتغيير، وإمكانية تدخل بشري. الذكاء يعالج البيانات الهائلة؛ والطبيب يقرر بدقة متناهية.",
            )}
          </p>
        </Reveal>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {engines.map((e, i) => (
          <Reveal key={e.en} delay={0.08 + i * 0.04} className={`min-w-0 ${e.span === 2 ? "sm:col-span-2" : ""}`}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0F1A]/80 p-5 sm:p-7 shadow-xl backdrop-blur-md transition-colors hover:border-[#0A84FF]/35"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 min-w-0">
                <p className="mb-3 font-mono text-[12px] font-bold text-[#4D9FFF]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className={`mb-4 font-bold text-white ${e.span === 2 ? "text-[18px]" : "text-[16px]"}`}>
                  {text(e.en, e.ar)}
                </h3>
                <div
                  dir="ltr"
                  className="w-full overflow-hidden rounded-xl border border-white/[0.05] bg-black/40 px-3 py-3 text-left font-mono text-[11px] leading-relaxed text-[#94A3B8] shadow-inner"
                >
                  <span aria-hidden className="me-2 font-bold text-[#0A84FF]">›</span>
                  <span className="truncate">{e.out}</span>
                </div>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Scale ─── */

function Scale() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  const stats = [
    { value: "100M+", en: "Record capacity per national deployment", ar: "سعة سجلات لكل نشر وطني" },
    { value: "6+", en: "Country deployment profiles, GCC-ready", ar: "ملفات نشر للدول، جاهزة خليجياً" },
    { value: "<1s", en: "Emergency record retrieval", ar: "استدعاء سجل الطوارئ" },
    { value: "99.99%", en: "Availability architecture", ar: "معمارية الجاهزية" },
  ];
  return (
    <Section className="border-t border-white/[0.06] py-28 lg:py-36">
      <Reveal><Eyebrow en="Built for national scale" ar="مصمم على مقياس وطني" /></Reveal>
      <Reveal delay={0.08}>
        <h2 className="mb-16 max-w-[700px] font-semibold text-white" style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)", lineHeight: isAr ? 1.45 : 1.18, letterSpacing: isAr ? "0" : "-0.025em" }}>
          {text("Infrastructure measured in lives, not requests.", "بنية تحتية تُقاس بالأرواح، لا بالطلبات.")}
        </h2>
      </Reveal>
      <div className="grid gap-y-12 border-t border-white/[0.06] pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.en} delay={0.08 * i} className="border-white/[0.06] sm:border-e last:border-e-0 sm:pe-8 sm:[&:not(:first-child)]:ps-8">
            <p className="font-semibold tabular-nums text-white" dir="ltr" style={{ fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)", letterSpacing: "-0.03em" }}>{s.value}</p>
            <p className="mt-2 text-[12.5px] text-white/55">{text(s.en, s.ar)}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Trust ─── */

function Trust() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  const items = [
    { icon: ScrollText, en: "Isnād — the audit chain", ar: "الإسناد — سلسلة التدقيق", enBody: "Every access and every AI output is recorded in an immutable chain of attribution.", arBody: "كل وصول وكل مخرجات للذكاء تُسجَّل في سلسلة نسبة غير قابلة للتغيير." },
    { icon: UserCheck, en: "Human-in-the-loop", ar: "الإنسان في مركز القرار", enBody: "AI recommends with confidence and reasoning. The final call is always human.", arBody: "يوصي الذكاء الاصطناعي بدرجة ثقة وتعليل، ويبقى القرار الأخير بشريًا دائمًا." },
    { icon: ShieldCheck, en: "Role-based access", ar: "وصول مبني على الدور", enBody: "Access is scoped to clinical need across twelve roles, governed by national health policy.", arBody: "يُحدَّد الوصول وفق الحاجة السريرية عبر اثني عشر دورًا، بموجب السياسات الصحية الوطنية." },
    { icon: Lock, en: "End-to-end encryption", ar: "تشفير شامل", enBody: "Citizen data is encrypted in transit and at rest.", arBody: "بيانات المواطنين مشفّرة أثناء النقل وفي التخزين." },
    { icon: Landmark, en: "Sovereign residency", ar: "سيادة البيانات", enBody: "Health data is stored, processed and governed inside the nation it belongs to.", arBody: "تُخزَّن البيانات الصحية وتُعالَج وتُحكَم داخل الوطن الذي تنتمي إليه." },
    { icon: Eye, en: "Consent-governed", ar: "محكوم بالموافقة", enBody: "Citizens see who accessed their record, and control who can.", arBody: "يرى المواطن من اطّلع على سجله، ويتحكم فيمن يستطيع ذلك." },
  ];
  return (
    <Section id="trust" className="border-t border-white/[0.06] py-28 lg:py-36">
      <Reveal><Eyebrow en="Trust, by design" ar="ثقة بالتصميم" /></Reveal>
      <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
        <Reveal delay={0.08}>
          <h2 className="font-semibold text-white" style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)", lineHeight: isAr ? 1.45 : 1.18, letterSpacing: isAr ? "0" : "-0.025em" }}>
            {text("Every decision has its chain of trust.", "لكل قرارٍ سلسلةُ ثقة.")}
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-[14px] leading-relaxed text-white/55">
            {text(
              "SANAD doesn't make decisions for clinicians. It ensures no decision is ever made without real ground to stand on. Every action recorded. Every decision justified. Every patient protected.",
              "سند لا تتخذ القرار بدلًا عن الطبيب — لكنها تضمن ألّا يُتّخذ قرار في فراغ. كل إجراء مسجَّل. كل قرار مبرَّر. كل مريض محمي.",
            )}
          </p>
        </Reveal>
      </div>
      <Reveal delay={0.1}><IsnadChain /></Reveal>
      <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <Reveal key={it.en} delay={0.06 * i} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <Icon className="h-[18px] w-[18px] text-[#7CB9FF]" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="mb-1.5 text-[15px] font-semibold text-white">{text(it.en, it.ar)}</h3>
                <p className="text-[13px] leading-relaxed text-white/55">{text(it.enBody, it.arBody)}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function IsnadChain() {
  const { text } = useLanguage();
  const links = [
    { n: "01", main: "engine output · risk 0.94 — reasoning archived", hash: "sha256 9f2c…41a1" },
    { n: "02", main: "physician decision · diuretic held", hash: "sha256 41bb…0c7e" },
    { n: "03", main: "pharmacy dispense · amended rx", hash: "sha256 c8d0…b252" },
    { n: "04", main: "citizen visibility · access logged", hash: "sha256 77aa…e019" },
  ];
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div dir="ltr" role="img" aria-label="ISNAD Case Trace" className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070B12] text-left">
        <div aria-hidden className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 font-mono text-[10.5px] tracking-[0.12em]">
          <span className="text-[#22c55e]/90">ISNĀD — case #a3f9-2210</span>
          <span className="text-white/35">sealed 14:03:12</span>
        </div>
        <div aria-hidden className="px-5 py-4">
          {links.map((l) => (
            <div key={l.n} className="flex items-baseline gap-4 border-b border-white/[0.04] py-2.5 font-mono text-[12px] last:border-b-0">
              <span className="w-6 shrink-0 text-[10.5px] text-white/40">{l.n}</span>
              <span className="min-w-0 flex-1 truncate text-white/85">{l.main}</span>
              <span className="hidden shrink-0 text-[11px] text-white/30 sm:inline">{l.hash}</span>
              <span className="shrink-0 text-[11px] text-[#22c55e]/80">✓</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-3 font-mono text-[10.5px] tracking-[0.08em] text-white/40">
            <span className="h-1 w-1 rounded-full bg-[#22c55e]/80" />
            chain verified · attributable at every link · nothing erasable
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[13px] leading-relaxed text-white/50">
        {text(
          "The case you watched above, sealed — four attestations, one immutable chain, a human at every link.",
          "الحالة التي شاهدتها أعلاه، مختومة — أربعة إسنادات في سلسلة واحدة غير قابلة للمحو، وإنسان عند كل حلقة.",
        )}
      </p>
    </div>
  );
}

/* ─── Ecosystem ─── */

function Ecosystem() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  const groups: { en: string; ar: string; roles: { role: string; en: string; ar: string; enBody: string; arBody: string }[] }[] = [
    {
      en: "Clinical care", ar: "الرعاية السريرية",
      roles: [
        { role: "doctor", en: "Physician Workspace", ar: "بوابة الطبيب", enBody: "Full patient context, AI differential support and e-prescribing.", arBody: "سياق كامل للمريض ودعم تشخيصي ووصفات إلكترونية." },
        { role: "emergency", en: "Emergency Response", ar: "الاستجابة للطوارئ", enBody: "Blood type, allergies and medications — in under a second.", arBody: "فصيلة الدم والحساسيات والأدوية — في أقل من ثانية." },
        { role: "citizen", en: "Citizen Health", ar: "صحة المواطن", enBody: "A personal record, forecasts and full access transparency.", arBody: "سجل شخصي وتنبؤات وشفافية كاملة للوصول." },
        { role: "family", en: "Family Health", ar: "صحة الأسرة", enBody: "Hereditary risk mapped and managed across generations.", arBody: "مخاطر وراثية تُرصد وتُدار عبر الأجيال." },
      ],
    },
    {
      en: "Operations", ar: "العمليات",
      roles: [
        { role: "hospital", en: "Hospital Operations", ar: "عمليات المستشفى", enBody: "Live capacity, AI-prioritized queues and staffing.", arBody: "سعة لحظية وقوائم مرتّبة بالذكاء الاصطناعي وتوزيع للكوادر." },
        { role: "pharmacy", en: "Pharmacy", ar: "الصيدلية", enBody: "Dispensing with safety screening on every script.", arBody: "صرف الأدوية مع فحص أمان لكل وصفة." },
        { role: "lab", en: "Laboratory", ar: "المختبر", enBody: "Results with instant AI interpretation.", arBody: "نتائج مع تفسير فوري بالذكاء الاصطناعي." },
        { role: "supply-chain", en: "Supply Chain", ar: "سلسلة الإمداد", enBody: "National inventory with shortage forecasting.", arBody: "مخزون وطني مع تنبؤ بالنواقص." },
      ],
    },
    {
      en: "Intelligence & oversight", ar: "الذكاء والإشراف",
      roles: [
        { role: "admin", en: "Ministry Command", ar: "قيادة الوزارة", enBody: "Population intelligence and policy decision support.", arBody: "ذكاء سكاني ودعم لقرارات السياسات الصحية." },
        { role: "ai-control", en: "AI Control Center", ar: "مركز التحكم بالذكاء الاصطناعي", enBody: "Nine engines monitored for drift, latency and confidence.", arBody: "تسعة محركات تُراقب من حيث الانحراف والاستجابة والثقة." },
        { role: "insurance", en: "Insurance", ar: "التأمين", enBody: "Claims intelligence and fraud detection.", arBody: "ذكاء المطالبات وكشف الاحتيال." },
        { role: "research", en: "Research", ar: "الأبحاث", enBody: "Anonymized population data in service of science.", arBody: "بيانات سكانية مجهولة الهوية في خدمة العلم." },
      ],
    },
  ];
  return (
    <Section id="ecosystem" className="border-t border-white/[0.06] py-28 lg:py-36">
      <Reveal><Eyebrow en="One system, every role" ar="منظومة واحدة لكل الأدوار" /></Reveal>
      <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
        <Reveal delay={0.08}>
          <h2 className="font-semibold text-white" style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)", lineHeight: isAr ? 1.45 : 1.18, letterSpacing: isAr ? "0" : "-0.025em" }}>
            {text("One intelligence layer. Twelve doors.", "طبقة ذكاء واحدة. اثنا عشر بابًا.")}
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-[14px] leading-relaxed text-white/55">
            {text(
              "Workspaces own no data and no logic — each is a role-scoped view of the same system. SANAD unifies what a nation already runs; it replaces nothing.",
              "لا تملك مساحات العمل بيانات ولا منطقًا خاصًا — كل واحدة منها نافذة على المنظومة نفسها بحدود دورها. توحّد سند ما يديره الوطن أصلًا، ولا تستبدل شيئًا.",
            )}
          </p>
        </Reveal>
      </div>
      <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
        {groups.map((g, gi) => (
          <Reveal key={g.en} delay={0.08 * gi}>
            <p className={`mb-4 border-b border-white/[0.08] pb-3 text-white/45 ${isAr ? "text-[11.5px] font-semibold" : "text-[11px] font-mono uppercase tracking-[0.18em]"}`}>
              {text(g.en, g.ar)}
            </p>
            <div>
              {g.roles.map((r) => (
                <Link
                  key={r.role}
                  href={`/login?role=${r.role}`}
                  className={`group -mx-3 flex items-center justify-between gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-white/[0.04] ${FOCUS}`}
                >
                  <span>
                    <span className="block text-[14.5px] font-semibold text-white">{text(r.en, r.ar)}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/50">{text(r.enBody, r.arBody)}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#7CB9FF] rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                </Link>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Final call ─── */

function FinalCall() {
  const { text, locale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="relative overflow-hidden border-t border-white/[0.06]">
      <div aria-hidden className="absolute left-1/2 bottom-[-300px] h-[520px] w-[860px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(10,132,255,0.13), transparent)" }} />
      <Section className="relative py-32 text-center lg:py-40">
        <Reveal>
          <h2
            className="mx-auto mb-9 max-w-[680px] font-semibold text-white"
            style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)", lineHeight: isAr ? 1.4 : 1.12, letterSpacing: isAr ? "0" : "-0.03em" }}
          >
            {text("A healthier nation runs on better decisions.", "وطن أكثر صحة يقوم على قرارات أفضل.")}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col items-center gap-5">
          <Link href="/login" className={`flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-[#05070C] transition-opacity hover:opacity-85 ${FOCUS}`}>
            {text("Enter your workspace", "ادخل إلى مساحة عملك")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
          <p className="text-[12px] text-white/45">
            {text("Access is provisioned by your national health authority.", "يُمنح الوصول عبر الجهة الصحية الوطنية المختصة.")}
          </p>
        </Reveal>
      </Section>
    </div>
  );
}

function Footer() {
  const { text, locale } = useLanguage();
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 sm:px-6 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <Wordmark />
          <p className="text-[12px] text-white/50">
            {text(
              "Reference deployment: KSA demo environment — global platform, configurable per country.",
              "نشر مرجعي: بيئة عرض سعودية — منصة عالمية قابلة للتهيئة حسب الدولة.",
            )}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="text-[11.5px] text-white/45">{text("© 2026 Sanad Technologies", "© 2026 شركة سند للتقنية")}</p>
          {locale === "ar" ? (
            <p className="text-[11.5px] font-semibold text-white/40">سيادية بالتصميم · لكل دولة — SANAD HEALTH</p>
          ) : (
            <p className="font-mono text-[11px] tracking-[0.08em] text-white/40" dir="ltr">SANAD HEALTH — SOVEREIGN BY DESIGN · BUILT FOR EVERY NATION</p>
          )}
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070C] text-[#F4F6FA] antialiased selection:bg-[#0A84FF]/30">
      <Nav />
      <main className="overflow-x-hidden">
        <Hero />
        <NationalFabric />
        <Thesis />
        <Intelligence />
        <Scale />
        <Trust />
        <Ecosystem />
        <FinalCall />
      </main>
      <Footer />
    </div>
  );
}

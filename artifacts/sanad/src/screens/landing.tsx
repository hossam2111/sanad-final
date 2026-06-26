"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, ArrowUpRight, Eye, Landmark, Languages,
  Lock, ScrollText, ShieldCheck, UserCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

/* ────────────────────────────────────────────────────────────────────────────
   SANAD Health — Landing experience
   Sanad Technologies · Sovereign Health Intelligence
   Fixed dark visual language, independent of app theme. The workspaces stay
   light; this page is the institutional front door.
──────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#4D9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070C]";

/* ─── Primitives ─── */

function Reveal({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const { text, dir, locale, toggleLocale } = useLanguage();

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
  const { text, dir, locale, toggleLocale } = useLanguage();
  return (
    <p
      className={`text-[#4D9FFF] mb-6 flex items-center gap-3 ${
        locale === "en" ? "text-[11px] font-mono uppercase tracking-[0.22em]" : "text-[12px] font-bold"
      }`}
    >
      <span className="inline-block h-px w-7 bg-[#4D9FFF]/50" />
      {text(en, ar)}
    </p>
  );
}

function Section({
  id, children, className = "",
}: { id?: string; children: React.ReactNode; className?: string }) {
  const { text, dir, locale, toggleLocale } = useLanguage();

  return (
    <section id={id} className={`scroll-mt-20 ${className}`}>
      <div className="mx-auto w-full max-w-[1120px] px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SanadMark({ size = 30 }: { size?: number }) {
  const { text, dir, locale, toggleLocale } = useLanguage();

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
  const { text, dir, locale, toggleLocale } = useLanguage();
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

/* ─── Decision trace — the product, shown working ───
   The organizing principle of the page: everything SANAD claims is shown in
   this one syntax. Three live cases rotate; telemetry is kept Latin monospace
   and LTR in both locales, like a code block in Arabic prose. */

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
      { tag: "SIGNAL", main: "ems.scan — citizen ID verified", note: "unconscious patient · unit 7, Riyadh", time: "09:14:02" },
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
  const { text, dir, locale, toggleLocale } = useLanguage();

  return (
    <div aria-hidden className="px-5 py-4">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={animate ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: animate ? 0.2 + i * 0.26 : 0, ease: EASE }}
          className="flex items-baseline gap-4 border-b border-white/[0.04] py-2.5 font-mono text-[12px] last:border-b-0"
        >
          <span className={`w-14 shrink-0 text-[10.5px] tracking-[0.1em] ${r.accent ? "text-[#7CB9FF]" : r.seal ? "text-success" : "text-white/50"}`}>
            {r.tag}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-white/90">{r.main}</span>
            <span className="block truncate text-[11px] text-white/40">{r.note}</span>
          </span>
          <span className="shrink-0 tabular-nums text-[11px] text-white/35">{r.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

function DecisionTrace() {
  const { text, dir, locale, toggleLocale } = useLanguage();
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
        dir={dir}
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
                  className={`h-1.5 rounded-full transition-all ${FOCUS} ${
                    i === caseIdx ? "w-4 bg-[#7CB9FF]" : "w-1.5 bg-card/20 hover:bg-card/40"
                  }`}
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

/* ─── Navigation ─── */

function Nav() {
  const { text, dir, locale, toggleLocale } = useLanguage();
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
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-md text-[13px] font-medium text-white/60 transition-colors hover:text-white ${FOCUS}`}
            >
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
            className={`flex h-8 items-center gap-1.5 rounded-full bg-card px-4 text-[12px] font-bold text-[#05070C] transition-opacity hover:opacity-85 ${FOCUS}`}
          >
            {text("Sign in", "تسجيل الدخول")}
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─── */

function Hero() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="relative overflow-hidden pt-16">
      {/* Atmosphere: Vercel/Stripe-inspired glowing mesh and sharp grid */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#05070C] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        />
        {/* Animated glowing orb */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[300px] left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-[#0A84FF]/20 to-transparent blur-3xl"
        />
      </div>

      <Section className="relative z-10 pb-0 pt-24 lg:pt-36">
        <div className="mx-auto max-w-[900px] text-center">
          <Reveal>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`mb-8 inline-flex items-center gap-2 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 px-5 py-2.5 text-[#7CB9FF] shadow-[0_0_20px_rgba(10,132,255,0.2)] backdrop-blur-md ${
                isAr ? "text-[12.5px] font-bold" : "text-[11.5px] font-mono uppercase tracking-[0.2em]"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A84FF] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0A84FF]"></span>
              </span>
              {text("The Sovereign Brain of National Healthcare", "العقل السيادي للرعاية الصحية الوطنية")}
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1
              className="mb-8 font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E2E8F0] to-[#94A3B8]"
              style={{
                fontSize: "clamp(3rem, 7.5vw, 5.5rem)",
                lineHeight: isAr ? 1.3 : 1.05,
                letterSpacing: isAr ? "0" : "-0.04em",
              }}
            >
              {text("Beyond Data.", "ما وراء البيانات.")}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#0A84FF] to-[#0048C0] bg-clip-text text-transparent">
                {text(" Absolute Certainty.", " يقين مطلق يصنع الفارق.")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto mb-12 max-w-[720px] text-[17px] leading-relaxed text-[#94A3B8] lg:text-[19px]">
              {text(
                "SANAD is the cognitive backbone of healthcare. A sovereign intelligence that processes fragmented data streams in milliseconds, turning chaos into life-saving clarity. Predictive precision. Immutable trust. Absolute certainty at scale.",
                "سند هي العقل المدبر لقطاع الرعاية الصحية. ذكاء سيادي يعالج تدفقات البيانات المشتتة في أجزاء من الثانية، ليحول الفوضى إلى رؤية واضحة تنقذ الأرواح. دقة تنبؤية فائقة، ثقة لا تُخترق، ويقين مطلق على نطاق وطني."
              )}
            </p>
          </Reveal>

          <Reveal delay={0.3} className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className={`group flex h-12 items-center gap-2.5 rounded-full bg-white px-8 text-[15px] font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] ${FOCUS}`}
            >
              {text("Enter Workspace", "دخول مساحة العمل")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </Link>
            <a
              href="#intelligence"
              className={`flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 text-[15px] font-semibold text-white transition-all hover:bg-white/10 hover:text-white backdrop-blur-md ${FOCUS}`}
            >
              {text("Explore the Engine", "استكشف المحرك")}
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.4} className="mt-20 lg:mt-28">
          <DecisionTrace />
        </Reveal>
      </Section>

      <DeploymentStrip />
    </div>
  );
}

/* One quiet line of deployment fact — proof of scale, honestly attributed. */
function DeploymentStrip() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="mt-16 border-y border-white/[0.06] lg:mt-20">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-4 lg:px-8">
        <p
          className={`text-center leading-relaxed text-white/50 ${
            isAr ? "text-[11.5px] font-semibold" : "text-[11px] font-mono uppercase tracking-[0.14em]"
          }`}
        >
          {text(
            "The National Health Intelligence Backbone — Kingdom of Saudi Arabia · 450+ Facilities · 13 Regions · 34.2M Immutable Records",
            "نظام الاستخبارات الصحية الوطني — المملكة العربية السعودية · أكثر من 450 منشأة · 13 منطقة · 34.2 مليون سجل صحي محصّن",
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Thesis: why SANAD exists ─── */

function Thesis() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  const gaps = [
    {
      en: "Data Fragmentation",
      ar: "تشتت البيانات",
      enBody: "Medical histories are trapped in isolated silos. When critical context is lost during a transfer of care, outcomes suffer. Intelligence requires unified data.",
      arBody: "تاريخ المريض محتجز في أنظمة معزولة. عندما يضيع السياق الطبي بين المستشفيات، تتأثر النتائج. الذكاء الحقيقي يبدأ بتوحيد البيانات.",
    },
    {
      en: "Latent Signals",
      ar: "إشارات خفية",
      enBody: "Epidemics, supply chain vulnerabilities, and patient anomalies hide in plain sight. SANAD detects these patterns in milliseconds, long before human observation.",
      arBody: "المؤشرات الوبائية وتدهور الحالات ونقص الأدوية تختبئ في طيات البيانات. سند يلتقط هذه الأنماط في أجزاء من الثانية، قبل أن تدركها الملاحظة البشرية.",
    },
    {
      en: "Decision Isolation",
      ar: "قرارات معزولة",
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
          className="mb-16 max-w-[800px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#94A3B8]"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: isAr ? 1.4 : 1.15,
            letterSpacing: isAr ? "0" : "-0.025em",
          }}
        >
          {text(
            "Healthcare has never lacked data. It lacked a sovereign operating system.",
            "لم تفتقر الرعاية الصحية يوماً للبيانات. بل افتقرت لنظام تشغيل سيادي يوظفها.",
          )}
        </h2>
      </Reveal>
      
      {/* Bento Grid Design */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:grid-rows-2">
        <Reveal delay={0.15} className="lg:row-span-2">
          <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-10 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-6 text-[22px] font-bold text-white">{text(gaps[0]!.en, gaps[0]!.ar)}</h3>
            <p className="text-[16px] leading-relaxed text-[#94A3B8]">{text(gaps[0]!.enBody, gaps[0]!.arBody)}</p>
            <div className="mt-12">
               <BrokenTrace />
            </div>
          </div>
        </Reveal>
        
        <Reveal delay={0.25} className="h-full">
          <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-bl from-white/[0.04] to-transparent p-10 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.06]">
            <h3 className="mb-4 text-[20px] font-bold text-[#7CB9FF]">{text(gaps[1]!.en, gaps[1]!.ar)}</h3>
            <p className="text-[15px] leading-relaxed text-[#94A3B8]">{text(gaps[1]!.enBody, gaps[1]!.arBody)}</p>
          </div>
        </Reveal>
        
        <Reveal delay={0.35} className="h-full">
           <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-tl from-white/[0.04] to-transparent p-10 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.06]">
            <h3 className="mb-4 text-[20px] font-bold text-[#7CB9FF]">{text(gaps[2]!.en, gaps[2]!.ar)}</h3>
            <p className="text-[15px] leading-relaxed text-[#94A3B8]">{text(gaps[2]!.enBody, gaps[2]!.arBody)}</p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.4}>
        <div className="mt-16 rounded-full border border-[#0A84FF]/20 bg-[#0A84FF]/5 px-8 py-4 text-center backdrop-blur-md">
          <p className="text-[16px] font-semibold text-[#4D9FFF]">
            {text(
              "SANAD brings order to the chaos. Complete interoperability, absolute truth.",
              "سند يخلق النظام من الفوضى. تكامل تام، وحقيقة مطلقة واحدة للجميع.",
            )}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

/* The same potassium signal as the hero — in a system without memory.
   One syntax, two worlds. */
function BrokenTrace() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const rows = [
    { tag: "SIGNAL", main: "lab.result — K⁺ 6.1 mmol/L", note: "printed · placed in a queue", time: "day 0", dead: false },
    { tag: "HANDOVER", main: "patient transferred — context lost", note: "history unavailable at receiving ward", time: "day 2", dead: true },
    { tag: "DECIDE", main: "prescription issued — blind to history", note: "interaction unseen", time: "day 4", dead: true },
    { tag: "OUTCOME", main: "readmission · cause never linked", note: "the system learned nothing", time: "day 9", dead: true },
  ];
  return (
    <div className="lg:sticky lg:top-28">
      <div
        dir={dir}
        role="img"
        aria-label="Timeline without a trace"
        className="overflow-hidden rounded-2xl border border-white/[0.08] text-left shadow-[0_16px_64px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        style={{ background: "rgba(6, 9, 15, 0.7)" }}
      >
        <div aria-hidden className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3 font-mono text-[10.5px] tracking-[0.12em] text-white/35">
          <span>WITHOUT A TRACE</span>
          <span className="text-white/25">no record</span>
        </div>
        <div aria-hidden className="px-5 py-4">
          {rows.map((r) => (
            <div
              key={r.tag}
              className="flex items-baseline gap-4 border-b border-white/[0.03] py-2.5 font-mono text-[12px] last:border-b-0"
            >
              <span className={`w-[72px] shrink-0 text-[10.5px] tracking-[0.1em] ${r.tag === "OUTCOME" ? "text-danger/70" : "text-white/30"}`}>
                {r.tag}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate ${r.dead ? "text-white/40" : "text-white/65"}`}>{r.main}</span>
                <span className="block truncate text-[11px] text-white/25">{r.note}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[11px] text-white/25">{r.time}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-white/50">
        {text(
          "The same signal as above — in a system without memory. Nine days, no loop, nothing learned.",
          "الإشارة نفسها التي رأيتها أعلاه — في نظام بلا ذاكرة. تسعة أيام، بلا دائرة تكتمل، وبلا درس يُتعلَّم.",
        )}
      </p>
    </div>
  );
}

/* ─── The intelligence layer ─── */

function Intelligence() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  const engines = [
    { en: "Clinical Decision Support", ar: "دعم القرار السريري", out: "ddx: DKA 0.81 · sepsis 0.12 — reasoning attached" },
    { en: "Drug Interaction Analysis", ar: "تحليل التعارض الدوائي", out: "warfarin × ciprofloxacin — INR risk · hold advised" },
    { en: "Risk Stratification", ar: "تصنيف المخاطر", out: "deterioration 0.87 · ward 4 — escalate now" },
    { en: "Digital Twin Forecasting", ar: "التوأم الرقمي", out: "HbA1c 7.1% → 8.3% by Q3 — intervene early" },
    { en: "Epidemic Radar", ar: "رادار الأوبئة", out: "RTI cluster · 3 districts · Rt 1.4 — alert issued" },
    { en: "Lab Intelligence", ar: "ذكاء المختبرات", out: "eGFR 41 ↓ 6-mo trend — stage 3b · refer nephrology" },
    { en: "Fraud Detection", ar: "كشف الاحتيال", out: "claim #88412 — duplicate billing pattern · hold" },
    { en: "Shortage Prediction", ar: "التنبؤ بالنواقص", out: "amoxicillin — stockout T−9 days · reorder issued" },
    { en: "Hereditary Risk Mapping", ar: "خرائط المخاطر الوراثية", out: "BRCA1 lineage · 3 relatives — screening due ×2" },
  ];
  return (
    <Section id="intelligence" className="relative border-t border-white/[0.06] py-28 lg:py-36">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0A84FF]/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 mb-20 flex flex-col items-center text-center">
        <Reveal>
          <Eyebrow en="The Core Intelligence Layer" ar="طبقة الذكاء الأساسية" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="mb-6 font-extrabold text-white"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: isAr ? 1.4 : 1.15,
              letterSpacing: isAr ? "0" : "-0.025em",
            }}
          >
            {text("Nine autonomous engines. ", "تسعة محركات ذاتية. ")}
            <span className="text-[#4D9FFF]">{text("One clinical mind.", "عقل سريري واحد.")}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="max-w-[600px] text-[16px] leading-relaxed text-[#94A3B8]">
            {text(
              "Every output carries a confidence score, an immutable reasoning trace, and a human override. The AI processes at scale; clinicians decide with precision.",
              "كل مخرجات الذكاء تحمل درجة ثقة، وسلسلة تعليل غير قابلة للتغيير، وإمكانية تدخل بشري. الذكاء يعالج البيانات الهائلة؛ والطبيب يقرر بدقة متناهية."
            )}
          </p>
        </Reveal>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {engines.map((e, i) => (
          <Reveal key={e.en} delay={0.1 + i * 0.05}>
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0F1A]/80 p-8 shadow-xl backdrop-blur-md transition-colors hover:border-[#0A84FF]/40 hover:bg-[#0A0F1A]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <p className="mb-4 font-mono text-[13px] font-bold text-[#4D9FFF]">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mb-4 text-[17px] font-bold text-white">{text(e.en, e.ar)}</h3>
              <p
                dir="ltr"
                className="relative z-10 truncate rounded-xl border border-white/[0.05] bg-black/40 px-4 py-3 text-left font-mono text-[11.5px] leading-relaxed text-[#94A3B8] shadow-inner"
              >
                <span aria-hidden className="me-2 font-bold text-[#0A84FF]">›</span>
                {e.out}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── National scale ─── */

function Scale() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  const stats = [
    { value: "34.2M", en: "Citizen health records", ar: "سجل صحي للمواطنين" },
    { value: "450+", en: "Hospitals & clinics connected", ar: "مستشفى وعيادة متصلة" },
    { value: "<1s", en: "Emergency record retrieval", ar: "استدعاء سجل الطوارئ" },
    { value: "99.99%", en: "Availability architecture", ar: "معمارية الجاهزية" },
  ];
  return (
    <Section className="border-t border-white/[0.06] py-28 lg:py-36">
      <Reveal>
        <Eyebrow en="Built for national scale" ar="مصمم على مقياس وطني" />
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className="mb-16 max-w-[700px] font-semibold text-white"
          style={{
            fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)",
            lineHeight: isAr ? 1.45 : 1.18,
            letterSpacing: isAr ? "0" : "-0.025em",
          }}
        >
          {text(
            "Infrastructure measured in lives, not requests.",
            "بنية تحتية تُقاس بالأرواح، لا بالطلبات.",
          )}
        </h2>
      </Reveal>
      <div className="grid gap-y-12 border-t border-white/[0.06] pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.en} delay={0.08 * i} className="border-white/[0.06] sm:border-e last:border-e-0 sm:pe-8 sm:[&:not(:first-child)]:ps-8">
            <p
              className="font-semibold tabular-nums text-white"
              dir="ltr"
              style={{ fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)", letterSpacing: "-0.03em" }}
            >
              {s.value}
            </p>
            <p className="mt-2 text-[12.5px] text-white/55">{text(s.en, s.ar)}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Trust & governance — the Isnād ─── */

function Trust() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  const items = [
    {
      icon: ScrollText, en: "Isnād — the audit chain", ar: "الإسناد — سلسلة التدقيق",
      enBody: "Every access and every AI output is recorded in an immutable chain of attribution.",
      arBody: "كل وصول وكل مخرجات للذكاء تُسجَّل في سلسلة نسبة غير قابلة للتغيير.",
    },
    {
      icon: UserCheck, en: "Human-in-the-loop", ar: "الإنسان في مركز القرار",
      enBody: "AI recommends with confidence and reasoning. The final call is always human.",
      arBody: "يوصي الذكاء الاصطناعي بدرجة ثقة وتعليل، ويبقى القرار الأخير بشريًا دائمًا.",
    },
    {
      icon: ShieldCheck, en: "Role-based access", ar: "وصول مبني على الدور",
      enBody: "Access is scoped to clinical need across twelve roles, governed by national health policy.",
      arBody: "يُحدَّد الوصول وفق الحاجة السريرية عبر اثني عشر دورًا، بموجب السياسات الصحية الوطنية.",
    },
    {
      icon: Lock, en: "End-to-end encryption", ar: "تشفير شامل",
      enBody: "Citizen data is encrypted in transit and at rest.",
      arBody: "بيانات المواطنين مشفّرة أثناء النقل وفي التخزين.",
    },
    {
      icon: Landmark, en: "Sovereign residency", ar: "سيادة البيانات",
      enBody: "Health data is stored, processed and governed inside the nation it belongs to.",
      arBody: "تُخزَّن البيانات الصحية وتُعالَج وتُحكَم داخل الوطن الذي تنتمي إليه.",
    },
    {
      icon: Eye, en: "Consent-governed", ar: "محكوم بالموافقة",
      enBody: "Citizens see who accessed their record, and control who can.",
      arBody: "يرى المواطن من اطّلع على سجله، ويتحكم فيمن يستطيع ذلك.",
    },
  ];
  return (
    <Section id="trust" className="border-t border-white/[0.06] py-28 lg:py-36">
      <Reveal>
        <Eyebrow en="Trust, by design" ar="ثقة بالتصميم" />
      </Reveal>
      <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
        <Reveal delay={0.08}>
          <h2
            className="font-semibold text-white"
            style={{
              fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)",
              lineHeight: isAr ? 1.45 : 1.18,
              letterSpacing: isAr ? "0" : "-0.025em",
            }}
          >
            {text(
              "Every decision has its chain of trust.",
              "لكل قرارٍ سلسلةُ ثقة.",
            )}
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
      <Reveal delay={0.1}>
        <IsnadChain />
      </Reveal>
      <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <Reveal key={it.en} delay={0.06 * i} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-card/[0.03]">
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

/* The hero's case, sealed. The chain of trust is shown, not described —
   and the page's opening story finds its ending here. */
function IsnadChain() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const links = [
    { n: "01", main: "engine output · risk 0.94 — reasoning archived", hash: "sha256 9f2c…41a1" },
    { n: "02", main: "physician decision · diuretic held", hash: "sha256 41bb…0c7e" },
    { n: "03", main: "pharmacy dispense · amended rx", hash: "sha256 c8d0…b252" },
    { n: "04", main: "citizen visibility · access logged", hash: "sha256 77aa…e019" },
  ];
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div
        dir={dir}
        role="img"
        aria-label="ISNAD Case Trace"
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070B12] text-left"
      >
        <div aria-hidden className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 font-mono text-[10.5px] tracking-[0.12em]">
          <span className="text-success/90">ISNĀD — case #a3f9-2210</span>
          <span className="text-white/35">sealed 14:03:12</span>
        </div>
        <div aria-hidden className="px-5 py-4">
          {links.map((l) => (
            <div key={l.n} className="flex items-baseline gap-4 border-b border-white/[0.04] py-2.5 font-mono text-[12px] last:border-b-0">
              <span className="w-6 shrink-0 text-[10.5px] text-white/40">{l.n}</span>
              <span className="min-w-0 flex-1 truncate text-white/85">{l.main}</span>
              <span className="hidden shrink-0 text-[11px] text-white/30 sm:inline">{l.hash}</span>
              <span className="shrink-0 text-[11px] text-success/80">✓</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-3 font-mono text-[10.5px] tracking-[0.08em] text-white/40">
            <span className="h-1 w-1 rounded-full bg-success/80" />
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

/* ─── Ecosystem: twelve doors into one system ─── */

function Ecosystem() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  const groups: {
    en: string; ar: string;
    roles: { role: string; en: string; ar: string; enBody: string; arBody: string }[];
  }[] = [
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
      <Reveal>
        <Eyebrow en="One system, every role" ar="منظومة واحدة لكل الأدوار" />
      </Reveal>
      <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
        <Reveal delay={0.08}>
          <h2
            className="font-semibold text-white"
            style={{
              fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)",
              lineHeight: isAr ? 1.45 : 1.18,
              letterSpacing: isAr ? "0" : "-0.025em",
            }}
          >
            {text(
              "One intelligence layer. Twelve doors.",
              "طبقة ذكاء واحدة. اثنا عشر بابًا.",
            )}
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
            <p
              className={`mb-4 border-b border-white/[0.08] pb-3 text-white/45 ${
                isAr ? "text-[11.5px] font-semibold" : "text-[11px] font-mono uppercase tracking-[0.18em]"
              }`}
            >
              {text(g.en, g.ar)}
            </p>
            <div>
              {g.roles.map((r) => (
                <Link
                  key={r.role}
                  href={`/login?role=${r.role}`}
                  className={`group -mx-3 flex items-center justify-between gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-card/[0.04] ${FOCUS}`}
                >
                  <span>
                    <span className="block text-[14.5px] font-semibold text-white">{text(r.en, r.ar)}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/50">
                      {text(r.enBody, r.arBody)}
                    </span>
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

/* ─── Final call & footer ─── */

function FinalCall() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="relative overflow-hidden border-t border-white/[0.06]">
      <div
        aria-hidden
        className="absolute left-1/2 bottom-[-300px] h-[520px] w-[860px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(10,132,255,0.13), transparent)" }}
      />
      <Section className="relative py-32 text-center lg:py-40">
        <Reveal>
          <h2
            className="mx-auto mb-9 max-w-[680px] font-semibold text-white"
            style={{
              fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
              lineHeight: isAr ? 1.4 : 1.12,
              letterSpacing: isAr ? "0" : "-0.03em",
            }}
          >
            {text(
              "A healthier nation runs on better decisions.",
              "وطن أكثر صحة يقوم على قرارات أفضل.",
            )}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col items-center gap-5">
          <Link
            href="/login"
            className={`flex h-12 items-center gap-2 rounded-full bg-card px-7 text-[15px] font-bold text-[#05070C] transition-opacity hover:opacity-85 ${FOCUS}`}
          >
            {text("Enter your workspace", "ادخل إلى مساحة عملك")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
          <p className="text-[12px] text-white/45">
            {text(
              "Access is provisioned by your national health authority.",
              "يُمنح الوصول عبر الجهة الصحية الوطنية المختصة.",
            )}
          </p>
        </Reveal>
      </Section>
    </div>
  );
}

function Footer() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <Wordmark />
          <p className="text-[12px] text-white/50">
            {text(
              "Flagship deployment: Kingdom of Saudi Arabia — a Vision 2030 health transformation initiative.",
              "النشر الأول: المملكة العربية السعودية — إحدى مبادرات التحول الصحي لرؤية السعودية 2030.",
            )}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="text-[11.5px] text-white/45">
            {text("© 2026 Sanad Technologies", "© 2026 شركة سند للتقنية")}
          </p>
          {locale === "ar" ? (
            <p className="text-[11.5px] font-semibold text-white/40">
              صُمّمت وبُنيت في الرياض — SANAD HEALTH
            </p>
          ) : (
            <p className="font-mono text-[11px] tracking-[0.08em] text-white/40" dir="ltr">
              SANAD HEALTH — DESIGNED AND BUILT IN RIYADH
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */

export default function Landing() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  return (
    <div className="min-h-screen bg-[#05070C] text-[#F4F6FA] antialiased selection:bg-[#0A84FF]/30">
      <Nav />
      <main>
        <Hero />
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

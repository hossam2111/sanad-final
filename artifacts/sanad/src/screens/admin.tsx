import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { PageHeader, Card, CardHeader, CardTitle, CardBody, KpiCard, Badge, AlertBanner , SkeletonCard, ErrorBanner} from "@/components/shared";
import { useGetAdminStats, useGetPopulationHealth, type BloodTypeStat } from "@workspace/api-client-react";

type RegionalStat = {
  region: string;
  patients: number;
  hospitals: number;
  highRisk: number;
  critical: number;
  coverage: string;
  population: number;
  riskRate: number;
  riskLevel: string;
};

type RiskDistributionEntry = {
  level: string;
  count: number;
  color: string;
};

type AdminStatsExtended = {
  totalPatients: number;
  totalVisitsToday: number;
  activeAlerts: number;
  drugInteractionsBlocked: number;
  aiDecisionsMade: number;
  highRiskPatients: number;
  criticalPatients: number;
  systemUptimeSeconds: number;
  systemUptimeHours: number;
  nationalRiskRate: number;
  riskDistribution: RiskDistributionEntry[];
  regionalStats: RegionalStat[];
  policyInsights: string[];
};

type Appointment = {
  id: string | number;
  patientName?: string;
  doctor?: string;
  department?: string;
  date?: string;
  time?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  referenceNo?: string;
  status: string;
  hospital: string;
};

type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: string;
  org?: string;
  organization?: string;
  title?: string;
  status?: "active" | "revoked";
};

type NewUser = {
  username: string;
  password: string;
  role: string;
  name: string;
  organization: string;
  title: string;
};

type EpidemicRadarItem = {
  condition: string;
  count: number;
  trend: string;
  alert: string;
};

type PolicyInsight = {
  insight: string;
  priority: string;
  action?: string;
};

type IntelligenceData = {
  urgencyBreakdown: Record<string, number>;
  avgAiConfidence: number;
  totalDecisions: number;
  aiDecisionsToday: number;
  criticalPatients: number;
  epidemicRadar: EpidemicRadarItem[];
  policyInsights: PolicyInsight[];
  auditRecords: number;
  systemHealth: Record<string, string>;
  diseaseBurden?: Array<{ condition: string; totalRisk: number; avgRisk: number }>;
};
import { useNationalIntelligence } from "@/hooks/use-ai-decision";
import { Users, Activity, ShieldAlert, Building, TrendingUp, AlertTriangle, PieChart as PieIcon, Globe, Brain, Zap, Radio, Lightbulb, Target, MapPin, Calendar, RefreshCw, X, Server, Database, Download, CheckCircle2, XCircle, Clock, UserCheck, Shield, Wrench } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--primary))"];
const RISK_COLORS = { Low: "hsl(var(--success))", Medium: "hsl(var(--warning))", High: "hsl(var(--risk-high))", Critical: "hsl(var(--destructive))" };

// KSA Region approximate SVG coordinates (simplified polygon centroids)
const KSA_REGIONS: Record<string, { cx: number; cy: number; label: string; labelAr: string; r: number }> = {
  "Riyadh":           { cx: 300, cy: 210, label: "Riyadh",      labelAr: "الرياض",          r: 28 },
  "Makkah":           { cx: 140, cy: 250, label: "Makkah",      labelAr: "مكة",             r: 24 },
  "Eastern Province": { cx: 400, cy: 170, label: "Eastern",     labelAr: "الشرقية",         r: 22 },
  "Madinah":          { cx: 165, cy: 185, label: "Madinah",     labelAr: "المدينة",         r: 18 },
  "Asir":             { cx: 175, cy: 320, label: "Asir",        labelAr: "عسير",            r: 16 },
  "Qassim":           { cx: 265, cy: 155, label: "Qassim",      labelAr: "القصيم",          r: 15 },
  "Jazan":            { cx: 148, cy: 370, label: "Jazan",       labelAr: "جازان",           r: 14 },
  "Hail":             { cx: 240, cy: 115, label: "Hail",        labelAr: "حائل",            r: 13 },
  "Tabuk":            { cx: 130, cy: 110, label: "Tabuk",       labelAr: "تبوك",            r: 13 },
  "Najran":           { cx: 240, cy: 370, label: "Najran",      labelAr: "نجران",           r: 12 },
  "Al Bahah":         { cx: 170, cy: 295, label: "Al Bahah",    labelAr: "الباحة",          r: 10 },
  "Al Jouf":          { cx: 215, cy: 65,  label: "Al Jouf",     labelAr: "الجوف",           r: 10 },
  "Northern Borders": { cx: 265, cy: 48,  label: "N. Borders",  labelAr: "الحدود الشمالية", r: 10 },
};

const RISK_FILL: Record<string, string> = {
  critical: "hsl(var(--risk-critical))",
  high:     "hsl(var(--risk-high))",
  medium:   "hsl(var(--risk-medium))",
  low:      "hsl(var(--risk-low))",
};

function KSAHeatmap({ regions }: { regions: RegionalStat[] }) {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [hovered, setHovered] = useState<string | null>(null);
  const regionMap = Object.fromEntries(regions.map(r => [r.region, r]));

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 520 430" className="w-full max-h-[420px]">
        {/* KSA outline (simplified) */}
        <path
          d="M 80 60 L 160 30 L 290 20 L 450 90 L 480 180 L 460 280 L 380 360 L 300 420 L 220 410 L 140 390 L 100 340 L 85 280 L 75 200 Z"
          fill="hsl(240 6% 97%)"
          stroke="hsl(240 5% 84%)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Gulf coastline detail */}
        <path
          d="M 450 90 L 480 120 L 490 180 L 480 220 L 460 280"
          fill="none"
          stroke="hsl(211 100% 70%)"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Red Sea detail */}
        <path
          d="M 80 60 L 70 150 L 75 250 L 85 320 L 100 360"
          fill="none"
          stroke="hsl(211 100% 70%)"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Circles per region */}
        {Object.entries(KSA_REGIONS).map(([name, pos]) => {
          const data = regionMap[name];
          if (!data) return null;
          const fill = RISK_FILL[data.riskLevel] ?? "hsl(var(--muted-foreground))";
          const isHov = hovered === name;

          return (
            <g key={name} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Pulse ring for critical */}
              {data.riskLevel === "critical" && (
                <circle cx={pos.cx} cy={pos.cy} r={pos.r + 8} fill={fill} opacity="0.15">
                  <animate attributeName="r" values={`${pos.r + 4};${pos.r + 14};${pos.r + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={isHov ? pos.r + 4 : pos.r}
                fill={fill}
                opacity={isHov ? 1 : 0.82}
                stroke="white"
                strokeWidth={isHov ? 2.5 : 1.5}
                style={{ transition: "all 0.15s ease" }}
              />
              <text x={pos.cx} y={pos.cy + 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={pos.r > 18 ? 8 : 7} fontWeight="bold">
                {data.riskRate}%
              </text>
              {/* Label */}
              <text
                x={pos.cx}
                y={pos.cy + pos.r + 10}
                textAnchor="middle"
                fill="hsl(240 5% 35%)"
                fontSize="7.5"
                fontWeight="600"
              >
                {locale === "ar" ? pos.labelAr : pos.label}
              </text>

              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect x={pos.cx - 60} y={pos.cy - pos.r - 72} width="120" height="64" rx="8"
                    fill="white" stroke="hsl(240 5% 84%)" strokeWidth="1"
                    filter="drop-shadow(0 4px 12px rgba(0,0,0,0.12))" />
                  <text x={pos.cx} y={pos.cy - pos.r - 56} textAnchor="middle" fill="hsl(240 10% 10%)" fontSize="9" fontWeight="bold">{name}</text>
                  <text x={pos.cx} y={pos.cy - pos.r - 43} textAnchor="middle" fill="hsl(240 5% 50%)" fontSize="8">
                    {text(`${data.patients?.toLocaleString()} patients`, `${data.patients?.toLocaleString()} مريض`)}
                  </text>
                  <text x={pos.cx} y={pos.cy - pos.r - 31} textAnchor="middle" fill={fill} fontSize="8.5" fontWeight="bold">
                    {text("Risk:", "الخطورة:")} {data.riskRate}% — {data.riskLevel === "critical" ? text("CRITICAL", "حرجة") : data.riskLevel === "high" ? text("HIGH", "مرتفعة") : data.riskLevel === "medium" ? text("MEDIUM", "متوسطة") : text("LOW", "منخفضة")}
                  </text>
                  <text x={pos.cx} y={pos.cy - pos.r - 19} textAnchor="middle" fill="hsl(240 5% 50%)" fontSize="7.5">
                    {text(`${data.highRisk} high-risk · ${data.hospitals} hospitals`, `${data.highRisk} مرتفع الخطورة · ${data.hospitals} مستشفى`)}
                  </text>
                  <text x={pos.cx} y={pos.cy - pos.r - 8} textAnchor="middle" fill="hsl(240 5% 50%)" fontSize="7.5">
                    {text(`Coverage: ${data.coverage}`, `التغطية: ${data.coverage}`)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Legend */}
        {["low", "medium", "high", "critical"].map((level, i) => (
          <g key={level} transform={`translate(${20 + i * 115}, 405)`}>
            <circle cx={7} cy={7} r={7} fill={RISK_FILL[level]} />
            <text x={18} y={11} fill="hsl(240 5% 45%)" fontSize="8" fontWeight="600" style={{ textTransform: "uppercase" }}>
              {level === "low" ? text("Low", "منخفضة") : level === "medium" ? text("Medium", "متوسطة") : level === "high" ? text("High", "مرتفعة") : text("Critical", "حرجة")}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AuditFeed() {
  const { text, dir } = useLanguage();
  const [entries, setEntries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState<string>("");

  React.useEffect(() => {
    const params = roleFilter ? `?role=${roleFilter}` : "";
    apiFetch(`/api/admin/audit-feed${params}`)
      .then(r => r.json())
      .then(data => { setEntries(data.entries ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter]);

  const ROLES = ["", "doctor", "citizen", "admin", "emergency", "lab", "pharmacy", "hospital", "insurance", "family"];

  return (
    <Card dir={dir}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{text("Isnād Audit Trail", "سجل إسناد التدقيق")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {text("Tamper-evident chain of every access and AI decision", "سلسلة غير قابلة للتلاعب لكل وصول وقرار ذكاء اصطناعي")}
          </p>
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setLoading(true); }}
          className="rounded-md border border-border bg-background text-foreground text-sm px-2 py-1"
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r || text("All roles", "كل الأدوار")}</option>
          ))}
        </select>
      </CardHeader>
      <CardBody>
        {loading ? (
          <p className="text-muted-foreground text-sm">{text("Loading...", "جاري التحميل...")}</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{text("No audit entries found", "لا توجد سجلات تدقيق")}</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {entries.map(entry => (
              <div key={entry.id} dir={dir}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border text-sm">
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{entry.whoName ?? entry.who}</span>
                    <Badge variant="outline" className="text-[10px]">{entry.whoRole}</Badge>
                    <Badge variant="default" className="text-[10px]">{entry.action}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate">{entry.what}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5" dir="ltr">
                    {new Date(entry.createdAt).toLocaleString("en-SA")}
                    {entry.ipAddress && ` · ${entry.ipAddress}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ComplianceDashboard() {
  const { text, dir } = useLanguage();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch("/api/admin/compliance")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{text("Loading compliance data…","جارٍ تحميل بيانات الامتثال…")}</div>;
  if (!data) return <div className="text-center text-danger py-16">{text("Failed to load compliance data","تعذّر تحميل بيانات الامتثال")}</div>;

  const TIER_COLORS: Record<string, string> = {
    "Critical — PHI": "bg-danger/10 text-danger border-danger/30",
    "Sensitive — PII": "bg-warning-bg text-warning border-warning/30",
    "Internal — Clinical": "bg-info-bg text-info border-info/30",
    "Restricted — Aggregate": "bg-primary/10 text-primary border-primary/30",
    "Public": "bg-success-bg text-success border-success/30",
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Shield className="w-6 h-6 text-primary" /></div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{text("Data Sovereignty & PDPL Compliance","السيادة الرقمية والامتثال لنظام PDPL")}</h2>
          <p className="text-sm text-muted-foreground">{text("Saudi Personal Data Protection Law — SDAIA Certified","نظام حماية البيانات الشخصية السعودي — معتمد من هيئة SDAIA")}</p>
        </div>
        <div className="ms-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-bg text-success border border-success/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {text("COMPLIANT","ممتثل")}
          </span>
        </div>
      </div>

      {/* PDPL Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            {text("PDPL Articles Coverage","تغطية مواد نظام PDPL")}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(data.pdpl?.articlesCovered ?? []).map((a: any) => (
              <div key={a.article} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">{text(a.article, a.article)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{text(a.description, a.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Data Residency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {text("Data Residency — KSA Sovereign Cloud","إقامة البيانات — السحابة السيادية السعودية")}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              [text("Primary Region","المنطقة الأساسية"), data.dataResidency?.primaryRegion],
              [text("Disaster Recovery","التعافي من الكوارث"), data.dataResidency?.disasterRecovery],
              [text("Cross-Border Transfer","النقل عبر الحدود"), data.dataResidency?.crossBorderTransfer],
              [text("Encryption at Rest","التشفير في حالة السكون"), data.dataResidency?.encryptionAtRest],
              [text("Encryption in Transit","التشفير أثناء النقل"), data.dataResidency?.encryptionInTransit],
            ].map(([label, value]) => (
              <div key={String(label)} className="p-3 rounded-lg border border-border bg-muted/20">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Data Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            {text("Data Classification Matrix","مصفوفة تصنيف البيانات")}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {(data.dataClassification ?? []).map((tier: any) => (
              <div key={tier.tier} className={`flex items-center justify-between p-3 rounded-lg border ${TIER_COLORS[tier.tier] ?? "bg-muted/20 border-border text-foreground"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{text(tier.tier, tier.tier)}</span>
                  <span className="text-xs opacity-70">{text(tier.examples, tier.examples)}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold">{text("Retention","الاحتفاظ")}: {tier.retention}</p>
                  <p className="text-[11px] opacity-70">{tier.accessControl}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Audit Metrics + Consent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {text("Audit Metrics","مقاييس التدقيق")}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                [text("Total Audited Events","إجمالي الأحداث المدققة"), (data.auditMetrics?.totalAuditedEvents ?? 0).toLocaleString()],
                [text("Total Patient Records","إجمالي سجلات المرضى"), (data.auditMetrics?.totalPatientRecords ?? 0).toLocaleString()],
                [text("Hash-Chain Integrity","سلامة سلسلة التجزئة"), data.auditMetrics?.hashChainIntegrity ?? "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{k}</span>
                  <span className="text-sm font-bold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              {text("Consent Framework","إطار الموافقة")}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{text("Model","النموذج")}</p>
              <p className="text-sm font-semibold text-foreground">{data.consentFramework?.model ?? "—"}</p>
            </div>
            <div className="space-y-1">
              {(data.consentFramework?.granularity ?? []).map((g: string) => (
                <div key={g} className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function fetchAppointmentsSummary() {
  const res = await apiFetch("/api/appointments/all?limit=100");
  if (!res.ok) return { appointments: [] };
  return res.json();
}

async function fetchSystemHealth() {
  const res = await apiFetch("/api/health/healthz");
  return res.json();
}

async function fetchUsers() {
  const res = await apiFetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.users ?? [];
}

const ROLE_BADGE: Record<string, { label: string; labelAr: string; cls: string }> = {
  admin:        { label: "Admin",        labelAr: "مدير النظام",    cls: "bg-primary/10 text-primary" },
  doctor:       { label: "Doctor",       labelAr: "طبيب",           cls: "bg-primary/10 text-primary" },
  emergency:    { label: "Emergency",    labelAr: "طوارئ",          cls: "bg-danger-bg text-danger" },
  lab:          { label: "Lab",          labelAr: "مختبر",          cls: "bg-info-bg text-info" },
  pharmacy:     { label: "Pharmacy",     labelAr: "صيدلية",         cls: "bg-success-bg text-success" },
  hospital:     { label: "Hospital",     labelAr: "مستشفى",         cls: "bg-warning-bg text-warning" },
  insurance:    { label: "Insurance",    labelAr: "تأمين",          cls: "bg-warning-bg text-warning" },
  "ai-control": { label: "AI Control",  labelAr: "تحكم ذكي",       cls: "bg-primary/10 text-primary" },
  research:     { label: "Research",     labelAr: "بحث",            cls: "bg-info-bg text-info" },
  citizen:      { label: "Citizen",      labelAr: "مواطن",          cls: "bg-secondary text-muted-foreground" },
  family:       { label: "Family",       labelAr: "أسرة",           cls: "bg-success-bg text-success" },
  "supply-chain":{ label: "Supply Chain",labelAr: "سلسلة التوريد", cls: "bg-warning-bg text-warning" },
};

const DEMO_USERS = [
  { id:"ADM-001", username:"admin.saad",      name:"Eng. Saad Al-Otaibi",      role:"admin",        org:"Ministry of Health — KSA",         title:"National Health Ops Director" },
  { id:"DOC-001", username:"dr.rashidi",      name:"Dr. Ahmed Al-Rashidi",      role:"doctor",       org:"King Fahd Medical City",           title:"Consultant Physician" },
  { id:"EMP-001", username:"emergency_unit7", name:"Unit 7 — Riyadh Central",   role:"emergency",    org:"SRCA Emergency Services",          title:"First Responder" },
  { id:"LAB-001", username:"lab.sara",        name:"Sara Al-Otaibi",            role:"lab",          org:"SANAD Lab Network",                title:"Senior Lab Technician" },
  { id:"PHA-001", username:"pharm.hassan",    name:"Hassan Al-Ghamdi",          role:"pharmacy",     org:"Central Pharmacy — Riyadh",        title:"Clinical Pharmacist" },
  { id:"HOS-001", username:"hosp.ops",        name:"Operations Manager",        role:"hospital",     org:"King Fahd Medical City",           title:"Hospital Ops Director" },
  { id:"INS-001", username:"ins.nora",        name:"Nora Al-Qahtani",           role:"insurance",    org:"Tawuniya Insurance",               title:"Insurance Operations Lead" },
  { id:"AIC-001", username:"ai.khalid",       name:"Dr. Khalid Al-Mansouri",    role:"ai-control",   org:"SANAD AI Division",                title:"AI Systems Lead" },
  { id:"RES-001", username:"research.reem",   name:"Dr. Reem Al-Zahrani",       role:"research",     org:"King Abdulaziz University",        title:"Clinical Research Director" },
  { id:"CIT-001", username:"citizen_demo",    name:"Mohammed Al-Ghamdi",        role:"citizen",      org:"National Health Record",           title:"Citizen" },
  { id:"FAM-001", username:"family.fatima",   name:"Fatima Al-Ghamdi",          role:"family",       org:"Al-Ghamdi Household",              title:"Family Member" },
  { id:"SUP-001", username:"supply.ibrahim",  name:"Ibrahim Al-Dosari",         role:"supply-chain", org:"National Pharma Supply",           title:"Supply Chain Manager" },
];

export default function AdminDashboard() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const { data: statsRaw, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStats();
  const { data: popHealth, isLoading: healthLoading } = useGetPopulationHealth();
  const { data: intelligence } = useNationalIntelligence();
  const { data: apptData } = useQuery({ queryKey: ["admin-appointments"], queryFn: fetchAppointmentsSummary, refetchInterval: 60000 });
  const { data: sysHealth, refetch: refetchHealth } = useQuery({ queryKey: ["system-health"], queryFn: fetchSystemHealth, refetchInterval: 30000 });

  const [showResetModal, setShowResetModal] = useState(false);
  const [userEnabled, setUserEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(DEMO_USERS.map(u => [u.id, true]))
  );
  const [exportingLogs, setExportingLogs] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [resetMsg, setResetMsg] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "doctor", name: "", organization: "", title: "" });

  const queryClient = useQueryClient();
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers, staleTime: 30000 });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "revoked" }) => {
      const res = await apiFetch(`/api/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (user: NewUser) => {
      const res = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowAddUserModal(false);
      setNewUser({ username: "", password: "", role: "doctor", name: "", organization: "", title: "" });
    },
  });

  const handleResetDemo = async () => {
    setResetState("running");
    setResetMsg("");
    try {
      const res = await apiFetch("/api/admin/reset-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResetState("error"); setResetMsg(data.message ?? "Reset failed"); return; }
      setResetState("done");
      setResetMsg(data.message ?? "Done");
      refetchStats();
    } catch {
      setResetState("error");
      setResetMsg(text("Network error", "خطأ في الاتصال"));
    }
  };

  const handleExportLogs = async () => {
    setExportingLogs(true);
    try {
      const res = await apiFetch("/api/admin/audit-log?limit=5000");
      const data = await res.json();
      const rows: Record<string, unknown>[] = data.logs ?? [];
      const cols = ["id","createdAt","whoRole","whoUserId","action","what","patientId","details"];
      const csv = [
        cols.join(","),
        ...rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `sanad-audit-${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setExportingLogs(false); }
  };

  const stats = statsRaw as AdminStatsExtended | undefined;

  if (statsLoading || healthLoading) {
    return (
      <Layout role="admin" localized>
        <div className="flex items-center gap-3 py-20 justify-center text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span className="text-sm font-medium">{text("Aggregating national health data...", "جارٍ تجميع البيانات الصحية الوطنية...")}</span>
        </div>
      </Layout>
    );
  }

  const appointments: Appointment[] = apptData?.appointments ?? [];
  const upcomingAppts = appointments.filter((a: Appointment) => a.status === "confirmed").slice(0, 6);

  return (
    <Layout role="admin" localized>
      {stats && stats.highRiskPatients > 0 && (
        <AlertBanner variant="warning">
          <AlertTriangle className="w-4 h-4 text-risk-high shrink-0" />
          <span>
            <strong>{text(`${stats.highRiskPatients} patients`, `${stats.highRiskPatients} مريض`)}</strong> {text("currently classified as high or critical risk require clinical follow-up.", "مصنّفون حاليًا ضمن الخطورة المرتفعة أو الحرجة ويحتاجون إلى متابعة سريرية.")}
          </span>
          <Badge variant="warning" className="ms-auto shrink-0">{text(`${stats.highRiskPatients} flagged`, `${stats.highRiskPatients} موسوم`)}</Badge>
        </AlertBanner>
      )}

      <div className="mb-8 relative rounded-3xl overflow-hidden glass-panel border border-primary/20 shadow-xl bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="absolute top-0 ltr:right-0 rtl:left-0 w-[500px] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {text("Ministry of Health Command Center", "وزارة الصحة — مركز القيادة")}
              </h1>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl text-[13px] sm:text-sm leading-relaxed">
              {text("Real-time national infrastructure metrics and population health intelligence.", "مؤشّرات البنية التحتية الوطنية الفورية وذكاء صحة السكان.")}
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-mono font-bold bg-background/50 border border-border rounded-xl px-4 py-2.5 text-foreground backdrop-blur-sm shadow-sm" dir="ltr">
              {new Date().toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            <button
              onClick={() => { setShowResetModal(true); setResetState("idle"); setResetMsg(""); }}
              className="flex items-center gap-2 text-[11px] font-bold px-4 py-2.5 rounded-xl border border-warning/30 bg-warning/10 text-warning hover:bg-warning hover:text-warning-foreground transition-all shadow-sm"
              title={text("Reset Demo Environment", "إعادة تعيين بيئة العرض")}
            >
              <RefreshCw className="w-4 h-4" />
              {text("Reset Demo", "إعادة العرض")}
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" dir={dir}>
        <div className="mb-6 overflow-x-auto pb-1">
          <TabsList className="min-w-max">
            <TabsTrigger value="dashboard">{text("Dashboard", "لوحة القيادة")}</TabsTrigger>
            <TabsTrigger value="system">{text("System Health", "صحة النظام")}</TabsTrigger>
            <TabsTrigger value="ai-gov">{text("AI Governance", "حوكمة الذكاء")}</TabsTrigger>
            <TabsTrigger value="users">{text("User Registry", "سجل المستخدمين")}</TabsTrigger>
            <TabsTrigger value="audit">{text("Audit Trail", "سجل التدقيق")}</TabsTrigger>
            <TabsTrigger value="maintenance">{text("Maintenance", "الصيانة")}</TabsTrigger>
            <TabsTrigger value="compliance">{text("Data Sovereignty", "السيادة الرقمية")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">

      {/* KPI Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard title={text("Registered Patients", "المرضى المسجّلون")} value={(stats.totalPatients ?? 0).toLocaleString()} sub={text("Active national records", "سجلات وطنية نشطة")} icon={Users} iconBg="bg-primary/10" iconColor="text-primary" />
          <KpiCard title={text("Visits Today", "زيارات اليوم")} value={(stats.totalVisitsToday ?? 0).toLocaleString()} sub={text("Across all facilities", "في جميع المنشآت")} icon={Activity} iconBg="bg-info-bg" iconColor="text-info" />
          <KpiCard title={text("Drug Conflicts Prevented", "تداخلات دوائية مُنعت")} value={(stats.drugInteractionsBlocked ?? 0).toLocaleString()} sub={text("Blocked by interaction screening", "حُجبت عبر فحص التداخلات")} icon={ShieldAlert} iconBg="bg-success-bg" iconColor="text-success" />
          <KpiCard title={text("AI Decisions Made", "قرارات الذكاء الاصطناعي")} value={(stats.aiDecisionsMade ?? 0).toLocaleString()} sub={text(`${(stats.activeAlerts ?? 0).toLocaleString()} active alerts`, `${(stats.activeAlerts ?? 0).toLocaleString()} تنبيه نشط`)} icon={Building} iconBg="bg-primary/10" iconColor="text-primary" />
        </div>
      )}

      {/* Charts Grid */}
      {popHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Monthly Trend */}
          <Card className="col-span-full lg:col-span-8">
            <CardHeader>
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><CardTitle>{text("Monthly Visit Trend", "اتجاه الزيارات الشهري")}</CardTitle></div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-3 h-0.5 bg-primary inline-block rounded-full" /> {text("Total Visits", "إجمالي الزيارات")}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-3 h-0.5 bg-destructive inline-block rounded-full" /> {text("Emergency", "الطوارئ")}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="h-[300px] w-full py-4">
                <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                  <LineChart data={popHealth.monthlyVisitTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="emergency" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer></div>
              </div>
            </CardBody>
          </Card>

          {/* Blood Type Pie */}
          <Card className="col-span-full lg:col-span-4">
            <CardHeader><CardTitle>{text("Blood Type Distribution", "توزيع فصائل الدم")}</CardTitle></CardHeader>
            <CardBody>
              <div className="h-[280px] w-full py-4">
                <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={popHealth.bloodTypeDistribution} innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="count" nameKey="bloodType">
                      {popHealth.bloodTypeDistribution.map((_: BloodTypeStat, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer></div>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 mt-1">
                {popHealth.bloodTypeDistribution.map((d: BloodTypeStat, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground font-mono">{d.bloodType}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* === KSA GEOGRAPHIC RISK HEATMAP === */}
          {stats?.regionalStats && stats.regionalStats.length > 0 && (
            <Card className="col-span-full lg:col-span-7">
              <CardHeader>
                <MapPin className="w-4 h-4 text-primary" />
                <CardTitle>{text("National Risk Heatmap — KSA", "خريطة الخطورة الوطنية — المملكة")}</CardTitle>
                <Badge variant="outline" className="ms-auto text-[10px]">
                  {text(`${stats.regionalStats.filter((r: RegionalStat) => r.riskLevel === "critical").length} critical regions`, `${stats.regionalStats.filter((r: RegionalStat) => r.riskLevel === "critical").length} مناطق حرجة`)}
                </Badge>
              </CardHeader>
              <CardBody>
                <KSAHeatmap regions={stats.regionalStats} />
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {text("Circle size = relative patient volume · Color = risk level · Hover for details", "حجم الدائرة = حجم المرضى النسبي · اللون = مستوى الخطورة · مرّر للتفاصيل")}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Conditions Bar */}
          <Card className="col-span-full lg:col-span-5">
            <CardHeader>
              <CardTitle>{text("Top Chronic Conditions", "أبرز الأمراض المزمنة")}</CardTitle>
              <Badge variant="default">{text(`${popHealth.conditionBreakdown?.length} tracked`, `${popHealth.conditionBreakdown?.length} متابَع`)}</Badge>
            </CardHeader>
            <CardBody>
              <div className="h-[350px] w-full py-4">
                <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popHealth.conditionBreakdown} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="condition" type="category" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }} width={130} />
                    <RechartsTooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer></div>
              </div>
            </CardBody>
          </Card>

          {/* Age Distribution */}
          <Card className="col-span-full lg:col-span-6">
            <CardHeader><CardTitle>{text("Population Age Distribution", "التوزيع العمري للسكان")}</CardTitle></CardHeader>
            <CardBody>
              <div className="h-[320px] w-full py-4">
                <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popHealth.ageDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <RechartsTooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer></div>
              </div>
            </CardBody>
          </Card>

          {/* Risk Distribution */}
          {stats?.riskDistribution && (
            <Card className="col-span-full lg:col-span-6">
              <CardHeader>
                <div className="flex items-center gap-2"><PieIcon className="w-4 h-4 text-risk-high" /><CardTitle>{text("Patient Risk Distribution", "توزيع خطورة المرضى")}</CardTitle></div>
                <Badge variant="warning">{text(`${stats.highRiskPatients} high/critical`, `${stats.highRiskPatients} مرتفعة/حرجة`)}</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-[280px] w-full py-4">
                  <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.riskDistribution} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="level"
                        label={({ percent }) => percent > 0.15 ? `${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                        {stats.riskDistribution.map((entry: RiskDistributionEntry, i: number) => (
                          <Cell key={i} fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS] || "hsl(var(--muted-foreground))"} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number | string, name: string) => [`${value} patients`, name]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {stats.riskDistribution.map((d: RiskDistributionEntry, i: number) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[d.level as keyof typeof RISK_COLORS] }} />
                        <span className="text-xs font-medium text-foreground">{d.level === "Low" ? text("Low", "منخفضة") : d.level === "Medium" ? text("Medium", "متوسطة") : d.level === "High" ? text("High", "مرتفعة") : d.level === "Critical" ? text("Critical", "حرجة") : d.level}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">{d.count}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Upcoming Appointments Panel */}
          {upcomingAppts.length > 0 && (
            <Card className="col-span-12">
              <CardHeader>
                <Calendar className="w-4 h-4 text-info" />
                <CardTitle>{text("National Appointments — Upcoming Confirmed", "المواعيد الوطنية — المؤكّدة القادمة")}</CardTitle>
                <Badge variant="info" className="ms-auto">{text(`${appointments.filter((a: Appointment) => a.status === "confirmed").length} total`, `${appointments.filter((a: Appointment) => a.status === "confirmed").length} الإجمالي`)}</Badge>
              </CardHeader>
              <div className="overflow-x-auto"><table className="w-full data-table">
                <thead>
                  <tr>
                    <th>{text("Reference", "المرجع")}</th>
                    <th>{text("Patient", "المريض")}</th>
                    <th>{text("Hospital", "المستشفى")}</th>
                    <th>{text("Department", "القسم")}</th>
                    <th>{text("Date", "التاريخ")}</th>
                    <th>{text("Time", "الوقت")}</th>
                    <th>{text("Status", "الحالة")}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppts.map((a: Appointment, i: number) => (
                    <tr key={i}>
                      <td className="font-mono text-xs text-muted-foreground" dir="ltr">{a.referenceNo}</td>
                      <td className="font-bold text-foreground">{a.patientName}</td>
                      <td className="text-muted-foreground text-xs">{a.hospital.split("—")[0]?.trim()}</td>
                      <td><Badge variant="outline" className="text-[10px]">{a.department}</Badge></td>
                      <td className="font-mono text-xs" dir="ltr">{a.appointmentDate}</td>
                      <td className="font-mono text-xs font-bold" dir="ltr">{a.appointmentTime}</td>
                      <td><Badge variant="success" className="text-[10px]">{text("Confirmed", "مؤكّد")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </Card>
          )}

          {/* National Intelligence Panel */}
          {intelligence && (
            <Card className="col-span-12">
              <CardHeader>
                <Brain className="w-4 h-4 text-primary" />
                <CardTitle>{text("National AI Intelligence Platform", "منصّة الذكاء الاصطناعي الوطنية")}</CardTitle>
                <Badge variant="outline" className="ms-auto">{text("LIVE · v3.0", "مباشر · v3.0")}</Badge>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* AI Engine Status */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-risk-high" /> {text("AI Engine Cluster — 9 Active Engines", "عنقود محرّكات الذكاء — 9 محرّكات نشطة")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { name: "Risk Scoring Engine", status: "online", version: "v4.2" },
                      { name: "Decision Engine", status: "online", version: "v3.0" },
                      { name: "Digital Twin Simulator", status: "online", version: "v2.1" },
                      { name: "Behavioral AI", status: "online", version: "v1.8" },
                      { name: "Recommendation Engine", status: "online", version: "v2.5" },
                      { name: "Policy Intelligence", status: "online", version: "v1.3" },
                      { name: "Multi-Agent Orchestrator", status: "online", version: "v1.0" },
                      { name: "Explainability Layer", status: "online", version: "v2.0" },
                      { name: "Unknown Pattern Detector", status: "standby", version: "v0.9" },
                    ].map((engine, i) => (
                      <div key={i} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${engine.status === "online" ? "bg-success-bg border-success/20" : "bg-secondary border-border"}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${engine.status === "online" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                        <div>
                          <p className="text-xs font-bold text-foreground">{engine.name}</p>
                          <p className="text-[10px] text-muted-foreground">{engine.version} · {engine.status === "online" ? text("online", "متّصل") : text("standby", "احتياطي")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Epidemic Radar */}
                {(intelligence as IntelligenceData | undefined)?.epidemicRadar && (intelligence as IntelligenceData).epidemicRadar.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-danger" /> {text("Epidemic Radar — Disease Surveillance", "رادار الأوبئة — ترصّد الأمراض")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(intelligence as IntelligenceData).epidemicRadar.map((item: EpidemicRadarItem, i: number) => (
                        <div key={i} className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${
                          item.alert === "high" ? "bg-destructive/10 border-danger/20" : item.alert === "medium" ? "bg-risk-high-bg border-risk-high/20" : "bg-secondary border-border"
                        }`}>
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.alert === "high" ? "bg-danger" : item.alert === "medium" ? "bg-risk-high" : "bg-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-foreground">{item.condition}</p>
                              <Badge variant={item.alert === "high" ? "destructive" : item.alert === "medium" ? "warning" : "outline"} className="text-[9px] shrink-0">{item.alert === "high" ? text("high", "مرتفع") : item.alert === "medium" ? text("medium", "متوسط") : text("low", "منخفض")}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{text(`${item.count} cases`, `${item.count} حالة`)} · {item.trend}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policy Insights */}
                {(intelligence as IntelligenceData | undefined)?.policyInsights && (intelligence as IntelligenceData).policyInsights.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" /> {text("AI Policy Intelligence Recommendations", "توصيات ذكاء السياسات الصحية")}
                    </p>
                    <div className="space-y-2">
                      {(intelligence as IntelligenceData).policyInsights.map((insight: PolicyInsight, i: number) => (
                        <div key={i} className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${insight.priority === "high" ? "bg-primary/5 border-primary/20" : "bg-secondary border-border"}`}>
                          <Target className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-foreground">{insight.insight}</p>
                              <Badge variant={insight.priority === "high" ? "info" : "outline"} className="text-[9px] shrink-0">{insight.priority === "high" ? text("high", "مرتفعة") : text("medium", "متوسطة")}</Badge>
                            </div>
                            {insight.action && (<p className="text-[10px] text-muted-foreground mt-0.5">{text("→", "←")} {insight.action}</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* National Metrics Footer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: text("AI Decisions Today", "قرارات اليوم"), value: (intelligence as IntelligenceData | undefined)?.aiDecisionsToday ?? "0", icon: Brain },
                    { label: text("Event Bus Throughput", "إنتاجية ناقل الأحداث"), value: "—", icon: Zap },
                    { label: text("Audit Records", "سجلات التدقيق"), value: (intelligence as IntelligenceData | undefined)?.auditRecords ?? "0", icon: Target },
                    { label: text("Avg Response Time", "متوسط زمن الاستجابة"), value: "—", icon: Activity },
                  ].map((m, i) => (
                    <div key={i} className="px-4 py-3.5 bg-secondary rounded-2xl border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <m.icon className="w-3 h-3" /> {m.label}
                      </p>
                      <p className="text-xl font-bold text-foreground tabular-nums">{m.value}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Regional table */}
          {stats?.regionalStats && stats.regionalStats.length > 0 && (
            <Card className="col-span-12">
              <CardHeader>
                <CardTitle>Regional Health Overview — All 13 Regions</CardTitle>
                <Badge variant="outline">{stats.regionalStats.length} regions</Badge>
              </CardHeader>
              <div className="overflow-x-auto"><table className="w-full data-table">
                <thead>
                  <tr>
                    <th>{text("Region", "المنطقة")}</th>
                    <th>{text("Population", "عدد السكان")}</th>
                    <th>{text("Total Patients", "إجمالي المرضى")}</th>
                    <th>{text("Hospitals", "المستشفيات")}</th>
                    <th>{text("High Risk", "خطورة مرتفعة")}</th>
                    <th>{text("Risk Rate", "معدل الخطورة")}</th>
                    <th>{text("Network Coverage", "تغطية الشبكة")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.regionalStats.map((r: RegionalStat, i: number) => (
                    <tr key={i}>
                      <td className="font-bold text-foreground">{r.region}</td>
                      <td className="font-mono tabular-nums text-muted-foreground text-xs">{r.population?.toLocaleString()}</td>
                      <td className="font-mono tabular-nums">{r.patients?.toLocaleString()}</td>
                      <td className="tabular-nums">{r.hospitals}</td>
                      <td><span className={`font-mono font-bold ${r.highRisk > 5 ? "text-danger" : "text-muted-foreground"}`}>{r.highRisk ?? "—"}</span></td>
                      <td>
                        <Badge variant={r.riskLevel === "critical" ? "destructive" : r.riskLevel === "high" ? "warning" : r.riskLevel === "medium" ? "info" : "success"} className="text-[10px]">
                          {r.riskRate}% {r.riskLevel}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 bg-secondary rounded-full h-1.5 max-w-[100px]">
                            <div className="h-full bg-primary rounded-full" style={{ width: r.coverage }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{r.coverage}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </Card>
          )}
        </div>
      )}
        </TabsContent>

        {/* ── System Health ─────────────────────────────────────── */}
        <TabsContent value="system">
          <div className="space-y-5">
            {/* Overall status banner */}
            {sysHealth && (
              <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
                sysHealth.status === "ok" ? "bg-success-bg border-success/25" :
                sysHealth.status === "degraded" ? "bg-warning-bg border-warning/25" :
                "bg-danger-bg border-danger/25"
              }`}>
                {sysHealth.status === "ok"
                  ? <CheckCircle2 className="w-5 h-5 text-success shrink-0"/>
                  : <XCircle className="w-5 h-5 text-danger shrink-0"/>
                }
                <div>
                  <p className="font-bold text-foreground text-sm">{text("SANAD API Server", "خادم SANAD API")} — <span className="uppercase">{sysHealth.status}</span></p>
                  <p className="text-xs text-muted-foreground">{text("Version", "الإصدار")}: {sysHealth.version ?? "—"} · Build: {(sysHealth.buildSha ?? "—").slice(0,7)}</p>
                </div>
                <button onClick={() => refetchHealth()} className="ms-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5"/>{text("Refresh","تحديث")}</button>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                title={text("API Uptime","وقت تشغيل الـ API")}
                value={sysHealth ? `${Math.floor((sysHealth.uptimeSeconds ?? 0) / 60)}m` : "—"}
                sub={text("Since last restart","منذ آخر إعادة تشغيل")}
                icon={Server} iconBg="bg-primary/10" iconColor="text-primary"
              />
              <KpiCard
                title={text("DB Latency","زمن استجابة قاعدة البيانات")}
                value={sysHealth?.services?.database?.latencyMs != null ? `${sysHealth.services.database.latencyMs}ms` : "—"}
                sub={sysHealth?.services?.database?.ok ? text("Connected","متصلة") : text("Disconnected","منقطعة")}
                icon={Database}
                iconBg={sysHealth?.services?.database?.ok ? "bg-success-bg" : "bg-danger-bg"}
                iconColor={sysHealth?.services?.database?.ok ? "text-success" : "text-danger"}
              />
              <KpiCard
                title={text("DB Pool","حوض الاتصالات")}
                value={sysHealth?.services?.database?.pool ? `${sysHealth.services.database.pool.totalCount}/${sysHealth.services.database.pool.idleCount}` : "—"}
                sub={text("Total / Idle","إجمالي / خامل")}
                icon={Activity} iconBg="bg-info-bg" iconColor="text-info"
              />
              <KpiCard
                title={text("SSE Clients","عملاء الأحداث المباشرة")}
                value={sysHealth?.services?.sse?.connectedClients ?? "—"}
                sub={text("Live event streams","بث الأحداث المباشر")}
                icon={Radio} iconBg="bg-primary/10" iconColor="text-primary"
              />
            </div>

            {/* Service detail cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Database */}
              <Card>
                <CardHeader><Database className="w-4 h-4 text-primary"/><CardTitle>{text("Database","قاعدة البيانات")}</CardTitle>
                  <span className={`ms-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${sysHealth?.services?.database?.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                    {sysHealth?.services?.database?.ok ? "ONLINE" : "OFFLINE"}
                  </span>
                </CardHeader>
                <CardBody className="space-y-2 text-sm">
                  {[
                    [text("Latency","زمن الاستجابة"), `${sysHealth?.services?.database?.latencyMs ?? "—"}ms`],
                    [text("Threshold","الحد الأقصى"), `${sysHealth?.services?.database?.thresholdMs ?? "—"}ms`],
                    [text("Total connections","إجمالي الاتصالات"), sysHealth?.services?.database?.pool?.totalCount ?? "—"],
                    [text("Idle connections","الاتصالات الخاملة"), sysHealth?.services?.database?.pool?.idleCount ?? "—"],
                    [text("Waiting","في الانتظار"), sysHealth?.services?.database?.pool?.waitingCount ?? "—"],
                  ].map(([k,v])=>(
                    <div key={String(k)} className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground font-mono">{v}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {/* Audit */}
              <Card>
                <CardHeader><Shield className="w-4 h-4 text-info"/><CardTitle>{text("Audit Engine","محرك التدقيق")}</CardTitle>
                  <span className={`ms-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${(sysHealth?.services?.audit?.failureCount ?? 0) === 0 ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>
                    {(sysHealth?.services?.audit?.failureCount ?? 0) === 0 ? "HEALTHY" : "DEGRADED"}
                  </span>
                </CardHeader>
                <CardBody className="space-y-2 text-sm">
                  {[
                    [text("Total records","إجمالي السجلات"), (intelligence as IntelligenceData | undefined)?.auditRecords ?? "—"],
                    [text("Write failures","أخطاء الكتابة"), sysHealth?.services?.audit?.failureCount ?? "0"],
                    [text("Chain integrity","سلامة السلسلة"), (sysHealth?.services?.audit?.failureCount ?? 0) === 0 ? text("Intact","سليمة") : text("Check needed","تحتاج فحص")],
                    [text("Server uptime","وقت التشغيل"), sysHealth ? `${Math.floor((sysHealth.uptimeSeconds ?? 0) / 60)} min` : "—"],
                  ].map(([k,v])=>(
                    <div key={String(k)} className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground font-mono">{v}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {/* SSE */}
              <Card>
                <CardHeader><Radio className="w-4 h-4 text-primary"/><CardTitle>{text("Real-time Events","الأحداث المباشرة")}</CardTitle>
                  <span className="ms-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success">LIVE</span>
                </CardHeader>
                <CardBody className="space-y-2 text-sm">
                  {[
                    [text("Connected clients","العملاء المتصلون"), sysHealth?.services?.sse?.connectedClients ?? "—"],
                    [text("Messages sent","الرسائل المُرسَلة"), sysHealth?.services?.sse?.messagesSent ?? "—"],
                    [text("Write failures","أخطاء الإرسال"), sysHealth?.services?.sse?.writeFailureCount ?? "0"],
                    [text("Drain mode","وضع الاستنزاف"), sysHealth?.draining ? text("ACTIVE","نشط") : text("OFF","معطّل")],
                  ].map(([k,v])=>(
                    <div key={String(k)} className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground font-mono">{v}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>

            {!sysHealth && (
              <Card><CardBody className="py-10 text-center text-muted-foreground text-sm">{text("Loading system health…","جاري تحميل بيانات صحة النظام…")}</CardBody></Card>
            )}
          </div>
        </TabsContent>

        {/* ── AI Governance ─────────────────────────────────────── */}
        <TabsContent value="ai-gov">
          {(() => {
            const intel = intelligence as IntelligenceData | undefined;
            const urgency = intel?.urgencyBreakdown ?? {};
            const insights = intel?.policyInsights ?? [];
            const sysFlags = intel?.systemHealth ?? {};
            const total = intel?.totalDecisions ?? 0;
            const confidence = intel?.avgAiConfidence ?? 0;
            const critPts = intel?.criticalPatients ?? 0;
            const todayDec = intel?.aiDecisionsToday ?? 0;
            return (
              <div className="space-y-5">
                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard title={text("Total AI Decisions","إجمالي قرارات الذكاء")} value={total.toLocaleString()} sub={text("All time","منذ البداية")} icon={Brain} iconBg="bg-primary/10" iconColor="text-primary" />
                  <KpiCard title={text("Decisions Today","قرارات اليوم")} value={todayDec.toLocaleString()} sub={text("Since midnight","منذ منتصف الليل")} icon={Clock} iconBg="bg-info-bg" iconColor="text-info" />
                  <KpiCard title={text("Avg Confidence","متوسط الثقة")} value={`${confidence}%`} sub={text("AI model performance","أداء نموذج الذكاء")} icon={Target} iconBg="bg-success-bg" iconColor="text-success" />
                  <KpiCard title={text("Critical Patients","المرضى الحرجون")} value={critPts.toLocaleString()} sub={text("Score ≥ 70 — immediate action","نتيجة ≥ 70 — تدخل فوري")} icon={AlertTriangle} iconBg="bg-danger-bg" iconColor="text-danger" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Urgency breakdown */}
                  <Card>
                    <CardHeader><Zap className="w-4 h-4 text-warning"/><CardTitle>{text("Decision Urgency Breakdown","توزيع إلحاحية القرارات")}</CardTitle></CardHeader>
                    <CardBody className="space-y-3">
                      {[
                        { key:"immediate", label:text("Immediate","فوري"),   cls:"bg-danger-bg border-danger/20 text-danger" },
                        { key:"urgent",    label:text("Urgent","عاجل"),       cls:"bg-warning-bg border-warning/20 text-warning" },
                        { key:"soon",      label:text("Soon","قريباً"),       cls:"bg-info-bg border-info/20 text-info" },
                        { key:"routine",   label:text("Routine","روتيني"),    cls:"bg-success-bg border-success/20 text-success" },
                      ].map(({key,label,cls})=>{
                        const val = urgency[key] ?? 0;
                        const pct = total > 0 ? Math.round(val/total*100) : 0;
                        return (
                          <div key={key} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${cls}`}>
                            <span className="text-sm font-medium">{label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{pct}%</span>
                              <span className="text-lg font-bold">{val}</span>
                            </div>
                          </div>
                        );
                      })}
                    </CardBody>
                  </Card>

                  {/* System health flags + policy insights */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader><Server className="w-4 h-4 text-primary"/><CardTitle>{text("Engine Status","حالة المحركات")}</CardTitle></CardHeader>
                      <CardBody className="space-y-2">
                        {[
                          [text("Decision Engine","محرك القرار"), sysFlags.decisionEngine ?? "—"],
                          [text("Data Fabric","نسيج البيانات"), sysFlags.dataFabric ?? "—"],
                          [text("Audit Trail","مسار التدقيق"), sysFlags.auditTrail ?? "—"],
                        ].map(([k,v])=>(
                          <div key={String(k)} className="flex justify-between text-[13px]">
                            <span className="text-muted-foreground">{k}</span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${String(v)==="operational"||String(v)==="connected"||String(v)==="logging" ? "bg-success-bg text-success" : "bg-secondary text-muted-foreground"}`}>{v}</span>
                          </div>
                        ))}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader><Lightbulb className="w-4 h-4 text-warning"/><CardTitle>{text("Policy Insights","رؤى السياسة الصحية")}</CardTitle></CardHeader>
                      <CardBody className="space-y-2">
                        {insights.slice(0,3).map((ins: PolicyInsight, i: number)=>(
                          <div key={i} className="text-[13px] border-b border-border last:border-0 pb-2 last:pb-0">
                            <div className="flex items-start gap-2">
                              <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 ${ins.priority==="high"?"bg-danger-bg text-danger":ins.priority==="medium"?"bg-warning-bg text-warning":"bg-secondary text-muted-foreground"}`}>{ins.priority}</span>
                              <p className="text-foreground leading-snug">{ins.insight}</p>
                            </div>
                          </div>
                        ))}
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── Identity & Access Management (IAM) ─────────────────────────────────────── */}
        <TabsContent value="users">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <span className="truncate">{text("Identity & Access Management (IAM)", "إدارة الهوية والصلاحيات (IAM)")}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{text("Role-Based Access Control (RBAC) securely integrated with national ID systems.", "نظام إدارة صلاحيات آمن (RBAC) متصل مع أنظمة الهوية الوطنية.")}</p>
              </div>
              <button onClick={() => setShowAddUserModal(true)} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
                {text("+ Add User / Invite", "+ إضافة مستخدم / دعوة")}
              </button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="text-start text-[12px] font-semibold text-muted-foreground px-4 py-3">{text("Identity","الهوية")}</th>
                      <th className="text-start text-[12px] font-semibold text-muted-foreground px-4 py-3">{text("Permissions (RBAC)","الصلاحيات")}</th>
                      <th className="text-start text-[12px] font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">{text("Organization","المنظمة")}</th>
                      <th className="text-center text-[12px] font-semibold text-muted-foreground px-4 py-3">{text("Auth Status","حالة المصادقة")}</th>
                      <th className="text-center text-[12px] font-semibold text-muted-foreground px-4 py-3">{text("Security Action","إجراء أمني")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">{text("Loading users...", "جاري تحميل المستخدمين...")}</td></tr>
                    ) : (usersData?.length === 0 && DEMO_USERS.length === 0) ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">{text("No users found", "لا يوجد مستخدمين")}</td></tr>
                    ) : (usersData?.length > 0 ? usersData : DEMO_USERS).map((u: AdminUser) => {
                      const badge = ROLE_BADGE[u.role] ?? { label: u.role, labelAr: u.role, cls: "bg-secondary text-muted-foreground" };
                      // If it's a real user, status is active/revoked. Otherwise fallback to userEnabled map.
                      const enabled = u.status ? u.status === "active" : (userEnabled[u.id] ?? true);
                      return (
                        <tr key={u.id} className={`border-b border-border last:border-0 transition-colors ${!enabled ? "opacity-50" : "hover:bg-secondary/30"}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <UserCheck className="w-4 h-4 text-primary"/>
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-[13px]">{u.name}</p>
                                <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${badge.cls}`}>{locale === "ar" ? badge.labelAr : badge.label}</span>
                              {u.role === "admin" && <span className="text-[9px] text-muted-foreground font-mono">Full Access (Read/Write)</span>}
                              {u.role === "doctor" && <span className="text-[9px] text-muted-foreground font-mono">Clinical Access (PHI)</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-muted-foreground hidden md:table-cell">
                            <p className="font-medium text-foreground">{u.org || u.organization}</p>
                            <p className="text-[10px]">{u.title}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {enabled ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-success-bg border border-success/30 rounded-lg">
                                  <Shield className="w-3 h-3 text-success" />
                                  <span className="text-[10px] font-bold text-success">{text("Verified (JWT)","مُوثق (JWT)")}</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-danger-bg border border-danger/30 rounded-lg">
                                  <ShieldAlert className="w-3 h-3 text-danger" />
                                  <span className="text-[10px] font-bold text-danger">{text("Access Revoked","تم سحب الصلاحية")}</span>
                                </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (u.status) {
                                  statusMutation.mutate({ id: u.id, status: enabled ? "revoked" : "active" });
                                } else {
                                  setUserEnabled(prev => ({ ...prev, [u.id]: !prev[u.id] }));
                                }
                              }}
                              disabled={statusMutation.isPending}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${enabled ? "border-danger/30 text-danger hover:bg-danger-bg" : "border-success/30 text-success hover:bg-success-bg"} disabled:opacity-50`}
                            >
                              {enabled ? text("Revoke Token","سحب الصلاحية") : text("Restore Token","استعادة الصلاحية")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="bg-info-bg/50 border border-info/20 rounded-xl p-3 flex items-start gap-2">
               <Brain className="w-4 h-4 text-info shrink-0 mt-0.5" />
               <p className="text-[11px] text-info leading-relaxed">{text("SANAD Identity Management is actively monitoring all JWT tokens and OAuth providers. Unauthorized access attempts are automatically blocked by the AI Security Engine.", "تقوم إدارة هوية (سند) بمراقبة جميع رموز JWT ومزودي OAuth بنشاط. محاولات الوصول غير المصرح بها يتم حظرها تلقائياً بواسطة محرك الأمان الذكي.")}</p>
            </div>
          </div>
        </TabsContent>

        {/* ── Maintenance ───────────────────────────────────────── */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Reset Demo */}
            <Card>
              <CardHeader><RefreshCw className="w-4 h-4 text-warning"/><CardTitle>{text("Demo Environment","بيئة العرض")}</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <p className="text-sm text-muted-foreground">{text("Truncates all tables and re-seeds the Al-Ghamdi 7-scenario demo dataset. Takes ~20 seconds.","يحذف جميع البيانات ويعيد تهيئة مجموعة البيانات التجريبية. يستغرق ~20 ثانية.")}</p>
                <ul className="text-[12px] text-muted-foreground space-y-1">
                  <li>• {text("Restores 12 demo patients","يستعيد 12 مريضاً تجريبياً")}</li>
                  <li>• {text("Resets 7 clinical scenarios","يعيد ضبط 7 سيناريوهات سريرية")}</li>
                  <li>• {text("Clears manually added records","يحذف السجلات المضافة يدوياً")}</li>
                  <li>• {text("Blocked in production","محظور في بيئة الإنتاج")}</li>
                </ul>
                <button onClick={() => { setShowResetModal(true); setResetState("idle"); setResetMsg(""); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-warning text-white font-bold text-sm hover:bg-warning/90 transition-colors">
                  <RefreshCw className="w-4 h-4"/>
                  {text("Reset Demo Environment","إعادة تعيين بيئة العرض")}
                </button>
              </CardBody>
            </Card>

            {/* Export Audit Logs */}
            <Card>
              <CardHeader><Download className="w-4 h-4 text-info"/><CardTitle>{text("Audit Log Export","تصدير سجل التدقيق")}</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <p className="text-sm text-muted-foreground">{text("Downloads the complete Isnād audit chain as a CSV file. Up to 5,000 most recent entries.","تنزيل سلسلة التدقيق الكاملة كملف CSV. حتى 5000 إدخال حديث.")}</p>
                <ul className="text-[12px] text-muted-foreground space-y-1">
                  <li>• {text("Includes: action, role, patient, timestamp","يشمل: الإجراء، الدور، المريض، التوقيت")}</li>
                  <li>• {text("Format: CSV (UTF-8)","الصيغة: CSV (UTF-8)")}</li>
                  <li>• {text("Suitable for compliance review","مناسب لمراجعة الامتثال")}</li>
                </ul>
                <button onClick={handleExportLogs} disabled={exportingLogs}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-info text-white font-bold text-sm hover:bg-info/90 transition-colors disabled:opacity-60">
                  <Download className="w-4 h-4"/>
                  {exportingLogs ? text("Exporting…","جاري التصدير…") : text("Export Audit Logs (.csv)","تصدير سجل التدقيق (.csv)")}
                </button>
              </CardBody>
            </Card>

            {/* System Info */}
            <Card className="col-span-full lg:col-span-2">
              <CardHeader><Wrench className="w-4 h-4 text-muted-foreground"/><CardTitle>{text("System Information","معلومات النظام")}</CardTitle></CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    [text("API Version","إصدار الـ API"), sysHealth?.version ?? "—"],
                    [text("Build SHA","رقم البناء"), (sysHealth?.buildSha ?? "—").slice(0,8)],
                    [text("Migration","نسخة المخطط"), sysHealth?.migrationVersion ?? "—"],
                    [text("Environment","البيئة"), process?.env?.NODE_ENV ?? "development"],
                  ].map(([k,v])=>(
                    <div key={String(k)}>
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">{k}</p>
                      <p className="font-mono text-sm font-bold text-foreground">{v}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <AuditFeed />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceDashboard />
        </TabsContent>
      </Tabs>

      {/* Reset Demo Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { if (resetState !== "running") setShowResetModal(false); }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-warning" />
                <span className="font-bold text-foreground">{text("Reset Demo Environment", "إعادة تعيين بيئة العرض")}</span>
              </div>
              {resetState !== "running" && (
                <button onClick={() => setShowResetModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {resetState === "idle" && (
                <>
                  <div className="rounded-xl bg-warning-bg border border-warning/25 p-4 space-y-2">
                    <p className="text-sm font-semibold text-warning">{text("This will:", "هذا الإجراء سيقوم بـ:")}</p>
                    <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                      <li>{text("Delete all current patients, visits, labs, and medications", "حذف جميع المرضى والزيارات والنتائج والأدوية الحالية")}</li>
                      <li>{text("Re-run the Al-Ghamdi demo dataset (7 scenarios)", "إعادة تشغيل بيانات العرض (7 سيناريوهات)")}</li>
                      <li>{text("Reset all numeric IDs to their original values", "إعادة تعيين جميع المعرّفات لقيمها الأصلية")}</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">{text("This takes ~15–30 seconds. Do not close the window.", "يستغرق ~15-30 ثانية. لا تغلق النافذة.")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                      {text("Cancel", "إلغاء")}
                    </button>
                    <button onClick={handleResetDemo} className="flex-1 px-4 py-2.5 rounded-xl bg-warning text-white text-sm font-bold hover:bg-warning/90 transition-colors">
                      {text("Yes, Reset Demo", "نعم، إعادة التعيين")}
                    </button>
                  </div>
                </>
              )}

              {resetState === "running" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">{text("Resetting demo environment…", "جاري إعادة تعيين بيئة العرض…")}</p>
                  <p className="text-xs text-muted-foreground">{text("Truncating tables and re-seeding data. Please wait.", "حذف البيانات وإعادة البذر. يرجى الانتظار.")}</p>
                </div>
              )}

              {resetState === "done" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center">
                    <span className="text-2xl text-success">✓</span>
                  </div>
                  <p className="text-sm font-bold text-success">{text("Reset complete!", "اكتملت إعادة التعيين!")}</p>
                  <p className="text-xs text-muted-foreground">{text("Demo dataset restored. Al-Ghamdi scenarios are ready.", "بيانات العرض جاهزة. سيناريوهات الغامدي مُستعادة.")}</p>
                  <button onClick={() => setShowResetModal(false)} className="mt-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    {text("Close", "إغلاق")}
                  </button>
                </div>
              )}

              {resetState === "error" && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-danger-bg border border-danger/25 p-4">
                    <p className="text-sm font-semibold text-danger mb-1">{text("Reset failed", "فشلت إعادة التعيين")}</p>
                    <p className="text-xs text-foreground font-mono break-all">{resetMsg}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium">{text("Close", "إغلاق")}</button>
                    <button onClick={handleResetDemo} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">{text("Retry", "إعادة المحاولة")}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddUserModal(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground">{text("Add New User", "إضافة مستخدم جديد")}</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              addUserMutation.mutate(newUser);
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{text("Name", "الاسم")}</label>
                <input required value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{text("Username", "اسم المستخدم")}</label>
                  <input required value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{text("Password", "كلمة المرور")}</label>
                  <input required type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{text("Role", "الصلاحية")}</label>
                <select required value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
                  {Object.keys(ROLE_BADGE).map(role => (
                    <option key={role} value={role}>{locale === "ar" ? ROLE_BADGE[role].labelAr : ROLE_BADGE[role].label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{text("Organization", "المنظمة")}</label>
                  <input value={newUser.organization} onChange={e => setNewUser(p => ({ ...p, organization: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{text("Title", "المسمى الوظيفي")}</label>
                  <input value={newUser.title} onChange={e => setNewUser(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  {text("Cancel", "إلغاء")}
                </button>
                <button type="submit" disabled={addUserMutation.isPending} className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {addUserMutation.isPending ? text("Adding...", "جاري الإضافة...") : text("Save User", "حفظ المستخدم")}
                </button>
              </div>
              {addUserMutation.isError && (
                <p className="text-danger text-xs font-medium text-center">{text("Error creating user", "حدث خطأ أثناء إضافة المستخدم")}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
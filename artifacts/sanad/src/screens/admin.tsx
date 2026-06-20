import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { PageHeader, Card, CardHeader, CardTitle, CardBody, KpiCard, Badge, AlertBanner , SkeletonCard, ErrorBanner} from "@/components/shared";
import { useGetAdminStats, useGetPopulationHealth } from "@workspace/api-client-react";
import { useNationalIntelligence } from "@/hooks/use-ai-decision";
import { Users, Activity, ShieldAlert, Building, TrendingUp, AlertTriangle, PieChart as PieIcon, Globe, Brain, Zap, Radio, Lightbulb, Target, MapPin, Calendar, RefreshCw, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#5856D6", "#32ADE6", "#AF52DE"];
const RISK_COLORS = { Low: "#22c55e", Medium: "#f59e0b", High: "#f97316", Critical: "#ef4444" };

// KSA Region approximate SVG coordinates (simplified polygon centroids)
const KSA_REGIONS: Record<string, { cx: number; cy: number; label: string; r: number }> = {
  "Riyadh":           { cx: 300, cy: 210, label: "Riyadh",           r: 28 },
  "Makkah":           { cx: 140, cy: 250, label: "Makkah",           r: 24 },
  "Eastern Province": { cx: 400, cy: 170, label: "Eastern",          r: 22 },
  "Madinah":          { cx: 165, cy: 185, label: "Madinah",          r: 18 },
  "Asir":             { cx: 175, cy: 320, label: "Asir",             r: 16 },
  "Qassim":           { cx: 265, cy: 155, label: "Qassim",           r: 15 },
  "Jazan":            { cx: 148, cy: 370, label: "Jazan",            r: 14 },
  "Hail":             { cx: 240, cy: 115, label: "Hail",             r: 13 },
  "Tabuk":            { cx: 130, cy: 110, label: "Tabuk",            r: 13 },
  "Najran":           { cx: 240, cy: 370, label: "Najran",           r: 12 },
  "Al Bahah":         { cx: 170, cy: 295, label: "Al Bahah",         r: 10 },
  "Al Jouf":          { cx: 215, cy: 65,  label: "Al Jouf",          r: 10 },
  "Northern Borders": { cx: 265, cy: 48,  label: "N. Borders",       r: 10 },
};

const RISK_FILL: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#f59e0b",
  low:      "#22c55e",
};

function KSAHeatmap({ regions }: { regions: any[] }) {
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
          const fill = RISK_FILL[data.riskLevel] ?? "#94a3b8";
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
                {pos.label}
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

async function fetchAppointmentsSummary() {
  const res = await apiFetch("/api/appointments/all?limit=100");
  if (!res.ok) return { appointments: [] };
  return res.json();
}

export default function AdminDashboard() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const { data: statsRaw, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStats();
  const { data: popHealth, isLoading: healthLoading } = useGetPopulationHealth();
  const { data: intelligence } = useNationalIntelligence();
  const { data: apptData } = useQuery({ queryKey: ["admin-appointments"], queryFn: fetchAppointmentsSummary, refetchInterval: 60000 });

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [resetMsg, setResetMsg] = useState("");

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

  const stats = statsRaw as Record<string, any>;

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

  const appointments = apptData?.appointments ?? [];
  const upcomingAppts = appointments.filter((a: any) => a.status === "confirmed").slice(0, 6);

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

      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={text("Ministry of Health — Analytics Command Center", "وزارة الصحة — مركز قيادة التحليلات")}
          subtitle={text("Real-time national infrastructure metrics and population health intelligence.", "مؤشّرات البنية التحتية الوطنية الفورية وذكاء صحة السكان.")}
        />
        <div className="flex items-center gap-2 shrink-0 ms-4">
          <span className="text-xs font-mono bg-card border border-border rounded-xl px-3 py-2 text-muted-foreground" dir="ltr">
            {new Date().toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" })}
          </span>
          <button
            onClick={() => { setShowResetModal(true); setResetState("idle"); setResetMsg(""); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-warning/50 hover:bg-warning-bg transition-colors"
            title={text("Reset Demo Environment", "إعادة تعيين بيئة العرض")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {text("Reset Demo", "إعادة العرض")}
          </button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" dir={dir}>
        <div className="mb-6">
          <TabsList>
            <TabsTrigger value="dashboard">{text("Dashboard", "لوحة القيادة")}</TabsTrigger>
            <TabsTrigger value="audit">{text("Audit Trail", "سجل التدقيق")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">

      {/* KPI Row */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard title={text("Registered Patients", "المرضى المسجّلون")} value={(stats.totalPatients ?? 0).toLocaleString()} sub={text("Active national records", "سجلات وطنية نشطة")} icon={Users} iconBg="bg-primary/10" iconColor="text-primary" />
          <KpiCard title={text("Visits Today", "زيارات اليوم")} value={(stats.totalVisitsToday ?? 0).toLocaleString()} sub={text("Across all facilities", "في جميع المنشآت")} icon={Activity} iconBg="bg-info-bg" iconColor="text-info" />
          <KpiCard title={text("Drug Conflicts Prevented", "تداخلات دوائية مُنعت")} value={(stats.drugInteractionsBlocked ?? 0).toLocaleString()} sub={text("Blocked by interaction screening", "حُجبت عبر فحص التداخلات")} icon={ShieldAlert} iconBg="bg-success-bg" iconColor="text-success" />
          <KpiCard title={text("AI Decisions Made", "قرارات الذكاء الاصطناعي")} value={(stats.aiDecisionsMade ?? 0).toLocaleString()} sub={text(`${(stats.activeAlerts ?? 0).toLocaleString()} active alerts`, `${(stats.activeAlerts ?? 0).toLocaleString()} تنبيه نشط`)} icon={Building} iconBg="bg-violet-100" iconColor="text-violet-600" />
        </div>
      )}

      {/* Charts Grid */}
      {popHealth && (
        <div className="grid grid-cols-12 gap-5">

          {/* Monthly Trend */}
          <Card className="col-span-8">
            <CardHeader>
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><CardTitle>{text("Monthly Visit Trend", "اتجاه الزيارات الشهري")}</CardTitle></div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-3 h-0.5 bg-primary inline-block rounded-full" /> {text("Total Visits", "إجمالي الزيارات")}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-3 h-0.5 bg-destructive inline-block rounded-full" /> {text("Emergency", "الطوارئ")}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={popHealth.monthlyVisitTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Line type="monotone" dataKey="visits" stroke="#007AFF" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="emergency" stroke="#FF3B30" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Blood Type Pie */}
          <Card className="col-span-4">
            <CardHeader><CardTitle>{text("Blood Type Distribution", "توزيع فصائل الدم")}</CardTitle></CardHeader>
            <CardBody>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={popHealth.bloodTypeDistribution} innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="count" nameKey="bloodType">
                      {popHealth.bloodTypeDistribution.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 mt-1">
                {popHealth.bloodTypeDistribution.map((d: any, i: number) => (
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
            <Card className="col-span-7">
              <CardHeader>
                <MapPin className="w-4 h-4 text-primary" />
                <CardTitle>{text("National Risk Heatmap — KSA", "خريطة الخطورة الوطنية — المملكة")}</CardTitle>
                <Badge variant="outline" className="ms-auto text-[10px]">
                  {text(`${stats.regionalStats.filter((r: any) => r.riskLevel === "critical").length} critical regions`, `${stats.regionalStats.filter((r: any) => r.riskLevel === "critical").length} مناطق حرجة`)}
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
          <Card className="col-span-5">
            <CardHeader>
              <CardTitle>{text("Top Chronic Conditions", "أبرز الأمراض المزمنة")}</CardTitle>
              <Badge variant="default">{text(`${popHealth.conditionBreakdown?.length} tracked`, `${popHealth.conditionBreakdown?.length} متابَع`)}</Badge>
            </CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popHealth.conditionBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 140, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="condition" type="category" axisLine={false} tickLine={false} tick={{ fill: "#374151", fontSize: 11, fontWeight: 500 }} width={130} />
                    <RechartsTooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#007AFF" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Age Distribution */}
          <Card className="col-span-6">
            <CardHeader><CardTitle>{text("Population Age Distribution", "التوزيع العمري للسكان")}</CardTitle></CardHeader>
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popHealth.ageDistribution} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <RechartsTooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#007AFF" radius={[6, 6, 0, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Risk Distribution */}
          {stats?.riskDistribution && (
            <Card className="col-span-6">
              <CardHeader>
                <div className="flex items-center gap-2"><PieIcon className="w-4 h-4 text-risk-high" /><CardTitle>{text("Patient Risk Distribution", "توزيع خطورة المرضى")}</CardTitle></div>
                <Badge variant="warning">{text(`${stats.highRiskPatients} high/critical`, `${stats.highRiskPatients} مرتفعة/حرجة`)}</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.riskDistribution} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="level"
                        label={({ level, percent }) => percent > 0.05 ? `${level} ${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                        {stats.riskDistribution.map((entry: any, i: number) => (
                          <Cell key={i} fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any, name: any) => [`${value} patients`, name]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {stats.riskDistribution.map((d: any, i: number) => (
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
                <Badge variant="info" className="ms-auto">{text(`${appointments.filter((a: any) => a.status === "confirmed").length} total`, `${appointments.filter((a: any) => a.status === "confirmed").length} الإجمالي`)}</Badge>
              </CardHeader>
              <table className="w-full data-table">
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
                  {upcomingAppts.map((a: any, i: number) => (
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
              </table>
            </Card>
          )}

          {/* National Intelligence Panel */}
          {intelligence && (
            <Card className="col-span-12">
              <CardHeader>
                <Brain className="w-4 h-4 text-violet-600" />
                <CardTitle>{text("National AI Intelligence Platform", "منصّة الذكاء الاصطناعي الوطنية")}</CardTitle>
                <Badge variant="outline" className="ms-auto">{text("LIVE · v3.0", "مباشر · v3.0")}</Badge>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* AI Engine Status */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-risk-high" /> {text("AI Engine Cluster — 9 Active Engines", "عنقود محرّكات الذكاء — 9 محرّكات نشطة")}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
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
                {((intelligence as Record<string, any>))?.epidemicRadar && ((intelligence as Record<string, any>)).epidemicRadar.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-danger" /> {text("Epidemic Radar — Disease Surveillance", "رادار الأوبئة — ترصّد الأمراض")}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {((intelligence as Record<string, any>)).epidemicRadar.map((item: any, i: number) => (
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
                {((intelligence as Record<string, any>))?.policyInsights && ((intelligence as Record<string, any>)).policyInsights.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-violet-500" /> {text("AI Policy Intelligence Recommendations", "توصيات ذكاء السياسات الصحية")}
                    </p>
                    <div className="space-y-2">
                      {((intelligence as Record<string, any>)).policyInsights.map((insight: any, i: number) => (
                        <div key={i} className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${insight.priority === "high" ? "bg-violet-50 border-violet-200" : "bg-secondary border-border"}`}>
                          <Target className="w-4 h-4 shrink-0 mt-0.5 text-violet-600" />
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
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: text("AI Decisions Today", "قرارات اليوم"), value: ((intelligence as Record<string, any>))?.aiDecisionsToday ?? "0", icon: Brain },
                    { label: text("Event Bus Throughput", "إنتاجية ناقل الأحداث"), value: ((intelligence as Record<string, any>))?.eventBusThroughput ?? "—", icon: Zap },
                    { label: text("Audit Records", "سجلات التدقيق"), value: ((intelligence as Record<string, any>))?.auditRecords ?? "0", icon: Target },
                    { label: text("Avg Response Time", "متوسط زمن الاستجابة"), value: ((intelligence as Record<string, any>))?.avgResponseMs ? `${((intelligence as Record<string, any>)).avgResponseMs}ms` : "—", icon: Activity },
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
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Population</th>
                    <th>Total Patients</th>
                    <th>Hospitals</th>
                    <th>High Risk</th>
                    <th>Risk Rate</th>
                    <th>Network Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.regionalStats.map((r: any, i: number) => (
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
              </table>
            </Card>
          )}
        </div>
      )}
        </TabsContent>

        <TabsContent value="audit">
          <AuditFeed />
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
    </Layout>
  );
}
import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardBody, Badge, PageHeader, KpiCard , SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  Brain, Activity, AlertTriangle, CheckCircle2, Zap, TrendingUp,
  RefreshCw, RotateCcw, Shield, Cpu, Database, Clock, Settings, BarChart2,
  Layers, Eye, AlertCircle, GitBranch, ChevronRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area, Legend
} from "recharts";

async function fetchMetrics() {
  const res = await apiFetch("/api/ai-control/metrics");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
async function fetchDrift() {
  const res = await apiFetch("/api/ai-control/drift-analysis");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
async function fetchRetrainingJobs() {
  const res = await apiFetch("/api/ai-control/retraining/jobs");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; badge: any; dot: string }> = {
  operational: { bg: "bg-success-bg", text: "text-success", border: "border-success/30", badge: "success" as const, dot: "bg-success" },
  degraded: { bg: "bg-risk-high-bg", text: "text-risk-high", border: "border-risk-high/20", badge: "warning" as const, dot: "bg-risk-high animate-pulse" },
  drift_detected: { bg: "bg-danger-bg", text: "text-danger", border: "border-danger/30", badge: "destructive" as const, dot: "bg-danger animate-pulse" },
  monitoring: { bg: "bg-info-bg", text: "text-info", border: "border-info/30", badge: "info" as const, dot: "bg-info" },
  stable: { bg: "bg-success-bg", text: "text-success", border: "border-success/30", badge: "success" as const, dot: "bg-success" },
  needs_retraining: { bg: "bg-danger-bg", text: "text-danger", border: "border-danger/30", badge: "destructive" as const, dot: "bg-danger animate-pulse" },
};

type ViewTab = "overview" | "engines" | "drift" | "retraining" | "decisions" | "settings";

export default function AIControlCenter() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [retrainingTarget, setRetrainingTarget] = useState<string | null>(null);
  const [retrainResult, setRetrainResult] = useState<Record<string, any>>({});
  const [newJobForm, setNewJobForm] = useState(false);
  const [newJobModel, setNewJobModel] = useState("");
  const [newJobReason, setNewJobReason] = useState("");

  const qc = useQueryClient();

  const { data: metrics, isLoading: loadingMetrics } = useQuery({ queryKey: ["ai-metrics"], queryFn: fetchMetrics, refetchInterval: 30000 });
  const { data: drift, isLoading: loadingDrift } = useQuery({ queryKey: ["ai-drift"], queryFn: fetchDrift, refetchInterval: 30000 });
  const { data: jobs } = useQuery({ queryKey: ["retraining-jobs-new"], queryFn: async () => apiFetch("/api/ai-control/retrain-jobs").then(r => r.json()), refetchInterval: 5000 });
  const { data: featureData } = useQuery({ queryKey: ["ai-features"], queryFn: async () => apiFetch("/api/ai-control/features").then(r => r.json()), refetchInterval: 5000 });

  const featureToggles = featureData?.features ?? {};

  const retrainMutation = useMutation({
    mutationFn: async (engineName: string) => {
      const res = await apiFetch(`/api/ai-control/engines/${encodeURIComponent(engineName)}/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: "Dr. Khalid Al-Mansouri — AI Control Center" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (result, engineName) => {
      setRetrainResult(prev => ({ ...prev, [engineName]: result }));
      setRetrainingTarget(null);
      qc.invalidateQueries({ queryKey: ["retraining-jobs-new"] });
    },
  });

  const queueRetrainMutation = useMutation({
    mutationFn: async ({ model, reason }: { model: string; reason: string }) => {
      const res = await apiFetch("/api/ai-control/retrain-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, reason }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setNewJobForm(false);
      setNewJobModel("");
      setNewJobReason("");
      qc.invalidateQueries({ queryKey: ["retraining-jobs-new"] });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ feature, enabled }: { feature: string; enabled: boolean }) => {
      const res = await apiFetch(`/api/ai-control/features/${feature}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-features"] });
    },
  });

  const isLoading = loadingMetrics || loadingDrift;

  if (isLoading) {
    return (
      <Layout role="ai-control" localized>
        <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-danger" />
          <span className="text-sm font-medium">{text("Connecting to AI Control Bus...", "جارٍ الاتصال بناقل التحكم بالذكاء الاصطناعي...")}</span>
        </div>
      </Layout>
    );
  }

  const TABS: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: text("System Overview", "نظرة عامة"), icon: Layers },
    { id: "engines", label: text("Engine Monitor", "مراقبة المحركات"), icon: Cpu },
    { id: "drift", label: text("Drift Detection", "كشف الانحراف"), icon: GitBranch },
    { id: "retraining", label: text("Retraining Panel", "إعادة التدريب"), icon: RotateCcw },
    { id: "decisions", label: text("Decision Analysis", "تحليل القرارات"), icon: BarChart2 },
    { id: "settings", label: text("Control Panel", "لوحة التحكم"), icon: Settings },
  ];

  const driftEngines = drift?.engines ?? [];
  const driftDetected = driftEngines.filter((e: any) => e.status === "drift_detected");

  return (
    <Layout role="ai-control" localized>
      {/* Priority Strip */}
      {driftDetected.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-danger text-white rounded-2xl mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest">
            {text("DRIFT DETECTED", "تم رصد انحراف")} — {text(`${driftDetected.length} engine${driftDetected.length > 1 ? "s" : ""} ${driftDetected.length > 1 ? "require" : "requires"} retraining:`, `${driftDetected.length} ${driftDetected.length > 1 ? "محركات تتطلب" : "محرك يتطلب"} إعادة تدريب:`)}{" "}
            {driftDetected.map((e: any) => e.engine).join(" · ")}
          </p>
          <button
            onClick={() => setActiveTab("drift")}
            className="ms-auto text-[11px] font-bold bg-card/20 hover:bg-card/30 px-3 py-1 rounded-full transition-colors"
          >
            {text("View Drift Analysis →", "عرض تحليل الانحراف ←")}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-danger text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest">
          <Brain className="w-3 h-3" />
          {text("AI Control Center", "مركز التحكم بالذكاء")}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success-bg px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {text(`${metrics?.engines?.filter((e: any) => e.status === "operational").length} / ${metrics?.engines?.length} engines operational`, `${metrics?.engines?.filter((e: any) => e.status === "operational").length} / ${metrics?.engines?.length} محرك يعمل`)}
        </div>
        <div className="ms-auto font-mono text-[11px] text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-full" dir={dir}>
          {text("Uptime", "التشغيل")} {metrics?.systemHealth?.uptime} · {text("Last retrain:", "آخر تدريب:")} {metrics?.systemHealth?.lastRetraining}
        </div>
      </div>

      <PageHeader
        title={text("AI Governance & Control Center", "مركز حوكمة الذكاء الاصطناعي والتحكم")}
        subtitle={text("9-engine real-time monitor · Model drift detection · Retraining orchestration · Decision audit trail", "مراقبة فورية لـ 9 محركات · كشف انحراف النماذج · تنظيم إعادة التدريب · سجل تدقيق القرارات")}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          title={text("Model Confidence", "ثقة النموذج")} value={`${metrics?.avgConfidence}%`}
          sub={metrics?.modelStatus === "optimal" ? text("Optimal performance", "أداء مثالي") : metrics?.modelStatus === "needs_retraining" ? text("Retraining required", "يتطلب إعادة تدريب") : text(`Status: ${metrics?.modelStatus}`, `الحالة: ${metrics?.modelStatus}`)}
          icon={Brain} iconBg="bg-danger-bg" iconColor="text-danger"
        />
        <KpiCard
          title={text("Drift Risk", "خطر الانحراف")} value={`${metrics?.driftRisk}%`}
          sub={text(`${metrics?.lowConfidenceCount} low-confidence decisions`, `${metrics?.lowConfidenceCount} قرار منخفض الثقة`)}
          icon={AlertCircle} iconBg={metrics?.driftRisk > 10 ? "bg-danger-bg" : "bg-success-bg"} iconColor={metrics?.driftRisk > 10 ? "text-danger" : "text-success"}
        />
        <KpiCard
          title={text("Total AI Decisions", "إجمالي قرارات الذكاء")} value={metrics?.totalDecisions?.toLocaleString()}
          sub={text(`${metrics?.decisionsLast24h} in last 24 hours`, `${metrics?.decisionsLast24h} خلال 24 ساعة`)}
          icon={Zap} iconBg="bg-risk-high-bg" iconColor="text-risk-high"
        />
        <KpiCard
          title={text("Audit Records", "سجلات التدقيق")} value={metrics?.auditRecords?.toLocaleString()}
          sub={text("Fully traceable · Tamper-evident", "قابلة للتتبّع · مقاومة للتلاعب")}
          icon={Shield} iconBg="bg-primary/10" iconColor="text-primary"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
              {tab.id === "drift" && driftDetected.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {driftDetected.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader><Cpu className="w-4 h-4 text-primary" /><CardTitle>{text("Platform Health", "صحة المنصّة")}</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                {[
                  { label: text("Model Confidence", "ثقة النموذج"), value: metrics?.avgConfidence, unit: "%", color: "bg-info" },
                  { label: text("Engine Availability", "توافر المحركات"), value: metrics?.engines?.length ? Math.round((metrics.engines.filter((e: any) => e.status === "operational").length / metrics.engines.length) * 100) : undefined, unit: "%", color: "bg-success" },
                  { label: text("Drift Headroom", "هامش الانحراف"), value: metrics?.driftRisk != null ? Math.max(0, 100 - Math.round(metrics.driftRisk)) : undefined, unit: "%", color: "bg-violet-500" },
                  { label: text("Memory Utilization", "استخدام الذاكرة"), value: metrics?.systemHealth?.memoryUsedPct, unit: "%", color: "bg-teal-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-bold text-foreground">{item.value}{item.unit}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(Number(item.value) || 0, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: text("Immediate", "فوري"), value: metrics?.urgencyBreakdown?.immediate, color: "text-danger", bg: "bg-danger-bg" },
                    { label: text("Urgent", "عاجل"), value: metrics?.urgencyBreakdown?.urgent, color: "text-risk-high", bg: "bg-risk-high-bg" },
                    { label: text("Soon", "قريب"), value: metrics?.urgencyBreakdown?.soon, color: "text-info", bg: "bg-info-bg" },
                    { label: text("Routine", "روتيني"), value: metrics?.urgencyBreakdown?.routine, color: "text-success", bg: "bg-success-bg" },
                  ].map((u, i) => (
                    <div key={i} className={`${u.bg} rounded-xl px-3 py-2 text-center`}>
                      <p className={`text-lg font-bold ${u.color}`}>{u.value}</p>
                      <p className="text-[10px] text-muted-foreground">{u.label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <Activity className="w-4 h-4 text-danger" />
                <CardTitle>{text("Model Confidence History — 12 Months", "سجل ثقة النموذج — 12 شهرًا")}</CardTitle>
                <span className="ms-auto text-[11px] font-mono text-muted-foreground">{text("Target: ≥85%", "المستهدف: ≥85%")}</span>
              </CardHeader>
              <CardBody>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.confidenceHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                      <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} unit="%" />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} formatter={(v: any) => [`${v}%`, text("Confidence", "الثقة")]} />
                      <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: text("85% Target", "المستهدف 85%"), fill: "#ef4444", fontSize: 10 }} />
                      <Area type="monotone" dataKey="confidence" stroke="#007AFF" fill="url(#confGrad)" strokeWidth={2.5} dot={{ fill: "#007AFF", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <Layers className="w-4 h-4 text-primary" />
              <CardTitle>{text("9-Engine Quick Status", "حالة المحركات التسعة")}</CardTitle>
              <Badge variant={driftDetected.length > 0 ? "destructive" : "success"}>
                {driftDetected.length > 0 ? text(`${driftDetected.length} Drift Alerts`, `${driftDetected.length} تنبيه انحراف`) : text("All Engines Nominal", "جميع المحركات سليمة")}
              </Badge>
            </CardHeader>
            <div className="divide-y divide-border">
              {metrics?.engines?.map((engine: any, i: number) => {
                const driftInfo = driftEngines.find((d: any) => d.engine === engine.name);
                const hasDrift = driftInfo?.status === "drift_detected";
                const statusCfg = STATUS_COLORS[hasDrift ? "drift_detected" : engine.status] ?? STATUS_COLORS.operational;
                return (
                  <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${hasDrift ? "bg-destructive/10/30" : ""}`}>
                    <div className={`w-2 h-2 rounded-full ${statusCfg.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{engine.name}</p>
                      <p className="text-xs text-muted-foreground">{engine.version} · {text(`${engine.requests?.toLocaleString()} requests`, `${engine.requests?.toLocaleString()} طلب`)} · {text(`avg ${engine.avgLatencyMs}ms`, `متوسط ${engine.avgLatencyMs} مل.ث`)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-secondary rounded-full h-1.5">
                        <div className="h-full rounded-full bg-success" style={{ width: `${engine.accuracy}%` }} />
                      </div>
                      <span className="text-xs font-bold text-foreground w-8">{engine.accuracy}%</span>
                      {driftInfo && (
                        <span className={`text-[10px] font-bold ${driftInfo.driftScore > 5 ? "text-danger bg-danger-bg border-danger/30" : driftInfo.driftScore > 3 ? "text-risk-high bg-risk-high-bg border-risk-high/20" : "text-success bg-success-bg border-success/30"} px-2 py-0.5 rounded-full border`}>
                          {text("Drift:", "انحراف:")} {driftInfo.driftScore}<span className="opacity-50">/10</span>
                        </span>
                      )}
                      <Badge variant={statusCfg.badge} className="text-[9px] shrink-0">{hasDrift ? text("Drift", "انحراف") : engine.status === "operational" ? text("operational", "يعمل") : engine.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─── ENGINE MONITOR ─── */}
      {activeTab === "engines" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {metrics?.engines?.map((engine: any, i: number) => {
              const driftInfo = driftEngines.find((d: any) => d.engine === engine.name);
              const hasDrift = driftInfo?.status === "drift_detected";
              const isMonitoring = driftInfo?.status === "monitoring";
              const statusCfg = STATUS_COLORS[hasDrift ? "drift_detected" : isMonitoring ? "monitoring" : engine.status] ?? STATUS_COLORS.operational;
              return (
                <Card key={i} className={`border ${statusCfg.border}`}>
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                          <Badge variant={statusCfg.badge} className="text-[9px]">{hasDrift ? text("Drift Detected", "انحراف مُكتشف") : isMonitoring ? text("Monitoring", "قيد المراقبة") : engine.status === "operational" ? text("operational", "يعمل") : engine.status}</Badge>
                        </div>
                        <p className="text-sm font-bold text-foreground">{engine.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{engine.version}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-2xl font-bold text-primary" dir="ltr">{engine.accuracy}%</p>
                        <p className="text-[10px] text-muted-foreground">{text("Accuracy", "الدقّة")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-secondary px-2.5 py-2 rounded-xl text-center">
                        <p className="text-sm font-bold text-foreground">{engine.requests?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{text("Requests", "الطلبات")}</p>
                      </div>
                      <div className="bg-secondary px-2.5 py-2 rounded-xl text-center">
                        <p className="text-sm font-bold text-foreground" dir="ltr">{engine.avgLatencyMs}ms</p>
                        <p className="text-[10px] text-muted-foreground">{text("Avg Latency", "متوسط الكمون")}</p>
                      </div>
                    </div>
                    {driftInfo && (
                      <div className={`${statusCfg.bg} border ${statusCfg.border} rounded-xl px-3 py-2 mb-3`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{text("Drift Score", "درجة الانحراف")}</span>
                          <span className={`text-xs font-bold ${hasDrift ? "text-danger" : "text-success"}`} dir="ltr">{driftInfo.driftScore} / {driftInfo.threshold}</span>
                        </div>
                        <div className="mt-1.5 w-full bg-card/60 rounded-full h-1.5">
                          <div className={`h-full rounded-full ${hasDrift ? "bg-danger" : isMonitoring ? "bg-risk-high" : "bg-success"}`} style={{ width: `${Math.min((driftInfo.driftScore / driftInfo.threshold) * 100, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {hasDrift && (
                      <button
                        onClick={() => { setRetrainingTarget(engine.name); retrainMutation.mutate(engine.name); }}
                        disabled={retrainMutation.isPending}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-danger hover:bg-danger text-white py-2 rounded-xl transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {retrainResult[engine.name] ? text("Retraining Queued ✓", "أُدرج للتدريب ✓") : text("Trigger Retraining", "بدء إعادة التدريب")}
                      </button>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader><BarChart2 className="w-4 h-4 text-primary" /><CardTitle>{text("Event Type Distribution", "توزيع أنواع الأحداث")}</CardTitle></CardHeader>
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.eventTypes?.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 170, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{ fill: "#374151", fontSize: 10, fontWeight: 500 }} width={165} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#007AFF" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── DRIFT DETECTION ─── */}
      {activeTab === "drift" && (
        <div className="space-y-5">
          {driftDetected.length > 0 && (
            <div className="space-y-3">
              {driftDetected.map((engine: any, i: number) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 bg-danger-bg border-2 border-danger/30 rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-danger">{text("DRIFT DETECTED:", "تم رصد انحراف:")} {engine.engine}</p>
                    <p className="text-xs text-danger mt-0.5">{text(`Drift score ${engine.driftScore} exceeds threshold ${engine.threshold} — Model predictions may be unreliable`, `درجة الانحراف ${engine.driftScore} تتجاوز الحدّ ${engine.threshold} — قد تكون تنبؤات النموذج غير موثوقة`)}</p>
                  </div>
                  <button
                    onClick={() => { setRetrainingTarget(engine.engine); retrainMutation.mutate(engine.engine); }}
                    disabled={retrainMutation.isPending}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-danger hover:bg-danger text-white px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {text("Retrain Now", "إعادة التدريب الآن")}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3 bg-secondary border border-border rounded-2xl">
            <Brain className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{text("Drift Analysis", "تحليل الانحراف")}</span> · {text(`${drift?.summary?.stable} stable`, `${drift?.summary?.stable} مستقر`)} · {text(`${drift?.summary?.driftDetected} drift detected`, `${drift?.summary?.driftDetected} انحراف`)} · {text(`${drift?.summary?.monitoring} monitoring`, `${drift?.summary?.monitoring} قيد المراقبة`)} · {text(`Threshold: ${driftEngines[0]?.threshold ?? 5.0}`, `الحدّ: ${driftEngines[0]?.threshold ?? 5.0}`)}
            </p>
          </div>

          <Card>
            <CardHeader>
              <GitBranch className="w-4 h-4 text-danger" />
              <CardTitle>{text("Drift Score by Engine", "درجة الانحراف لكل محرك")}</CardTitle>
              <span className="ms-auto font-mono text-[11px] text-muted-foreground">{text("Alert threshold: 5.0", "حدّ التنبيه: 5.0")}</span>
            </CardHeader>
            <CardBody>
              <div className="space-y-2.5">
                {[...driftEngines].sort((a: any, b: any) => b.driftScore - a.driftScore).map((engine: any, i: number) => {
                  const pct = (engine.driftScore / 10) * 100;
                  const color = engine.driftScore > 5 ? "bg-danger" : engine.driftScore > 3 ? "bg-risk-high" : "bg-success";
                  const textColor = engine.driftScore > 5 ? "text-danger" : engine.driftScore > 3 ? "text-risk-high" : "text-success";
                  const bg = engine.driftScore > 5 ? "bg-danger-bg border-danger/30" : engine.driftScore > 3 ? "bg-risk-high-bg border-risk-high/20" : "bg-secondary border-border";
                  const statusCfg = STATUS_COLORS[engine.status] ?? STATUS_COLORS.stable;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border ${bg}`}>
                      <div className={`w-2 h-2 rounded-full ${statusCfg.dot} shrink-0`} />
                      <span className="text-xs font-medium text-foreground w-44 truncate shrink-0">{engine.engine}</span>
                      <div className="flex-1 bg-card/60 rounded-full h-2">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${textColor}`}>{engine.driftScore}</span>
                      <Badge variant={statusCfg.badge} className="text-[9px] w-28 justify-center shrink-0">{engine.status === "drift_detected" ? text("drift detected", "انحراف") : engine.status === "monitoring" ? text("monitoring", "مراقبة") : engine.status === "stable" ? text("stable", "مستقر") : engine.status.replace("_", " ")}</Badge>
                      {engine.driftScore > 5 && (
                        <button
                          onClick={() => { setRetrainingTarget(engine.engine); retrainMutation.mutate(engine.engine); }}
                          disabled={retrainMutation.isPending}
                          className="text-[10px] font-bold text-white bg-danger hover:bg-danger px-2.5 py-1 rounded-lg transition-colors shrink-0"
                        >
                          {text("Retrain", "تدريب")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><Eye className="w-4 h-4 text-primary" /><CardTitle>{text("Drift Root Cause Analysis", "تحليل الأسباب الجذرية للانحراف")}</CardTitle><Badge variant="info">{text("AI Generated", "مُولّد بالذكاء")}</Badge></CardHeader>
            <CardBody className="space-y-3">
              {[
                { engine: "Digital Twin Simulator", score: 6.8, cause: text("Population diabetes prevalence increased 9% since last training — simulator underestimating complication trajectories", "ارتفع معدّل انتشار السكري بين السكان 9% منذ آخر تدريب — المحاكي يقلّل من تقدير مسارات المضاعفات"), action: text("Retrain with Q4 2025 population data and updated HbA1c progression rates", "إعادة التدريب ببيانات سكان الربع الرابع 2025 ومعدّلات تطوّر HbA1c المحدّثة") },
                { engine: "Behavioral AI", score: 7.2, cause: text("Ramadan seasonal behavior patterns not captured in training data — medication adherence model degraded for observant patient cohort", "أنماط سلوك رمضان الموسمية غير مُمثّلة في بيانات التدريب — تراجَع نموذج الالتزام الدوائي لفئة المرضى الصائمين"), action: text("Augment training data with seasonal behavioral patterns; implement time-aware feature engineering", "إثراء بيانات التدريب بالأنماط السلوكية الموسمية؛ تطبيق هندسة سمات مدركة للزمن") },
                { engine: "Policy AI", score: 4.1, cause: text("MOH Circular 47/1445 introduced new screening protocols not reflected in current policy ruleset — minor policy drift", "أدخل تعميم وزارة الصحة 47/1445 بروتوكولات فحص جديدة غير مُضمّنة في قواعد السياسة الحالية — انحراف طفيف"), action: text("Manual rule update + full retrain scheduled for March 2026 review cycle", "تحديث القواعد يدويًا + إعادة تدريب كاملة مجدولة لدورة مراجعة مارس 2026") },
              ].map((item, i) => (
                <div key={i} className={`px-4 py-3.5 rounded-2xl border ${item.score > 5 ? "bg-danger-bg border-danger/30" : "bg-risk-high-bg border-risk-high/20"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-bold text-foreground">{item.engine}</p>
                    <span className={`text-xs font-bold ${item.score > 5 ? "text-danger" : "text-risk-high"}`}>{text("Score:", "الدرجة:")} {item.score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2"><span className="font-semibold text-foreground">{text("Root cause:", "السبب الجذري:")}</span> {item.cause}</p>
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5 rtl:-scale-x-100" />
                    <span><span className="font-semibold text-foreground">{text("Action:", "الإجراء:")}</span> {item.action}</span>
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── RETRAINING PANEL ─── */}
      {activeTab === "retraining" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4 p-4 bg-secondary border border-border rounded-2xl">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{metrics?.systemHealth?.lastRetraining}</p>
              <p className="text-xs text-muted-foreground">{text("Last Retraining", "آخر إعادة تدريب")}</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-xl font-bold text-foreground">{metrics?.systemHealth?.nextScheduledReview}</p>
              <p className="text-xs text-muted-foreground">{text("Next Scheduled Review", "المراجعة المجدولة القادمة")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{jobs?.jobs?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">{text("Retraining Jobs This Session", "مهام التدريب بهذه الجلسة")}</p>
            </div>
          </div>

          <Card>
            <CardHeader><RotateCcw className="w-4 h-4 text-danger" /><CardTitle>{text("Manual Retraining Triggers", "مشغّلات إعادة التدريب اليدوية")}</CardTitle><Badge variant="warning">{text("Privileged Action · Logged", "إجراء مميّز · مُسجَّل")}</Badge></CardHeader>
            <div className="divide-y divide-border">
              {metrics?.engines?.map((engine: any, i: number) => {
                const driftInfo = driftEngines.find((d: any) => d.engine === engine.name);
                const hasDrift = driftInfo?.status === "drift_detected";
                const jobResult = retrainResult[engine.name];
                const isMonitoring = driftInfo?.status === "monitoring";
                return (
                  <div key={i} className={`flex items-center gap-4 px-5 py-4 ${hasDrift ? "bg-danger-bg" : ""}`}>
                    <div className={`w-2 h-2 rounded-full ${hasDrift ? "bg-danger animate-pulse" : isMonitoring ? "bg-risk-high" : "bg-success"} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{engine.name}</p>
                      <p className="text-xs text-muted-foreground">{engine.version} · {text("Accuracy:", "الدقّة:")} {engine.accuracy}% · {text("Drift:", "الإنحراف:")} {driftInfo?.driftScore ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasDrift && <Badge variant="destructive" className="text-[9px]">{text("Drift Detected", "انحراف مُكتشف")}</Badge>}
                      {isMonitoring && <Badge variant="warning" className="text-[9px]">{text("Monitoring", "قيد المراقبة")}</Badge>}
                      {jobResult ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {text("Queued:", "أُدرج:")} {jobResult.jobId}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setRetrainingTarget(engine.name); retrainMutation.mutate(engine.name); }}
                          disabled={retrainMutation.isPending}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                            hasDrift ? "bg-danger hover:bg-danger text-white" : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-black/[0.06]"
                          }`}
                        >
                          <RotateCcw className="w-3 h-3" />
                          {retrainingTarget === engine.name && retrainMutation.isPending ? text("Queuing...", "جارٍ الإدراج...") : text("Trigger Retrain", "بدء التدريب")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {jobs?.jobs?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <CardTitle>{text("Retraining Job History", "سجل مهام إعادة التدريب")}</CardTitle>
                    <Badge variant="outline">{text(`${jobs.jobs.length} jobs`, `${jobs.jobs.length} مهمة`)}</Badge>
                  </div>
                  <button
                    onClick={() => setNewJobForm(prev => !prev)}
                    className="text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-xl transition-colors hover:bg-primary/90"
                  >
                    {text("Queue Retrain", "إدراج للتدريب")}
                  </button>
                </div>
              </CardHeader>

              {newJobForm && (
                <div className="p-4 bg-muted/30 border-b border-border space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder={text("Model Name (e.g., risk-scoring-v3)", "اسم النموذج")}
                      value={newJobModel}
                      onChange={e => setNewJobModel(e.target.value)}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder={text("Reason for retraining", "سبب إعادة التدريب")}
                      value={newJobReason}
                      onChange={e => setNewJobReason(e.target.value)}
                      className="flex-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm w-1/2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setNewJobForm(false)}
                      className="text-xs font-semibold px-3 py-1.5 border border-border bg-secondary rounded-xl transition-colors hover:bg-secondary/80"
                    >
                      {text("Cancel", "إلغاء")}
                    </button>
                    <button
                      disabled={!newJobModel || queueRetrainMutation.isPending}
                      onClick={() => queueRetrainMutation.mutate({ model: newJobModel, reason: newJobReason })}
                      className="text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-xl transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {queueRetrainMutation.isPending ? text("Queuing...", "جارٍ الإدراج...") : text("Submit", "تأكيد")}
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-border">
                {jobs.jobs.map((job: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-2 h-2 rounded-full ${job.status === "completed" ? "bg-success" : job.status === "running" ? "bg-info animate-pulse" : "bg-risk-high"} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground font-mono">{job.id}</p>
                      <p className="text-xs text-muted-foreground">{job.engine} · {text("Started:", "بدأ:")} {new Date(job.createdAt || job.startedAt).toLocaleTimeString()} · {text("By:", "بواسطة:")} {job.triggeredBy}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.status === "running" && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-secondary rounded-full h-1.5">
                            <div className="h-full rounded-full bg-info" style={{ width: `${job.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{job.progress}%</span>
                        </div>
                      )}
                      <Badge variant={job.status === "completed" ? "success" : job.status === "running" ? "info" : "warning"} className="text-[9px]">
                        {job.status === "completed" ? text("completed", "مكتمل") : job.status === "running" ? text("running", "قيد التشغيل") : job.status === "queued" ? text("queued", "في الطابور") : job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── DECISION ANALYSIS ─── */}
      {activeTab === "decisions" && (
        <div className="space-y-5">
          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-6">
              <CardHeader><BarChart2 className="w-4 h-4 text-primary" /><CardTitle>{text("Decision Urgency Breakdown", "توزيع استعجال القرارات")}</CardTitle></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {[
                    { urgency: text("Immediate", "فوري"), value: metrics?.urgencyBreakdown?.immediate, color: "bg-danger", text: "text-danger" },
                    { urgency: text("Urgent", "عاجل"), value: metrics?.urgencyBreakdown?.urgent, color: "bg-risk-high", text: "text-risk-high" },
                    { urgency: text("Soon", "قريب"), value: metrics?.urgencyBreakdown?.soon, color: "bg-info", text: "text-info" },
                    { urgency: text("Routine", "روتيني"), value: metrics?.urgencyBreakdown?.routine, color: "bg-success", text: "text-success" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${item.text}`}>{item.urgency}</span>
                        <span className="text-xs font-bold text-foreground">{item.value?.toLocaleString()} ({metrics?.totalDecisions ? Math.round((item.value / metrics.totalDecisions) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${metrics?.totalDecisions ? (item.value / metrics.totalDecisions) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-6">
              <CardHeader><Shield className="w-4 h-4 text-primary" /><CardTitle>{text("Risk Level Distribution", "توزيع مستويات الخطورة")}</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                {[
                  { level: text("Critical Risk", "خطورة حرجة"), value: metrics?.riskBreakdown?.critical, color: "bg-danger", text: "text-danger" },
                  { level: text("High Risk", "خطورة مرتفعة"), value: metrics?.riskBreakdown?.high, color: "bg-risk-high", text: "text-risk-high" },
                  { level: text("Medium Risk", "خطورة متوسطة"), value: metrics?.riskBreakdown?.medium, color: "bg-info", text: "text-info" },
                  { level: text("Low Risk", "خطورة منخفضة"), value: metrics?.riskBreakdown?.low, color: "bg-success", text: "text-success" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${item.text}`}>{item.level}</span>
                      <span className="text-xs font-bold text-foreground">{item.value?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${metrics?.totalDecisions ? (item.value / metrics.totalDecisions) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-3">
                  <div className="bg-secondary px-3 py-2.5 rounded-xl text-center">
                    <p className="text-sm font-bold text-foreground">{metrics?.totalDecisions?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{text("Total Decisions", "إجمالي القرارات")}</p>
                  </div>
                  <div className="bg-risk-high-bg border border-risk-high/20 px-3 py-2.5 rounded-xl text-center">
                    <p className="text-sm font-bold text-risk-high">{metrics?.lowConfidenceCount?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{text("Low Confidence", "ثقة منخفضة")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ─── SETTINGS / CONTROL PANEL ─── */}
      {activeTab === "settings" && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <Settings className="w-4 h-4 text-primary" />
              <CardTitle>{text("AI Feature Toggles", "تفعيل ميزات الذكاء الاصطناعي")}</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {Object.entries(featureToggles).map(([featureKey, enabled]) => (
                <div key={featureKey} dir={dir} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-sm font-medium text-foreground capitalize">{featureKey.replace(/_/g, " ")}</span>
                  <button
                    onClick={() => toggleFeatureMutation.mutate({ feature: featureKey, enabled: !(enabled as boolean) })}
                    disabled={toggleFeatureMutation.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── FOOTER ─── */}

      {/* ─── FOOTER ─── */}

      <div className="px-5 py-3.5 bg-secondary border border-border rounded-2xl flex items-center gap-4 mt-5">
        <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="flex-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{text("Audit Status:", "حالة التدقيق:")}</span> {text(`All AI decisions fully traceable · ${metrics?.auditRecords?.toLocaleString()} audit records · Aligned with MOH AI Governance Framework 1445 · ISO/IEC 42001 AI Management compliance target 2026`, `جميع قرارات الذكاء قابلة للتتبّع · ${metrics?.auditRecords?.toLocaleString()} سجل تدقيق · متوافقة مع إطار حوكمة الذكاء الاصطناعي لوزارة الصحة 1445 · مستهدف الامتثال لمعيار ISO/IEC 42001 لعام 2026`)}
        </p>
        <Badge variant="success">{text("Audit Active", "التدقيق نشط")}</Badge>
      </div>
    </Layout>
  );
}

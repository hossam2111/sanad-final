import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  Search, Shield, Activity, AlertCircle, Syringe, Clock,
  User as UserIcon, Pill, FlaskConical, Building2, X, Stethoscope, CalendarDays,
  TrendingUp, TrendingDown, Minus, Brain, Bell, BellOff, CheckCheck,
  TriangleAlert, Zap, ArrowUpRight, ArrowDownRight, ChevronRight, Lightbulb,
  Wifi, WifiOff, Sparkles, Send, RefreshCw, MessageSquare, Printer
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip,
  ReferenceLine, XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from "recharts";
import { Layout } from "@/components/layout";
import { RiskBadge } from "@/components/ui/risk-badge";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Badge, PageHeader, Tabs, KpiCard, StatusDot, Select, DataLabel, AlertBanner
, SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  useGetPatientByNationalId,
  useGetPatientRiskScore,
  useCheckDrugInteraction,
  usePrescribeMedication,
  useListAlerts,
  useMarkAlertRead,
  useGetPatientPredictions,
} from "@workspace/api-client-react";
import { useAiDecision, useAuditLog } from "@/hooks/use-ai-decision";
import { useSseAlerts } from "@/hooks/use-sse-alerts";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { T } from "@/lib/terms";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";

type PredictionWarning = {
  type: string;
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  confidence: "low" | "moderate" | "high";
};

const predictionSeverityStyle: Record<string, { bg: string; border: string; icon: string; badge: "destructive" | "warning" | "info" | "outline" | "success" | "default"  }> = {
  critical: { bg: "bg-risk-critical-bg", border: "border-risk-critical/25", icon: "text-risk-critical", badge: "destructive" },
  high:     { bg: "bg-risk-high-bg",     border: "border-risk-high/25",     icon: "text-risk-high",     badge: "warning" },
  moderate: { bg: "bg-risk-medium-bg",   border: "border-risk-medium/25",   icon: "text-risk-medium",   badge: "info" },
  low:      { bg: "bg-secondary",        border: "border-border",            icon: "text-muted-foreground", badge: "outline" },
};

function safeDate(dateStr: string) {
  const d = new Date(dateStr);
  return isValid(d) ? d : new Date();
}

type TimelineEvent = {
  id: number;
  type: "visit" | "lab" | "medication" | "alert";
  date: Date;
  title: string;
  subtitle: string;
  status?: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "destructive" | "outline" | "info";
};

function visitBadgeVariant(visitType: string): NonNullable<TimelineEvent["badgeVariant"]> {
  if (visitType === "emergency") return "destructive";
  if (visitType === "inpatient") return "warning";
  return "outline";
}

// Professional Arabic equivalents for clinical visit types.
const VISIT_TYPE_AR: Record<string, string> = {
  emergency: "طوارئ",
  inpatient: "تنويم",
  outpatient: "عيادات خارجية",
  "follow-up": "متابعة",
};
function visitTypeAr(visitType: string): string {
  return VISIT_TYPE_AR[visitType] ?? visitType;
}

// Localized label for a timeline badge (visit type, or medication active/completed).
function timelineBadgeLabel(badge: string, text: (en: string, ar: string) => string): string {
  if (badge === "active") return text("active", "نشط");
  if (badge === "completed") return text("completed", "مكتمل");
  if (VISIT_TYPE_AR[badge]) return text(badge, VISIT_TYPE_AR[badge]!);
  return badge;
}

// Localized alert / decision severity & urgency labels.
const SEVERITY_AR: Record<string, string> = {
  critical: "حرجة", high: "مرتفعة", moderate: "متوسطة", medium: "متوسطة", low: "منخفضة",
  warning: "تحذير", info: "معلومة",
};
function severityLabel(sev: string, text: (en: string, ar: string) => string): string {
  return SEVERITY_AR[sev] ? text(sev, SEVERITY_AR[sev]!) : sev;
}
const URGENCY_AR: Record<string, string> = {
  immediate: "فوري", urgent: "عاجل", soon: "قريب", routine: "روتيني",
};
function urgencyLabel(u: string, text: (en: string, ar: string) => string): string {
  return URGENCY_AR[u] ? text(u, URGENCY_AR[u]!) : u;
}
const RISK_LEVEL_AR: Record<string, string> = {
  critical: "حرجة", high: "مرتفعة", medium: "متوسطة", low: "منخفضة",
};
function riskLevelLabel(r: string, text: (en: string, ar: string) => string): string {
  return RISK_LEVEL_AR[r] ? text(r, RISK_LEVEL_AR[r]!) : r;
}
const TRAJECTORY_AR: Record<string, string> = {
  rapidly_worsening: "تدهور سريع", worsening: "تدهور", stable: "مستقر", improving: "تحسّن",
};
function trajectoryLabel(t: string, text: (en: string, ar: string) => string): string {
  return TRAJECTORY_AR[t] ? text(t.replace("_", " ").toUpperCase(), TRAJECTORY_AR[t]!) : t.replace("_", " ").toUpperCase();
}

function labBadgeVariant(status: string): NonNullable<TimelineEvent["badgeVariant"]> {
  if (status === "normal") return "success";
  if (status === "abnormal") return "warning";
  return "destructive";
}

function medicationBadgeVariant(isActive: boolean): NonNullable<TimelineEvent["badgeVariant"]> {
  return isActive ? "success" : "outline";
}

export default function DoctorDashboard() {
  const { text, dir, locale, toggleLocale } = useLanguage();

  
  const [searchId, setSearchId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [recordView, setRecordView] = useState<"timeline" | "medications" | "labs" | "visits">("timeline");
  const [showSsePanel, setShowSsePanel] = useState(false);
  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeProvider, setNarrativeProvider] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const narrativeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { alerts: sseAlerts, connected: sseConnected, unreadCount: sseUnread, markRead: markSseRead, clearAll: clearSseAlerts } = useSseAlerts(user?.role ?? "");

  const { data: nameSearchResults } = useQuery({
    queryKey: ["patient-name-search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return { patients: [] };
      const res = await apiFetch(`/api/patients?search=${encodeURIComponent(searchQuery)}&limit=6`);
      if (!res.ok) return { patients: [] };
      return res.json();
    },
    enabled: searchQuery.length >= 2 && !/^\d+$/.test(searchQuery),
  });
  const searchPatients: any[] = nameSearchResults?.patients ?? [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: patient, isLoading } = useGetPatientByNationalId(
    patientId || "",
    { query: { enabled: !!patientId, retry: false } }
  );

  const { data: riskScore } = useGetPatientRiskScore(
    patient?.id || 0,
    { query: { enabled: !!patient?.id } }
  );

  const { data: predictionsData } = useGetPatientPredictions(
    patient?.id || 0,
    { query: { enabled: !!patient?.id } }
  );

  const { data: aiDecision, isLoading: decisionLoading } = useAiDecision(
    patient?.id || 0,
    { enabled: !!patient?.id }
  );

  const { data: auditData } = useAuditLog(
    patient?.id || 0,
    { enabled: !!patient?.id && activeTab === "audit" }
  );

  const { data: alertsData, refetch: refetchAlerts } = useListAlerts(
    { patientId: patient?.id || 0 },
    { query: { enabled: !!patient?.id } }
  );

  const markReadMutation = useMarkAlertRead();

  const fetchNarrative = useCallback(async () => {
    if (!patient?.id || narrativeLoading) return;
    setNarrativeText("");
    setNarrativeProvider("");
    setNarrativeLoading(true);
    setChatAnswer("");
    try {
      const res = await apiFetch(`/api/ai/narrative/${patient.id}`);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : part;
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.text) { setNarrativeText(prev => prev + msg.text); if (msg.provider) setNarrativeProvider(msg.provider); }
            if (msg.done) setNarrativeLoading(false);
            if (msg.error) { setNarrativeText(`⚠️ ${msg.error}`); setNarrativeLoading(false); }
          } catch { /* ignore malformed SSE line */ }
        }
      }
    } catch (err) {
      setNarrativeText(`⚠️ Failed to connect to AI: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setNarrativeLoading(false);
    }
  }, [patient?.id, narrativeLoading]);

  const sendChatQuestion = useCallback(async () => {
    if (!patient?.id || !chatQuestion.trim() || chatLoading) return;
    setChatLoading(true);
    setChatAnswer("");
    try {
      const res = await apiFetch(`/api/ai/chat/${patient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: chatQuestion }),
      });
      const data = await res.json();
      setChatAnswer(data.answer ?? data.message ?? "No response.");
    } catch (err) {
      setChatAnswer(`⚠️ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setChatLoading(false);
    }
  }, [patient?.id, chatQuestion, chatLoading]);

  const handlePrintNarrative = useCallback(() => {
    window.print();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) { setPatientId(searchId.trim()); setActiveTab("overview"); setShowDropdown(false); setNarrativeText(""); setNarrativeProvider(""); setChatAnswer(""); setChatQuestion(""); }
  };

  const handleSelectPatient = (nationalId: string, name: string) => {
    setSearchId(nationalId);
    setSearchQuery(name);
    setPatientId(nationalId);
    setActiveTab("overview");
    setShowDropdown(false);
    setNarrativeText("");
    setNarrativeProvider("");
    setChatAnswer("");
    setChatQuestion("");
  };

  const activeMeds = patient?.medications?.filter(m => m.isActive) ?? [];
  const labResults = patient?.labResults ?? [];
  const criticalLabs = labResults.filter(l => l.status === "critical").length;
  const abnormalLabs = labResults.filter(l => l.status === "abnormal").length;

  const alerts = alertsData?.alerts ?? [];
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  const predictions: PredictionWarning[] = (predictionsData as { predictions?: PredictionWarning[] })?.predictions ?? [];
  const criticalPredictions = predictions.filter(p => p.severity === "critical" || p.severity === "high").length;

  const handleMarkRead = async (alertId: number) => {
    await markReadMutation.mutateAsync({ id: alertId });
    refetchAlerts();
  };

  const timeline: TimelineEvent[] = [
    ...(patient?.visits?.map(v => ({
      id: v.id,
      type: "visit" as const,
      date: safeDate(v.visitDate),
      title: text(`${v.visitType.charAt(0).toUpperCase() + v.visitType.slice(1)} Visit — ${v.hospital}`, `زيارة ${visitTypeAr(v.visitType)} — ${v.hospital}`),
      subtitle: v.diagnosis ?? "",
      badge: v.visitType,
      badgeVariant: visitBadgeVariant(v.visitType),
    })) ?? []),
    ...(patient?.labResults?.map(l => ({
      id: l.id,
      type: "lab" as const,
      date: safeDate(l.testDate),
      title: l.testName,
      subtitle: `${l.result} ${l.unit ?? ""} · ${l.hospital}`,
      status: l.status,
      badge: l.status,
      badgeVariant: labBadgeVariant(l.status),
    })) ?? []),
    ...(patient?.medications?.map(m => ({
      id: m.id,
      type: "medication" as const,
      date: safeDate(m.startDate ?? new Date().toISOString()),
      title: text(`Prescribed: ${m.drugName} ${m.dosage ?? ""}`, `وصفة: ${m.drugName} ${m.dosage ?? ""}`),
      subtitle: text(`By ${m.prescribedBy} · ${m.hospital}`, `بواسطة ${m.prescribedBy} · ${m.hospital}`),
      badge: m.isActive ? "active" : "completed",
      badgeVariant: medicationBadgeVariant(m.isActive),
    })) ?? []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const timelineIconMap = {
    visit: { icon: Building2, bg: "bg-sky-100", color: "text-sky-600" },
    lab: { icon: FlaskConical, bg: "bg-violet-100", color: "text-violet-600" },
    medication: { icon: Pill, bg: "bg-emerald-100", color: "text-emerald-600" },
    alert: { icon: AlertCircle, bg: "bg-red-100", color: "text-red-600" },
  };

  const labsByName: Record<string, typeof labResults> = {};
  for (const lab of [...labResults].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())) {
    const k = lab.testName;
    if (!labsByName[k]) labsByName[k] = [];
    labsByName[k].push(lab);
  }

  const getTrend = (labGroup: typeof labResults) => {
    if (labGroup.length < 2) return "stable";
    const vals = labGroup.slice(0, 3).map(l => parseFloat(l.result)).filter(v => !isNaN(v));
    if (vals.length < 2) return "stable";
    const diff = vals[0]! - vals[vals.length - 1]!;
    const pct = Math.abs(diff / (vals[vals.length - 1]! || 1)) * 100;
    if (pct < 5) return "stable";
    return diff > 0 ? "rising" : "falling";
  };

  const topPredictions = predictions.filter(p => p.severity === "critical" || p.severity === "high").slice(0, 3);

  return (
    <Layout role="doctor" localized>
      {criticalLabs > 0 && (
        <AlertBanner variant="destructive">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>{text("Critical Lab Alert:", "تنبيه مختبر حرج:")}</strong>{" "}
            {text(
              `${criticalLabs} lab result${criticalLabs > 1 ? "s" : ""} require immediate clinical review.`,
              `${criticalLabs} ${criticalLabs > 1 ? "نتائج مختبرية تتطلب" : "نتيجة مختبرية تتطلب"} مراجعة سريرية فورية.`,
            )}
          </span>
          <Badge variant="destructive" className="ml-auto shrink-0">{text(`${criticalLabs} critical`, `${criticalLabs} حرجة`)}</Badge>
        </AlertBanner>
      )}
      {criticalPredictions > 0 && (
        <AlertBanner variant="warning">
          <Brain className="w-4 h-4 text-risk-high shrink-0" />
          <span>
            <strong>{text("AI Warning:", "إنذار ذكاء اصطناعي:")}</strong>{" "}
            {text(
              `${criticalPredictions} high-priority clinical prediction${criticalPredictions > 1 ? "s" : ""} require attention.`,
              `${criticalPredictions} ${criticalPredictions > 1 ? "تنبؤات سريرية عالية الأولوية تتطلب" : "تنبؤ سريري عالي الأولوية يتطلب"} الانتباه.`,
            )}
          </span>
          <Badge variant="warning" className="ml-auto shrink-0">{text(`${criticalPredictions} flagged`, `${criticalPredictions} موسومة`)}</Badge>
        </AlertBanner>
      )}

      {/* SSE Real-time Lab Alerts Panel */}
      {showSsePanel && sseAlerts.length > 0 && (
        <div className="mx-0 mb-4 rounded-2xl border border-red-200 bg-destructive/10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-red-200 bg-red-100/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-sm text-red-800">{text("Live Lab Alerts", "تنبيهات مخبرية حيّة")}</span>
              <Badge variant="destructive" className="text-[10px]">{text(`${sseUnread} new`, `${sseUnread} جديدة`)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearSseAlerts} className="text-[11px] text-red-600 hover:text-red-800 font-medium">{text("Clear all", "مسح الكل")}</button>
              <button onClick={() => setShowSsePanel(false)} className="text-red-400 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-red-200 max-h-64 overflow-y-auto">
            {sseAlerts.map(alert => (
              <div key={alert.id} className={`px-4 py-3 flex items-start gap-3 ${alert.read ? "opacity-60" : ""}`}>
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${alert.severity === "critical" ? "bg-red-500" : "bg-risk-high"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-red-900">{alert.title}</p>
                  <p className="text-xs text-red-700 mt-0.5">{alert.patientName} · {alert.result}</p>
                  <p className="text-xs text-red-600 mt-0.5">{alert.action}</p>
                  <p className="text-[10px] text-red-400 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => { handleSelectPatient(alert.nationalId, alert.patientName); markSseRead(alert.id); }}
                    className="text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg px-2 py-1 transition-colors"
                  >
                    {text("View Patient", "عرض المريض")}
                  </button>
                  {!alert.read && (
                    <button onClick={() => markSseRead(alert.id)} className="text-[10px] text-red-400 hover:text-red-700">{text("Dismiss", "تجاهل")}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={text("Physician Dashboard", "لوحة الطبيب")}
          subtitle={text(
            "Patient clinical records, prescribing, AI-assisted risk analysis, and predictive alerts.",
            "السجلات السريرية للمرضى، ووصف الأدوية، وتحليل المخاطر بمساعدة الذكاء الاصطناعي، والتنبيهات التنبؤية.",
          )}
        />
        <div className="flex items-center gap-2 shrink-0 ml-6">
          {/* SSE Real-time Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setShowSsePanel(p => !p)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
                sseUnread > 0 ? "bg-destructive/10 border-red-200 hover:bg-red-100" : "bg-card border-border hover:bg-secondary"
              }`}
              title={sseConnected ? text("Live alerts connected", "التنبيهات الحيّة متصلة") : text("Connecting to live alerts...", "جارٍ الاتصال بالتنبيهات الحيّة...")}
            >
              {sseUnread > 0 ? (
                <Bell className="w-4.5 h-4.5 text-red-600" />
              ) : (
                <Bell className="w-4.5 h-4.5 text-muted-foreground" />
              )}
              {sseUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {sseUnread > 9 ? "9+" : sseUnread}
                </span>
              )}
            </button>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${sseConnected ? "bg-emerald-400" : "bg-gray-300"}`} title={sseConnected ? text("Live", "مباشر") : text("Offline", "غير متصل")} />
          </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={text("Name or National ID...", "الاسم أو رقم الهوية...")}
              className="pl-9 w-64"
              value={searchQuery || searchId}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                setSearchId(v);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && searchPatients.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden">
                {searchPatients.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p.nationalId, p.fullName)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-foreground truncate">{p.fullName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{p.nationalId} · {text("Age", "العمر")} {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}</p>
                    </div>
                    {(p.riskLevel === "critical" || p.riskLevel === "high") && (
                      <RiskBadge level={p.riskLevel} className="shrink-0 text-[9px] px-1.5 py-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" size="md">{text("Load", "استدعاء")}</Button>
        </form>
        </div>
      </div>

      {!patientId && !isLoading && (
        <Card>
          <CardBody className="py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">{text("No Patient Selected", "لم يتم اختيار مريض")}</p>
            <p className="text-sm text-muted-foreground mb-2">{text("Enter a National ID above to load a patient record.", "أدخل رقم الهوية الوطنية أعلاه لاستدعاء سجل المريض.")}</p>
            <p className="text-xs text-muted-foreground font-mono bg-secondary inline-block px-3 py-1.5 rounded-xl" dir="ltr">
              {text("Demo:", "للتجربة:")} 1000000001 · 1000000003 · 1000000006 · 1000000009
            </p>
          </CardBody>
        </Card>
      )}

      {isLoading && <div className="p-5"><SkeletonCard rows={3} /></div>}

      {patient && (
        <div className="space-y-5">
          {/* Patient Banner */}
          <Card>
            <CardBody className="p-0">
              <div className="flex items-stretch divide-x divide-border">
                <div className="flex-1 p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <UserIcon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{patient.fullName}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-secondary px-2.5 py-1 rounded-xl" dir="ltr">{patient.nationalId}</span>
                      <span className="text-xs text-muted-foreground">
                        {text("DOB:", "تاريخ الميلاد:")} {format(safeDate(patient.dateOfBirth), "dd MMM yyyy")}
                      </span>
                      <span className="text-xs text-muted-foreground">· {patient.gender === "male" ? text("Male", "ذكر") : text("Female", "أنثى")}</span>
                      {(patient.allergies?.length ?? 0) > 0 && (
                        <Badge variant="destructive">{text(`${patient.allergies?.length ?? 0} Allerg${(patient.allergies?.length ?? 0) > 1 ? "ies" : "y"}`, `${patient.allergies?.length ?? 0} حساسية`)}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 flex flex-col items-center justify-center bg-destructive/10 min-w-[90px]">
                  <DataLabel label={text("Blood Type", "فصيلة الدم")}>
                    <p className="text-3xl font-bold text-red-600" dir="ltr">{patient.bloodType}</p>
                  </DataLabel>
                </div>

                {riskScore && (
                  <div className="px-6 py-4 flex flex-col items-center justify-center min-w-[120px] bg-secondary/40">
                    <DataLabel label={text("AI Risk Score", "درجة الخطورة")}>
                      <p className="text-3xl font-bold tabular-nums text-foreground" dir="ltr">
                        {riskScore.riskScore}<span className="text-base font-normal text-muted-foreground">/100</span>
                      </p>
                    </DataLabel>
                    <RiskBadge
                      level={riskScore.riskLevel as "critical" | "high" | "medium" | "low"}
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="px-5 py-4 flex flex-col justify-center gap-2 min-w-[160px]">
                  <PrescribeModal patientId={patient.id} />
                  <Button variant="outline" size="sm">
                    <CalendarDays className="w-3.5 h-3.5" /> {text("Schedule Visit", "جدولة زيارة")}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-4">
            <KpiCard
              title={text("Active Medications", "الأدوية الفعّالة")}
              value={activeMeds.length}
              sub={text("Current prescriptions", "الوصفات الحالية")}
              icon={Pill}
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
            <KpiCard
              title={text("Lab Results", "نتائج المختبر")}
              value={labResults.length}
              sub={text(`${criticalLabs} critical · ${abnormalLabs} abnormal`, `${criticalLabs} حرجة · ${abnormalLabs} غير طبيعية`)}
              icon={FlaskConical}
              iconBg={criticalLabs > 0 ? "bg-red-100" : "bg-sky-100"}
              iconColor={criticalLabs > 0 ? "text-red-600" : "text-sky-600"}
            />
            <KpiCard
              title={text("Visit History", "سجل الزيارات")}
              value={patient.visits?.length ?? 0}
              sub={text("Total hospital visits", "إجمالي الزيارات")}
              icon={Building2}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <KpiCard
              title={text("AI Predictions", "التنبؤات الذكية")}
              value={predictions.length}
              sub={text(`${criticalPredictions} high priority`, `${criticalPredictions} عالية الأولوية`)}
              icon={Brain}
              iconBg={criticalPredictions > 0 ? "bg-risk-high-bg" : "bg-violet-100"}
              iconColor={criticalPredictions > 0 ? "text-risk-high" : "text-violet-600"}
            />
            <KpiCard
              title={text("Active Alerts", "التنبيهات النشطة")}
              value={unreadAlerts}
              sub={text(`${alerts.length} total alerts`, `${alerts.length} إجمالي التنبيهات`)}
              icon={Bell}
              iconBg={unreadAlerts > 0 ? "bg-red-100" : "bg-secondary"}
              iconColor={unreadAlerts > 0 ? "text-red-600" : "text-muted-foreground"}
            />
          </div>

          {/* Tabbed Content */}
          <Card>
            <Tabs
              tabs={[
                { id: "overview", label: text(...T.overview) },
                { id: "record", label: text(...T.record) },
                { id: "intelligence", label: text(...T.intelligence), count: criticalPredictions || undefined },
                { id: "alerts", label: text(...T.alerts), count: unreadAlerts || undefined },
                { id: "audit", label: text(...T.audit) },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />

            {/* Record sub-views: one tab, four lenses on the same history. */}
            {activeTab === "record" && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-secondary/40 px-5 py-3">
                {([
                  { id: "timeline", label: text("Timeline", "الجدول الزمني") },
                  { id: "medications", label: text(`Medications · ${activeMeds.length}`, `الأدوية · ${activeMeds.length}`) },
                  { id: "labs", label: text(`Labs · ${labResults.length}`, `المختبر · ${labResults.length}`) },
                  { id: "visits", label: text(`Visits · ${patient.visits?.length ?? 0}`, `الزيارات · ${patient.visits?.length ?? 0}`) },
                ] as const).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setRecordView(v.id)}
                    className={`h-8 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                      recordView === v.id
                        ? "bg-primary text-white shadow-sm shadow-primary/25"
                        : "bg-card text-muted-foreground border border-border hover:text-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="divide-y divide-border">
                {/* Clinical Decision Panel */}
                {riskScore && (
                  <div className="p-5 bg-secondary/30">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-violet-600" /> {text("Clinical Intelligence — Decision Summary", "التحليلات السريرية — ملخّص القرار")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("intelligence")}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80"
                      >
                        {text("Full analysis", "التحليل الكامل")} <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-stretch gap-4">
                      {/* Score Block */}
                      <div className="rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[130px] shrink-0 bg-risk-critical-bg border border-risk-critical/20"
                        style={{
                          background: `hsl(var(--risk-${riskScore.riskLevel}-bg))`,
                          borderColor: `hsl(var(--risk-${riskScore.riskLevel}) / 0.2)`,
                        }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{text("Risk Score", "درجة الخطورة")}</p>
                        <p className="text-5xl font-bold tabular-nums leading-none" dir="ltr"
                          style={{ color: `hsl(var(--risk-${riskScore.riskLevel}))` }}>
                          {riskScore.riskScore}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">/ 100</p>
                        <RiskBadge
                          level={riskScore.riskLevel as "critical" | "high" | "medium" | "low"}
                          className="mt-3"
                        />
                      </div>

                      {/* WHY Block */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <TriangleAlert className="w-3 h-3 text-risk-high" /> {text("WHY — Top Risk Factors", "المُبرّرات — أبرز عوامل الخطورة")}
                        </p>
                        <div className="space-y-1.5">
                          {riskScore.factors.slice(0, 4).map((f: any, i: number) => (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-card/70 border border-border rounded-xl">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                f.impact === "high" ? "bg-red-500" :
                                f.impact === "moderate" ? "bg-risk-high" : "bg-primary"
                              }`} />
                              <span className="text-xs font-semibold text-foreground flex-1 truncate">{f.factor}</span>
                              <Badge variant={f.impact === "high" ? "destructive" : f.impact === "moderate" ? "warning" : "info"} className="text-[9px] shrink-0">{f.impact === "high" ? text("high", "مرتفع") : f.impact === "moderate" ? text("moderate", "متوسط") : text("low", "منخفض")}</Badge>
                            </div>
                          ))}
                          {riskScore.factors.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2">{text("No significant risk factors detected.", "لم تُرصد عوامل خطورة جوهرية.")}</p>
                          )}
                        </div>
                      </div>

                      {/* ACTION Block */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-primary" /> {text("RECOMMENDED ACTIONS", "الإجراءات الموصى بها")}
                        </p>
                        <div className="space-y-1.5">
                          {riskScore.recommendations.slice(0, 3).map((rec: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-card/70 border border-border rounded-xl">
                              <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                              <p className="text-xs text-foreground leading-snug">{rec}</p>
                            </div>
                          ))}
                        </div>
                        {topPredictions.length > 0 && (
                          <div className="mt-2 px-3 py-2 bg-risk-high-bg/60 border border-risk-high/20 rounded-xl">
                            <p className="text-[10px] font-bold text-risk-high uppercase tracking-wide mb-1">{text("AI Alert", "تنبيه ذكي")}</p>
                            <p className="text-xs text-risk-high font-medium">{topPredictions[0]?.title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditions + Allergies */}
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" /> {text("Chronic Conditions", "الأمراض المزمنة")}
                    </p>
                    {(patient.chronicConditions?.length ?? 0) > 0 ? (
                      <div className="space-y-2">
                        {patient.chronicConditions?.map((c, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-secondary rounded-2xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="text-sm font-semibold">{c}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">{text("None on record.", "لا شيء مُسجّل.")}</p>}
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" /> {text("Documented Allergies", "الحساسية المُوثّقة")}
                    </p>
                    {(patient.allergies?.length ?? 0) > 0 ? (
                      <div className="space-y-2">
                        {patient.allergies?.map((a, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-destructive/10 border border-red-100 rounded-2xl">
                            <StatusDot status="critical" />
                            <span className="text-sm font-bold text-red-700">{a}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">{text("No known allergies.", "لا توجد حساسية معروفة.")}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "record" && recordView === "timeline" && (
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{text("Unified Clinical Timeline", "الجدول الزمني السريري الموحّد")}</p>
                  <div className="flex items-center gap-2 ms-auto">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-sky-500" /> {text("Visit", "زيارة")}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-violet-500" /> {text("Lab", "مختبر")}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {text("Medication", "دواء")}</div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {timeline.slice(0, 30).map((event, idx) => {
                      const cfg = timelineIconMap[event.type];
                      const Icon = cfg.icon;
                      return (
                        <div key={`${event.type}-${event.id}-${idx}`} className="flex gap-4 relative ps-14">
                          <div className={`absolute start-2 top-1.5 w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center border-2 border-background z-10`}>
                            <Icon className={`w-3 h-3 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0 pb-4 border-b border-border last:border-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.subtitle}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {event.badge && (
                                  <Badge variant={event.badgeVariant ?? "outline"} className="text-[10px]">{timelineBadgeLabel(event.badge, text)}</Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap" dir="ltr">
                                  {format(event.date, "dd MMM yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {timeline.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">{text("No timeline data available.", "لا توجد بيانات في الجدول الزمني.")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "record" && recordView === "medications" && (
              <div>
                <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ background: "hsl(240 6% 97%)" }}>
                  <p className="text-xs font-semibold text-muted-foreground">{text(`${activeMeds.length} active prescription${activeMeds.length !== 1 ? "s" : ""}`, `${activeMeds.length} وصفة فعّالة`)}</p>
                  <PrescribeModal patientId={patient.id} />
                </div>
                <table className="w-full data-table">
                  <thead><tr>
                    <th>{text("Drug Name", "اسم الدواء")}</th><th>{text("Dosage", "الجرعة")}</th><th>{text("Frequency", "التكرار")}</th>
                    <th>{text("Prescribed By", "الطبيب الواصف")}</th><th>{text("Hospital", "المستشفى")}</th><th>{text("Start Date", "تاريخ البدء")}</th><th>{text("Status", "الحالة")}</th>
                  </tr></thead>
                  <tbody>
                    {patient.medications?.map(med => (
                      <tr key={med.id}>
                        <td className="font-bold text-foreground">{med.drugName}</td>
                        <td className="font-mono text-sm" dir="ltr">{med.dosage}</td>
                        <td className="text-muted-foreground">{med.frequency}</td>
                        <td>{med.prescribedBy}</td>
                        <td className="text-muted-foreground text-xs">{med.hospital}</td>
                        <td className="text-muted-foreground font-mono text-xs" dir="ltr">
                          {med.startDate ? format(safeDate(med.startDate), "dd MMM yyyy") : "—"}
                        </td>
                        <td><Badge variant={med.isActive ? "success" : "outline"}>{med.isActive ? text("Active", "نشط") : text("Completed", "مكتمل")}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "record" && recordView === "labs" && (
              <div>
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border" style={{ background: "hsl(240 6% 97%)" }}>
                  {criticalLabs > 0 && <Badge variant="destructive">{text(`${criticalLabs} Critical`, `${criticalLabs} حرجة`)}</Badge>}
                  {abnormalLabs > 0 && <Badge variant="warning">{text(`${abnormalLabs} Abnormal`, `${abnormalLabs} غير طبيعية`)}</Badge>}
                  <span className="text-xs text-muted-foreground ms-auto">{text(`${labResults.length} results · sparkline shows value trend over time`, `${labResults.length} نتيجة · يوضّح المخطط المصغّر اتجاه القيم عبر الزمن`)}</span>
                </div>

                {/* HbA1c Explicit Trend — Priority Glycemic Control Chart */}
                {(() => {
                  const hba1cKey = Object.keys(labsByName).find(k => k.toLowerCase().includes("hba1c") || k.toLowerCase().includes("hemoglobin a1c") || k.toLowerCase().includes("haemoglobin a1c"));
                  const hba1cGroup = hba1cKey ? labsByName[hba1cKey] : [];
                  if (!hba1cGroup || hba1cGroup.length < 2) return null;

                  const hba1cData = [...hba1cGroup].reverse().map(l => ({
                    date: format(safeDate(l.testDate), "MMM yy"),
                    val: parseFloat(l.result),
                    status: l.status,
                  })).filter(d => !isNaN(d.val));

                  const latest = hba1cData[hba1cData.length - 1]!;
                  const first = hba1cData[0]!;
                  const delta = latest.val - first.val;
                  const isWorsening = delta > 0.2;
                  const isImproving = delta < -0.2;
                  const areaColor = isWorsening ? "#ef4444" : isImproving ? "#22c55e" : "#6366f1";
                  const trend = isWorsening ? "↑ WORSENING" : isImproving ? "↓ IMPROVING" : "→ STABLE";

                  return (
                    <div className={`mx-5 my-4 rounded-2xl border p-4 ${isWorsening ? "border-red-200 bg-destructive/10" : isImproving ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-violet-50/40"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FlaskConical className={`w-4 h-4 ${isWorsening ? "text-red-500" : isImproving ? "text-emerald-500" : "text-violet-500"}`} />
                            <span className="font-bold text-sm">HbA1c Glycemic Trajectory</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWorsening ? "bg-red-100 text-red-700" : isImproving ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>
                              {trend}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {hba1cData.length} readings · {first.date} → {latest.date} · Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${latest.val >= 7.0 ? "text-red-600" : latest.val >= 5.7 ? "text-risk-high" : "text-emerald-600"}`}>
                            {latest.val}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">{latest.val >= 7.0 ? "Diabetic range" : latest.val >= 5.7 ? "Pre-diabetic" : "Normal"}</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={hba1cData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="hba1cGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={areaColor} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={areaColor} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload?.length) {
                                const d = payload[0]?.payload;
                                return (
                                  <div className="bg-card rounded-xl px-3 py-2 shadow-lg border border-border text-xs">
                                    <p className="font-bold text-foreground">{d?.val}% HbA1c</p>
                                    <p className="text-muted-foreground">{d?.date}</p>
                                    <p className={`font-medium mt-0.5 ${d?.val >= 7.0 ? "text-red-600" : d?.val >= 5.7 ? "text-risk-high" : "text-emerald-600"}`}>
                                      {d?.val >= 7.0 ? text("Diabetic range", "نطاق السكري") : d?.val >= 5.7 ? text("Pre-diabetic", "ما قبل السكري") : text("Normal", "طبيعي")}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "6.5% DM threshold", fontSize: 9, fill: "#ef4444", position: "insideTopLeft" }} />
                          <ReferenceLine y={5.7} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "5.7% Pre-DM", fontSize: 9, fill: "#f59e0b", position: "insideTopLeft" }} />
                          <Area type="monotone" dataKey="val" stroke={areaColor} strokeWidth={2.5} fill="url(#hba1cGrad)" dot={{ r: 4, fill: areaColor, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                <div className="divide-y divide-border">
                  {Object.entries(labsByName).map(([testName, group]) => {
                    const latest = group[0]!;
                    const trend = getTrend(group);
                    const chartData = [...group].reverse().map((l, i) => ({
                      i,
                      val: parseFloat(l.result),
                      date: format(safeDate(l.testDate), "MMM yy"),
                    })).filter(d => !isNaN(d.val));
                    const hasChart = chartData.length >= 2;
                    const lineColor = trend === "rising"
                      ? (latest.status === "normal" ? "#22c55e" : "#f59e0b")
                      : trend === "falling"
                        ? (latest.status === "normal" ? "#22c55e" : "#38bdf8")
                        : "#94a3b8";

                    return (
                      <div key={latest.id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-secondary/20 transition-colors ${
                        latest.status === "critical" ? "border-l-2 border-red-500 bg-destructive/10/30" :
                        latest.status === "abnormal" ? "border-l-2 border-risk-high/50 bg-risk-high-bg/20" : ""
                      }`}>
                        {/* Lab Name + Status */}
                        <div className="w-44 shrink-0">
                          <p className="font-bold text-sm text-foreground truncate">{testName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StatusDot status={latest.status as "critical" | "abnormal" | "normal"} />
                            <Badge variant={latest.status === "normal" ? "success" : latest.status === "abnormal" ? "warning" : "destructive"} className="text-[10px]">{latest.status === "normal" ? text("normal", "طبيعي") : latest.status === "abnormal" ? text("abnormal", "غير طبيعي") : text("critical", "حرج")}</Badge>
                          </div>
                        </div>

                        {/* Sparkline Chart */}
                        <div className="w-28 h-10 shrink-0">
                          {hasChart ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                                <RechartsTooltip
                                  content={({ active, payload }) => {
                                    if (active && payload?.length) {
                                      const d = payload[0]?.payload;
                                      return (
                                        <div className="bg-card border border-border rounded-lg px-2 py-1 text-[10px] shadow-sm">
                                          <p className="font-bold">{d?.val} {latest.unit}</p>
                                          <p className="text-muted-foreground">{d?.date}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="val"
                                  stroke={lineColor}
                                  strokeWidth={2}
                                  dot={{ r: 2, fill: lineColor, strokeWidth: 0 }}
                                  activeDot={{ r: 3 }}
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Minus className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Values sequence */}
                        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                          {chartData.map((d, i) => (
                            <React.Fragment key={i}>
                              <span className={`text-xs font-mono tabular-nums ${
                                i === chartData.length - 1
                                  ? (latest.status === "normal" ? "text-emerald-600 font-bold" : latest.status === "critical" ? "text-red-600 font-bold" : "text-risk-high font-bold")
                                  : "text-muted-foreground"
                              }`}>{d.val}</span>
                              {i < chartData.length - 1 && (
                                <span className="text-muted-foreground/40 text-xs">→</span>
                              )}
                            </React.Fragment>
                          ))}
                          {hasChart && (
                            <span className="ml-1">
                              {trend === "rising" ? <TrendingUp className="w-3.5 h-3.5 text-risk-high inline" /> :
                               trend === "falling" ? <TrendingDown className="w-3.5 h-3.5 text-sky-500 inline" /> :
                               <Minus className="w-3 h-3 text-muted-foreground inline" />}
                            </span>
                          )}
                          {!hasChart && (
                            <span className="text-sm font-mono font-semibold">{latest.result} <span className="text-xs text-muted-foreground font-normal">{latest.unit}</span></span>
                          )}
                        </div>

                        {/* Reference range + date */}
                        <div className="text-right shrink-0 min-w-[120px]">
                          {latest.referenceRange && (
                            <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{text("Ref:", "المرجع:")} {latest.referenceRange}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">{format(safeDate(latest.testDate), "dd MMM yyyy")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "record" && recordView === "visits" && (
              <div>
                <div className="px-5 py-3 border-b border-border" style={{ background: "hsl(240 6% 97%)" }}>
                  <p className="text-xs font-semibold text-muted-foreground">{text(`${patient.visits?.length ?? 0} recorded visits`, `${patient.visits?.length ?? 0} زيارة مُسجّلة`)}</p>
                </div>
                <table className="w-full data-table">
                  <thead><tr>
                    <th>{text("Hospital", "المستشفى")}</th><th>{text("Department", "القسم")}</th><th>{text("Physician", "الطبيب")}</th><th>{text("Visit Type", "نوع الزيارة")}</th><th>{text("Diagnosis", "التشخيص")}</th><th>{text("Date", "التاريخ")}</th>
                  </tr></thead>
                  <tbody>
                    {patient.visits?.map(visit => (
                      <tr key={visit.id}>
                        <td className="font-bold text-foreground">{visit.hospital}</td>
                        <td>{visit.department}</td>
                        <td className="text-muted-foreground">{visit.doctor ? `${text("Dr.", "د.")} ${visit.doctor}` : "—"}</td>
                        <td><Badge variant={visit.visitType === "emergency" ? "destructive" : visit.visitType === "inpatient" ? "warning" : "outline"}>{text(visit.visitType, visitTypeAr(visit.visitType))}</Badge></td>
                        <td className="text-muted-foreground max-w-xs truncate">{visit.diagnosis}</td>
                        <td className="text-muted-foreground font-mono text-xs" dir="ltr">{format(safeDate(visit.visitDate), "dd MMM yyyy")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "alerts" && (
              <div>
                <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ background: "hsl(240 6% 97%)" }}>
                  <div className="flex items-center gap-2">
                    {unreadAlerts > 0 && <Badge variant="destructive">{text(`${unreadAlerts} unread`, `${unreadAlerts} غير مقروء`)}</Badge>}
                    <span className="text-xs text-muted-foreground">{text(`${alerts.length} total alerts`, `${alerts.length} إجمالي التنبيهات`)}</span>
                  </div>
                  {unreadAlerts > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        for (const a of alerts.filter(al => !al.isRead)) {
                          await markReadMutation.mutateAsync({ id: a.id });
                        }
                        refetchAlerts();
                      }}
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> {text("Mark all read", "تحديد الكل كمقروء")}
                    </Button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <div className="py-12 text-center">
                    <BellOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-bold text-foreground mb-1">{text("No Alerts", "لا توجد تنبيهات")}</p>
                    <p className="text-sm text-muted-foreground">{text("No clinical alerts for this patient.", "لا توجد تنبيهات سريرية لهذا المريض.")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {alerts.map(alert => (
                      <div key={alert.id} className={`flex items-start gap-4 px-5 py-4 transition-colors ${alert.isRead ? "opacity-60" : "bg-risk-high-bg/30"}`}>
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          alert.severity === "critical" ? "bg-red-600" :
                          alert.severity === "high" ? "bg-risk-high" :
                          alert.severity === "moderate" ? "bg-sky-500" : "bg-secondary"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant={
                              alert.severity === "critical" ? "destructive" :
                              alert.severity === "high" ? "warning" :
                              alert.severity === "moderate" ? "info" : "outline"
                            } className="text-[10px]">{severityLabel(alert.severity, text)}</Badge>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{alert.alertType}</span>
                          </div>
                          <p className="font-bold text-sm text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono" dir="ltr">
                            {format(safeDate(alert.createdAt), "dd MMM yyyy HH:mm")}
                          </p>
                        </div>
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkRead(alert.id)}
                            className="shrink-0 text-xs"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> {text("Read", "مقروء")}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "intelligence" && (
              <div className="p-5">
                {decisionLoading && (
                  <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600" />
                    <span className="text-sm font-medium">{text("AI Decision Engine processing...", "محرك القرار الذكي قيد المعالجة...")}</span>
                  </div>
                )}
                {!decisionLoading && !aiDecision && (
                  <div className="py-12 text-center">
                    <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-bold text-foreground">{text("No decision data", "لا توجد بيانات قرار")}</p>
                  </div>
                )}
                {!decisionLoading && aiDecision && (
                  <div className="space-y-5">
                    {/* Urgency Header Strip */}
                    <div className={`rounded-2xl p-5 ${
                      aiDecision.urgency === "immediate" ? "bg-red-600 text-white" :
                      aiDecision.urgency === "urgent" ? "bg-risk-high text-white" :
                      aiDecision.urgency === "soon" ? "bg-sky-500 text-white" :
                      "bg-emerald-500 text-white"
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{text("Urgency Level", "درجة الاستعجال")}</span>
                            <span className="bg-card/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {urgencyLabel(aiDecision.urgency, text)}
                            </span>
                          </div>
                          <p className="text-lg font-bold leading-snug">{aiDecision.primaryAction}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                              <Clock className="w-3.5 h-3.5" /> {aiDecision.timeWindow}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                              <Zap className="w-3.5 h-3.5" /> {text("Confidence:", "مستوى الثقة:")} {Math.round(aiDecision.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-5xl font-bold tabular-nums leading-none" dir="ltr">{aiDecision.riskScore}</p>
                          <p className="text-white/60 text-xs mt-1">/ 100</p>
                          <p className="text-xs font-bold uppercase tracking-wide mt-2 text-white/80">{text(`${aiDecision.riskLevel} risk`, `خطورة ${riskLevelLabel(aiDecision.riskLevel, text)}`)}</p>
                        </div>
                      </div>
                      {aiDecision.explainability.uncertaintyNote && (
                        <div className="mt-3 px-3 py-2 bg-card/20 rounded-xl text-xs font-semibold text-white">
                          ⚠ {aiDecision.explainability.uncertaintyNote}
                        </div>
                      )}
                    </div>

                    {/* WHY Factors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                          <TriangleAlert className="w-3.5 h-3.5 text-risk-high" /> {text("WHY — Clinical Factors", "المُبرّرات — العوامل السريرية")}
                        </p>
                        <div className="space-y-2">
                          {aiDecision.whyFactors.map((f, i) => (
                            <div key={i} className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border ${
                              f.impact === "critical" ? "bg-destructive/10 border-red-200" :
                              f.impact === "high" ? "bg-risk-high-bg border-risk-high/20" :
                              f.impact === "moderate" ? "bg-sky-50 border-sky-200" :
                              "bg-secondary border-border"
                            }`}>
                              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                f.impact === "critical" ? "bg-red-600" :
                                f.impact === "high" ? "bg-risk-high" :
                                f.impact === "moderate" ? "bg-sky-500" : "bg-muted-foreground"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-foreground truncate">{f.factor}</span>
                                  <Badge variant={f.impact === "critical" ? "destructive" : f.impact === "high" ? "warning" : f.impact === "moderate" ? "info" : "outline"} className="text-[9px] shrink-0">+{f.contribution}</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{f.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Recommendations */}
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-primary" /> {text("Recommended Actions", "الإجراءات الموصى بها")}
                          </p>
                          <div className="space-y-2">
                            {aiDecision.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 bg-primary/5 border border-primary/15 rounded-xl">
                                <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground leading-snug">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explainability */}
                        <div className="p-4 bg-secondary rounded-2xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("Clinical Basis", "الأساس السريري")}</p>
                          <div className="space-y-1">
                            {aiDecision.explainability.clinicalBasis.map((b, i) => (
                              <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                                <span className="text-primary shrink-0">·</span> {b}
                              </p>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] text-muted-foreground font-mono">{text("SOURCE:", "المصدر:")} {aiDecision.source}</span>
                            <span className="ms-auto text-[10px] font-bold text-foreground">{text("CONFIDENCE:", "مستوى الثقة:")} {Math.round(aiDecision.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Digital Twin */}
                    {aiDecision.digitalTwin && (
                      <div className={`p-5 rounded-2xl border-2 ${
                        aiDecision.digitalTwin.riskTrajectory === "rapidly_worsening" ? "bg-destructive/10 border-red-300" :
                        aiDecision.digitalTwin.riskTrajectory === "worsening" ? "bg-risk-high-bg border-risk-high/20" :
                        aiDecision.digitalTwin.riskTrajectory === "improving" ? "bg-emerald-50 border-emerald-200" :
                        "bg-secondary border-border"
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                              <Brain className="w-3.5 h-3.5 text-violet-600" /> {text("Digital Twin", "التوأم الرقمي")} — {aiDecision.digitalTwin.timeframe}
                            </p>
                            <p className="font-bold text-foreground">{text("Trajectory:", "المسار:")} <span className={
                              aiDecision.digitalTwin.riskTrajectory === "rapidly_worsening" ? "text-red-600" :
                              aiDecision.digitalTwin.riskTrajectory === "worsening" ? "text-risk-high" :
                              aiDecision.digitalTwin.riskTrajectory === "improving" ? "text-emerald-600" :
                              "text-muted-foreground"
                            }>{trajectoryLabel(aiDecision.digitalTwin.riskTrajectory, text)}</span></p>
                          </div>
                          <div className="text-end">
                            <p className="text-xs text-muted-foreground">{text("Projected Risk Score", "درجة الخطورة المتوقعة")}</p>
                            <p className={`text-3xl font-bold tabular-nums ${
                              aiDecision.digitalTwin.projectedRiskScore >= 70 ? "text-red-600" :
                              aiDecision.digitalTwin.projectedRiskScore >= 50 ? "text-risk-high" : "text-emerald-600"
                            }`}>{aiDecision.digitalTwin.projectedRiskScore}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
                          </div>
                        </div>
                        {aiDecision.digitalTwin.predictedConditions.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {aiDecision.digitalTwin.predictedConditions.map((c, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-risk-high mt-0.5" />
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="px-3 py-2 bg-card/60 rounded-xl">
                          <p className="text-xs font-semibold text-foreground">{aiDecision.digitalTwin.interventionWindow}</p>
                        </div>
                      </div>
                    )}

                    {/* Behavioral Flags */}
                    {aiDecision.behavioralFlags && aiDecision.behavioralFlags.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-sky-600" /> {text("Behavioral AI Flags", "إشارات سلوكية ذكية")}
                        </p>
                        <div className="space-y-2">
                          {aiDecision.behavioralFlags.map((flag, i) => (
                            <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${
                              flag.severity === "high" ? "bg-risk-high-bg border-risk-high/20" :
                              flag.severity === "moderate" ? "bg-sky-50 border-sky-200" :
                              "bg-secondary border-border"
                            }`}>
                              <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${
                                flag.severity === "high" ? "text-risk-high" :
                                flag.severity === "moderate" ? "text-sky-600" : "text-muted-foreground"
                              }`} />
                              <div>
                                <p className="text-sm font-bold text-foreground">{flag.description}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{text("→", "←")} {flag.recommendation}</p>
                              </div>
                              <Badge variant={flag.severity === "high" ? "warning" : flag.severity === "moderate" ? "info" : "outline"} className="ms-auto shrink-0 text-[9px]">{severityLabel(flag.severity, text)}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "intelligence" && (
              <div className="border-t border-border p-5">
                <div className="flex items-center gap-3 mb-5">
                  <Brain className="w-4 h-4 text-violet-600" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{text("Predictive Warnings", "الإنذارات التنبؤية")}</p>
                  <Badge variant="outline" className="ms-auto">{text(`${predictions.length} total`, `${predictions.length} الإجمالي`)}</Badge>
                </div>
                {predictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{text("No predictive warnings — insufficient clinical data for forecasting.", "لا توجد إنذارات تنبؤية — البيانات السريرية غير كافية للتنبؤ.")}</p>
                ) : (
                  <div className="space-y-3">
                    {predictions.map((p, i) => {
                      const style = predictionSeverityStyle[p.severity] ?? predictionSeverityStyle.low;
                      return (
                        <div key={i} className={`p-4 ${style.bg} border ${style.border} rounded-2xl`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl bg-card flex items-center justify-center shrink-0`}>
                              {p.severity === "critical" || p.severity === "high" ? (
                                <TriangleAlert className={`w-4 h-4 ${style.icon}`} />
                              ) : (
                                <Zap className={`w-4 h-4 ${style.icon}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={style.badge} className="text-[10px]">{severityLabel(p.severity, text)}</Badge>
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{p.type.replace("_", " ")}</span>
                                <span className="ms-auto text-[10px] text-muted-foreground">{text("Confidence:", "مستوى الثقة:")} {severityLabel(p.confidence, text)}</span>
                              </div>
                              <p className="font-bold text-sm text-foreground">{p.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                              <div className="mt-2 p-2.5 bg-card/60 border border-border rounded-xl">
                                <p className="text-xs font-semibold text-foreground">{text("Recommendation:", "التوصية:")} {p.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" /> {text("Immutable Audit Trail — WHO · WHAT · WHEN · WHY", "سجل تدقيق غير قابل للتعديل — مَن · ماذا · متى · لماذا")}
                </p>
                {(!auditData || (auditData as { auditLog?: any[] })?.auditLog?.length === 0) ? (
                  <div className="py-12 text-center">
                    <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-bold text-foreground">{text("No audit records yet", "لا توجد سجلات تدقيق بعد")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{text("Run the Decision Engine to generate audit entries.", "شغّل محرك القرار لتوليد سجلات التدقيق.")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {((auditData as { auditLog?: any[] })?.auditLog ?? []).map((log: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 bg-secondary rounded-2xl border border-border">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-foreground">{log.what}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {text("WHO:", "مَن:")} <span className="font-semibold">{log.who}</span> · {text("ROLE:", "الدور:")} {log.whoRole}
                                {log.confidence && ` · ${text("CONFIDENCE:", "الثقة:")} ${Math.round(log.confidence * 100)}%`}
                              </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono shrink-0" dir="ltr">
                              {log.createdAt ? format(new Date(log.createdAt), "dd MMM yyyy HH:mm") : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "intelligence" && (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="sanad-print-hidden flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{text("SANAD AI — Clinical Narrative", "ذكاء سند — السرد السريري")}</p>
                      <p className="text-[11px] text-muted-foreground">{narrativeProvider || text("Real-time clinical summary", "ملخّص سريري فوري")} · {text("Real-time streaming · Bilingual", "بث فوري · ثنائي اللغة")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePrintNarrative}
                      disabled={!narrativeText.trim()}
                      variant="outline"
                      size="sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> {text("Print Summary", "طباعة الملخّص")}
                    </Button>
                    <Button
                      onClick={fetchNarrative}
                      disabled={narrativeLoading}
                      variant="primary"
                      size="sm"
                    >
                      {narrativeLoading
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {text("Generating...", "جارٍ التوليد...")}</>
                        : <><Sparkles className="w-3.5 h-3.5" /> {text("Generate Narrative", "توليد السرد")}</>
                      }
                    </Button>
                  </div>
                </div>

                <section className="sanad-print-summary" aria-label="Printable AI clinical summary">
                  <header className="sanad-print-summary-header">
                    <h1>منصة سناد - ملخص سريري بالذكاء الاصطناعي</h1>
                  </header>
                  <dl className="sanad-print-summary-meta">
                    <div>
                      <dt>{text("Patient Name", "اسم المريض")}</dt>
                      <dd>{patient.fullName}</dd>
                    </div>
                    <div>
                      <dt>{text("National ID", "رقم الهوية الوطنية")}</dt>
                      <dd dir="ltr">{patient.nationalId}</dd>
                    </div>
                    <div>
                      <dt>{text("Date", "التاريخ")}</dt>
                      <dd dir="ltr">{format(new Date(), "dd MMM yyyy HH:mm")}</dd>
                    </div>
                  </dl>
                  <article className="sanad-print-summary-body">
                    {narrativeText || text("No AI narrative has been generated yet.", "لم يُولّد سرد ذكاء اصطناعي بعد.")}
                  </article>
                  <footer className="sanad-print-summary-footer">
                    تم توليده بواسطة SANAD AI · {format(new Date(), "dd MMM yyyy HH:mm")}
                  </footer>
                </section>

                {/* Narrative output */}
                <div
                  ref={narrativeRef}
                  className="sanad-print-hidden min-h-[220px] rounded-2xl bg-secondary border border-border p-5 relative"
                >
                  {!narrativeText && !narrativeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Brain className="w-8 h-8 opacity-25" />
                      <p className="text-sm">{text("Click", "اضغط")} <strong>{text("Generate Narrative", "توليد السرد")}</strong> {text("to get a live AI clinical summary", "للحصول على ملخّص سريري فوري بالذكاء الاصطناعي")}</p>
                    </div>
                  )}
                  {narrativeLoading && !narrativeText && (
                    <div className="flex items-center gap-2 text-violet-600 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{text("Connecting to AI...", "جارٍ الاتصال بالذكاء الاصطناعي...")}</span>
                    </div>
                  )}
                  {narrativeText && (
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm font-mono">
                      {narrativeText}
                      {narrativeLoading && (
                        <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  )}
                </div>

                {/* Chat / Q&A */}
                <div className="sanad-print-hidden rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary border-b border-border">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{text("Ask the AI about this patient", "اسأل الذكاء الاصطناعي عن هذا المريض")}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                        placeholder={text("e.g. What are the main drug risks for this patient?", "مثال: ما هي أبرز المخاطر الدوائية لهذا المريض؟")}
                        value={chatQuestion}
                        onChange={e => setChatQuestion(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendChatQuestion()}
                        disabled={chatLoading}
                      />
                      <Button
                        onClick={sendChatQuestion}
                        disabled={chatLoading || !chatQuestion.trim()}
                        variant="primary"
                        size="sm"
                      >
                        {chatLoading
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Send className="w-3.5 h-3.5" />
                        }
                      </Button>
                    </div>
                    {chatAnswer && (
                      <div className="rounded-xl bg-violet-50 border border-violet-100 p-3.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2">{text("AI Response", "رد الذكاء الاصطناعي")}</p>
                        {chatAnswer}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "intelligence" && riskScore && (
              <div className="p-5">
                <div className="flex items-start gap-6">
                  <div className="rounded-2xl p-6 min-w-[200px] text-center border"
                    style={{
                      background: `hsl(var(--risk-${riskScore.riskLevel}-bg))`,
                      borderColor: `hsl(var(--risk-${riskScore.riskLevel}) / 0.2)`,
                    }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{text("AI Risk Score", "درجة الخطورة")}</p>
                    <p className="text-6xl font-bold tabular-nums leading-none" dir="ltr"
                      style={{ color: `hsl(var(--risk-${riskScore.riskLevel}))` }}>
                      {riskScore.riskScore}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">{text("/ 100 risk score", "/ 100 درجة الخطورة")}</p>
                    <RiskBadge
                      level={riskScore.riskLevel as "critical" | "high" | "medium" | "low"}
                      className="mt-4"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                        {text(`${riskScore.factors.length} Risk Factors Identified`, `${riskScore.factors.length} عامل خطورة مُحدّد`)}
                      </p>
                      <div className="space-y-2.5">
                        {riskScore.factors.map((f: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3.5 bg-secondary rounded-2xl">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                              f.impact === "high" ? "bg-red-500" :
                              f.impact === "moderate" ? "bg-risk-high" : "bg-primary"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-foreground">{f.factor}</span>
                                <Badge variant={
                                  f.impact === "high" ? "destructive" :
                                  f.impact === "moderate" ? "warning" : "info"
                                } className="text-[10px] shrink-0">{text(`${f.impact} impact`, `تأثير ${f.impact === "high" ? "مرتفع" : f.impact === "moderate" ? "متوسط" : "منخفض"}`)}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {riskScore.recommendations && riskScore.recommendations.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{text("Clinical Recommendations", "التوصيات السريرية")}</p>
                        <div className="space-y-2">
                          {riskScore.recommendations.map((rec: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <p className="text-xs text-foreground">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </Layout>
  );
}

function PrescribeModal({ patientId }: { patientId: number }) {
  const { text, dir, locale, toggleLocale } = useLanguage();

  
  const [isOpen, setIsOpen] = useState(false);
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");

  const checkMutation = useCheckDrugInteraction();
  const prescribeMutation = usePrescribeMedication();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName) return;
    await checkMutation.mutateAsync({ data: { patientId, newDrug: drugName } });
  };

  const handlePrescribe = async () => {
    await prescribeMutation.mutateAsync({
      data: {
        patientId, drugName, dosage, frequency,
        prescribedBy: "Dr. Ahmed Al-Rashidi",
        hospital: "King Fahd Medical City",
        startDate: new Date().toISOString().split("T")[0]!,
      }
    });
    setIsOpen(false);
    setDrugName(""); setDosage(""); setFrequency("");
    checkMutation.reset();
    window.location.reload();
  };

  const close = () => {
  const { text, dir, locale, toggleLocale } = useLanguage();
 setIsOpen(false); checkMutation.reset(); };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" variant="primary" className="w-full">
        <Syringe className="w-3.5 h-3.5" /> {text("Prescribe Medication", "وصف دواء")}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground text-base">{text("Prescribe Medication", "وصف دواء")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{text("AI drug interaction check will be performed before confirming.", "سيُجرى فحص التداخل الدوائي بالذكاء الاصطناعي قبل التأكيد.")}</p>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleCheck} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("Drug Name", "اسم الدواء")}</label>
                  <Input
                    value={drugName}
                    onChange={e => setDrugName(e.target.value)}
                    placeholder={text("e.g. Warfarin, Aspirin, Metformin...", "مثال: وارفارين، أسبرين، ميتفورمين...")}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("Dosage", "الجرعة")}</label>
                    <Input value={dosage} onChange={e => setDosage(e.target.value)} required placeholder={text("e.g. 50mg", "مثال: 50 مجم")} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("Frequency", "التكرار")}</label>
                    <Select value={frequency} onChange={e => setFrequency(e.target.value)} required>
                      <option value="">{text("Select...", "اختر...")}</option>
                      <option value="Once daily">{text("Once daily", "مرة يوميًا")}</option>
                      <option value="Twice daily">{text("Twice daily", "مرتين يوميًا")}</option>
                      <option value="Three times daily">{text("Three times daily", "ثلاث مرات يوميًا")}</option>
                      <option value="Every 8 hours">{text("Every 8 hours", "كل 8 ساعات")}</option>
                      <option value="As needed">{text("As needed", "عند الحاجة")}</option>
                    </Select>
                  </div>
                </div>
                {!checkMutation.data && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={close}>{text("Cancel", "إلغاء")}</Button>
                    <Button type="submit" isLoading={checkMutation.isPending}>
                      <Shield className="w-3.5 h-3.5" /> {text("Run AI Check", "تشغيل الفحص الذكي")}
                    </Button>
                  </div>
                )}
              </form>

              {checkMutation.data && (
                <div className="space-y-3 border-t border-border pt-4">
                  {checkMutation.data.safe ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <Shield className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-700 text-sm">{text("No Interactions Detected", "لم تُكتشف تداخلات دوائية")}</p>
                        <p className="text-xs text-muted-foreground">{text("Safe to prescribe based on current medication profile.", "آمن للوصف بناءً على ملف الأدوية الحالي.")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {checkMutation.data.warnings.map((w: any, i: number) => (
                        <div key={i} className="p-4 bg-destructive/10 border border-red-200 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-bold text-red-700">{text("Interaction:", "تداخل:")} {w.conflictingDrug}</span>
                            <Badge variant={w.severity === "critical" ? "destructive" : "warning"} className="ms-auto text-[10px]">{severityLabel(w.severity, text)}</Badge>
                          </div>
                          <p className="text-xs text-foreground/80 mb-2 ms-6">{w.description}</p>
                          <p className="text-xs font-semibold bg-card border border-red-100 rounded-xl p-2 ms-6">{w.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={close}>{text("Cancel", "إلغاء")}</Button>
                    <Button
                      variant={checkMutation.data.safe ? "primary" : "destructive"}
                      size="sm"
                      onClick={handlePrescribe}
                      isLoading={prescribeMutation.isPending}
                    >
                      {checkMutation.data.safe ? text("Confirm & Prescribe", "تأكيد ووصف") : text("Override & Prescribe", "تجاوز ووصف")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

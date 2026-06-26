import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Badge, PageHeader, KpiCard
, SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  Building2, BedDouble, Users, Brain, Activity, AlertTriangle,
  TrendingUp, Zap, Lightbulb, ChevronRight, Stethoscope, Clock,
  HeartPulse, RefreshCw, CheckCircle2, Phone
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";

async function fetchHospitalOverview() {
  const res = await apiFetch("/api/hospital/overview");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const UNIT_COLORS: Record<string, string> = {
  Icu: "hsl(var(--destructive))",
  General: "hsl(var(--primary))",
  Emergency: "hsl(var(--warning))",
  Pediatric: "hsl(var(--success))",
  Maternity: "hsl(var(--violet-500))",
  Surgical: "hsl(var(--cyan-500))",
};

const PRIORITY_COLORS = {
  immediate: { bg: "bg-danger-bg", border: "border-danger/30", badge: "destructive" as const, text: "text-danger" },
  urgent: { bg: "bg-risk-high-bg", border: "border-risk-high/20", badge: "warning" as const, text: "text-risk-high" },
  soon: { bg: "bg-info-bg", border: "border-info/20", badge: "info" as const, text: "text-info" },
};

const OR_STATUS = {
  in_progress: { bg: "bg-success-bg", border: "border-success/30", badge: "success" as const, label: "In Progress", labelAr: "قيد التنفيذ", dot: "bg-success animate-pulse" },
  scheduled: { bg: "bg-info-bg", border: "border-info/20", badge: "info" as const, label: "Scheduled", labelAr: "مجدوَل", dot: "bg-info" },
  emergency: { bg: "bg-danger-bg", border: "border-danger/30", badge: "destructive" as const, label: "Emergency", labelAr: "طارئ", dot: "bg-danger animate-pulse" },
};

type TabId = "overview" | "icu" | "or" | "readmission";

export default function HospitalPortal() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["hospital-overview"],
    queryFn: fetchHospitalOverview,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Layout role="hospital" localized>
        <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span className="text-sm font-medium">{text("Loading hospital operations...", "جارٍ تحميل عمليات المستشفى...")}</span>
        </div>
      </Layout>
    );
  }

  const icuCritical = (data?.icuAlerts ?? []).filter((a: any) => a.severity === "critical").length;

  return (
    <Layout role="hospital" localized>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest">
          <Building2 className="w-3 h-3" />
          {text("Hospital Operations Center", "مركز عمليات المستشفى")}
        </div>
        {icuCritical > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-danger bg-danger-bg border border-danger/20 px-3 py-1.5 rounded-full ms-2 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {text(`${icuCritical} ICU Critical Alert${icuCritical > 1 ? "s" : ""}`, `${icuCritical} تنبيه حرج بالعناية المركّزة`)}
          </div>
        )}
        <button
          onClick={() => refetch()}
          className="ms-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          {text("Refresh", "تحديث")}
        </button>
        <span className="text-[11px] font-mono text-muted-foreground">{text("Live · auto-refresh 60s", "مباشر · تحديث تلقائي 60ث")}</span>
      </div>

      <PageHeader
        title={data?.hospitalName ?? text("Hospital Portal", "بوابة المستشفى")}
        subtitle={text("Bed management · ICU alerts · OR scheduling · Readmission risk", "إدارة الأسرّة · تنبيهات العناية المركزة · جدولة العمليات · خطر إعادة التنويم")}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <KpiCard
          title={text("Total Beds", "إجمالي الأسرّة")}
          value={data?.totalBeds?.toLocaleString() ?? "—"}
          icon={BedDouble}
          sub={text(`${data?.overallOccupancy}% occupied`, `${data?.overallOccupancy}% إشغال`)}
          trend={data?.overallOccupancy >= 80 ? text("High Occupancy", "إشغال مرتفع") : text("Normal", "طبيعي")}
        />
        <KpiCard
          title={text("Occupied Beds", "الأسرّة المشغولة")}
          value={data?.totalOccupied?.toLocaleString() ?? "—"}
          icon={Users}
          sub={text(`${(data?.totalBeds ?? 0) - (data?.totalOccupied ?? 0)} available`, `${(data?.totalBeds ?? 0) - (data?.totalOccupied ?? 0)} متاح`)}
        />
        <KpiCard
          title={text("OR Today", "عمليات اليوم")}
          value={data?.pendingSurgeries ?? "—"}
          icon={Stethoscope}
          sub={text(`${(data?.orSchedule ?? []).filter((s: any) => s.status === "in_progress").length} in progress`, `${(data?.orSchedule ?? []).filter((s: any) => s.status === "in_progress").length} قيد التنفيذ`)}
        />
        <KpiCard
          title={text("Avg Length of Stay", "متوسط مدة الإقامة")}
          value={text(`${data?.avgLengthOfStay} days`, `${data?.avgLengthOfStay} يوم`)}
          icon={Zap}
          sub={text(`${data?.dischargesToday} discharges today`, `${data?.dischargesToday} خروج اليوم`)}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {([
          { id: "overview", label: "Bed Overview", labelAr: "نظرة عامة على الأسرة" },
          { id: "icu", label: `ICU Alerts${icuCritical > 0 ? ` (${icuCritical} critical)` : ""}`, labelAr: `تنبيهات العناية المركزة${icuCritical > 0 ? ` (${icuCritical} حرج)` : ""}` },
          { id: "or", label: "OR Schedule", labelAr: "جدول غرف العمليات" },
          { id: "readmission", label: "Readmission Risk", labelAr: "خطر الإعادة للمستشفى" },
        ] as { id: TabId; label: string; labelAr: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? tab.id === "icu" && icuCritical > 0
                  ? "bg-danger text-white"
                  : "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "ar" ? tab.labelAr : tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card className="col-span-full lg:col-span-8">
            <CardHeader>
              <BedDouble className="w-4 h-4 text-primary" />
              <CardTitle>{text("Bed Occupancy by Unit", "إشغال الأسرّة حسب القسم")}</CardTitle>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">{text("Live data", "بيانات مباشرة")}</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {data?.bedStatus?.map((unit: any) => {
                  const color = UNIT_COLORS[unit.unit] ?? "hsl(var(--primary))";
                  return (
                    <div key={unit.unitKey} className={`p-4 rounded-2xl border ${
                      unit.status === "critical" ? "bg-danger-bg border-danger/20" :
                      unit.status === "high" ? "bg-risk-high-bg border-risk-high/20" :
                      "bg-secondary border-border"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-foreground">{unit.unit}</p>
                        <Badge variant={
                          unit.status === "critical" ? "destructive" :
                          unit.status === "high" ? "warning" :
                          unit.status === "moderate" ? "info" : "success"
                        } className="text-[9px]">
                          {text(
                            unit.status === "critical" ? "Critical" : unit.status === "high" ? "High" : unit.status === "moderate" ? "Moderate" : "Normal",
                            unit.status === "critical" ? "حرج" : unit.status === "high" ? "مرتفع" : unit.status === "moderate" ? "متوسط" : "طبيعي"
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-3xl font-bold tabular-nums" style={{ color }}>{unit.occupancyPct}%</p>
                          <p className="text-[10px] text-muted-foreground">{text("occupancy", "إشغال")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-foreground">{unit.occupied} / {unit.total}</p>
                          <p className="text-[10px] text-muted-foreground">{unit.available} {text("available", "متاح")}</p>
                        </div>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${unit.occupancyPct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <Users className="w-4 h-4 text-primary" />
              <CardTitle>{text("Staff Allocation", "توزيع الكوادر")}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { label: text("Total Doctors", "إجمالي الأطباء"), value: data?.staffKPIs?.doctors, icon: Stethoscope },
                  { label: text("Total Nurses", "إجمالي الممرضين"), value: data?.staffKPIs?.nurses, icon: Activity },
                  { label: text("Specialists", "الأخصائيون"), value: data?.staffKPIs?.specialists, icon: Brain },
                  { label: text("Currently On Duty", "في الخدمة الآن"), value: data?.staffKPIs?.onDuty, icon: CheckCircle2 },
                  { label: text("Available for Call", "متاح للنداء"), value: data?.staffKPIs?.available, icon: Phone },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                  <div key={item.label} className="flex items-center justify-between px-3.5 py-2.5 bg-secondary rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-foreground">{item.value?.toLocaleString()}</p>
                  </div>
                )})}
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-primary/5 border border-primary/15 rounded-xl">
                    <p className="text-[10px] font-bold text-muted-foreground">{text("Doctor : Patient", "طبيب : مريض")}</p>
                    <p className="text-xs font-bold text-primary font-mono">{data?.staffKPIs?.doctorPatientRatio}</p>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2 bg-primary/5 border border-primary/15 rounded-xl">
                    <p className="text-[10px] font-bold text-muted-foreground">{text("Nurse : Patient", "ممرض : مريض")}</p>
                    <p className="text-xs font-bold text-primary font-mono">{data?.staffKPIs?.nursePatientRatio}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12">
            <CardHeader>
              <Brain className="w-4 h-4 text-violet-600" />
              <CardTitle>{text("AI Capacity Intelligence", "ذكاء استيعاب المرضى")}</CardTitle>
              <Badge variant="outline" className="ml-auto">{text("Predictive Analysis", "تحليل تنبؤي")}</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                {data?.aiCapacityInsights?.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 bg-secondary rounded-2xl border border-border">
                    <Lightbulb className="w-4 h-4 text-risk-high shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12">
            <CardHeader>
              <AlertTriangle className="w-4 h-4 text-risk-high" />
              <CardTitle>{text("AI Priority Patient Queue", "قائمة انتظار المرضى — الأولوية السريرية")}</CardTitle>
              <Badge variant="outline" className="ml-auto">{text("Sorted by Clinical Priority · High → Low", "مُرتَّب حسب الأولوية السريرية · من الأعلى")}</Badge>
            </CardHeader>
            <div className="overflow-x-auto"><table className="w-full data-table">
              <thead>
                <tr>
                  <th>{text("Triage", "الفرز")}</th>
                  <th>{text("Patient", "المريض")}</th>
                  <th>{text("Age", "العمر")}</th>
                  <th>{text("Priority Index", "مؤشر الأولوية")}</th>
                  <th>{text("Conditions", "الحالات")}</th>
                  <th>{text("Suggested Ward", "الجناح المقترح")}</th>
                  <th>{text("Last Visit", "آخر زيارة")}</th>
                </tr>
              </thead>
              <tbody>
                {data?.priorityQueue?.map((p: any, i: number) => {
                  const style = PRIORITY_COLORS[p.priority as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.soon;
                  return (
                    <tr key={p.id} className={i < 3 ? "bg-destructive/10/20" : ""}>
                      <td><Badge variant={style.badge} className="text-[9px]">{p.priority}</Badge></td>
                      <td>
                        <p className="font-bold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.nationalId}</p>
                      </td>
                      <td className="tabular-nums">{p.age}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${p.riskScore >= 70 ? "text-danger" : p.riskScore >= 50 ? "text-risk-high" : "text-foreground"}`}>{p.riskScore}<span className="text-[10px] font-normal opacity-40">/100</span></span>
                          <div className="w-16 bg-secondary rounded-full h-1.5">
                            <div className={`h-full rounded-full ${p.riskScore >= 70 ? "bg-danger" : p.riskScore >= 50 ? "bg-risk-high" : "bg-success"}`} style={{ width: `${p.riskScore}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {p.chronicConditions.slice(0, 2).map((c: string) => (
                            <span key={c} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full font-medium">{c}</span>
                          ))}
                          {p.chronicConditions.length > 2 && <span className="text-[9px] text-muted-foreground">+{p.chronicConditions.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.suggestedWard === "ICU" ? "bg-danger-bg text-danger" : p.suggestedWard === "Emergency" ? "bg-risk-high-bg text-risk-high" : "bg-info-bg text-info"}`}>{p.suggestedWard}</span>
                      </td>
                      <td className="text-[10px] text-muted-foreground font-mono">
                        {p.lastVisit ? `${p.lastVisit.date} · ${p.lastVisit.department}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </Card>
        </div>
      )}

      {activeTab === "icu" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-danger-bg border-2 border-danger/30 rounded-2xl">
            <HeartPulse className="w-5 h-5 text-danger shrink-0" />
            <div>
              <p className="text-sm font-bold text-danger">{text("ICU Alert System — Real-time Patient Monitoring", "نظام تنبيهات العناية المركزة — مراقبة المرضى لحظياً")}</p>
              <p className="text-xs text-danger mt-0.5">{(data?.icuAlerts ?? []).length} {text("patients flagged ·", "مرضى مُعلَّمون ·")} {icuCritical} {text("require immediate action", "يستوجبون تدخلاً فورياً")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(data?.icuAlerts ?? []).map((alert: any, i: number) => (
              <div key={i} className={`p-5 rounded-2xl border-2 ${alert.severity === "critical" ? "bg-danger-bg border-danger/30" : "bg-risk-high-bg border-risk-high/20"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === "critical" ? "bg-danger-bg" : "bg-risk-high-bg"}`}>
                    <AlertTriangle className={`w-5 h-5 ${alert.severity === "critical" ? "text-danger" : "text-risk-high"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-foreground">{alert.name}</p>
                      <Badge variant={alert.severity === "critical" ? "destructive" : "warning"} className="text-[9px]">{alert.severity.toUpperCase()}</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">{alert.nationalId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-bold ${alert.riskScore >= 90 ? "text-danger" : "text-risk-high"}`}>{alert.riskScore}<span className="text-[11px] font-normal opacity-40">/100</span></p>
                    <p className="text-[10px] text-muted-foreground">{text("priority index", "مؤشر الأولوية")}</p>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-xl mb-2 ${alert.severity === "critical" ? "bg-danger-bg" : "bg-risk-high-bg"}`}>
                  <p className={`text-xs font-bold ${alert.severity === "critical" ? "text-danger" : "text-risk-high"}`}>{alert.alertType}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className={`w-3 h-3 ${alert.severity === "critical" ? "text-danger" : "text-risk-high"}`} />
                    <p className={`text-[11px] font-bold ${alert.severity === "critical" ? "text-danger" : "text-risk-high"}`}>{text("Time window:", "النافذة الزمنية:")} {alert.timeWindow}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {alert.conditions.map((c: string, ci: number) => (
                    <span key={ci} className="text-[10px] font-semibold bg-card/80 border border-danger/20 text-danger px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "or" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-info-bg border border-info/20 rounded-2xl">
            <Stethoscope className="w-5 h-5 text-info shrink-0" />
            <div>
              <p className="text-sm font-bold text-info">{text("Operating Room Schedule — Today", "جدول غرف العمليات — اليوم")}</p>
              <p className="text-xs text-info mt-0.5">{(data?.orSchedule ?? []).length} {text("procedures ·", "إجراء ·")} {(data?.orSchedule ?? []).filter((s: any) => s.status === "in_progress").length} {text("in progress ·", "قيد التنفيذ ·")} {(data?.orSchedule ?? []).filter((s: any) => s.status === "emergency").length} {text("emergency", "طارئ")}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <Stethoscope className="w-4 h-4 text-info" />
              <CardTitle>{text("OR Schedule", "جدول العمليات")}</CardTitle>
              <Badge variant="outline" className="ml-auto">{(data?.orSchedule ?? []).length} {text("procedures today", "إجراء اليوم")}</Badge>
            </CardHeader>
            <div className="divide-y divide-border">
              {(data?.orSchedule ?? []).map((op: any, i: number) => {
                const cfg = OR_STATUS[op.status as keyof typeof OR_STATUS] ?? OR_STATUS.scheduled;
                return (
                  <div key={i} className={`p-5 ${op.status === "emergency" ? "bg-destructive/10/30" : op.status === "in_progress" ? "bg-[hsl(var(--risk-low)/0.1)]/30" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-foreground">{op.procedure}</p>
                          <Badge variant={cfg.badge} className="text-[9px]">{locale === "ar" ? cfg.labelAr : cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{op.patient} · {op.surgeon}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-sm font-bold text-foreground">{op.room}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{op.scheduledTime} · {op.estimatedDuration}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "readmission" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
            <Brain className="w-5 h-5 text-violet-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-violet-800">{text("AI Readmission Risk Analysis", "تحليل الذكاء الاصطناعي — خطر الإعادة للمستشفى")}</p>
              <p className="text-xs text-violet-600 mt-0.5">{text("Patients with highest 30-day readmission probability — AI-calculated from clinical history", "المرضى الأعلى احتمالاً للعودة خلال 30 يوماً — محسوب بالذكاء الاصطناعي من السجل السريري")}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <CardTitle>{text("Readmission Risk — Top Patients", "خطر الإعادة — أعلى المرضى")}</CardTitle>
              <Badge variant="outline" className="ml-auto">{text("Sorted by risk %", "مرتب حسب نسبة الخطر")}</Badge>
            </CardHeader>
            <div className="divide-y divide-border">
              {(data?.readmissionRisks ?? []).map((p: any, i: number) => (
                <div key={i} className={`p-5 ${p.readmissionRisk >= 80 ? "bg-destructive/10/30" : p.readmissionRisk >= 60 ? "bg-risk-high-bg/20" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${p.readmissionRisk >= 80 ? "bg-danger-bg" : p.readmissionRisk >= 60 ? "bg-risk-high-bg" : "bg-secondary"}`}>
                      <p className={`text-lg font-bold tabular-nums ${p.readmissionRisk >= 80 ? "text-danger" : p.readmissionRisk >= 60 ? "text-risk-high" : "text-foreground"}`}>{p.readmissionRisk}%</p>
                      <p className="text-[9px] text-muted-foreground">{text("risk", "خطر")}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">{p.nationalId}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded-full text-foreground">{p.primaryReason}</span>
                        <span className="text-[10px] text-muted-foreground">{text("Last discharge:", "آخر خروج:")} {p.lastDischarge}</span>
                      </div>
                    </div>
                    <div className="shrink-0 max-w-[200px] text-right">
                      <div className={`flex items-start gap-1.5 px-3 py-2 rounded-xl ${p.readmissionRisk >= 80 ? "bg-danger-bg border border-danger/20" : "bg-secondary border border-border"}`}>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${p.readmissionRisk >= 80 ? "text-danger" : "text-primary"}`} />
                        <p className={`text-[11px] font-semibold ${p.readmissionRisk >= 80 ? "text-danger" : "text-foreground"}`}>{p.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

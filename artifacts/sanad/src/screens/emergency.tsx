import React, { useState } from "react";
import {
  Search, AlertTriangle, Droplet, Pill, FileWarning,
  PhoneCall, Activity, ChevronRight, Clock,
  ShieldAlert, Ban, Eye, UserCheck, Wrench, PauseCircle, Brain,
  Target, Timer
} from "lucide-react";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Badge, PageHeader, StatusDot, DataLabel
, SkeletonCard, ErrorBanner} from "@/components/shared";
import { useEmergencyLookup, useListPatients } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/language-context";

type TextFn = (en: string, ar: string) => string;

// Localized labels for emergency clinical actions and priorities.
const ACTION_LABEL_AR: Record<string, string> = {
  DO_NOT_GIVE: "ممنوع إعطاؤه", HOLD_MEDICATION: "إيقاف مؤقت", URGENT_REVIEW: "مراجعة عاجلة",
  ALERT_FAMILY: "إبلاغ الأسرة", MONITOR: "مراقبة", PREPARE_EQUIPMENT: "تجهيز المعدات",
};
const ACTION_LABEL_EN: Record<string, string> = {
  DO_NOT_GIVE: "DO NOT GIVE", HOLD_MEDICATION: "HOLD", URGENT_REVIEW: "URGENT REVIEW",
  ALERT_FAMILY: "ALERT FAMILY", MONITOR: "MONITOR", PREPARE_EQUIPMENT: "PREPARE",
};
function actionLabel(action: string, text: TextFn): string {
  return ACTION_LABEL_AR[action] ? text(ACTION_LABEL_EN[action]!, ACTION_LABEL_AR[action]!) : action;
}
const PRIORITY_AR: Record<string, string> = { immediate: "فوري", urgent: "عاجل", standard: "اعتيادي" };
function priorityLabel(p: string, text: TextFn): string {
  return PRIORITY_AR[p] ? text(p, PRIORITY_AR[p]!) : p;
}
const RISK_AR: Record<string, string> = { critical: "حرجة", high: "مرتفعة", medium: "متوسطة", low: "منخفضة", unknown: "غير معروفة" };
function riskLabel(r: string, text: TextFn): string {
  return RISK_AR[r] ? text(r.toUpperCase(), RISK_AR[r]!) : (r || "").toUpperCase();
}

type ClinicalAction = {
  action: "DO_NOT_GIVE" | "MONITOR" | "URGENT_REVIEW" | "ALERT_FAMILY" | "PREPARE_EQUIPMENT" | "HOLD_MEDICATION";
  priority: "immediate" | "urgent" | "standard";
  description: string;
  reason: string;
};

interface EmergencyPatient {
  id?: number;
  nationalId?: string;
  riskLevel?: "critical" | "high" | "medium" | "low" | "unknown";
  riskScore?: number;
  clinicalActions?: ClinicalAction[];
  [key: string]: unknown;
}

const actionConfig: Record<ClinicalAction["action"], { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  DO_NOT_GIVE: { icon: Ban, color: "text-danger", bg: "bg-danger-bg", border: "border-danger/20", label: "DO NOT GIVE" },
  HOLD_MEDICATION: { icon: PauseCircle, color: "text-risk-high", bg: "bg-risk-high-bg", border: "border-risk-high/20", label: "HOLD" },
  URGENT_REVIEW: { icon: Brain, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", label: "URGENT REVIEW" },
  ALERT_FAMILY: { icon: PhoneCall, color: "text-info", bg: "bg-info-bg", border: "border-info/20", label: "ALERT FAMILY" },
  MONITOR: { icon: Eye, color: "text-risk-high", bg: "bg-risk-high-bg", border: "border-risk-high/20", label: "MONITOR" },
  PREPARE_EQUIPMENT: { icon: Wrench, color: "text-info", bg: "bg-info-bg", border: "border-info/20", label: "PREPARE" },
};

const priorityBadge: Record<ClinicalAction["priority"], string> = {
  immediate: "bg-danger text-white",
  urgent: "bg-risk-high text-white",
  standard: "bg-secondary text-muted-foreground",
};

export default function EmergencyPage() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [nationalId, setNationalId] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const { data: patient, isLoading, isError } = useEmergencyLookup(
    submittedId || "",
    { query: { enabled: !!submittedId, retry: false } }
  );
  const { data: patientsData } = useListPatients(
    { limit: 100 },
    { query: { retry: false } }
  );

  const criticalPatients = (patientsData?.patients ?? [])
    .filter((p: any) => (p.riskScore ?? 0) >= 80)
    .sort((a: any, b: any) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (nationalId.trim()) setSubmittedId(nationalId.trim());
  };

  const handleViewPatient = (patientNationalId: string) => {
    setNationalId(patientNationalId);
    setSubmittedId(patientNationalId);
  };

  const clinicalActions = (patient as unknown as EmergencyPatient)?.clinicalActions as ClinicalAction[] | undefined;
  const immediateActions = clinicalActions?.filter(a => a.priority === "immediate") ?? [];
  const urgentActions = clinicalActions?.filter(a => a.priority !== "immediate") ?? [];

  return (
    <Layout role="emergency" localized>
      <PageHeader
        title={text("Emergency Patient Lookup", "استدعاء بيانات الطوارئ")}
        subtitle={text("Life-critical patient information in under a second. Enter a National ID.", "معلومات المريض الحرجة في أقل من ثانية. أدخل رقم الهوية الوطنية.")}
      />

      {/* The lookup is the job — it stays first, large, and keyboard-ready. */}
      <Card className="mb-4">
        <CardBody className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                inputMode="numeric"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder={text("National ID (e.g. 1000000001)", "رقم الهوية (مثال: 1000000001)")}
                className="h-12 ps-10 font-mono text-base"
                dir="ltr"
              />
            </div>
            <Button type="submit" variant="destructive" size="lg" className="shrink-0 bg-danger hover:bg-danger/80">
              <Search className="h-4 w-4" /> {text("Emergency Lookup", "استدعاء طارئ")}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground" dir="ltr">
            {text("Demo IDs:", "أرقام تجريبية:")} <span className="font-mono">1000000003</span> · <span className="font-mono">1000000009</span> · <span className="font-mono">1000000001</span>
          </p>
        </CardBody>
      </Card>

      {/* Critical queue — compact, secondary to the lookup. */}
      {!patient && !isLoading && criticalPatients.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-danger" />
              <CardTitle>{text("Critical Risk Queue", "قائمة الحالات الحرجة")}</CardTitle>
            </div>
            <Badge variant="destructive">{text(`${criticalPatients.length} patients · risk 80+`, `${criticalPatients.length} مريض · خطورة 80+`)}</Badge>
          </CardHeader>
          <CardBody className="p-2">
            {criticalPatients.slice(0, 6).map((criticalPatient: any) => (
              <button
                key={criticalPatient.id ?? criticalPatient.nationalId}
                type="button"
                onClick={() => handleViewPatient(criticalPatient.nationalId)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-secondary"
              >
                <StatusDot status="critical" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{criticalPatient.fullName}</span>
                  <span className="block font-mono text-xs text-muted-foreground" dir="ltr">{criticalPatient.nationalId}</span>
                </span>
                <Badge variant="destructive" className="shrink-0">{text("Risk", "خطورة")} {criticalPatient.riskScore}</Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
              </button>
            ))}
            {criticalPatients.length > 6 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {text(`+${criticalPatients.length - 6} more in queue`, `+${criticalPatients.length - 6} في القائمة`)}
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 text-muted-foreground py-16 justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-danger" />
          <span className="text-sm font-medium">{text("Retrieving critical patient data...", "جارٍ استدعاء بيانات المريض الحرجة...")}</span>
        </div>
      )}

      {isError && !isLoading && (
        <Card className="border-danger/20 bg-danger-bg">
          <CardBody className="flex items-center gap-4 p-5">
            <div className="w-10 h-10 rounded-2xl bg-danger-bg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="font-bold text-danger">{text("Patient Not Found", "المريض غير موجود")}</p>
              <p className="text-sm text-danger/80 mt-0.5">{text("No record for", "لا يوجد سجل لـ")} <span className="font-mono" dir="ltr">{submittedId}</span>. {text("Verify the National ID and retry.", "تحقّق من رقم الهوية وأعد المحاولة.")}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {patient && (
        <div className="space-y-4">
          {/* TRIAGE LEVEL STRIP */}
          <div className={`rounded-3xl overflow-hidden border-2 ${
            (patient as unknown as EmergencyPatient).riskLevel === "critical" ? "border-danger" :
            (patient as unknown as EmergencyPatient).riskLevel === "high" ? "border-risk-high/50" :
            "border-info/40"
          }`}>
            <div className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-5 ${
              (patient as unknown as EmergencyPatient).riskLevel === "critical" ? "bg-danger" :
              (patient as unknown as EmergencyPatient).riskLevel === "high" ? "bg-risk-high" :
              "bg-info"
            } text-white`}>
              <div className="hidden shrink-0 sm:block">
                <Target className="w-8 h-8 text-white/80" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{text("Triage Level", "مستوى الفرز")}</p>
                <p className="text-2xl font-bold uppercase tracking-wide">{text(`${((patient as unknown as EmergencyPatient).riskLevel ?? "unknown").toUpperCase()} RISK`, `خطورة ${riskLabel((patient as unknown as EmergencyPatient).riskLevel ?? "unknown", text)}`)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">{text("Priority Index", "مؤشر الأولوية")}</p>
                  <p className="text-4xl font-bold tabular-nums" dir="ltr">{(patient as unknown as EmergencyPatient).riskScore ?? "—"}</p>
                  <p className="text-[10px] text-white/60">/ 100</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">{text("Response Window", "نافذة الاستجابة")}</p>
                  <p className="text-lg font-bold">
                    {(patient as unknown as EmergencyPatient).riskLevel === "critical" ? text("≤ 3 min", "≤ 3 دقائق") :
                     (patient as unknown as EmergencyPatient).riskLevel === "high" ? text("≤ 30 min", "≤ 30 دقيقة") : text("≤ 2 hrs", "≤ ساعتين")}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Timer className="w-3 h-3 text-white/60" />
                    <span className="text-[10px] text-white/60">{text("Triage protocol", "بروتوكول الفرز")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* IMMEDIATE ACTIONS — highest priority, shown first */}
          {immediateActions.length > 0 && (
            <div className="border-2 border-danger rounded-3xl overflow-hidden">
              <div className="bg-danger px-5 py-3 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm uppercase tracking-widest">
                  {text("⚠ IMMEDIATE CLINICAL ACTIONS REQUIRED", "⚠ إجراءات سريرية فورية مطلوبة")}
                </span>
                <div className="ms-auto flex items-center gap-2">
                  <span className="bg-card/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {text("Act within 3 min", "تصرّف خلال 3 دقائق")}
                  </span>
                  <span className="bg-card/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {text(`${immediateActions.length} Action${immediateActions.length > 1 ? "s" : ""}`, `${immediateActions.length} إجراء`)}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 bg-destructive/10">
                {immediateActions.map((action, i) => {
                  const cfg = actionConfig[action.action];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-4 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                      <div className={`w-9 h-9 rounded-xl bg-card flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityBadge[action.priority]}`}>
                            {priorityLabel(action.priority, text)}
                          </span>
                          <span className={`text-xs font-bold ${cfg.color} uppercase tracking-wide`}>{actionLabel(action.action, text)}</span>
                        </div>
                        <p className={`font-bold text-sm ${cfg.color}`}>{action.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Critical Alerts */}
          {patient.criticalAlerts.length > 0 && (
            <Card className="bg-danger border-danger text-white">
              <CardBody className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-2xl bg-card/15 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{text("Critical Medical Alert", "تنبيه طبي حرج")}</p>
                  <p className="text-lg font-bold mb-2">{patient.criticalAlerts[0]}</p>
                  {patient.criticalAlerts.slice(1).map((a, i) => (
                    <p key={i} className="text-sm text-white/80 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3" /> {a}
                    </p>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Patient Identity Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <Card className="p-5 md:col-span-9">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("Patient Identity", "هوية المريض")}</p>
                  <h2 className="text-3xl font-bold text-foreground leading-tight mb-2">{patient.fullName}</h2>
                  <p className="font-mono text-sm text-muted-foreground bg-secondary rounded-xl px-3 py-1.5 inline-block" dir="ltr">
                    {text("PATIENT ID:", "رقم المريض:")} {patient.nationalId}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={patient.riskLevel === "critical" ? "destructive" : patient.riskLevel === "high" ? "warning" : "info"}
                    className="text-xs px-3 py-1 rounded-full"
                  >
                    {text(`${patient.riskLevel?.toUpperCase()} RISK`, `خطورة ${riskLabel(patient.riskLevel ?? "unknown", text)}`)}
                  </Badge>
                  {(patient as unknown as EmergencyPatient).riskScore !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-bold text-foreground" dir="ltr">{(patient as unknown as EmergencyPatient).riskScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{text("Live", "مباشر")}</span>
                    <StatusDot status="active" />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-secondary p-3.5">
                  <DataLabel label={text("Age / Sex", "العمر / الجنس")}>
                    <p className="text-lg font-bold text-foreground">{patient.age ?? "—"} <span className="text-muted-foreground font-normal text-sm">{patient.gender === "male" ? text("M", "ذكر") : text("F", "أنثى")}</span></p>
                  </DataLabel>
                </div>
                <div className="rounded-2xl bg-secondary p-3.5 sm:col-span-2">
                  <DataLabel label={text("Emergency Contact", "جهة الاتصال للطوارئ")}>
                    {patient.emergencyContact ? (
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <p className="text-sm font-bold text-foreground">{patient.emergencyContact}</p>
                        <a href={`tel:${patient.emergencyPhone}`} className="font-mono text-lg font-bold text-primary underline-offset-2 hover:underline" dir="ltr">
                          {patient.emergencyPhone}
                        </a>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">{text("Not listed", "غير مُدرج")}</p>}
                  </DataLabel>
                </div>
              </div>
            </Card>

            <Card className="bg-danger-bg border-danger/20 md:col-span-3">
              <CardBody className="flex h-full flex-col items-center justify-center py-8">
                <Droplet className="mb-2 h-7 w-7 text-danger/70" />
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-danger/70">{text("Blood Type", "فصيلة الدم")}</p>
                <p className="text-5xl font-bold text-danger" dir="ltr">{patient.bloodType}</p>
              </CardBody>
            </Card>
          </div>

          {/* Urgent (non-immediate) Clinical Actions */}
          {urgentActions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-risk-high" />
                  <CardTitle>{text("Clinical Guidance", "إرشادات سريرية")}</CardTitle>
                </div>
                <Badge variant="warning">{text(`${urgentActions.length} notes`, `${urgentActions.length} ملاحظات`)}</Badge>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {urgentActions.map((action, i) => {
                    const cfg = actionConfig[action.action];
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3.5 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                        <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center shrink-0">
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>{actionLabel(action.action, text)}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityBadge[action.priority]}`}>{priorityLabel(action.priority, text)}</span>
                          </div>
                          <p className="font-semibold text-sm text-foreground">{action.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Clinical Data */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-danger" />
                  <CardTitle>{text("Known Allergies", "الحساسية المعروفة")}</CardTitle>
                </div>
                <Badge variant="destructive">{patient.allergies.length}</Badge>
              </CardHeader>
              <CardBody>
                {patient.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {patient.allergies.map((a, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-danger-bg border border-danger/20 rounded-2xl">
                        <StatusDot status="critical" />
                        <span className="text-sm font-bold text-danger">{a}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">{text("No known allergies.", "لا توجد حساسية معروفة.")}</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <CardTitle>{text("Chronic Conditions", "الأمراض المزمنة")}</CardTitle>
                </div>
                <Badge variant="default">{patient.chronicConditions.length}</Badge>
              </CardHeader>
              <CardBody>
                {patient.chronicConditions.length > 0 ? (
                  <div className="space-y-2">
                    {patient.chronicConditions.map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-secondary rounded-2xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm font-semibold text-foreground">{c}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">{text("None on record.", "لا شيء مُسجّل.")}</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-risk-high" />
                  <CardTitle>{text("Active Medications", "الأدوية الفعّالة")}</CardTitle>
                </div>
                <Badge variant="warning">{patient.currentMedications.length}</Badge>
              </CardHeader>
              <CardBody>
                {patient.currentMedications.length > 0 ? (
                  <div className="space-y-2">
                    {patient.currentMedications.map((med, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-secondary rounded-2xl">
                        <span className="text-sm font-semibold text-foreground">{med}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">{text("No active medications.", "لا توجد أدوية فعّالة.")}</p>}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}

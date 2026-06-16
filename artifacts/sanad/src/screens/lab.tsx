import React, { useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Badge, PageHeader, StatusDot, DataLabel
, SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  FlaskConical, Search, AlertTriangle, CheckCircle2, Zap,
  Brain, TrendingUp, TrendingDown, Minus, ArrowRight, Plus, X, Activity
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from "recharts";

async function fetchLabPatient(nationalId: string) {
  const res = await apiFetch(`/api/lab/patient/${nationalId}`);
  if (!res.ok) throw new Error("Patient not found");
  return res.json();
}

async function submitLabResult(data: Record<string, string>) {
  const res = await apiFetch("/api/lab/result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit result");
  return res.json();
}

const TEST_NAMES = [
  "HbA1c", "Fasting Glucose", "Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol",
  "Triglycerides", "Creatinine", "eGFR", "Hemoglobin", "WBC Count", "Platelet Count",
  "ALT", "AST", "TSH", "Uric Acid", "Vitamin D", "Sodium", "Potassium",
];

export default function LabPortal() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const [form, setForm] = useState({
    testName: "", result: "", unit: "", referenceRange: "", status: "normal", hospital: "SANAD Lab Network", notes: ""
  });

  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["lab-patient", nationalId],
    queryFn: () => fetchLabPatient(nationalId),
    enabled: !!nationalId,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (formData: Record<string, string>) => submitLabResult({ ...formData, patientId: data?.patient?.id }),
    onSuccess: (result) => {
      setLastResult(result);
      setShowAddForm(false);
      setForm({ testName: "", result: "", unit: "", referenceRange: "", status: "normal", hospital: "SANAD Lab Network", notes: "" });
      qc.invalidateQueries({ queryKey: ["lab-patient", nationalId] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) setNationalId(searchId.trim());
  };

  const trendChartData = useMemo(() => {
    if (!data?.labs?.length) return {};
    const grouped: Record<string, { date: string; value: number; status: string }[]> = {};
    for (const lab of data.labs) {
      const val = parseFloat(lab.result);
      if (isNaN(val)) continue;
      if (!grouped[lab.testName]) grouped[lab.testName] = [];
      grouped[lab.testName]!.push({
        date: lab.testDate?.split("T")[0] ?? lab.testDate,
        value: val,
        status: lab.status,
      });
    }
    for (const key of Object.keys(grouped)) {
      grouped[key] = grouped[key]!.sort((a, b) => a.date.localeCompare(b.date));
    }
    return grouped;
  }, [data]);

  const CHART_TESTS = [
    "HbA1c", "Fasting Glucose", "Fasting Blood Glucose", "Total Cholesterol",
    "LDL Cholesterol", "Creatinine", "Hemoglobin", "eGFR", "Potassium", "Sodium"
  ];
  const CHART_COLORS: Record<string, string> = {
    "HbA1c": "#e11d48",
    "Fasting Glucose": "#f59e0b", "Fasting Blood Glucose": "#f59e0b",
    "Total Cholesterol": "#8b5cf6",
    "LDL Cholesterol": "#3b82f6",
    "Creatinine": "#10b981",
    "Hemoglobin": "#f97316",
    "eGFR": "#06b6d4",
    "Potassium": "#84cc16",
    "Sodium": "#a855f7",
  };
  const NORMAL_RANGES: Record<string, { min: number; max: number; unit: string }> = {
    "HbA1c": { min: 4.0, max: 5.7, unit: "%" },
    "Fasting Glucose": { min: 70, max: 100, unit: "mg/dL" },
    "Fasting Blood Glucose": { min: 70, max: 100, unit: "mg/dL" },
    "Total Cholesterol": { min: 0, max: 200, unit: "mg/dL" },
    "LDL Cholesterol": { min: 0, max: 100, unit: "mg/dL" },
    "Creatinine": { min: 0.6, max: 1.2, unit: "mg/dL" },
    "Hemoglobin": { min: 12, max: 17, unit: "g/dL" },
    "eGFR": { min: 60, max: 120, unit: "mL/min" },
    "Potassium": { min: 3.5, max: 5.0, unit: "mEq/L" },
    "Sodium": { min: 135, max: 145, unit: "mEq/L" },
  };

  const chartsToShow = CHART_TESTS.filter(t => (trendChartData[t]?.length ?? 0) >= 1);

  const statusColor = (status: string) => ({
    normal: "success", abnormal: "warning", critical: "destructive"
  } as Record<string, any>)[status] ?? "outline";

  const trendIcon = (trend: string) => {
    if (trend.includes("WORSENING") || trend.includes("HIGH") || trend.includes("ELEVATED") || trend.includes("DIABETIC") || trend.includes("CRITICAL") || trend.includes("ANEMIA") || trend.includes("STRESS") || trend.includes("ABNORMAL")) {
      return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
    }
    if (trend === "NORMAL" || trend === "OPTIMAL") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-risk-high" />;
  };

  return (
    <Layout role="lab" localized>
      <PageHeader
        title={text("Lab Portal", "بوابة المختبر")}
        subtitle={text("Upload results · AI interpretation · Clinical flags", "رفع النتائج · التفسير الذكي · الإشارات السريرية")}
      />

      {/* Search */}
      <Card className="mb-5">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={text("Patient National ID", "رقم هوية المريض")}
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="ps-9"
              />
            </div>
            <Button type="submit" disabled={!searchId.trim()}>
              <Search className="w-4 h-4" /> {text("Retrieve Patient", "استدعاء المريض")}
            </Button>
          </form>
        </CardBody>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
          <span className="text-sm font-medium">{text("Retrieving patient records...", "جارٍ استدعاء سجلات المريض...")}</span>
        </div>
      )}

      {error && (
        <Card>
          <CardBody className="py-10 text-center">
            <AlertTriangle className="w-8 h-8 text-risk-high mx-auto mb-3" />
            <p className="font-bold text-foreground">{text("Patient Not Found", "المريض غير موجود")}</p>
            <p className="text-sm text-muted-foreground mt-1">{text("No records for National ID:", "لا توجد سجلات لرقم الهوية:")} <span dir="ltr">{nationalId}</span></p>
          </CardBody>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          {/* Patient Strip */}
          <div className={`rounded-3xl p-5 flex items-center justify-between gap-5 ${
            data.patient.riskLevel === "critical" ? "bg-red-600" :
            data.patient.riskLevel === "high" ? "bg-risk-high" :
            "bg-teal-500"
          } text-white`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{text("Patient Identified", "تم تحديد المريض")}</p>
              <p className="text-xl font-bold">{data.patient.name}</p>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-white/80">
                <span dir="ltr">{text("ID:", "الهوية:")} {data.patient.nationalId}</span>
                <span>{text("Age:", "العمر:")} {data.patient.age}</span>
                <span>{text("Blood:", "الفصيلة:")} {data.patient.bloodType}</span>
              </div>
              {data.patient.allergies && data.patient.allergies.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{text("ALLERGIES:", "الحساسية:")} {data.patient.allergies.join("، ")}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-white/70">{text("Labs on Record", "تحاليل مُسجّلة")}</p>
                <p className="text-3xl font-bold">{data.summary.total}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">{text("Critical", "حرجة")}</p>
                <p className="text-3xl font-bold">{data.summary.critical}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">{text("Abnormal", "غير طبيعية")}</p>
                <p className="text-3xl font-bold">{data.summary.abnormal}</p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-card/20 hover:bg-card/30 text-white border-0"
              >
                <Plus className="w-4 h-4" /> {text("Add Result", "إضافة نتيجة")}
              </Button>
            </div>
          </div>

          {/* ─── Trend Charts ─── */}
          {chartsToShow.length > 0 && (
            <Card>
              <CardHeader>
                <Activity className="w-4 h-4 text-teal-600" />
                <CardTitle>{text("Lab Trends — Clinical Progression", "اتجاهات المختبر — التطوّر السريري")}</CardTitle>
                <span className="ms-auto text-[11px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {text(`${chartsToShow.length} test${chartsToShow.length > 1 ? "s" : ""} charted`, `${chartsToShow.length} فحص مرسوم`)}
                </span>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-5">
                  {chartsToShow.map(testName => {
                    const points = trendChartData[testName]!;
                    const color = CHART_COLORS[testName] ?? "#6366f1";
                    const range = NORMAL_RANGES[testName];
                    const latest = points[points.length - 1];
                    const previous = points.length >= 2 ? points[points.length - 2] : null;
                    const isWorsening = previous && latest && latest.value > previous.value && latest.status !== "normal";
                    const isImproving = previous && latest && latest.value < previous.value && latest.status === "normal";

                    return (
                      <div key={testName} className="rounded-2xl border border-border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-[13px] font-bold text-foreground">{testName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Latest: <span className="font-bold" style={{ color }}>{latest?.value} {range?.unit ?? ""}</span>
                              {range && (
                                <span className="ml-1 text-muted-foreground/70">
                                  (Normal: {range.min}–{range.max})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isWorsening && (
                              <span className="text-[10px] font-bold text-red-600 bg-destructive/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> WORSENING
                              </span>
                            )}
                            {isImproving && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" /> IMPROVING
                              </span>
                            )}
                            {!isWorsening && !isImproving && points.length > 1 && (
                              <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Minus className="w-3 h-3" /> STABLE
                              </span>
                            )}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              tickFormatter={d => d.slice(5)}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                            <Tooltip
                              contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontSize: 11 }}
                              formatter={(val: any) => [`${val} ${range?.unit ?? ""}`, testName]}
                            />
                            {range && range.max > 0 && (
                              <ReferenceLine y={range.max} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "Max", fill: "#f59e0b", fontSize: 9 }} />
                            )}
                            {range && range.min > 0 && (
                              <ReferenceLine y={range.min} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "Min", fill: "#10b981", fontSize: 9 }} />
                            )}
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={color}
                              strokeWidth={2.5}
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const fill = payload.status === "critical" ? "#ef4444" : payload.status === "abnormal" ? "#f59e0b" : "#10b981";
                                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={2} />;
                              }}
                              activeDot={{ r: 7, strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* AI Interpretation of last submitted result */}
          {lastResult && (
            <div className={`rounded-2xl p-5 border-2 ${lastResult.aiAnalysis?.status === "critical" ? "bg-destructive/10 border-red-300" : lastResult.aiAnalysis?.status === "abnormal" ? "bg-risk-high-bg border-risk-high/20" : "bg-emerald-50 border-emerald-300"}`}>
              <div className="flex items-start gap-3 mb-3">
                <Brain className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{text("AI Lab Interpreter — Just Submitted", "مفسّر المختبر الذكي — أُرسل للتو")}</p>
                  <p className="font-bold text-foreground" dir="ltr">{lastResult.result?.testName} = {lastResult.result?.result} {lastResult.result?.unit}</p>
                </div>
                <Badge variant={statusColor(lastResult.aiAnalysis?.status)} className="ms-auto">{lastResult.aiAnalysis?.status}</Badge>
              </div>
              <p className="text-sm text-foreground mb-2">{lastResult.aiAnalysis?.significance}</p>
              <div className="flex items-start gap-2 px-3 py-2.5 bg-card/60 rounded-xl">
                <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 rtl:-scale-x-100" />
                <p className="text-xs font-semibold text-foreground">{lastResult.aiAnalysis?.action}</p>
              </div>
              <div className="flex items-center gap-3 mt-2.5">
                <span className="text-[10px] text-muted-foreground">{text("RISK IMPACT:", "أثر الخطورة:")} +{lastResult.aiAnalysis?.riskImpact} {text("pts", "نقاط")}</span>
                <span className="text-[10px] text-muted-foreground">{text("CONFIDENCE:", "الثقة:")} {Math.round(lastResult.aiAnalysis?.confidence * 100)}%</span>
                <span className="text-[10px] text-muted-foreground ms-auto">{text("EVENT:", "الحدث:")} {lastResult.event}</span>
              </div>
            </div>
          )}

          {/* Add Result Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <FlaskConical className="w-4 h-4 text-teal-600" />
                <CardTitle>{text("Upload New Lab Result", "رفع نتيجة مخبرية جديدة")}</CardTitle>
                <button onClick={() => setShowAddForm(false)} className="ms-auto text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Test Name *", "اسم الفحص *")}</p>
                    <select
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.testName}
                      onChange={e => setForm(f => ({ ...f, testName: e.target.value }))}
                    >
                      <option value="">{text("Select test...", "اختر الفحص...")}</option>
                      {TEST_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Result Value *", "قيمة النتيجة *")}</p>
                    <Input
                      placeholder={text("e.g. 8.2", "مثال: 8.2")}
                      value={form.result}
                      onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Unit", "الوحدة")}</p>
                    <Input
                      placeholder={text("e.g. mg/dL, %", "مثال: mg/dL، %")}
                      value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Reference Range", "النطاق المرجعي")}</p>
                    <Input
                      placeholder={text("e.g. 70–99 mg/dL", "مثال: 70–99 mg/dL")}
                      value={form.referenceRange}
                      onChange={e => setForm(f => ({ ...f, referenceRange: e.target.value }))}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Status *", "الحالة *")}</p>
                    <select
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="normal">{text("Normal", "طبيعي")}</option>
                      <option value="abnormal">{text("Abnormal", "غير طبيعي")}</option>
                      <option value="critical">{text("Critical", "حرج")}</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Hospital / Lab", "المستشفى / المختبر")}</p>
                    <Input
                      value={form.hospital}
                      onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Clinical Notes", "ملاحظات سريرية")}</p>
                  <Input
                    placeholder={text("Optional clinical notes...", "ملاحظات سريرية اختيارية...")}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => submitMutation.mutate(form as Record<string, string>)}
                    disabled={!form.testName || !form.result || !form.status || submitMutation.isPending}
                    className="flex-1"
                  >
                    <Zap className="w-4 h-4" />
                    {submitMutation.isPending ? text("Submitting + AI Analysis...", "جارٍ الإرسال + التحليل الذكي...") : text("Submit Result & Run AI Analysis", "إرسال النتيجة وتشغيل التحليل الذكي")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>{text("Cancel", "إلغاء")}</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Lab Results List */}
          <Card>
            <CardHeader>
              <FlaskConical className="w-4 h-4 text-teal-600" />
              <CardTitle>{text("Lab Results with AI Interpretation", "نتائج المختبر مع التفسير الذكي")}</CardTitle>
              <Badge variant="outline" className="ms-auto">{text(`${data.labs.length} results`, `${data.labs.length} نتيجة`)}</Badge>
            </CardHeader>
            <div className="divide-y divide-border">
              {data.labs.length === 0 ? (
                <div className="py-12 text-center">
                  <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-bold text-foreground">{text("No lab results on record", "لا توجد نتائج مخبرية مُسجّلة")}</p>
                </div>
              ) : (
                data.labs.map((lab: any) => (
                  <div key={lab.id} className={`p-4 ${lab.status === "critical" ? "bg-destructive/10/50" : lab.status === "abnormal" ? "bg-risk-high-bg/30" : ""}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-teal-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-foreground">{lab.testName}</p>
                          <Badge variant={statusColor(lab.status)} className="text-[9px]">{lab.status}</Badge>
                          <div className="flex items-center gap-1 ml-1">
                            {trendIcon(lab.interpretation?.trend ?? "")}
                            <span className="text-[10px] font-bold text-muted-foreground">{lab.interpretation?.trend}</span>
                          </div>
                          <span className="ms-auto text-[10px] text-muted-foreground font-mono" dir="ltr">{lab.testDate}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-bold tabular-nums text-foreground" dir="ltr">{lab.result} <span className="text-sm font-normal text-muted-foreground">{lab.unit}</span></p>
                          {lab.referenceRange && <p className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-full" dir="ltr">{text("REF:", "المرجع:")} {lab.referenceRange}</p>}
                          <p className="text-[10px] text-muted-foreground">{lab.hospital}</p>
                        </div>
                        <div className={`px-3 py-2.5 rounded-xl border text-xs ${
                          lab.status === "critical" ? "bg-destructive/10 border-red-200" :
                          lab.status === "abnormal" ? "bg-risk-high-bg border-risk-high/20" :
                          "bg-emerald-50 border-emerald-200"
                        }`}>
                          <div className="flex items-start gap-2">
                            <Brain className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-foreground mb-0.5">{lab.interpretation?.significance}</p>
                              <p className="text-muted-foreground">{text("→", "←")} {lab.interpretation?.action}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-mono text-muted-foreground">{text("RISK IMPACT:", "أثر الخطورة:")} +{lab.interpretation?.riskImpact}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{text("CONFIDENCE:", "الثقة:")} {Math.round((lab.interpretation?.confidence ?? 0) * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {!nationalId && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-teal-100 flex items-center justify-center mx-auto mb-5">
            <FlaskConical className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2">{text("Lab Results Portal", "بوابة نتائج المختبر")}</p>
          <p className="text-sm text-muted-foreground max-w-sm">{text("Enter a patient's National ID to retrieve their lab history and upload new results with AI interpretation.", "أدخل رقم هوية المريض لاستدعاء سجل تحاليله ورفع نتائج جديدة مع التفسير الذكي.")}</p>
        </div>
      )}
    </Layout>
  );
}

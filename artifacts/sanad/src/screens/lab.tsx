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

type LabInterpretation = {
  significance: string;
  riskImpact: number;
  trend: string;
  action: string;
  confidence: number;
};

type LabResultWithInterpretation = {
  id: number;
  patientId: number;
  testName: string;
  testDate: string;
  result: string;
  unit?: string | null;
  referenceRange?: string | null;
  status: string;
  hospital: string;
  notes?: string | null;
  createdAt?: string;
  interpretation?: LabInterpretation;
};

type LabPatientData = {
  patient: {
    id: number;
    name: string;
    nationalId: string;
    age: number;
    bloodType: string;
    riskScore?: number | null;
    riskLevel?: string;
    allergies?: string[] | null;
    chronicConditions?: string[] | null;
  };
  labs: LabResultWithInterpretation[];
  summary: { total: number; critical: number; abnormal: number; normal: number };
};

type LabSubmitResult = {
  result: LabResultWithInterpretation;
  interpretation: LabInterpretation;
  event: string;
  aiAnalysis: { status: string; significance: string; riskImpact: number; action: string; confidence: number };
};

const TEST_NAMES = [
  "HbA1c", "Fasting Glucose", "Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol",
  "Triglycerides", "Creatinine", "eGFR", "Hemoglobin", "WBC Count", "Platelet Count",
  "ALT", "AST", "TSH", "Uric Acid", "Vitamin D", "Sodium", "Potassium",
];

const TEST_DEFAULTS: Record<string, { unit: string; referenceRange: string }> = {
  "HbA1c":            { unit: "%",            referenceRange: "< 7.0 (diabetic target)" },
  "Fasting Glucose":  { unit: "mg/dL",        referenceRange: "70–99" },
  "Total Cholesterol":{ unit: "mmol/L",       referenceRange: "< 5.2" },
  "LDL Cholesterol":  { unit: "mmol/L",       referenceRange: "< 2.6 (< 1.8 if CAD)" },
  "HDL Cholesterol":  { unit: "mmol/L",       referenceRange: "> 1.0 (M) / > 1.3 (F)" },
  "Triglycerides":    { unit: "mmol/L",       referenceRange: "< 1.7" },
  "Creatinine":       { unit: "umol/L",       referenceRange: "62–106" },
  "eGFR":             { unit: "mL/min/1.73m²",referenceRange: "> 60" },
  "Hemoglobin":       { unit: "g/dL",         referenceRange: "13.5–17.5 (M) / 12–16 (F)" },
  "WBC Count":        { unit: "×10³/µL",      referenceRange: "4.5–11.0" },
  "Platelet Count":   { unit: "×10³/µL",      referenceRange: "150–400" },
  "ALT":              { unit: "U/L",          referenceRange: "7–56" },
  "AST":              { unit: "U/L",          referenceRange: "10–40" },
  "TSH":              { unit: "mIU/L",        referenceRange: "0.4–4.0" },
  "Uric Acid":        { unit: "mg/dL",        referenceRange: "3.5–7.2 (M) / 2.6–6.0 (F)" },
  "Vitamin D":        { unit: "ng/mL",        referenceRange: "30–100" },
  "Sodium":           { unit: "mmol/L",       referenceRange: "136–145" },
  "Potassium":        { unit: "mmol/L",       referenceRange: "3.5–5.0" },
};

export default function LabPortal() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastResult, setLastResult] = useState<LabSubmitResult | null>(null);

  const [form, setForm] = useState({
    testName: "", result: "", unit: "", referenceRange: "", status: "normal", hospital: "SANAD Lab Network", notes: ""
  });

  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<LabPatientData>({
    queryKey: ["lab-patient", nationalId],
    queryFn: () => fetchLabPatient(nationalId),
    enabled: !!nationalId,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (formData: Record<string, string>) => submitLabResult({ ...formData, patientId: String(data?.patient?.id ?? "") }),
    onSuccess: (result) => {
      setLastResult(result);
      setShowAddForm(false);
      setForm({ testName: "", result: "", unit: "", referenceRange: "", status: "normal", hospital: "SANAD Lab Network", notes: "" });
      qc.setQueryData(["lab-patient", nationalId], (old: LabPatientData | undefined) => {
        if (!old) return old;
        return { ...old, labs: [result.result, ...(old.labs ?? [])] };
      });
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
    "HbA1c": "hsl(var(--destructive))",
    "Fasting Glucose": "hsl(var(--warning))", "Fasting Blood Glucose": "hsl(var(--warning))",
    "Total Cholesterol": "hsl(var(--primary))",
    "LDL Cholesterol": "hsl(var(--info))",
    "Creatinine": "hsl(var(--success))",
    "Hemoglobin": "hsl(var(--risk-high))",
    "eGFR": "hsl(var(--primary))",
    "Potassium": "hsl(var(--secondary-foreground))",
    "Sodium": "hsl(var(--info))",
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
      return <TrendingUp className="w-3.5 h-3.5 text-danger" />;
    }
    if (trend === "NORMAL" || trend === "OPTIMAL") return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-risk-high" />;
  };

  return (
    <Layout role="lab" localized>
      <div className="mb-8 relative rounded-3xl overflow-hidden glass-panel border border-primary/20 shadow-xl bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="absolute top-0 ltr:right-0 rtl:left-0 w-[500px] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {text("Lab Portal", "بوابة المختبر")}
              </h1>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl text-[13px] sm:text-sm leading-relaxed">
              {text("Upload results · AI interpretation · Clinical flags", "رفع النتائج · التفسير الذكي · الإشارات السريرية")}
            </p>
          </div>
        </div>
      </div>

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
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
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
          <div className={`rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 ${
            data.patient.riskLevel === "critical" ? "bg-danger" :
            data.patient.riskLevel === "high" ? "bg-risk-high" :
            "bg-primary"
          } text-white`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{text("Patient Identified", "تم تحديد المريض")}</p>
              <p className="text-xl font-bold">{data.patient.name}</p>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-white/80">
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
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
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
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle>{text("Lab Trends — Clinical Progression", "اتجاهات المختبر — التطوّر السريري")}</CardTitle>
                <span className="ms-auto text-[11px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {text(`${chartsToShow.length} test${chartsToShow.length > 1 ? "s" : ""} charted`, `${chartsToShow.length} فحص مرسوم`)}
                </span>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {chartsToShow.map(testName => {
                    const points = trendChartData[testName]!;
                    const color = CHART_COLORS[testName] ?? "hsl(var(--primary))";
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
                              <span className="text-[10px] font-bold text-danger bg-danger-bg px-2 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> WORSENING
                              </span>
                            )}
                            {isImproving && (
                              <span className="text-[10px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-full flex items-center gap-1">
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
                        <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height={140}>
                          <LineChart data={points} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={d => d.slice(5)}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                              contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontSize: 11 }}
                              formatter={(val: number | string) => [`${val} ${range?.unit ?? ""}`, testName]}
                            />
                            {range && range.max > 0 && (
                              <ReferenceLine y={range.max} stroke="hsl(var(--warning))" strokeDasharray="4 2" strokeWidth={1.5} />
                            )}
                            {range && range.min > 0 && (
                              <ReferenceLine y={range.min} stroke="hsl(var(--success))" strokeDasharray="4 2" strokeWidth={1.5} />
                            )}
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={color}
                              strokeWidth={2.5}
                              dot={(props: { cx: number; cy: number; payload: { status: string } }) => {
                                const { cx, cy, payload } = props;
                                const fill = payload.status === "critical" ? "hsl(var(--destructive))" : payload.status === "abnormal" ? "hsl(var(--warning))" : "hsl(var(--success))";
                                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={2} />;
                              }}
                              activeDot={{ r: 7, strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer></div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* AI Interpretation of last submitted result */}
          {lastResult && (
            <div className={`rounded-2xl p-5 border-2 ${lastResult.aiAnalysis?.status === "critical" ? "bg-danger-bg border-danger/30" : lastResult.aiAnalysis?.status === "abnormal" ? "bg-risk-high-bg border-risk-high/20" : "bg-success-bg border-success/30"}`}>
              <div className="flex items-start gap-3 mb-3">
                <Brain className="w-5 h-5 text-secondary-foreground shrink-0 mt-0.5" />
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
                <FlaskConical className="w-4 h-4 text-primary" />
                <CardTitle>{text("Upload New Lab Result", "رفع نتيجة مخبرية جديدة")}</CardTitle>
                <button onClick={() => setShowAddForm(false)} className="ms-auto text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Test Name *", "اسم الفحص *")}</p>
                    <select
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.testName}
                      onChange={e => {
                        const name = e.target.value;
                        const def = TEST_DEFAULTS[name];
                        setForm(f => ({
                          ...f,
                          testName: name,
                          unit: def?.unit ?? f.unit,
                          referenceRange: def?.referenceRange ?? f.referenceRange,
                        }));
                      }}
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
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      {text("Reference Range", "النطاق المرجعي")}
                      {form.status !== "normal" && <span className="text-danger ms-1">*</span>}
                    </p>
                    <Input
                      placeholder={text("e.g. 70–99 mg/dL", "مثال: 70–99 mg/dL")}
                      value={form.referenceRange}
                      onChange={e => setForm(f => ({ ...f, referenceRange: e.target.value }))}
                      className={form.status !== "normal" && !form.referenceRange ? "border-danger/60 focus:ring-danger/40" : ""}
                    />
                    {form.status !== "normal" && !form.referenceRange && (
                      <p className="text-[10px] text-danger mt-1">{text("Required when status is Abnormal/Critical", "مطلوب عند الحالة غير طبيعي/حرج")}</p>
                    )}
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
                {submitMutation.isError && (
                  <p className="text-sm text-danger">{text("Submission failed — please try again.", "فشل الإرسال — يرجى المحاولة مرة أخرى.")}</p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => submitMutation.mutate(form as Record<string, string>)}
                    disabled={!form.testName || !form.result || !form.status || (form.status !== "normal" && !form.referenceRange) || submitMutation.isPending}
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
              <FlaskConical className="w-4 h-4 text-primary" />
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
                data.labs.map((lab: LabResultWithInterpretation) => (
                  <div key={lab.id} className={`p-4 ${lab.status === "critical" ? "bg-danger-bg" : lab.status === "abnormal" ? "bg-risk-high-bg/30" : ""}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" />
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
                          lab.status === "critical" ? "bg-danger-bg border-danger/20" :
                          lab.status === "abnormal" ? "bg-risk-high-bg border-risk-high/20" :
                          "bg-success-bg border-success/30"
                        }`}>
                          <div className="flex items-start gap-2">
                            <Brain className="w-3.5 h-3.5 text-secondary-foreground shrink-0 mt-0.5" />
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
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2">{text("Lab Results Portal", "بوابة نتائج المختبر")}</p>
          <p className="text-sm text-muted-foreground max-w-sm">{text("Enter a patient's National ID to retrieve their lab history and upload new results with AI interpretation.", "أدخل رقم هوية المريض لاستدعاء سجل تحاليله ورفع نتائج جديدة مع التفسير الذكي.")}</p>
        </div>
      )}
    </Layout>
  );
}

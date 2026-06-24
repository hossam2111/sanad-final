import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, PageHeader, Badge, StatusDot, Tabs, DataLabel, Select
, SkeletonCard, ErrorBanner} from "@/components/shared";
import { useGetPatientByNationalId } from "@workspace/api-client-react";
import { useAiDecision } from "@/hooks/use-ai-decision";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSseAlerts } from "@/hooks/use-sse-alerts";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { T } from "@/lib/terms";

type TextFn = (en: string, ar: string) => string;

const VISIT_TYPE_AR_C: Record<string, string> = {
  emergency: "طوارئ", inpatient: "تنويم", outpatient: "عيادات خارجية", "follow-up": "متابعة",
};
function visitTypeArCitizen(visitType: string, text: TextFn): string {
  return VISIT_TYPE_AR_C[visitType] ? text(visitType, VISIT_TYPE_AR_C[visitType]!) : visitType;
}

async function fetchDepartments() {
  const res = await apiFetch("/api/appointments/departments");
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ departments: string[]; services: Record<string, string[]> }>;
}
async function fetchHospitals() {
  const res = await apiFetch("/api/appointments/hospitals");
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ hospitals: string[] }>;
}
async function fetchSlots(date: string, hospital: string, department: string) {
  const p = new URLSearchParams({ date, hospital, department });
  const res = await apiFetch(`/api/appointments/slots?${p}`);
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ slots: string[] }>;
}
async function fetchPatientAppointments(patientId: number) {
  const res = await apiFetch(`/api/appointments/patient/${patientId}`);
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ appointments: any[] }>;
}
async function bookAppointment(payload: object) {
  const res = await apiFetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to book"); }
  return res.json();
}
import {
  Bell, FileText, Activity, Pill, FlaskConical, User, Lock, CalendarDays,
  AlertCircle, Heart, TrendingUp, TrendingDown, CheckCircle2, ShieldAlert,
  Lightbulb, Star, ArrowRight, Stethoscope, Minus, Info, Brain, ArrowUpRight,
  Building2, Clock, X, MapPin, Sparkles, Shield, Share2, Users, ToggleLeft,
  ToggleRight, Eye, EyeOff, AlertOctagon, Fingerprint
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { format } from "date-fns";

function computeHealthScore(patient: {
  dateOfBirth: string;
  chronicConditions?: string[] | null;
  allergies?: string[] | null;
  medications?: Array<{ isActive: boolean }> | null;
  labResults?: Array<{ status: string }> | null;
  visits?: Array<{ visitDate: string; visitType: string }> | null;
}, text: TextFn): { score: number; grade: "A" | "B" | "C" | "D" | "F"; label: string; color: string; bg: string; summary: string } {
  let score = 100;

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  if (age >= 75) score -= 20;
  else if (age >= 60) score -= 10;
  else if (age >= 45) score -= 5;

  const conditions = patient.chronicConditions || [];
  const highRisk = ["heart failure", "coronary artery disease", "chronic kidney disease", "ckd", "cancer", "copd", "cirrhosis"];
  const modRisk = ["hypertension", "diabetes", "atrial fibrillation", "stroke", "depression"];
  for (const c of conditions) {
    const cl = c.toLowerCase();
    if (highRisk.some(h => cl.includes(h))) score -= 18;
    else if (modRisk.some(m => cl.includes(m))) score -= 10;
    else score -= 5;
  }

  const activeMeds = (patient.medications || []).filter(m => m.isActive).length;
  if (activeMeds >= 5) score -= 15;
  else if (activeMeds >= 3) score -= 7;

  const labs = patient.labResults || [];
  const criticalLabs = labs.filter(l => l.status === "critical").length;
  const abnormalLabs = labs.filter(l => l.status === "abnormal").length;
  score -= criticalLabs * 15;
  score -= abnormalLabs * 7;

  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentEmergency = (patient.visits || []).filter(v => v.visitType === "emergency" && new Date(v.visitDate) >= sixMonthsAgo).length;
  score -= recentEmergency * 8;

  score = Math.max(0, Math.min(100, score));
  return { score, ...gradeLadder(score, text) };
}

function gradeLadder(score: number, text: TextFn): { grade: "A" | "B" | "C" | "D" | "F"; label: string; color: string; bg: string; summary: string } {
  if (score >= 85) {
    return { grade: "A", label: text("Excellent", "ممتازة"), color: "text-success", bg: "bg-success-bg",
      summary: text("Your health indicators are in great shape. Keep up your healthy habits!", "مؤشّراتك الصحية في حالة ممتازة. واصِل عاداتك الصحية!") };
  } else if (score >= 70) {
    return { grade: "B", label: text("Good", "جيدة"), color: "text-info", bg: "bg-info-bg",
      summary: text("Your health is generally good. A few areas could benefit from attention.", "صحتك جيدة بشكل عام. هناك جوانب قليلة تستحق الاهتمام.") };
  } else if (score >= 55) {
    return { grade: "C", label: text("Fair", "مقبولة"), color: "text-risk-high", bg: "bg-risk-high-bg",
      summary: text("Some health factors need monitoring. Follow your doctor's recommendations.", "بعض العوامل الصحية بحاجة إلى متابعة. اتبع توصيات طبيبك.") };
  } else if (score >= 40) {
    return { grade: "D", label: text("Needs Attention", "تحتاج إلى عناية"), color: "text-warning", bg: "bg-warning-bg",
      summary: text("Multiple health concerns detected. Regular medical follow-up is important.", "رُصدت عدة مخاوف صحية. المتابعة الطبية المنتظمة مهمة.") };
  } else {
    return { grade: "F", label: text("High Risk", "خطورة مرتفعة"), color: "text-danger", bg: "bg-danger-bg",
      summary: text("Significant health risks identified. Please see your doctor as soon as possible.", "رُصدت مخاطر صحية كبيرة. يُرجى مراجعة طبيبك في أقرب وقت ممكن.") };
  }
}

function generateRecommendations(patient: {
  dateOfBirth: string;
  chronicConditions?: string[] | null;
  labResults?: Array<{ testName: string; status: string; result: string; unit?: string | null }> | null;
  medications?: Array<{ isActive: boolean; drugName: string }> | null;
  visits?: Array<{ visitDate: string }> | null;
}, text: TextFn): Array<{ icon: React.ElementType; title: string; description: string; priority: "high" | "medium" | "low"; category: string }> {
  const recs: Array<{ icon: React.ElementType; title: string; description: string; priority: "high" | "medium" | "low"; category: string }> = [];
  const conditions = (patient.chronicConditions || []).map(c => c.toLowerCase());
  const criticalLabs = (patient.labResults || []).filter(l => l.status === "critical");
  const abnormalLabs = (patient.labResults || []).filter(l => l.status === "abnormal");
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  if (criticalLabs.length > 0) {
    recs.push({
      icon: ShieldAlert,
      title: text("Critical Lab Results Require Attention", "نتائج مخبرية حرجة تتطلب الانتباه"),
      description: text(
        `${criticalLabs.length} lab result(s) are in the critical range: ${criticalLabs.map(l => l.testName).join(", ")}. Contact your doctor immediately.`,
        `${criticalLabs.length} من نتائجك المخبرية في النطاق الحرج: ${criticalLabs.map(l => l.testName).join("، ")}. تواصل مع طبيبك فورًا.`,
      ),
      priority: "high",
      category: text("Urgent", "عاجل"),
    });
  }

  if (abnormalLabs.length > 0 && criticalLabs.length === 0) {
    recs.push({
      icon: FlaskConical,
      title: text("Follow Up on Abnormal Lab Results", "متابعة النتائج المخبرية غير الطبيعية"),
      description: text(
        `${abnormalLabs.length} test(s) showed abnormal results. Schedule a follow-up appointment to review these with your doctor.`,
        `أظهرت ${abnormalLabs.length} من فحوصاتك نتائج غير طبيعية. احجز موعد متابعة لمراجعتها مع طبيبك.`,
      ),
      priority: "medium",
      category: text("Lab Results", "نتائج المختبر"),
    });
  }

  if (conditions.some(c => c.includes("diabetes") || c.includes("type 1") || c.includes("type 2"))) {
    recs.push({
      icon: Activity,
      title: text("Monitor Blood Sugar Daily", "راقب سكر الدم يوميًا"),
      description: text(
        "Check your fasting blood glucose every morning and after meals. Target HbA1c below 7%. Avoid sugary foods and refined carbohydrates.",
        "افحص سكر الدم الصائم كل صباح وبعد الوجبات. المستهدف: HbA1c أقل من 7%. تجنّب الأطعمة السكرية والنشويات المكررة.",
      ),
      priority: "high",
      category: text("Diabetes Management", "إدارة السكري"),
    });
    recs.push({
      icon: Stethoscope,
      title: text("Annual Diabetic Screening", "الفحص السنوي لمضاعفات السكري"),
      description: text(
        "Get annual eye exam, kidney function tests (creatinine, microalbumin), and foot examination to detect complications early.",
        "أجرِ فحص العين السنوي، وفحوصات وظائف الكلى (الكرياتينين، الألبومين الدقيق)، وفحص القدم لاكتشاف المضاعفات مبكرًا.",
      ),
      priority: "medium",
      category: text("Preventive Care", "الرعاية الوقائية"),
    });
  }

  if (conditions.some(c => c.includes("hypertension") || c.includes("blood pressure"))) {
    recs.push({
      icon: Heart,
      title: text("Monitor Blood Pressure Regularly", "راقب ضغط الدم بانتظام"),
      description: text(
        "Check your blood pressure at least twice a week. Target: below 130/80 mmHg. Reduce salt intake and avoid stress.",
        "افحص ضغط دمك مرتين أسبوعيًا على الأقل. المستهدف: أقل من 130/80 ملم زئبق. قلّل الملح وتجنّب التوتر.",
      ),
      priority: "high",
      category: text("Cardiovascular", "القلب والأوعية"),
    });
  }

  if (conditions.some(c => c.includes("heart"))) {
    recs.push({
      icon: Heart,
      title: text("Cardiac Monitoring", "متابعة حالة القلب"),
      description: text(
        "Avoid strenuous activity without medical clearance. Know the warning signs: chest pain, shortness of breath, or sudden dizziness require emergency care.",
        "تجنّب المجهود الشديد دون إذن طبي. اعرف العلامات التحذيرية: ألم الصدر أو ضيق التنفّس أو الدوخة المفاجئة تستدعي رعاية طارئة.",
      ),
      priority: "high",
      category: text("Cardiovascular", "القلب والأوعية"),
    });
  }

  if (conditions.some(c => c.includes("ckd") || c.includes("kidney") || c.includes("renal"))) {
    recs.push({
      icon: FlaskConical,
      title: text("Protect Your Kidneys", "احمِ كليتيك"),
      description: text(
        "Stay well hydrated. Avoid NSAIDs (ibuprofen, naproxen). Limit protein and potassium intake as advised. Check creatinine & eGFR every 3 months.",
        "حافظ على ترطيب جيد. تجنّب مضادات الالتهاب غير الستيرويدية (إيبوبروفين، نابروكسين). قلّل البروتين والبوتاسيوم حسب الإرشادات. افحص الكرياتينين وeGFR كل 3 أشهر.",
      ),
      priority: "high",
      category: text("Kidney Health", "صحة الكلى"),
    });
  }

  if (conditions.some(c => c.includes("asthma") || c.includes("copd"))) {
    recs.push({
      icon: Activity,
      title: text("Respiratory Health", "صحة الجهاز التنفّسي"),
      description: text(
        "Always carry your rescue inhaler. Avoid smoke, dust, and strong odors. Get annual flu vaccine. Track your peak flow readings.",
        "احمل دائمًا بخّاخ الإسعاف. تجنّب الدخان والغبار والروائح القوية. خذ لقاح الإنفلونزا السنوي. تابِع قياسات تدفّق الذروة.",
      ),
      priority: "medium",
      category: text("Respiratory", "الجهاز التنفّسي"),
    });
  }

  const activeMeds = (patient.medications || []).filter(m => m.isActive);
  if (activeMeds.length >= 3) {
    recs.push({
      icon: Pill,
      title: text("Medication Adherence", "الالتزام بالأدوية"),
      description: text(
        `You are on ${activeMeds.length} medications. Set daily reminders and never skip doses without consulting your doctor. Bring your medication list to every appointment.`,
        `أنت تتناول ${activeMeds.length} أدوية. اضبط تذكيرات يومية ولا تتخطَّ أي جرعة دون استشارة طبيبك. أحضِر قائمة أدويتك في كل موعد.`,
      ),
      priority: "medium",
      category: text("Medications", "الأدوية"),
    });
  }

  const lastVisitDate = patient.visits?.[0]?.visitDate;
  const daysSinceVisit = lastVisitDate
    ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceVisit > 180 && conditions.length > 0) {
    recs.push({
      icon: CalendarDays,
      title: text("Schedule a Routine Check-up", "احجز فحصًا دوريًا"),
      description: text(
        `It has been ${Math.round(daysSinceVisit / 30)} months since your last recorded visit. Regular check-ups are essential for managing your conditions.`,
        `مضى ${Math.round(daysSinceVisit / 30)} شهرًا منذ آخر زيارة مُسجّلة لك. الفحوصات الدورية ضرورية لإدارة حالتك الصحية.`,
      ),
      priority: "medium",
      category: text("Preventive Care", "الرعاية الوقائية"),
    });
  }

  if (age >= 50) {
    recs.push({
      icon: Stethoscope,
      title: text("Age-Appropriate Screenings", "فحوصات مناسبة للعمر"),
      description: age >= 65
        ? text(
            "At your age, annual screenings for colon cancer, osteoporosis, and cardiovascular disease are recommended. Discuss vaccination schedules with your doctor.",
            "في عمرك، يُوصى بالفحوصات السنوية لسرطان القولون وهشاشة العظام وأمراض القلب والأوعية. ناقش جداول التطعيمات مع طبيبك.",
          )
        : text(
            "Consider screenings for colorectal cancer (colonoscopy), blood pressure, cholesterol, and diabetes if not already monitored.",
            "فكّر في فحوصات سرطان القولون والمستقيم (تنظير القولون) وضغط الدم والكوليسترول والسكري إن لم تكن متابَعة بالفعل.",
          ),
      priority: "medium",
      category: text("Preventive Care", "الرعاية الوقائية"),
    });
  }

  recs.push({
    icon: Lightbulb,
    title: text("Healthy Lifestyle Habits", "عادات نمط حياة صحي"),
    description: text(
      "Walk 30 minutes daily, maintain a balanced diet rich in vegetables and whole grains, limit sodium to < 2g/day, sleep 7-8 hours, and manage stress through mindfulness.",
      "امشِ 30 دقيقة يوميًا، واتّبع نظامًا غذائيًا متوازنًا غنيًا بالخضار والحبوب الكاملة، وقلّل الصوديوم إلى أقل من 2 غرام يوميًا، ونم 7–8 ساعات، وتعامل مع التوتر عبر اليقظة الذهنية.",
    ),
    priority: "low",
    category: text("Lifestyle", "نمط الحياة"),
  });

  return recs.slice(0, 8);
}

function AppointmentBooking({ patientId }: { patientId: number }) {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const today = new Date().toISOString().split("T")[0]!;
  const [hospital, setHospital] = useState("");
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  const { data: hospData } = useQuery({ queryKey: ["apt-hospitals"], queryFn: fetchHospitals });
  const { data: deptData } = useQuery({ queryKey: ["apt-departments"], queryFn: fetchDepartments });
  const { data: slotsData } = useQuery({
    queryKey: ["apt-slots", date, hospital, department],
    queryFn: () => fetchSlots(date, hospital, department),
    enabled: !!(date && hospital && department),
  });
  const { data: myApts, refetch: refetchApts } = useQuery({
    queryKey: ["apt-patient", patientId],
    queryFn: () => fetchPatientAppointments(patientId),
    enabled: !!patientId,
  });

  const bookMutation = useMutation({
    mutationFn: bookAppointment,
    onSuccess: (res) => {
      setBooked(res.appointment);
      setTime("");
      setNotes("");
      setBookingError("");
      refetchApts();
    },
    onError: (e: any) => setBookingError(e.message),
  });

  const services = deptData?.services?.[department] ?? [];
  const [service, setService] = useState("");
  const slots = slotsData?.slots ?? [];

  const handleBook = () => {
    if (!hospital || !department || !date || !time) return;
    setBookingError("");
    bookMutation.mutate({ patientId, hospital, department, service: service || department, date, time, notes });
  };

  const myAppointments = myApts?.appointments ?? [];

  return (
    <div className="p-5 space-y-5">
      {/* Upcoming Appointments */}
      {myAppointments.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" /> {text("My Appointments", "مواعيدي")}
          </p>
          <div className="space-y-2">
            {myAppointments.map((apt: any) => (
              <div key={apt.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${apt.status === "confirmed" ? "bg-success-bg border-success/30" : "bg-secondary border-border"}`}>
                <div className="w-10 h-10 rounded-xl bg-card flex flex-col items-center justify-center shrink-0 border border-border">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{apt.date ? new Date(apt.date).toLocaleString("en", { month: "short" }) : "-"}</p>
                  <p className="text-lg font-bold text-foreground leading-none">{apt.date ? new Date(apt.date).getDate() : "-"}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-foreground">{apt.department}</p>
                    <Badge variant={apt.status === "confirmed" ? "success" : "outline"} className="text-[9px]">{apt.status === "confirmed" ? text("confirmed", "مؤكّد") : apt.status === "cancelled" ? text("cancelled", "ملغى") : apt.status === "completed" ? text("completed", "مكتمل") : apt.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{apt.hospital}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5" dir="ltr">{apt.time} · {text("Ref:", "المرجع:")} {apt.referenceNo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {booked && (
        <div className="p-4 rounded-2xl bg-success-bg border-2 border-success/30">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-success font-medium">{text("Appointment Confirmed!", "تم تأكيد الموعد!")}</p>
              <p className="text-xs text-success mt-0.5">{text("Reference:", "المرجع:")} <span className="font-mono font-bold">{booked.referenceNo}</span></p>
            </div>
            <button onClick={() => setBooked(null)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-card/70 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground">{text("Date", "التاريخ")}</p>
              <p className="text-xs font-bold text-foreground">{booked.date}</p>
            </div>
            <div className="bg-card/70 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground">{text("Time", "الوقت")}</p>
              <p className="text-xs font-bold text-foreground">{booked.time}</p>
            </div>
            <div className="bg-card/70 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground">{text("Department", "القسم")}</p>
              <p className="text-xs font-bold text-foreground">{booked.department}</p>
            </div>
          </div>
          {booked.aiReminders && (
            <div className="space-y-1.5">
              {booked.aiReminders.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2 px-3 py-1.5 bg-card/50 rounded-xl">
                  <Sparkles className="w-3 h-3 text-success shrink-0 mt-0.5" />
                  <p className="text-[11px] text-success">{r}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Form */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Stethoscope className="w-3.5 h-3.5" /> {text("Book New Appointment", "حجز موعد جديد")}
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Hospital *", "المستشفى *")}</p>
            <select
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={hospital}
              onChange={e => { setHospital(e.target.value); setTime(""); }}
            >
              <option value="">{text("Select hospital...", "اختر المستشفى...")}</option>
              {hospData?.hospitals?.map((h: string) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Department *", "القسم *")}</p>
            <select
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={department}
              onChange={e => { setDepartment(e.target.value); setService(""); setTime(""); }}
            >
              <option value="">{text("Select department...", "اختر القسم...")}</option>
              {deptData?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Service", "الخدمة")}</p>
              <select
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={service}
                onChange={e => setService(e.target.value)}
              >
                <option value="">{text("General consultation...", "استشارة عامة...")}</option>
                {services.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Date *", "التاريخ *")}</p>
            <Input
              type="date"
              value={date}
              min={today}
              onChange={e => { setDate(e.target.value); setTime(""); }}
            />
          </div>
        </div>

        {/* Time Slots */}
        {hospital && department && date && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{text("Available Time Slots *", "المواعيد المتاحة *")}</p>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-secondary px-4 py-3 rounded-xl">{text("No available slots for this date. Please try another date.", "لا توجد مواعيد متاحة في هذا التاريخ. يُرجى تجربة تاريخ آخر.")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setTime(s)}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all border ${
                      time === s
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-border text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{text("Notes (optional)", "ملاحظات (اختياري)")}</p>
          <Input
            placeholder={text("Any specific concerns or reason for visit...", "أي مخاوف محددة أو سبب الزيارة...")}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {bookingError && (
          <div className="mb-3 px-4 py-2.5 bg-danger-bg border border-danger/30 rounded-xl text-sm text-danger font-medium">
            {bookingError}
          </div>
        )}

        <Button
          onClick={handleBook}
          disabled={!hospital || !department || !date || !time || bookMutation.isPending}
          className="w-full"
        >
          <CalendarDays className="w-4 h-4" />
          {bookMutation.isPending ? text("Booking appointment...", "جارٍ الحجز...") : text("Confirm Appointment", "تأكيد الموعد")}
        </Button>
      </div>
    </div>
  );
}

export default function CitizenPortal() {
  const { user: authUser } = useAuth();
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [loginId, setLoginId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [recordView, setRecordView] = useState<"medications" | "labs" | "visits">("medications");
  const [showSsePanel, setShowSsePanel] = useState(false);

  // The citizen already authenticated at /login — their record loads
  // directly from the session identity. The manual ID form below is only a
  // fallback for sessions without a linked national ID.
  useEffect(() => {
    if (authUser?.nationalId && !isLoggedIn) {
      setLoginId(authUser.nationalId);
      setIsLoggedIn(true);
    }
  }, [authUser?.nationalId, isLoggedIn]);

  const { alerts: sseAlerts, connected: sseConnected, unreadCount: sseUnread, markRead: markSseRead, clearAll: clearSseAlerts } = useSseAlerts("citizen");

  const { data: patient, isLoading } = useGetPatientByNationalId(
    loginId,
    { query: { enabled: isLoggedIn, retry: false } }
  );

  const { data: aiDecision } = useAiDecision(
    (patient as { id?: number })?.id || 0,
    { enabled: !!patient }
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId.trim()) setIsLoggedIn(true);
  };

  // The score shown to the citizen comes from the SAME server risk engine the
  // physician sees (inverted to a well-being scale) — never from a parallel
  // client-side heuristic that could contradict the clinical record.
  const healthScore = useMemo(() => {
    if (!patient) return null;
    if (aiDecision) {
      const score = Math.max(0, Math.min(100, 100 - aiDecision.riskScore));
      const graded = gradeLadder(score, text);
      return { score, ...graded, summary: aiDecision.explainability?.summary || graded.summary };
    }
    return null; // wait for the engine instead of showing a contradictory local estimate
  }, [patient, aiDecision]);

  const recommendations = useMemo(() => {
    if (!patient) return [];
    return generateRecommendations(patient, text);
  }, [patient, text]);

  if (!isLoggedIn) {
    return (
      <Layout role="citizen" localized>
        <div className="max-w-md mx-auto mt-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-risk-high-bg flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-risk-high" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{text("Link your health record", "اربط سجلك الصحي")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {text("Your session isn't linked to a national record yet. Enter your National ID to load it.", "جلستك غير مرتبطة بسجل وطني بعد. أدخل رقم هويتك الوطنية لتحميله.")}
            </p>
          </div>
          <Card className="rounded-3xl">
            <CardBody className="p-7">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("National ID", "رقم الهوية الوطنية")}</label>
                  <Input
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    placeholder={text("Enter your 10-digit National ID", "أدخل رقم هويتك المكوّن من 10 أرقام")}
                    className="font-mono text-sm h-11 rounded-2xl"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2" dir="ltr">{text("Demo IDs:", "أرقام تجريبية:")} 1000000001 · 1000000004 · 1000000010</p>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Lock className="w-4 h-4" /> {text("Load My Record", "تحميل سجلي")}
                </Button>
              </form>
            </CardBody>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
            {text("Your data is protected under the Saudi Personal Data Protection Law (PDPL) and national health data governance standards.", "بياناتك محمية بموجب نظام حماية البيانات الشخصية السعودي (PDPL) ومعايير حوكمة البيانات الصحية الوطنية.")}
          </p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout role="citizen" localized>
        <div className="flex items-center gap-3 py-20 justify-center text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning" />
          <span className="text-sm">{text("Loading your health records...", "جارٍ تحميل سجلاتك الصحية...")}</span>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout role="citizen" localized>
        <Card className="rounded-3xl">
          <CardBody className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-foreground mb-1">{text("No Records Found", "لا توجد سجلات")}</p>
            <p className="text-sm text-muted-foreground mb-4">{text("National ID", "رقم الهوية")} <span className="font-mono" dir="ltr">{loginId}</span> {text("was not found.", "غير موجود.")}</p>
            <Button variant="outline" size="sm" onClick={() => { setIsLoggedIn(false); setLoginId(""); }}>{text("Try Again", "إعادة المحاولة")}</Button>
          </CardBody>
        </Card>
      </Layout>
    );
  }

  const activeMeds = patient.medications?.filter(m => m.isActive) ?? [];
  const labResults = patient.labResults ?? [];
  const abnormal = labResults.filter(l => l.status !== "normal").length;
  const criticalCount = labResults.filter(l => l.status === "critical").length;
  const highPriorityRecs = recommendations.filter(r => r.priority === "high").length;

  const priorityColors = {
    high: { bg: "bg-danger-bg", border: "border-danger/30", badge: "destructive" as const, dot: "bg-danger" },
    medium: { bg: "bg-risk-high-bg", border: "border-risk-high/20", badge: "warning" as const, dot: "bg-risk-high" },
    low: { bg: "bg-secondary", border: "border-border", badge: "outline" as const, dot: "bg-muted-foreground" },
  };

  return (
    <Layout role="citizen" localized>
      <PageHeader
        title={text(`My Health — ${patient.fullName.split(" ")[0]}`, `صحتي — ${patient.fullName.split(" ")[0]}`)}
        subtitle={text("Your personal AI health score, recommendations, and complete national health record.", "درجتك الصحية الذكية، والتوصيات، وسجلك الصحي الوطني الكامل.")}
        action={
          <div className="flex items-center gap-2">
            {/* SSE Live Alert Bell */}
            <div className="relative">
              <button
                onClick={() => setShowSsePanel(p => !p)}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                  sseUnread > 0 ? "bg-destructive/10 border-danger/30 hover:bg-danger-bg" : "bg-card border-border hover:bg-secondary"
                }`}
                title={sseConnected ? text("Live health alerts", "تنبيهات صحية حيّة") : text("Connecting...", "جارٍ الاتصال...")}
              >
                <Bell className={`w-4 h-4 ${sseUnread > 0 ? "text-danger" : "text-muted-foreground"}`} />
                {sseUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                    {sseUnread > 9 ? "9+" : sseUnread}
                  </span>
                )}
              </button>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${sseConnected ? "bg-success" : "bg-gray-300"}`} />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setIsLoggedIn(false); setLoginId(""); }}>
              {text("Sign Out", "تسجيل الخروج")}
            </Button>
          </div>
        }
      />

      {/* SSE Real-time Lab Alert Panel */}
      {showSsePanel && sseAlerts.length > 0 && (
        <div className="mb-4 rounded-2xl border border-danger/30 bg-danger-bg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-danger/30 bg-danger-bg/60">
            <Bell className="w-4 h-4 text-danger" />
            <span className="font-bold text-sm text-danger">{text("Live Health Alerts", "تنبيهات صحية حيّة")}</span>
            {sseUnread > 0 && <Badge variant="destructive" className="text-[10px]">{text(`${sseUnread} new`, `${sseUnread} جديد`)}</Badge>}
            <button onClick={() => { clearSseAlerts(); setShowSsePanel(false); }} className="ml-auto text-danger hover:text-danger">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-danger/30 max-h-56 overflow-y-auto">
            {sseAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => markSseRead(alert.id)}
                className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-danger-bg/40 transition-colors ${!alert.read ? "bg-danger-bg" : "bg-card/50"}`}
              >
                <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === "critical" ? "text-danger" : "text-risk-high"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-danger">{alert.title}</p>
                  <p className="text-xs text-danger mt-0.5 truncate">{alert.significance}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{alert.testName} · {alert.result} · {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
                {!alert.read && <span className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {criticalCount > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-danger-bg border border-danger/30 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm font-semibold text-danger">
            <strong>{text(`${criticalCount} critical lab result${criticalCount > 1 ? "s" : ""}`, `${criticalCount} نتيجة مخبرية حرجة`)}</strong> — {text("please contact your doctor as soon as possible.", "يُرجى التواصل مع طبيبك في أقرب وقت ممكن.")}
          </p>
          <Badge variant="destructive" className="ms-auto shrink-0">{text("Urgent", "عاجل")}</Badge>
        </div>
      )}

      {/* Identity + Score Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <Card className="col-span-full lg:col-span-7">
          <CardBody className="flex items-center gap-4 p-5">
            <div className="w-14 h-14 rounded-3xl bg-risk-high-bg flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-risk-high" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1.5">{patient.fullName}</h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono bg-secondary text-xs px-2.5 py-1 rounded-xl" dir="ltr">{patient.nationalId}</span>
                <span className="text-xs text-muted-foreground">{text("DOB:", "تاريخ الميلاد:")} {format(new Date(patient.dateOfBirth), "dd MMM yyyy")}</span>
                <span className="text-xs text-muted-foreground">· {patient.gender === "male" ? text("Male", "ذكر") : text("Female", "أنثى")}</span>
                <span className="text-xs font-bold text-danger bg-danger-bg px-2.5 py-0.5 rounded-full">{text("Blood:", "فصيلة الدم:")} <span dir="ltr">{patient.bloodType}</span></span>
              </div>
            </div>
            {(patient.allergies?.length ?? 0) > 0 && (
              <Badge variant="destructive">{text(`${patient.allergies?.length ?? 0} Allerg${(patient.allergies?.length ?? 0) > 1 ? "ies" : "y"}`, `${patient.allergies?.length ?? 0} حساسية`)}</Badge>
            )}
          </CardBody>
        </Card>

        {healthScore && (
          <Card className={`col-span-3 ${healthScore.bg} border-${healthScore.bg.replace("bg-", "border-")}`}>
            <CardBody className="flex flex-col items-center justify-center py-5 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{text("AI Health Score", "درجتك الصحية")}</p>
              <div className="relative w-24 h-24 mb-2">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={healthScore.score >= 85 ? "#22c55e" : healthScore.score >= 70 ? "#38bdf8" : healthScore.score >= 55 ? "#f59e0b" : healthScore.score >= 40 ? "#f97316" : "#ef4444"}
                    strokeWidth="2.5"
                    strokeDasharray={`${healthScore.score} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold tabular-nums ${healthScore.color}`}>{healthScore.score}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
              </div>
              <Badge
                variant={healthScore.grade === "A" ? "success" : healthScore.grade === "B" ? "info" : healthScore.grade === "C" ? "warning" : "destructive"}
                className="text-xs"
              >
                {text(`Grade ${healthScore.grade}`, `تقدير ${healthScore.grade}`)} — {healthScore.label}
              </Badge>
            </CardBody>
          </Card>
        )}

        <Card className="col-span-full lg:col-span-2">
          <CardBody className="flex flex-col gap-3 justify-center h-full py-5 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Pill className="w-3.5 h-3.5 text-risk-high" /> {text("Active Meds", "الأدوية الفعّالة")}</div>
              <span className="font-bold text-foreground">{activeMeds.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><FlaskConical className="w-3.5 h-3.5 text-info" /> {text("Lab Results", "نتائج المختبر")}</div>
              <span className="font-bold text-foreground">{labResults.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Bell className="w-3.5 h-3.5 text-danger" /> {text("Abnormal", "غير طبيعية")}</div>
              <span className={`font-bold ${abnormal > 0 ? "text-risk-high" : "text-foreground"}`}>{abnormal}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Lightbulb className="w-3.5 h-3.5 text-violet-500" /> {text("AI Tips", "نصائح ذكية")}</div>
              <span className={`font-bold ${highPriorityRecs > 0 ? "text-danger" : "text-foreground"}`}>{recommendations.length}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          tabs={[
            { id: "overview", label: text(...T.overview) },
            { id: "record", label: text("My Record", "سجلي الطبي") },
            { id: "appointments", label: text(...T.appointments) },
            { id: "consent", label: text(...T.privacy) },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* Record sub-views: one tab, three lenses on the same record. */}
        {activeTab === "record" && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-secondary/40 px-5 py-3">
            {([
              { id: "medications", label: text(`Prescriptions · ${activeMeds.length}`, `الوصفات · ${activeMeds.length}`) },
              { id: "labs", label: text(`Lab Results · ${labResults.length}`, `نتائج المختبر · ${labResults.length}`) },
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
          <div className="p-5">
            {!aiDecision ? (
              <div className="py-12 text-center">
                <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-bold text-foreground mb-1">{text("Loading Your Health Forecast", "جارٍ تحميل توقّعاتك الصحية")}</p>
                <p className="text-sm text-muted-foreground">{text("The AI is analyzing your health data...", "يحلّل الذكاء الاصطناعي بياناتك الصحية...")}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Overall Health Trajectory */}
                <div className={`rounded-3xl p-5 ${
                  aiDecision.digitalTwin?.riskTrajectory === "rapidly_worsening" ? "bg-danger text-white" :
                  aiDecision.digitalTwin?.riskTrajectory === "worsening" ? "bg-risk-high text-white" :
                  aiDecision.digitalTwin?.riskTrajectory === "improving" ? "bg-success text-white" :
                  "bg-info text-white"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">{text("Your Health Forecast (12 months)", "توقّعاتك الصحية (12 شهرًا)")}</p>
                      <p className="text-xl font-bold leading-snug">
                        {aiDecision.digitalTwin?.riskTrajectory === "rapidly_worsening" ? text("Urgent attention needed", "تحتاج إلى عناية عاجلة") :
                         aiDecision.digitalTwin?.riskTrajectory === "worsening" ? text("Health is declining — take action", "صحتك في تراجع — اتّخذ إجراءً") :
                         aiDecision.digitalTwin?.riskTrajectory === "improving" ? text("Great news! Health is improving", "خبر رائع! صحتك تتحسّن") :
                         text("Health is stable", "صحتك مستقرّة")}
                      </p>
                      <p className="text-sm text-white/80 mt-1.5">{aiDecision.explainability?.summary}</p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-[10px] text-white/70 uppercase tracking-widest">{text("Predicted Risk", "الخطورة المتوقعة")}</p>
                      <p className="text-5xl font-bold tabular-nums" dir="ltr">{aiDecision.digitalTwin?.projectedRiskScore ?? "—"}</p>
                      <p className="text-[10px] text-white/60">/ 100</p>
                    </div>
                  </div>
                  {aiDecision.digitalTwin?.interventionWindow && (
                    <div className="mt-3 px-3 py-2 bg-card/20 rounded-xl">
                      <p className="text-xs font-semibold text-white">{aiDecision.digitalTwin.interventionWindow}</p>
                    </div>
                  )}
                </div>

                {/* Predicted Conditions */}
                {aiDecision.digitalTwin?.predictedConditions && aiDecision.digitalTwin.predictedConditions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-risk-high" /> {text("Conditions to Watch Out For", "حالات يجب الانتباه لها")}
                    </p>
                    <div className="space-y-2">
                      {aiDecision.digitalTwin.predictedConditions.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3 bg-risk-high-bg border border-risk-high/20 rounded-xl">
                          <ArrowUpRight className="w-4 h-4 text-risk-high shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Drivers */}
                {aiDecision.digitalTwin?.keyDrivers && aiDecision.digitalTwin.keyDrivers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-primary" /> {text("Key Health Drivers", "أبرز محرّكات صحتك")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {aiDecision.digitalTwin.keyDrivers.map((driver, i) => (
                        <div key={i} className="flex items-start gap-2.5 px-3.5 py-3 bg-secondary border border-border rounded-xl">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-xs text-foreground">{driver}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiDecision.recommendations && aiDecision.recommendations.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" /> {text("Personalized Recommendations", "توصيات مخصّصة لك")}
                    </p>
                    <div className="space-y-2">
                      {aiDecision.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl">
                          <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="px-4 py-3.5 bg-secondary border border-border rounded-2xl">
                  <p className="text-[10px] text-muted-foreground flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {text("This AI forecast is based on your current health records and is intended for informational purposes only. Always consult your doctor before making any health decisions.", "يستند هذا التوقّع الذكي إلى سجلاتك الصحية الحالية وهو لأغراض إعلامية فقط. استشر طبيبك دائمًا قبل اتّخاذ أي قرارات صحية.")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && healthScore && (
          <div className="p-5 space-y-5">
            {/* Score interpretation */}
            <div className={`flex items-start gap-4 p-5 ${healthScore.bg} border border-border rounded-2xl`}>
              <div className="flex-shrink-0">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={healthScore.score >= 85 ? "#22c55e" : healthScore.score >= 70 ? "#38bdf8" : healthScore.score >= 55 ? "#f59e0b" : healthScore.score >= 40 ? "#f97316" : "#ef4444"}
                      strokeWidth="2.5"
                      strokeDasharray={`${healthScore.score} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold tabular-nums ${healthScore.color}`}>{healthScore.score}</span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`text-2xl font-bold ${healthScore.color}`}>{healthScore.label}</h3>
                  <Badge variant={healthScore.grade === "A" ? "success" : healthScore.grade === "B" ? "info" : healthScore.grade === "C" ? "warning" : "destructive"}>
                    {text(`Grade ${healthScore.grade}`, `تقدير ${healthScore.grade}`)}
                  </Badge>
                </div>
                <p className="text-sm text-foreground font-medium leading-relaxed">{healthScore.summary}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> {text("Based on your live medical data", "بناءً على بياناتك الطبية الحيّة")}</span>
                  <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {text("AI-powered analysis", "تحليل بالذكاء الاصطناعي")}</span>
                </div>
              </div>
            </div>

            {/* Score Factors */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Star className="w-3.5 h-3.5" /> {text("Score Breakdown", "تفصيل الدرجة")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: text("Chronic Conditions", "الأمراض المزمنة"), value: patient.chronicConditions?.length ?? 0, max: 5, good: 0, icon: Activity },
                  { label: text("Active Medications", "الأدوية الفعّالة"), value: activeMeds.length, max: 8, good: 2, icon: Pill },
                  { label: text("Abnormal Labs", "تحاليل غير طبيعية"), value: abnormal, max: 5, good: 0, icon: FlaskConical },
                  { label: text("Recent Visits", "الزيارات الأخيرة"), value: patient.visits?.length ?? 0, max: 10, good: 1, icon: CalendarDays },
                ].map((item) => {
                  const pct = Math.max(5, 100 - (item.value / item.max) * 100);
                  const isGood = item.value <= item.good;
                  return (
                    <div key={item.label} className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-2xl">
                      <item.icon className={`w-4 h-4 shrink-0 ${isGood ? "text-success" : item.value >= item.max * 0.7 ? "text-danger" : "text-risk-high"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-background rounded-full h-1.5">
                            <div
                              className={`h-full rounded-full ${isGood ? "bg-success" : item.value >= item.max * 0.7 ? "bg-danger" : "bg-risk-high"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Recommendations */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5" /> {text("Personalised Health Recommendations", "توصيات صحية مخصّصة")}
              </p>
              <div className="space-y-2.5">
                {recommendations.map((rec, i) => {
                  const cfg = priorityColors[rec.priority];
                  const Icon = rec.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3.5 p-4 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                      <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-foreground">{rec.title}</p>
                          <Badge variant={cfg.badge} className="text-[10px] shrink-0">{rec.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                      </div>
                      {rec.priority === "high" && (
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1.5`} />
                      )}
                    </div>
                  );
                })}
                {recommendations.length === 0 && (
                  <div className="flex items-center gap-3 px-4 py-5 bg-success-bg border border-success/30 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <p className="text-sm font-semibold text-success">{text("No urgent recommendations. Continue your healthy routine!", "لا توجد توصيات عاجلة. واصِل روتينك الصحي!")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <AppointmentBooking patientId={(patient as { id?: number }).id || 0} />
        )}

        {activeTab === "overview" && (
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
              ) : <p className="text-sm text-muted-foreground">{text("No chronic conditions on record.", "لا توجد أمراض مزمنة مُسجّلة.")}</p>}
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-danger" /> {text("Documented Allergies", "الحساسية المُوثّقة")}
              </p>
              {(patient.allergies?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {patient.allergies?.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-danger-bg border border-danger/30 rounded-2xl">
                      <StatusDot status="critical" />
                      <span className="text-sm font-bold text-danger">{a}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">{text("No known allergies.", "لا توجد حساسية معروفة.")}</p>}
            </div>
          </div>
        )}

        {activeTab === "record" && recordView === "medications" && (
          <div className="overflow-x-auto"><table className="w-full data-table">
            <thead><tr>
              <th>{text("Drug Name", "اسم الدواء")}</th><th>{text("Dosage", "الجرعة")}</th><th>{text("Frequency", "التكرار")}</th><th>{text("Prescribed By", "الطبيب الواصف")}</th><th>{text("Facility", "المنشأة")}</th><th>{text("Status", "الحالة")}</th>
            </tr></thead>
            <tbody>
              {patient.medications?.map(med => (
                <tr key={med.id}>
                  <td className="font-bold text-foreground">{med.drugName}</td>
                  <td className="font-mono text-sm" dir="ltr">{med.dosage}</td>
                  <td className="text-muted-foreground">{med.frequency}</td>
                  <td>{med.prescribedBy}</td>
                  <td className="text-muted-foreground text-xs">{med.hospital}</td>
                  <td><Badge variant={med.isActive ? "success" : "outline"}>{med.isActive ? text("Active", "نشط") : text("Completed", "مكتمل")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}

        {activeTab === "record" && recordView === "labs" && (
          <div className="overflow-x-auto"><table className="w-full data-table">
            <thead><tr>
              <th>{text("Test Name", "اسم الفحص")}</th><th>{text("Result", "النتيجة")}</th><th>{text("Reference Range", "النطاق المرجعي")}</th><th>{text("Date", "التاريخ")}</th><th>{text("Status", "الحالة")}</th>
            </tr></thead>
            <tbody>
              {labResults.map(lab => (
                <tr key={lab.id}>
                  <td className="font-bold text-foreground">{lab.testName}</td>
                  <td className="font-mono font-semibold" dir="ltr">{lab.result} <span className="text-muted-foreground font-normal">{lab.unit}</span></td>
                  <td className="text-muted-foreground text-xs font-mono" dir="ltr">{lab.referenceRange || "—"}</td>
                  <td className="text-muted-foreground font-mono text-xs" dir="ltr">{format(new Date(lab.testDate), "dd MMM yyyy")}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusDot status={lab.status as "critical" | "abnormal" | "normal"} />
                      <Badge variant={lab.status === "normal" ? "success" : lab.status === "abnormal" ? "warning" : "destructive"}>{lab.status === "normal" ? text("normal", "طبيعي") : lab.status === "abnormal" ? text("abnormal", "غير طبيعي") : text("critical", "حرج")}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}

        {activeTab === "record" && recordView === "visits" && (
          <div className="overflow-x-auto"><table className="w-full data-table">
            <thead><tr>
              <th>{text("Hospital", "المستشفى")}</th><th>{text("Department", "القسم")}</th><th>{text("Visit Type", "نوع الزيارة")}</th><th>{text("Diagnosis", "التشخيص")}</th><th>{text("Date", "التاريخ")}</th>
            </tr></thead>
            <tbody>
              {patient.visits?.map(visit => (
                <tr key={visit.id}>
                  <td className="font-bold text-foreground">{visit.hospital}</td>
                  <td>{visit.department}</td>
                  <td><Badge variant="outline">{visitTypeArCitizen(visit.visitType, text)}</Badge></td>
                  <td className="text-muted-foreground max-w-xs truncate">{visit.diagnosis}</td>
                  <td className="text-muted-foreground font-mono text-xs" dir="ltr">{format(new Date(visit.visitDate), "dd MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}

        {activeTab === "consent" && (
          <ConsentTab nationalId={loginId} patientName={patient.fullName} />
        )}
      </Card>
    </Layout>
  );
}

// ─── Consent Tab Component ───────────────────────────────────────────────────

const CONSENT_ICONS: Record<string, React.ElementType> = {
  data_sharing: Share2,
  emergency_access: ShieldAlert,
  research: Brain,
  insurance: Shield,
  family_linking: Users,
  ai_processing: Fingerprint,
};

const SEVERITY_CFG = {
  high:   { bg: "bg-danger-bg",     border: "border-danger/30",    text: "text-danger",    badge: "destructive" as const },
  medium: { bg: "bg-risk-high-bg",   border: "border-risk-high/20",  text: "text-risk-high",  badge: "warning" as const },
  low:    { bg: "bg-success-bg", border: "border-success/30",text: "text-success",badge: "success" as const },
};

async function fetchConsent(nationalId: string) {
  const res = await apiFetch(`/api/consent/patient/${nationalId}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function updateConsent(payload: { nationalId: string; consentType: string; granted: boolean }) {
  const res = await apiFetch("/api/consent/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.message ?? "Failed");
  }
  return res.json();
}

function ConsentTab({ nationalId, patientName }: { nationalId: string; patientName: string }) {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const qc = useQueryClient();
  const [toggling, setToggling] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["consent", nationalId],
    queryFn: () => fetchConsent(nationalId),
    enabled: !!nationalId,
  });

  const mutation = useMutation({
    mutationFn: updateConsent,
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["consent", nationalId] });
      setToggling(null);
      setToast({ msg: res.message, ok: true });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: Error, vars) => {
      setToggling(null);
      setToast({ msg: err.message, ok: false });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const handleToggle = (consentType: string, currentGranted: boolean, canRevoke: boolean, title: string) => {
    const nextGranted = !currentGranted;
    if (!canRevoke && !nextGranted) {
      setToast({ msg: text("This consent is required for platform operation and cannot be revoked.", "هذه الموافقة ضرورية لتشغيل المنصّة ولا يمكن سحبها."), ok: false });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    if (!nextGranted) {
      const msg = text(
        `Revoking consent for '${title}' will immediately block access. Are you sure?`,
        `إلغاء الموافقة على '${title}' سيوقف الوصول فوراً. هل أنت متأكد؟`
      );
      if (!window.confirm(msg)) {
        return;
      }
    }

    setToggling(consentType);
    mutation.mutate({ nationalId, consentType, granted: nextGranted });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-info" />
        <span className="text-sm font-medium">{text("Loading your consent preferences...", "جارٍ تحميل تفضيلات الموافقة...")}</span>
      </div>
    );
  }

  const consents = data?.consents ?? [];
  const summary = data?.summary ?? {};
  const history = data?.history ?? [];

  return (
    <div className="p-5 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${
          toast.ok ? "bg-success-bg border-success/30 text-success" : "bg-danger-bg border-danger/30 text-danger"
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertOctagon className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-info/30">
        <div className="w-10 h-10 rounded-2xl bg-info-bg flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground text-sm">{text("Your Data. Your Control.", "بياناتك. تحت سيطرتك.")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {text("You decide who can access your health information and for what purpose. All consent changes are logged and audited per MOH Circular 42/1445.", "أنت من يقرّر مَن يطّلع على معلوماتك الصحية ولأي غرض. تُسجَّل جميع تغييرات الموافقة وتُدقَّق وفق تعميم وزارة الصحة 42/1445.")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="text-center">
            <p className="text-lg font-black text-success">{summary.granted ?? 0}</p>
            <p className="text-muted-foreground">{text("Active", "نشطة")}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-black text-danger">{summary.revoked ?? 0}</p>
            <p className="text-muted-foreground">{text("Revoked", "مسحوبة")}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-black text-foreground">{summary.total ?? 0}</p>
            <p className="text-muted-foreground">{text("Total", "الإجمالي")}</p>
          </div>
        </div>
      </div>

      {/* Consent Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {consents.map((consent: any) => {
          const Icon = CONSENT_ICONS[consent.type] ?? Shield;
          const sev = SEVERITY_CFG[consent.severity as keyof typeof SEVERITY_CFG] ?? SEVERITY_CFG.low;
          const isToggling = toggling === consent.type;

          return (
            <div
              key={consent.type}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                consent.granted
                  ? "bg-card border-success/30 shadow-sm"
                  : "bg-muted/50/80 border-border"
              }`}
            >
              {/* Status dot */}
              <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-card ${
                consent.granted ? "bg-success" : "bg-gray-300"
              }`} />

              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  consent.granted ? sev.bg : "bg-muted"
                }`}>
                  <Icon className={`w-4 h-4 ${consent.granted ? sev.text : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-[13px] font-bold leading-tight ${consent.granted ? "text-foreground" : "text-muted-foreground"}`}>
                    {consent.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{consent.grantedTo}</p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                {consent.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground/70 font-medium truncate">{consent.legalBasis}</p>
                  {!consent.canRevoke && (
                    <p className="text-[9px] text-risk-high font-bold mt-0.5">{text("⚠ Required — cannot revoke", "⚠ مطلوبة — لا يمكن سحبها")}</p>
                  )}
                </div>

                <button
                  onClick={() => handleToggle(consent.type, consent.granted, consent.canRevoke, consent.title)}
                  disabled={isToggling || !consent.canRevoke}
                  className={`ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 ${
                    consent.granted
                      ? "bg-success-bg text-success hover:bg-success-bg/80"
                      : "bg-muted text-muted-foreground hover:bg-gray-200"
                  } ${!consent.canRevoke ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {isToggling ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : consent.granted ? (
                    <ToggleRight className="w-3.5 h-3.5" />
                  ) : (
                    <ToggleLeft className="w-3.5 h-3.5" />
                  )}
                  {consent.granted ? text("Granted", "ممنوحة") : text("Revoked", "مسحوبة")}
                </button>
              </div>

              {consent.grantedAt && consent.granted && (
                <p className="text-[9px] text-muted-foreground/60 mt-2">
                  {text("Granted", "مُنحت")} {format(new Date(consent.grantedAt), "dd MMM yyyy")}
                  {consent.expiresAt && ` · ${text("Expires", "تنتهي")} ${format(new Date(consent.expiresAt), "dd MMM yyyy")}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Consent Audit History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border-b border-border">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground">{text("Consent Audit Trail", "سجل تدقيق الموافقات")}</p>
            <Badge variant="outline" className="ms-auto text-[10px]">{text(`${history.length} events`, `${history.length} حدث`)}</Badge>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {history.map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  h.action === "granted" ? "bg-success-bg" : "bg-danger-bg"
                }`}>
                  {h.action === "granted"
                    ? <CheckCircle2 className="w-3 h-3 text-success" />
                    : <EyeOff className="w-3 h-3 text-danger" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground capitalize">{h.type.replace(/_/g, " ")} — {h.action === "granted" ? text("granted", "مُنحت") : text("revoked", "سُحبت")}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{h.grantedTo}</p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0 font-mono" dir="ltr">
                  {h.timestamp ? format(new Date(h.timestamp), "dd MMM yy HH:mm") : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal footer */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/30 text-[10px] text-muted-foreground">
        <Lock className="w-3 h-3 shrink-0" />
        {text("All consent actions are cryptographically logged and immutable · PDPL-compliant · MOH Circular 42/1445", "تُسجَّل جميع إجراءات الموافقة تشفيريًا وبصورة غير قابلة للتعديل · متوافقة مع PDPL · تعميم وزارة الصحة 42/1445")}
      </div>
    </div>
  );
}

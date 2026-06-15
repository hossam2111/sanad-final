/**
 * SANAD bilingual healthcare glossary.
 *
 * Single source of truth for terminology that recurs across portals, so the
 * same concept reads identically everywhere. Arabic follows the professional
 * register used in Saudi MOH clinical systems — terminology a physician, nurse,
 * or ministry official would actually use, NOT literal translation.
 *
 * Usage:  const { text } = useLanguage();  text(...T.riskScore)
 * (each entry is an [english, arabic] tuple, spread into the text() helper).
 */
export const T = {
  // ── Clinical core ──────────────────────────────────────────────────────────
  patient: ["Patient", "المريض"],
  patients: ["Patients", "المرضى"],
  riskScore: ["Risk Score", "درجة الخطورة"],
  riskLevel: ["Risk Level", "مستوى الخطورة"],
  nationalId: ["National ID", "رقم الهوية الوطنية"],
  bloodType: ["Blood Type", "فصيلة الدم"],
  age: ["Age", "العمر"],
  gender: ["Gender", "الجنس"],
  male: ["Male", "ذكر"],
  female: ["Female", "أنثى"],
  allergies: ["Allergies", "الحساسية"],
  chronicConditions: ["Chronic Conditions", "الأمراض المزمنة"],
  medications: ["Medications", "الأدوية"],
  activeMedications: ["Active Medications", "الأدوية الفعّالة"],
  labResults: ["Lab Results", "نتائج المختبر"],
  visits: ["Visits", "الزيارات"],
  diagnosis: ["Diagnosis", "التشخيص"],
  emergencyContact: ["Emergency Contact", "جهة الاتصال للطوارئ"],

  // ── Risk / urgency levels ───────────────────────────────────────────────────
  critical: ["Critical", "حرجة"],
  high: ["High", "مرتفعة"],
  moderate: ["Moderate", "متوسطة"],
  medium: ["Medium", "متوسطة"],
  low: ["Low", "منخفضة"],
  immediate: ["Immediate", "فوري"],
  urgent: ["Urgent", "عاجل"],
  soon: ["Soon", "قريب"],
  routine: ["Routine", "روتيني"],

  // ── AI / decision support ───────────────────────────────────────────────────
  decision: ["Decision", "القرار"],
  clinicalDecision: ["Clinical Decision", "القرار السريري"],
  recommendations: ["Recommendations", "التوصيات"],
  confidence: ["Confidence", "مستوى الثقة"],
  digitalTwin: ["Digital Twin", "التوأم الرقمي"],
  predictiveWarnings: ["Predictive Warnings", "الإنذارات التنبؤية"],
  riskFactors: ["Risk Factors", "عوامل الخطورة"],
  urgency: ["Urgency", "درجة الاستعجال"],
  primaryAction: ["Primary Action", "الإجراء الأساسي"],
  drugInteraction: ["Drug Interaction", "التداخل الدوائي"],
  whyThisDecision: ["Why This Decision", "مُبرّرات القرار"],

  // ── Workspace navigation / tabs ─────────────────────────────────────────────
  overview: ["Overview", "نظرة عامة"],
  record: ["Record", "السجل الطبي"],
  intelligence: ["Intelligence", "التحليلات الذكية"],
  alerts: ["Alerts", "التنبيهات"],
  audit: ["Audit", "سجل التدقيق"],
  timeline: ["Timeline", "الجدول الزمني"],
  appointments: ["Appointments", "المواعيد"],
  privacy: ["Privacy", "الخصوصية"],

  // ── Actions / UI ────────────────────────────────────────────────────────────
  search: ["Search", "بحث"],
  load: ["Load", "تحميل"],
  loadPatient: ["Load Patient", "استدعاء المريض"],
  view: ["View", "عرض"],
  close: ["Close", "إغلاق"],
  cancel: ["Cancel", "إلغاء"],
  confirm: ["Confirm", "تأكيد"],
  save: ["Save", "حفظ"],
  export: ["Export", "تصدير"],
  retry: ["Retry", "إعادة المحاولة"],
  viewFullAnalysis: ["Full analysis", "التحليل الكامل"],

  // ── Facilities / people ─────────────────────────────────────────────────────
  hospital: ["Hospital", "المستشفى"],
  department: ["Department", "القسم"],
  doctor: ["Doctor", "الطبيب"],
  physician: ["Physician", "الطبيب"],
  nurse: ["Nurse", "الممرض"],
  prescribedBy: ["Prescribed by", "وصفه"],
  prescriber: ["Prescriber", "الطبيب الواصف"],

  // ── States (empty / loading / error) ────────────────────────────────────────
  loading: ["Loading…", "جارٍ التحميل…"],
  noData: ["No data available", "لا توجد بيانات"],
  notFound: ["Not found", "غير موجود"],
  errorTitle: ["Something went wrong", "حدث خطأ ما"],
  tryAgain: ["Please try again", "يرجى المحاولة مرة أخرى"],

  // ── Units / time ────────────────────────────────────────────────────────────
  years: ["years", "سنة"],
  yearsOld: ["years old", "سنة"],
  days: ["days", "أيام"],
  active: ["Active", "نشط"],
  abnormal: ["Abnormal", "غير طبيعي"],
  normal: ["Normal", "طبيعي"],
} as const;

export type TermKey = keyof typeof T;

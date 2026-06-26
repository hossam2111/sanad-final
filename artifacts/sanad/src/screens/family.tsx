import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardBody, Input, Button, Badge, PageHeader, DataLabel , SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  Users, Search, Heart, AlertTriangle, Shield, Dna, CalendarDays, Activity,
  User, X, ChevronRight, TrendingUp, Brain, Zap, CheckCircle2, Clock, Info
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from "recharts";

class FamilyAccessError extends Error {
  consentRequired: boolean;
  constructor(message: string, consentRequired: boolean) {
    super(message);
    this.consentRequired = consentRequired;
  }
}

async function fetchFamilyData(nationalId: string) {
  const res = await apiFetch(`/api/family/patient/${nationalId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new FamilyAccessError(
      body?.message ?? "Patient not found",
      body?.error === "CONSENT_REQUIRED",
    );
  }
  return res.json();
}

const RISK_CONFIG = {
  high: { color: "text-danger", bg: "bg-danger-bg", border: "border-danger/30", badge: "destructive" as const, dot: "bg-danger", bar: "hsl(var(--destructive))" },
  medium: { color: "text-risk-high", bg: "bg-risk-high-bg", border: "border-risk-high/20", badge: "warning" as const, dot: "bg-risk-high", bar: "hsl(var(--warning))" },
  low: { color: "text-success", bg: "bg-success-bg", border: "border-success/30", badge: "success" as const, dot: "bg-success", bar: "hsl(var(--success))" },
};

const STATUS_CONFIG = {
  "high-risk": { bg: "bg-danger-bg", border: "border-danger/30", text: "text-danger", ringColor: "ring-danger/20", dotColor: "bg-danger" },
  "moderate": { bg: "bg-risk-high-bg", border: "border-risk-high/20", text: "text-risk-high", ringColor: "ring-warning/20", dotColor: "bg-risk-high" },
  "healthy": { bg: "bg-success-bg", border: "border-success/30", text: "text-success", ringColor: "ring-success/20", dotColor: "bg-success" },
};

function FamilyMemberCard({ member, isPatient = false }: { member: any; isPatient?: boolean }) {
  const statusCfg = STATUS_CONFIG[member.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG["healthy"];
  const riskColor = member.riskScore >= 70 ? "text-danger" : member.riskScore >= 40 ? "text-risk-high" : "text-success";
  const riskBg = member.riskScore >= 70 ? "bg-danger-bg" : member.riskScore >= 40 ? "bg-risk-high-bg" : "bg-success-bg";

  return (
    <div className={`relative p-4 rounded-2xl border-2 transition-all ${isPatient ? "border-primary bg-primary/5 ring-2 ring-primary/20" : `${statusCfg.border} ${statusCfg.bg} ring-1 ${statusCfg.ringColor}/20`}`}>
      {isPatient && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-primary text-white px-2.5 py-0.5 rounded-full whitespace-nowrap uppercase tracking-widest">
          INDEX PATIENT
        </div>
      )}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isPatient ? "bg-primary/20" : statusCfg.bg}`}>
          <User className={`w-4 h-4 ${isPatient ? "text-primary" : statusCfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{member.fullName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{member.relationship ?? "Patient"}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">Age {member.age}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] font-bold text-danger">{member.bloodType}</span>
          </div>
        </div>
      </div>
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${riskBg}`}>
        <div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">AI Risk</p>
          <p className={`text-xl font-bold ${riskColor}`}>{member.riskScore}<span className="text-[11px] font-normal opacity-50">/100</span></p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Conditions</p>
          <p className="text-sm font-bold text-foreground">{member.chronicConditions?.length ?? 0}</p>
        </div>
      </div>
      {member.sharedConditions?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-[9px] font-bold text-muted-foreground w-full mb-0.5">SHARED:</span>
          {member.sharedConditions.map((c: string, i: number) => (
            <span key={i} className="text-[9px] font-bold bg-danger-bg text-danger px-1.5 py-0.5 rounded-full">{c}</span>
          ))}
        </div>
      )}
      {member.chronicConditions?.length > 0 && !member.sharedConditions?.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {member.chronicConditions.slice(0, 2).map((c: string, i: number) => (
            <span key={i} className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">{c}</span>
          ))}
          {member.chronicConditions.length > 2 && <span className="text-[9px] text-muted-foreground">+{member.chronicConditions.length - 2}</span>}
        </div>
      )}
    </div>
  );
}

type TabId = "tree" | "genetics" | "burden" | "screening";

export default function FamilyPortal() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("tree");
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["family-data", nationalId],
    queryFn: () => fetchFamilyData(nationalId),
    enabled: !!nationalId,
    retry: false,
  });
  const consentRequired = error instanceof FamilyAccessError && error.consentRequired;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "tree", label: text("Family Tree", "شجرة العائلة"), icon: <Users className="w-3.5 h-3.5" /> },
    { id: "genetics", label: text("Genetic Risks", "المخاطر الوراثية"), icon: <Dna className="w-3.5 h-3.5" /> },
    { id: "burden", label: text("Condition Burden", "عبء الأمراض"), icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "screening", label: text("Screening Plan", "خطة الفحص"), icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <Layout role="family" localized>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-pink-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest">
          <Users className="w-3 h-3" /> {text("Family Health Portal", "بوابة صحة الأسرة")}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
          <Dna className="w-3 h-3" /> {text("Genetic Risk Intelligence Active", "ذكاء المخاطر الوراثية نشط")}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (searchId.trim()) { setNationalId(searchId.trim()); setActiveTab("tree"); } }} className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder={text("National ID...", "رقم الهوية...")} className="ps-9 w-52" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          </div>
          <Button type="submit" size="md">{text("Load Family Profile", "تحميل ملف الأسرة")}</Button>
        </form>
      </div>

      <div className="flex items-start justify-between mb-5">
        <PageHeader title={text("Family Health & Genetic Risk Portal", "بوابة صحة الأسرة والمخاطر الوراثية")} subtitle={text("Map familial disease inheritance, shared genetic risks, and coordinate family-wide preventive screening.", "رسم وراثة الأمراض العائلية، والمخاطر الجينية المشتركة، وتنسيق الفحص الوقائي على مستوى الأسرة.")} />
        {data && (
          <div className="flex gap-1.5 shrink-0 ms-6">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${activeTab === t.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!nationalId && (
        <Card>
          <CardBody className="py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-pink-500" />
            </div>
            <p className="font-bold text-foreground mb-1">{text("No Family Profile Selected", "لم يتم اختيار ملف أسرة")}</p>
            <p className="text-sm text-muted-foreground mb-2">{text("Enter a National ID to load genetic risk analysis, family tree, and hereditary condition mapping.", "أدخل رقم الهوية لتحميل تحليل المخاطر الوراثية وشجرة العائلة وخريطة الأمراض الوراثية.")}</p>
            <p className="text-xs text-muted-foreground font-mono bg-secondary inline-block px-3 py-1.5 rounded-xl" dir="ltr">{text("Demo:", "للتجربة:")} 1000000001 · 1000000002</p>
          </CardBody>
        </Card>
      )}
      {isLoading && <div className="p-5"><SkeletonCard rows={3} /></div>}
      {isError && nationalId && (
        consentRequired ? (
          <Card className="border-risk-high/20 bg-risk-high-bg">
            <CardBody className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-risk-high-bg flex items-center justify-center shrink-0">
                  <Shield className="w-4.5 h-4.5 text-risk-high" />
                </div>
                <div>
                  <p className="text-sm font-bold text-risk-high mb-1">{text("Family Health Linking consent required", "مطلوبة موافقة الربط الصحي للأسرة")}</p>
                  <p className="text-sm text-risk-high">{error instanceof Error ? error.message : text("This patient has not granted Family Health Linking consent.", "لم يمنح هذا المريض موافقة الربط الصحي للأسرة.")}</p>
                  <p className="mt-2 text-xs text-risk-high">{text("The record holder controls this access from the Privacy tab of their SANAD citizen portal. Access attempts are recorded in the national audit chain.", "يتحكّم صاحب السجل بهذا الوصول من تبويب الخصوصية في بوابته بسند. وتُسجّل محاولات الوصول في سلسلة التدقيق الوطنية.")}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-danger/30 bg-danger-bg">
            <CardBody className="flex items-center gap-3 p-4">
              <X className="w-4 h-4 text-danger" />
              <p className="text-sm text-danger">{error instanceof Error ? error.message : text("Patient not found", "المريض غير موجود")} — <span className="font-mono" dir="ltr">{nationalId}</span></p>
            </CardBody>
          </Card>
        )
      )}

      {data && (
        <div className="space-y-5">
          {data.familyRiskAlert && (
            <div className={`flex items-start gap-3 p-4 border-2 rounded-3xl ${data.summary.overallFamilyRisk === "HIGH" ? "bg-danger-bg border-danger/30" : "bg-risk-high-bg border-risk-high/20"}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${data.summary.overallFamilyRisk === "HIGH" ? "text-danger" : "text-risk-high"}`} />
              <div>
                <p className={`text-sm font-bold ${data.summary.overallFamilyRisk === "HIGH" ? "text-danger" : "text-risk-high"}`}>{data.familyRiskAlert}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground">{text(`${data.summary.totalMembers} family members mapped`, `${data.summary.totalMembers} فرد مُسجّل`)}</span>
                  <span className="text-[10px] font-semibold text-danger">{text(`${data.summary.highRiskMembers} high-risk`, `${data.summary.highRiskMembers} مرتفع الخطورة`)}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">{text(`${data.summary.sharedConditionsCount} shared conditions`, `${data.summary.sharedConditionsCount} حالة مشتركة`)}</span>
                </div>
              </div>
              <div className="ms-auto shrink-0 text-end">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{text("Family Risk", "خطورة الأسرة")}</p>
                <p className={`text-2xl font-bold ${data.summary.overallFamilyRisk === "HIGH" ? "text-danger" : data.summary.overallFamilyRisk === "MODERATE" ? "text-risk-high" : "text-success"}`}>{data.summary.overallFamilyRisk === "HIGH" ? text("HIGH", "مرتفعة") : data.summary.overallFamilyRisk === "MODERATE" ? text("MODERATE", "متوسطة") : text("LOW", "منخفضة")}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: text("Heritability Score", "درجة التوريث"), value: data.heritabilityScore, suffix: "/100", color: data.heritabilityScore >= 70 ? "text-danger" : data.heritabilityScore >= 40 ? "text-risk-high" : "text-success", bg: data.heritabilityScore >= 70 ? "bg-danger-bg" : "bg-secondary" },
              { label: text("Genetic Risk Factors", "عوامل الخطورة الوراثية"), value: data.geneticRisks?.length, suffix: text(" identified", " مُحدّد"), color: "text-violet-600", bg: "bg-violet-50" },
              { label: text("Family Members Linked", "أفراد الأسرة المرتبطون"), value: data.summary?.totalMembers, suffix: text(" members", " فرد"), color: "text-primary", bg: "bg-primary/5" },
              { label: text("Clinical Priority Index", "مؤشر الأولوية السريرية"), value: data.patient?.riskScore, suffix: "/100", color: data.patient?.riskScore >= 70 ? "text-danger" : "text-risk-high", bg: "bg-risk-high-bg" },
            ].map((kpi, i) => (
              <div key={i} className={`p-5 rounded-3xl ${kpi.bg}`}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className={`text-4xl font-bold ${kpi.color}`}>{kpi.value}<span className="text-sm font-semibold text-muted-foreground">{kpi.suffix}</span></p>
              </div>
            ))}
          </div>

          {activeTab === "tree" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-pink-600" /><CardTitle>{text("Family Tree — Risk Map", "شجرة العائلة — خريطة الخطورة")}</CardTitle></div>
                <p className="text-xs text-muted-foreground ms-auto">{text("Colors indicate Clinical Priority", "الألوان تشير إلى الأولوية السريرية")}</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {data.parents?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-border inline-block" /> {text("Parents (P1)", "الوالدان (P1)")}
                      </p>
                      <div className={`grid gap-4 ${data.parents.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-2"}`}>
                        {data.parents.map((m: any) => <FamilyMemberCard key={m.id} member={m} />)}
                      </div>
                    </div>
                  )}

                  {data.parents?.length > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-6 w-px bg-border" />
                      <div className="w-24 h-px bg-border" />
                      <div className="h-6 w-px bg-border" />
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-border inline-block" /> {text("Index Patient + Siblings (P2)", "المريض الأساسي والأشقّاء (P2)")}
                    </p>
                    <div className={`grid gap-4 ${(data.siblings?.length + 1) <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      <FamilyMemberCard member={{ ...data.patient, relationship: text("Index Patient", "المريض الأساسي") }} isPatient />
                      {data.siblings?.map((m: any) => <FamilyMemberCard key={m.id} member={m} />)}
                    </div>
                  </div>

                  {data.children?.length > 0 && (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-px bg-border" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <span className="w-4 h-0.5 bg-border inline-block" /> {text("Children (P3)", "الأبناء (P3)")}
                        </p>
                        <div className={`grid gap-4 ${data.children.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                          {data.children.map((m: any) => <FamilyMemberCard key={m.id} member={m} />)}
                        </div>
                      </div>
                    </>
                  )}

                  {data.familyRiskTrend?.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" /> {text("5-Year Family Risk Trajectory", "مسار خطورة الأسرة لـ 5 سنوات")}
                      </p>
                      <div className="h-36">
                        <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.familyRiskTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[0, 100]} />
                            <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="familyRisk" name="Family Risk" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--destructive))" }} />
                            <Line type="monotone" dataKey="patientRisk" name="Patient Risk" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                          </LineChart>
                        </ResponsiveContainer></div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === "genetics" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-violet-600" />
                <p className="text-sm font-bold text-foreground">{text(`${data.geneticRisks?.length} Hereditary Risk Factors Identified`, `${data.geneticRisks?.length} عامل خطورة وراثي مُحدّد`)}</p>
                <Badge variant={data.geneticRisks?.filter((r: any) => r.riskLevel === "high").length > 0 ? "destructive" : "success"} className="ms-auto">
                  {text(`${data.geneticRisks?.filter((r: any) => r.riskLevel === "high").length} high-penetrance`, `${data.geneticRisks?.filter((r: any) => r.riskLevel === "high").length} عالية النفاذية`)}
                </Badge>
              </div>
              {data.geneticRisks?.map((risk: any, i: number) => {
                const cfg = RISK_CONFIG[risk.riskLevel as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;
                const isExpanded = expandedRisk === i;
                return (
                  <Card key={i} className={`border-2 ${cfg.border} overflow-hidden`}>
                    <div className={`${cfg.bg} px-5 py-4`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-bold ${cfg.color}`}>{risk.condition}</p>
                            {risk.icdCode && <span className="font-mono text-[10px] bg-card/60 border border-current/20 px-1.5 py-0.5 rounded-lg text-muted-foreground">{risk.icdCode}</span>}
                            <Badge variant={cfg.badge} className="text-[10px] ms-auto shrink-0">{text(`${risk.riskLevel} penetrance`, `نفاذية ${risk.riskLevel === "high" ? "عالية" : risk.riskLevel === "medium" ? "متوسطة" : "منخفضة"}`)}</Badge>
                          </div>
                          {risk.gene && <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-semibold text-foreground">{text("Genes:", "الجينات:")}</span> {risk.gene}</p>}
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">{text("Inheritance:", "الوراثة:")}</span> {risk.inheritanceType}</span>
                            <span className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">{text("Transmission:", "الانتقال:")}</span> {Math.round(risk.transmissionProb * 100)}%</span>
                          </div>
                        </div>
                        <button onClick={() => setExpandedRisk(isExpanded ? null : i)}
                          className="text-[10px] font-bold text-primary bg-card/60 px-2.5 py-1 rounded-xl hover:bg-card transition-colors shrink-0">
                          {isExpanded ? text("Less", "أقل") : text("Details", "تفاصيل")}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <CardBody className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-secondary rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{text("Inheritance Pattern", "نمط الوراثة")}</p>
                            <p className="text-xs text-foreground">{risk.inheritancePattern}</p>
                          </div>
                          <div className="bg-secondary rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{text("Penetrance", "النفاذية")}</p>
                            <p className="text-xs text-foreground">{risk.penetrance}</p>
                          </div>
                        </div>
                        <div className="bg-secondary rounded-2xl p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{text("Transmission Probability", "احتمال الانتقال")}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-card rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${risk.riskLevel === "high" ? "bg-danger" : risk.riskLevel === "medium" ? "bg-risk-high" : "bg-success"}`}
                                style={{ width: `${risk.transmissionProb * 100}%` }} />
                            </div>
                            <span className={`text-sm font-bold shrink-0 ${risk.riskLevel === "high" ? "text-danger" : risk.riskLevel === "medium" ? "text-risk-high" : "text-success"}`}>
                              {Math.round(risk.transmissionProb * 100)}%
                            </span>
                          </div>
                        </div>
                        {risk.affectedRelatives?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{text("At-Risk Relatives", "الأقارب المعرّضون")}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {risk.affectedRelatives.map((r: string, ri: number) => (
                                <span key={ri} className="text-xs font-semibold bg-secondary border border-border px-2.5 py-1 rounded-xl">{r}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className={`flex items-start gap-2.5 p-3 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                          <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{text("Clinical Recommendation", "التوصية السريرية")}</p>
                            <p className="text-xs font-semibold text-foreground">{risk.recommendation}</p>
                          </div>
                        </div>
                      </CardBody>
                    )}

                    {!isExpanded && (
                      <div className="px-5 pb-4">
                        <div className="flex items-start gap-2 mt-2">
                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                          <p className="text-xs text-muted-foreground">{risk.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === "burden" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <Card className="col-span-full lg:col-span-7">
                  <CardHeader>
                    <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /><CardTitle>{text("Condition Burden Across Family", "عبء الأمراض عبر الأسرة")}</CardTitle></div>
                    <p className="text-xs text-muted-foreground">{text("Family load = % of members affected", "حِمل الأسرة = نسبة الأفراد المصابين")}</p>
                  </CardHeader>
                  <CardBody>
                    <div className="min-h-[320px] h-full w-full py-4">
                      <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.conditionBurden} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 100]} />
                          <YAxis type="category" dataKey="condition" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }} width={170} />
                          <RechartsTooltip contentStyle={{ borderRadius: "12px", fontSize: 11 }} formatter={(v: any, n: string) => [n === "familyLoad" ? `${v}%` : v, n === "familyLoad" ? "Family Load" : "Count"]} />
                          <Bar dataKey="familyLoad" name="Family Load %" radius={[0, 6, 6, 0]} barSize={16}>
                            {data.conditionBurden?.map((_: any, i: number) => (
                              <Cell key={i} fill={i === 0 ? "hsl(var(--destructive))" : i === 1 ? "hsl(var(--warning))" : i <= 3 ? "hsl(var(--info))" : "hsl(var(--primary))"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer></div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="col-span-full lg:col-span-5">
                  <CardHeader>
                    <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-violet-600" /><CardTitle>{text("Condition Details", "تفاصيل الأمراض")}</CardTitle></div>
                  </CardHeader>
                  <CardBody className="space-y-2.5">
                    {data.conditionBurden?.slice(0, 6).map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-danger" : i === 1 ? "bg-danger" : i <= 3 ? "bg-risk-high" : "bg-info"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{c.condition}</p>
                          <p className="text-[10px] text-muted-foreground">{c.penetrance}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{c.count}</p>
                          <p className="text-[10px] text-muted-foreground">{c.familyLoad}%</p>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>

              {/* Family Risk Trajectory */}
              {data.familyRiskTrend?.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><CardTitle>{text("5-Year Family Risk Trajectory", "مسار خطورة الأسرة لـ 5 سنوات")}</CardTitle></div>
                    <Badge variant="outline">{text("AI Projection · 2025–2029", "توقّع ذكي · 2025–2029")}</Badge>
                  </CardHeader>
                  <CardBody>
                    <div className="h-52">
                      <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.familyRiskTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[0, 100]} />
                          <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="familyRisk" name="Family Aggregate Risk" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 5, fill: "#ef4444" }} />
                          <Line type="monotone" dataKey="patientRisk" name="Patient Risk" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5, fill: "#007AFF" }} />
                        </LineChart>
                      </ResponsiveContainer></div>
                    </div>
                    <div className="mt-3 p-3.5 bg-risk-high-bg border border-risk-high/20 rounded-2xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-risk-high shrink-0 mt-0.5" />
                      <p className="text-xs text-risk-high">{text("AI projection based on current chronic condition trajectory, age-related risk accumulation, and hereditary penetrance rates. Assumes no major lifestyle or therapeutic intervention.", "توقّع ذكي مبني على مسار الأمراض المزمنة الحالي، وتراكم الخطورة المرتبط بالعمر، ومعدّلات النفاذية الوراثية. يفترض عدم وجود تدخّل علاجي أو في نمط الحياة.")}</p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* ─── SCREENING PLAN TAB ─── */}
          {activeTab === "screening" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-success" />
                <p className="text-sm font-bold text-foreground">{text("Family-Wide Screening Protocol", "بروتوكول الفحص على مستوى الأسرة")}</p>
                <Badge variant="success" className="ms-auto">{text(`${data.screeningRecommendations?.length} active recommendations`, `${data.screeningRecommendations?.length} توصية نشطة`)}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {data.screeningRecommendations?.map((rec: any, i: number) => {
                  const priBg = rec.priority === "high" ? "bg-danger-bg border-danger/30" : rec.priority === "medium" ? "bg-info-bg border-info/30" : "bg-secondary border-border";
                  const priIcon = rec.priority === "high" ? <AlertTriangle className="w-4 h-4 text-danger shrink-0" /> : rec.priority === "medium" ? <Clock className="w-4 h-4 text-info shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
                  return (
                    <div key={i} className={`p-4 rounded-3xl border ${priBg}`}>
                      <div className="flex items-start gap-3 mb-3">
                        {priIcon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{rec.test}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.for}</p>
                        </div>
                        <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "info" : "success"} className="text-[10px] shrink-0">{rec.priority === "high" ? text("high", "مرتفعة") : rec.priority === "medium" ? text("medium", "متوسطة") : text("low", "منخفضة")}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{rec.frequency}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-card/60 border border-border rounded-full text-muted-foreground ms-auto">{text("Due:", "الاستحقاق:")} {rec.dueIn}</span>
                      </div>
                      {rec.members?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{text("Applies to", "ينطبق على")}</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.members.slice(0, 3).map((m: string, mi: number) => (
                              <div key={mi} className="flex items-center gap-1 bg-card/60 border border-border px-2 py-0.5 rounded-xl">
                                <User className="w-2.5 h-2.5 text-muted-foreground" />
                                <span className="text-[10px] font-medium text-foreground">{m.split(" ")[0]}</span>
                              </div>
                            ))}
                            {rec.members.length > 3 && <span className="text-[10px] text-muted-foreground self-center">+{rec.members.length - 3}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Family member conditions full list */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><CardTitle>{text("Family Members — Full Health Summary", "أفراد الأسرة — الملخّص الصحي الكامل")}</CardTitle></div>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="divide-y divide-border">
                    {[{ ...data.patient, relationship: text("Index Patient (You)", "المريض الأساسي (أنت)") }, ...(data.familyMembers ?? [])].map((m: any, i: number) => {
                      const riskColor = m.riskScore >= 70 ? "text-danger bg-danger-bg" : m.riskScore >= 40 ? "text-risk-high bg-risk-high-bg" : "text-success bg-success-bg";
                      return (
                        <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{m.fullName}</p>
                              {i === 0 && <Badge variant="outline" className="text-[9px]">{text("Index", "أساسي")}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{m.relationship} · {text("Age", "العمر")} {m.age} · {m.gender === "male" ? text("Male", "ذكر") : text("Female", "أنثى")} · <span dir="ltr">{m.bloodType}</span></p>
                          </div>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {m.chronicConditions?.slice(0, 3).map((c: string, ci: number) => (
                              <span key={ci} className="text-[9px] font-semibold bg-secondary border border-border px-1.5 py-0.5 rounded-full text-muted-foreground">{c}</span>
                            ))}
                            {m.chronicConditions?.length > 3 && <span className="text-[9px] text-muted-foreground self-center">+{m.chronicConditions.length - 3}</span>}
                            {m.chronicConditions?.length === 0 && <span className="text-[9px] text-success font-semibold">No chronic conditions</span>}
                          </div>
                          <div className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl shrink-0 ${riskColor}`}>
                            <span className="text-sm font-bold leading-none">{m.riskScore}</span>
                            <span className="text-[8px] opacity-50 leading-none">/100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

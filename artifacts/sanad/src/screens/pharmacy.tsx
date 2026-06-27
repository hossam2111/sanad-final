import React, { useState, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Badge, PageHeader, KpiCard, DataLabel
, SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  Pill, Search, AlertTriangle, CheckCircle2, ShieldAlert,
  Brain, CreditCard, Zap, X, BookOpen, ChevronDown, ChevronUp,
  FlaskConical, Printer, History, Package, Plus,
  Receipt, Bell, Grid3X3, Minus, Users
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { useSseAlerts } from "@/hooks/use-sse-alerts";

async function fetchPharmacyPatient(nationalId: string) {
  const res = await apiFetch(`/api/pharmacy/patient/${nationalId}`);
  if (!res.ok) throw new Error("Patient not found");
  return res.json();
}

async function dispenseMed(medicationId: number, pharmacistName: string) {
  const res = await apiFetch(`/api/pharmacy/dispense/${medicationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pharmacistName }),
  });
  if (!res.ok) throw new Error("Failed to dispense");
  return res.json();
}

type PharmTab = "prescriptions" | "matrix" | "history" | "stock";

interface DispenseReceipt {
  refNo: string;
  drugName: string;
  dosage: string;
  frequency: string;
  patient: string;
  nationalId: string;
  pharmacist: string;
  dispensedAt: string;
  insurance: { eligible: boolean; provider: string; copay: number; coveragePercent: number };
  supplyChainStatus: any;
  safe: boolean;
}

const SEVERITY_COLOR: Record<string, string> = {
  CONTRAINDICATED: "bg-danger text-white",
  MAJOR: "bg-danger-bg text-danger",
  HIGH: "bg-risk-high-bg text-risk-high",
  MODERATE: "bg-risk-high-bg text-risk-high",
  MINOR: "bg-warning-bg text-warning",
};

const SEVERITY_CELL: Record<string, string> = {
  CONTRAINDICATED: "bg-danger text-white font-bold",
  MAJOR: "bg-danger-bg text-danger",
  HIGH: "bg-risk-high-bg text-risk-high",
  MODERATE: "bg-risk-high-bg text-risk-high",
  MINOR: "bg-warning-bg text-warning",
};

const SEVERITY_ORDER: Record<string, number> = {
  CONTRAINDICATED: 0, MAJOR: 1, HIGH: 2, MODERATE: 3, MINOR: 4,
};

function InteractionMatrix({ prescriptions }: { prescriptions: any[] }) {
  const { text, dir, locale, toggleLocale } = useLanguage();

  

  const drugs = prescriptions.map((p) => p.drugName);
  const [selected, setSelected] = useState<{ a: string; b: string; warnings: any[] } | null>(null);

  const matrix = useMemo(() => {
    const m: Record<string, Record<string, any[]>> = {};
    for (const presc of prescriptions) {
      m[presc.drugName] = {};
      for (const other of prescriptions) {
        if (presc.drugName === other.drugName) continue;
        const dws = presc.dispenseCheck?.detailedWarnings ?? [];
        m[presc.drugName]![other.drugName] = dws.filter((w: any) => {
          const b = other.drugName.toLowerCase();
          return (w.drugA && b.includes(w.drugA.toLowerCase())) || (w.drugB && b.includes(w.drugB.toLowerCase()));
        });
      }
    }
    return m;
  }, [prescriptions]);

  if (drugs.length < 2) {
    return (
      <div className="py-12 text-center">
        <Grid3X3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-bold text-foreground mb-1">{text("2+ Active Medications Required", "يلزم دواءان نشطان أو أكثر")}</p>
        <p className="text-sm text-muted-foreground">{text("The interaction matrix compares all active drugs simultaneously.", "مصفوفة التداخلات تقارن جميع الأدوية النشطة في آنٍ واحد.")}</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-primary">
        <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">{text("Full Drug-Drug Interaction Matrix", "مصفوفة التداخلات الدوائية الكاملة")}</span>
        <span className="text-primary/80 ml-1">{text("— Click any cell for clinical details", "— اضغط على أي خلية للتفاصيل السريرية")}</span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {(["CONTRAINDICATED", "MAJOR", "MODERATE"] as const).map((s) => (
            <span key={s} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[s]}`}>{s}</span>
          ))}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success">{text("SAFE", "آمن")}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="bg-secondary text-muted-foreground font-bold px-3 py-2.5 text-left border-r border-border min-w-[140px]">{text("Drug ↓ vs →", "الدواء ↓ مقابل →")}</th>
              {drugs.map((d) => (
                <th key={d} className="bg-secondary text-muted-foreground font-semibold px-2 py-2.5 text-center border-r border-border min-w-[110px]">
                  {d.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drugs.map((rowDrug) => (
              <tr key={rowDrug} className="border-t border-border">
                <td className="bg-secondary font-bold text-foreground px-3 py-2.5 border-r border-border text-xs">{rowDrug.split(" ")[0]}</td>
                {drugs.map((colDrug) => {
                  if (rowDrug === colDrug) {
                    return (
                      <td key={colDrug} className="bg-muted text-center px-2 py-2.5 border-r border-border text-muted-foreground">
                        <Minus className="w-3 h-3 mx-auto" />
                      </td>
                    );
                  }
                  const warnings = matrix[rowDrug]?.[colDrug] ?? [];
                  const topSeverity = warnings.reduce((best: string, w: any) => {
                    const s = w.severity ?? "MINOR";
                    return (SEVERITY_ORDER[s] ?? 99) < (SEVERITY_ORDER[best] ?? 99) ? s : best;
                  }, "");
                  return (
                    <td
                      key={colDrug}
                      onClick={() => warnings.length > 0 && setSelected({ a: rowDrug, b: colDrug, warnings })}
                      className={`text-center px-2 py-2.5 border-r border-border transition-all ${warnings.length > 0 ? "cursor-pointer hover:opacity-80 " + (SEVERITY_CELL[topSeverity] ?? "bg-danger-bg text-danger") : "bg-success-bg text-success"}`}
                    >
                      {warnings.length > 0
                        ? <span className="font-bold text-[9px]">{topSeverity.slice(0, 3)}</span>
                        : <CheckCircle2 className="w-3 h-3 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-danger" />
              <p className="font-bold text-sm text-foreground">{selected.a} ↔ {selected.b}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          {selected.warnings.map((w: any, i: number) => (
            <div key={i} className="bg-card rounded-xl border border-danger/20 p-3 mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[w.severity] ?? "bg-muted"}`}>{w.severity}</span>
                <p className="text-xs font-bold text-foreground">{w.text ?? `${w.drugA} ↔ ${w.drugB}`}</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">{text("Mechanism:", "الآلية:")}</span>{w.mechanism}</p>
              <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">{text("Clinical basis:", "الأساس السريري:")}</span>{w.clinicalBasis}</p>
              <p className="text-[11px] font-semibold text-danger mb-2">{w.recommendation}</p>
              <div className="flex flex-wrap gap-1">
                {(w.sources ?? [w.source]).filter(Boolean).map((src: string, si: number) => (
                  <span key={si} className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md">{src}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiptModal({ receipt, onClose }: { receipt: DispenseReceipt; onClose: () => void }) {
  const { text, dir, locale, toggleLocale } = useLanguage();

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Dispense Receipt — ${receipt.refNo}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; color: #111; }
        .header { text-align: center; border-bottom: 3px double #007AFF; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 900; color: #007AFF; }
        .sub { font-size: 11px; color: #666; margin-top: 2px; }
        .ref { font-size: 13px; font-weight: 700; color: #333; margin-top: 8px; font-family: monospace; }
        .timestamp { font-size: 11px; color: #888; }
        .section-title { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .1em; margin: 20px 0 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border-radius: 12px; padding: 16px; }
        .info-cell label { display: block; font-size: 9px; color: #888; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
        .info-cell p { font-size: 13px; font-weight: 700; margin: 0; }
        .drug-box { border: 2px solid #007AFF; border-radius: 12px; padding: 16px; }
        .drug-name { font-size: 18px; font-weight: 900; color: #007AFF; }
        .drug-detail { font-size: 12px; color: #555; margin-top: 4px; }
        .ins-row { display: flex; justify-content: space-between; padding: 10px 14px; background: #f0f9ff; border-radius: 10px; margin-top: 12px; font-size: 12px; }
        .safe-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .safe { background: #dcfce7; color: #166534; }
        .warn { background: #fee2e2; color: #991b1b; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 10px; color: #aaa; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">🏥 SANAD</div>
        <div class="sub">National AI Health Platform — Ministry of Health, Kingdom of Saudi Arabia</div>
        <div class="ref">REF: ${receipt.refNo}</div>
        <div class="timestamp">${receipt.dispensedAt}</div>
      </div>
      <div class="section-title">${locale === "ar" ? "معلومات المريض" : "Patient Information"}</div>
      <div class="info-grid">
        <div class="info-cell"><label>${locale === "ar" ? "الاسم الكامل" : "Full Name"}</label><p>${receipt.patient}</p></div>
        <div class="info-cell"><label>${locale === "ar" ? "رقم الهوية" : "National ID"}</label><p>${receipt.nationalId}</p></div>
        <div class="info-cell"><label>${locale === "ar" ? "صُرف بواسطة" : "Dispensed By"}</label><p>${receipt.pharmacist}</p></div>
        <div class="info-cell"><label>${locale === "ar" ? "سلامة الذكاء الاصطناعي" : "AI Safety"}</label><p><span class="safe-badge ${receipt.safe ? "safe" : "warn"}">${receipt.safe ? (locale === "ar" ? "✓ مُجاز" : "✓ CLEARED") : (locale === "ar" ? "⚠ تجاوز" : "⚠ OVERRIDE")}</span></p></div>
      </div>
      <div class="section-title">${locale === "ar" ? "الدواء المُصرَّف" : "Medication Dispensed"}</div>
      <div class="drug-box">
        <div class="drug-name">${receipt.drugName}</div>
        <div class="drug-detail">${receipt.dosage} · ${receipt.frequency}</div>
        ${receipt.insurance.eligible
          ? `<div class="ins-row"><span><b>${receipt.insurance.provider}</b> — ${receipt.insurance.coveragePercent}% covered</span><span>Copay: <b>SAR ${receipt.insurance.copay}</b></span></div>`
          : `<div class="ins-row"><span>${locale === "ar" ? "التأمين: غير مؤهل" : "Insurance: Not eligible"}</span></div>`}
      </div>
      <div class="footer">
        <div>SANAD Pharmacy Portal · AI Safety Engine v1.5</div>
        <div style="font-family:monospace;letter-spacing:.3em;margin-top:4px;font-size:9px;">${receipt.refNo}</div>
        <div style="margin-top:6px;">Retain for 7 years per MOH regulations.</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-success text-white p-5 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
          <p className="font-bold text-lg">{text("Medication Dispensed", "تم صرف الدواء")}</p>
          <p className="text-white/80 text-sm font-mono mt-1">{receipt.refNo}</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-secondary rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{text("Patient", "المريض")}</span><span className="font-bold">{receipt.patient}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{text("National ID", "رقم الهوية")}</span><span className="font-mono font-bold">{receipt.nationalId}</span></div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{text("Medication", "الدواء")}</span><span className="font-bold">{receipt.drugName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{text("Dosage", "الجرعة")}</span><span className="font-mono">{receipt.dosage} · {receipt.frequency}</span></div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{text("AI Safety", "سلامة الذكاء الاصطناعي")}</span>
              <Badge variant={receipt.safe ? "success" : "warning"} className="text-[10px]">{receipt.safe ? "✓ Cleared" : "⚠ Override"}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{text("Insurance", "التأمين")}</span>
              <span className="font-bold text-sm">{receipt.insurance.eligible ? `${receipt.insurance.coveragePercent}% · SAR ${receipt.insurance.copay} copay` : "Not covered"}</span>
            </div>
            {receipt.supplyChainStatus?.warning && (
              <div className="flex items-start gap-2 px-3 py-2 bg-risk-high-bg border border-risk-high/20 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-risk-high shrink-0 mt-0.5" />
                <p className="text-[11px] text-risk-high font-medium">{receipt.supplyChainStatus.warning}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">{text("Close", "إغلاق")}</Button>
            <Button onClick={handlePrint} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> {text("Print Receipt", "طباعة الإيصال")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PharmacyPortal() {
  const { text, dir, locale, toggleLocale } = useLanguage();

  

  const { user } = useAuth();
  
  const pharmacistName = user?.name ?? "Pharmacist";
  const { alerts: sseAlerts, connected: sseConnected } = useSseAlerts("pharmacy");

  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [queue, setQueue] = useState<Array<{ id: string; addedAt: Date }>>([]);
  const [dispensedResults, setDispensedResults] = useState<Record<number, any>>({});
  const [expandedWarnings, setExpandedWarnings] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<PharmTab>("prescriptions");
  const [receipt, setReceipt] = useState<DispenseReceipt | null>(null);
  const [dispensingId, setDispensingId] = useState<number | null>(null);
  const [todayLog, setTodayLog] = useState<DispenseReceipt[]>([]);
  const [showLog, setShowLog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pharmacy-patient", nationalId],
    queryFn: () => fetchPharmacyPatient(nationalId),
    enabled: !!nationalId,
    retry: false,
  });

  const dispenseMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => dispenseMed(id, pharmacistName),
    onSuccess: (result, { id }) => {
      setDispensedResults((prev) => ({ ...prev, [id]: result }));
      setDispensingId(null);
      qc.setQueryData(["pharmacy-patient", nationalId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          prescriptions: old.prescriptions?.map((p: any) =>
            p.id === id ? { ...p, dispensedAt: result.dispensedAt } : p
          ) ?? [],
        };
      });
      const presc = data?.prescriptions?.find((p: any) => p.id === id);
      if (presc && data?.patient) {
        const newReceipt: DispenseReceipt = {
          refNo: result.referenceNo, // server-issued — auditable against the dispense event
          drugName: presc.drugName,
          dosage: presc.dosage,
          frequency: presc.frequency,
          patient: data.patient.name,
          nationalId: data.patient.nationalId,
          pharmacist: pharmacistName,
          dispensedAt: new Date(result.dispensedAt ?? Date.now()).toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" }),
          insurance: result.insurance ?? presc.insurance,
          supplyChainStatus: result.supplyChainStatus,
          safe: presc.dispenseCheck?.safe ?? true,
        };
        setReceipt(newReceipt);
        setTodayLog((prev) => [newReceipt, ...prev]);
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim();
    if (!id) return;
    setNationalId(id);
    setActiveTab("prescriptions");
    setDispensedResults({});
    if (!queue.find((q) => q.id === id)) {
      setQueue((prev) => [...prev, { id, addedAt: new Date() }]);
    }
  };

  const handlePrintRx = () => {
    if (!data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Prescription — ${data.patient.name}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 680px; margin: 40px auto; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #007AFF; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; color: #007AFF; margin: 0; }
        .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
        .patient-row { display: flex; gap: 24px; background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 13px; }
        .patient-row div { flex: 1; }
        .patient-row label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: bold; }
        .patient-row p { font-weight: bold; margin: 2px 0 0; }
        .rx-item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .rx-drug { font-size: 15px; font-weight: bold; }
        .rx-details { font-size: 12px; color: #555; margin: 4px 0; }
        .rx-warn { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #b91c1c; margin-top: 8px; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
        .allergy-bar { background: #dc2626; color: white; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
      </style></head><body>
      <div class="header"><h1>🏥 SANAD National Health Platform</h1>
        <p>Ministry of Health — Kingdom of Saudi Arabia</p>
        <p>${locale === "ar" ? "قائمة الوصفات الفعّالة" : "Active Prescription List"} — ${data.patient.nationalId} · ${new Date().toLocaleDateString("en-SA")}</p>
      </div>
      ${data.patient.allergies?.length ? `<div class="allergy-bar">⚠ ${locale === "ar" ? "حساسية معروفة" : "KNOWN ALLERGIES"}: ${data.patient.allergies.join(" · ")}</div>` : ""}
      <div class="patient-row">
        <div><label>${locale === "ar" ? "اسم المريض" : "Patient Name"}</label><p>${data.patient.name}</p></div>
        <div><label>${locale === "ar" ? "رقم الهوية" : "National ID"}</label><p>${data.patient.nationalId}</p></div>
        <div><label>${locale === "ar" ? "العمر" : "Age"}</label><p>${data.patient.age} ${locale === "ar" ? "سنة" : "years"}</p></div>
        <div><label>${locale === "ar" ? "فصيلة الدم" : "Blood Type"}</label><p>${data.patient.bloodType}</p></div>
      </div>
      <h3 style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">${locale === "ar" ? "الوصفات الفعّالة" : "Active Prescriptions"}</h3>
      ${(data.prescriptions || []).map((p: any) => `
        <div class="rx-item">
          <div class="rx-drug">${p.drugName}</div>
          <div class="rx-details">${p.dosage} · ${p.frequency}${p.prescribedBy ? ` · ${p.prescribedBy}` : ""}</div>
          ${!p.dispenseCheck?.safe ? `<div class="rx-warn">⚠ ${locale === "ar" ? "تنبيه الذكاء الاصطناعي" : "AI Safety Flag"}: ${p.dispenseCheck?.warnings?.join(" | ") ?? ""}</div>` : ""}
        </div>
      `).join("")}
      <div class="footer"><span>${locale === "ar" ? "صرف بواسطة" : "Dispensed by"}: ${pharmacistName}</span><span>SANAD Pharmacy Portal · ${new Date().toISOString()}</span></div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const TABS: { id: PharmTab; label: string; icon: React.ElementType }[] = [
    { id: "prescriptions", label: "Active Prescriptions", icon: Pill },
    { id: "matrix", label: "Interaction Matrix", icon: Grid3X3 },
    { id: "history", label: "Medication History", icon: History },
    { id: "stock", label: "Stock Check", icon: Package },
  ];

  return (
    <Layout role="pharmacy" localized>
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}

      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={text("Pharmacy Portal", "بوابة الصيدلية")}
          subtitle={text("Prescription dispensing · AI drug safety · Insurance verification", "صرف الوصفات · سلامة الدواء بالذكاء · التحقّق من التأمين")}
        />
        <div className="flex items-center gap-2 shrink-0 ms-4">
          <button
            onClick={() => setShowLog((v) => !v)}
            className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl border border-border bg-card hover:bg-secondary transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-primary" />
            {text("Today's Log", "سجل اليوم")}
            {todayLog.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {todayLog.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl border border-border bg-card">
            <Bell className={`w-3.5 h-3.5 ${sseConnected ? "text-success" : "text-muted-foreground"}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${sseConnected ? "bg-success animate-pulse" : "bg-muted"}`} />
            <span className="text-muted-foreground">{sseConnected ? text("Live", "مباشر") : text("Connecting...", "جارٍ الاتصال...")}</span>
          </div>
        </div>
      </div>

      {/* SSE Critical Alerts */}
      {sseAlerts.filter((a) => a.severity === "critical").length > 0 && (
        <div className="mb-5 px-4 py-3 bg-danger-bg border border-danger/20 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-danger mb-0.5">{text("Critical Pharmacy Alert", "تنبيه صيدلية حرج")}</p>
            {sseAlerts.filter((a) => a.severity === "critical").slice(0, 2).map((a, i) => (
              <p key={i} className="text-xs text-danger">{a.title}: {a.action}</p>
            ))}
          </div>
        </div>
      )}

      {/* Today's Log Panel */}
      {showLog && (
        <Card className="mb-5 border-primary/20">
          <CardHeader>
            <Receipt className="w-4 h-4 text-primary" />
            <CardTitle>{text("Today's Dispense Log", "سجل صرف اليوم")}</CardTitle>
            <Badge variant="outline" className="ms-auto">{text(`${todayLog.length} dispensed`, `${todayLog.length} مصروف`)}</Badge>
            <button onClick={() => setShowLog(false)} className="ms-2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          {todayLog.length === 0 ? (
            <CardBody className="py-6 text-center text-sm text-muted-foreground">{text("No medications dispensed yet today.", "لم تُصرف أي أدوية اليوم بعد.")}</CardBody>
          ) : (
            <div className="divide-y divide-border">
              {todayLog.map((log, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{log.drugName} <span className="text-xs font-normal text-muted-foreground">{log.dosage}</span></p>
                    <p className="text-xs text-muted-foreground">{log.patient} · {log.nationalId}</p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground shrink-0" dir="ltr">{log.refNo.slice(-10)}</p>
                  <Badge variant={log.safe ? "success" : "warning"} className="text-[9px] shrink-0">{log.safe ? text("Cleared", "مُجاز") : text("Override", "تجاوز")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <KpiCard title={text("Dispensed Today", "صُرف اليوم")} value={String(todayLog.length)} sub={text("Medications issued", "أدوية مصروفة")} icon={Receipt} iconBg="bg-primary/10" iconColor="text-primary" />
        <KpiCard title={text("Queue", "قائمة الانتظار")} value={String(queue.length)} sub={text("Patients waiting", "مرضى منتظرون")} icon={Users} iconBg="bg-primary/10" iconColor="text-primary" />
        <KpiCard
          title={text("Interactions", "التداخلات")}
          value={String(data?.summary?.interactions ?? 0)}
          sub={text("Drug conflicts flagged", "تعارضات دوائية موسومة")}
          icon={ShieldAlert}
          iconBg={data?.summary?.interactions > 0 ? "bg-danger-bg" : "bg-secondary"}
          iconColor={data?.summary?.interactions > 0 ? "text-danger" : "text-muted-foreground"}
        />
        <KpiCard title={text("Insured", "مؤمّن")} value={String(data?.summary?.insuranceCovered ?? 0)} sub={text("Coverage eligible", "مؤهّل للتغطية")} icon={CreditCard} iconBg="bg-success-bg" iconColor="text-success" />
      </div>

      {/* Search + Queue */}
      <Card className="mb-5">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={text("Enter Patient National ID", "أدخل رقم هوية المريض")}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="ps-9"
              />
            </div>
            <Button type="submit" disabled={!searchId.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Search className="w-4 h-4 me-1.5" /> {text("Retrieve Prescriptions", "استدعاء الوصفات")}
            </Button>
          </form>

          {/* Queue strip */}
          {queue.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{text("Queue:", "قائمة الانتظار:")}</span>
              {queue.map((q) => (
                <div
                  key={q.id}
                  onClick={() => { setNationalId(q.id); setSearchId(q.id); setActiveTab("prescriptions"); setDispensedResults({}); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                    q.id === nationalId
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {q.id}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const remaining = queue.filter((x) => x.id !== q.id);
                      setQueue(remaining);
                      if (q.id === nationalId) {
                        const next = remaining[0];
                        if (next) { setNationalId(next.id); setSearchId(next.id); }
                        else { setNationalId(""); setSearchId(""); }
                      }
                    }}
                    className={`${q.id === nationalId ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-danger"} transition-colors`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span className="text-sm font-medium">{text("Loading prescriptions...", "جارٍ تحميل الوصفات...")}</span>
        </div>
      )}

      {error && !isLoading && (
        <Card>
          <CardBody className="py-10 text-center">
            <AlertTriangle className="w-8 h-8 text-risk-high mx-auto mb-3" />
            <p className="font-bold text-foreground">{text("Patient Not Found", "المريض غير موجود")}</p>
            <p className="text-sm text-muted-foreground mt-1">{text("No records for National ID:", "لا توجد سجلات لرقم الهوية:")} {nationalId}</p>
          </CardBody>
        </Card>
      )}

      {!nationalId && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Pill className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2">{text("Pharmacy Portal", "بوابة الصيدلية")}</p>
          <p className="text-sm text-muted-foreground max-w-sm">{text("Enter a patient National ID to retrieve active prescriptions and begin the AI-verified dispensing workflow.", "أدخل رقم هوية المريض لاستدعاء وصفاته النشطة وبدء سير عمل الصرف المعتمد بالذكاء الاصطناعي.")}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4" ref={printRef}>
          {/* Patient Header */}
          <div className={`rounded-3xl p-5 flex items-start justify-between gap-5 ${
            data.summary.interactions > 0 ? "bg-danger" : "bg-primary"
          } text-white`}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{text("Patient Record", "سجل المريض")}</p>
              <p className="text-xl font-bold">{data.patient.name}</p>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-white/80">
                <span className="font-mono">{data.patient.nationalId}</span>
                <span>·</span>
                <span>{data.patient.age}{text("y", "سنة")}</span>
                <span>·</span>
                <span>{data.patient.bloodType}</span>
                <span>·</span>
                <span>{text("Risk", "الخطر")} {data.patient.riskScore ?? "—"}/100</span>
              </div>
              {data.patient.chronicConditions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.patient.chronicConditions.map((c: string) => (
                    <span key={c} className="text-[10px] font-bold bg-card/20 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              )}
              {data.patient.allergies?.length > 0 && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-card/20 rounded-xl w-fit">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <p className="text-xs font-bold">{text("ALLERGIES:", "الحساسية:")} {data.patient.allergies.join(", ")}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-white/70">{text("Active Rx", "وصفات نشطة")}</p>
                <p className="text-3xl font-bold">{data.summary.active}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">{text("Conflicts", "تعارضات")}</p>
                <p className={`text-3xl font-bold ${data.summary.interactions > 0 ? "text-warning" : ""}`}>{data.summary.interactions}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">{text("Insured", "مؤمَّن")}</p>
                <p className="text-3xl font-bold">{data.summary.insuranceCovered}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintRx}
                className="bg-card/20 text-white border-border/30 hover:bg-card/30 text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> {text("Print Rx", "طباعة الوصفة")}
              </Button>
            </div>
          </div>

          {/* Tabs Card */}
          <Card>
            <div className="flex border-b border-border">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.id === "matrix" && data.summary.interactions > 0 && (
                      <span className="w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">{data.summary.interactions}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Active Prescriptions ── */}
            {activeTab === "prescriptions" && (
              <div className="divide-y divide-border">
                {data.prescriptions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-bold text-foreground">{text("No active prescriptions", "لا توجد وصفات نشطة")}</p>
                  </div>
                ) : (
                  data.prescriptions.map((presc: any) => {
                    const isDispensed = !!dispensedResults[presc.id];
                    const check = presc.dispenseCheck;
                    const ins = presc.insurance;
                    return (
                      <div key={presc.id} className={`p-5 ${!check.safe ? "bg-destructive/10/40" : ""}`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-base text-foreground">{presc.drugName}</p>
                              {!check.safe && <Badge variant="destructive" className="text-[9px]">{text("⚠ CONFLICT", "⚠ تعارض")}</Badge>}
                              {check.safe && <Badge variant="success" className="text-[9px]">{text("✓ SAFE", "✓ آمن")}</Badge>}
                              {isDispensed && <Badge variant="info" className="text-[9px]">{text("DISPENSED", "تم الصرف")}</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="font-mono font-bold text-foreground">{presc.dosage}</span>
                              <span>·</span>
                              <span>{presc.frequency}</span>
                              {presc.prescribedBy && <><span>·</span><span>{text("Rx:", "وصفة:")} {presc.prescribedBy}</span></>}
                              {presc.startDate && <><span>·</span><span>{text("Since", "منذ")} {presc.startDate}</span></>}
                            </div>
                          </div>
                          {!isDispensed ? (
                            <Button
                              onClick={() => { setDispensingId(presc.id); dispenseMutation.mutate({ id: presc.id }); }}
                              disabled={dispenseMutation.isPending && dispensingId === presc.id}
                              variant={check.safe ? "primary" : "outline"}
                              className={`shrink-0 ${check.safe ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-danger/30 text-danger hover:bg-danger-bg"}`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              {dispensingId === presc.id && dispenseMutation.isPending ? text("Dispensing...", "جارٍ الصرف...") : check.safe ? text("Dispense", "صرف") : text("Override & Dispense", "تجاوز وصرف")}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-success shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                              {text("Dispensed", "تم الصرف")}
                            </div>
                          )}
                        </div>

                        {/* AI Safety Block */}
                        <div className={`px-3.5 py-3 rounded-2xl border mb-2 ${!check.safe ? "bg-danger-bg border-danger/30" : "bg-success-bg border-success/30"}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Brain className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{text("AI Dispense Safety Check", "فحص سلامة الصرف بالذكاء الاصطناعي")}</p>
                            <span className="text-[10px] font-mono text-muted-foreground ml-auto">{text("Confidence:", "الثقة:")} {Math.round(check.confidenceScore * 100)}%</span>
                          </div>
                          {check.warnings.map((w: string, i: number) => (
                            <p key={i} className="text-xs font-semibold text-foreground mb-1">{w}</p>
                          ))}
                          {check.detailedWarnings?.length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => setExpandedWarnings((prev) => ({ ...prev, [presc.id]: !prev[presc.id] }))}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                              >
                                <BookOpen className="w-3 h-3" />
                                {expandedWarnings[presc.id] ? text("Hide", "إخفاء") : text("Show", "عرض")} {text("Clinical References (", "المراجع السريرية (")}{check.detailedWarnings.length})
                                {expandedWarnings[presc.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              {expandedWarnings[presc.id] && (
                                <div className="mt-2 space-y-2">
                                  {check.detailedWarnings.map((dw: any, wi: number) => (
                                    <div key={wi} className="rounded-xl bg-card/80 border border-danger/20 p-3">
                                      <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <FlaskConical className="w-3 h-3 text-danger shrink-0" />
                                          <p className="text-[11px] font-bold text-foreground">{dw.drugA} ↔ {dw.drugB}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SEVERITY_COLOR[dw.severity] ?? "bg-muted"}`}>{dw.severity}</span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">{text("Mechanism:", "الآلية:")}</span>{dw.mechanism}</p>
                                      <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">{text("Clinical basis:", "الأساس السريري:")}</span>{dw.clinicalBasis}</p>
                                      <p className="text-[11px] font-semibold text-danger mb-2">{dw.recommendation}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {(dw.sources ?? [dw.source]).filter(Boolean).map((src: string, si: number) => (
                                          <span key={si} className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md">{src}</span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Insurance Row */}
                        <div className="flex items-center gap-4 px-3.5 py-2.5 bg-secondary rounded-2xl border border-border">
                          <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{text("Insurance ·", "التأمين ·")} {ins.provider}</p>
                            <p className="text-xs text-foreground truncate">{ins.notes}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-xs">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">{text("Coverage", "التغطية")}</p>
                              <p className="font-bold text-foreground">{ins.eligible ? `${ins.coveragePercent}%` : "None"}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">{text("Copay", "المشاركة")}</p>
                              <p className="font-bold text-foreground">{text("SAR", "ر.س")} {ins.copay}</p>
                            </div>
                            {ins.preAuthRequired && <Badge variant="warning" className="text-[9px]">{text("Pre-Auth", "موافقة مسبقة")}</Badge>}
                            <Badge variant={ins.eligible ? "success" : "destructive"} className="text-[9px]">{ins.eligible ? text("Eligible", "مؤهل") : text("Not Eligible", "غير مؤهل")}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Interaction Matrix ── */}
            {activeTab === "matrix" && <InteractionMatrix prescriptions={data.prescriptions} />}

            {/* ── Medication History ── */}
            {activeTab === "history" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-secondary rounded-2xl text-xs text-muted-foreground">
                  <History className="w-3.5 h-3.5" />
                  {text("Full medication history — active and discontinued for", "السجل الكامل للأدوية — النشطة والموقوفة لـ")} {data.patient.name}
                  <span className="ml-auto font-bold text-foreground">{(data.allMedications ?? data.prescriptions)?.length ?? 0} {text("total", "الإجمالي")}</span>
                </div>
                <div className="space-y-2">
                  {(data.allMedications ?? data.prescriptions ?? []).map((med: any, i: number) => (
                    <div key={i} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border ${med.isActive ? "bg-card border-success/30" : "bg-muted/50 border-border opacity-70"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${med.isActive ? "bg-secondary" : "bg-muted"}`}>
                        <Pill className={`w-4 h-4 ${med.isActive ? "text-secondary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${med.isActive ? "text-foreground" : "text-muted-foreground"}`}>{med.drugName}</p>
                        <p className="text-[11px] text-muted-foreground">{med.dosage} · {med.frequency}{med.prescribedBy ? ` · ${med.prescribedBy}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={med.isActive ? "success" : "outline"} className="text-[10px] mb-1">{med.isActive ? text("Active", "نشط") : text("Discontinued", "موقوف")}</Badge>
                        {med.startDate && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{text("Since", "منذ")} {med.startDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Stock Check ── */}
            {activeTab === "stock" && (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1 px-4 py-3 bg-secondary rounded-2xl text-xs text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  {text("Real-time inventory check for this patient's medications", "فحص المخزون اللحظي لأدوية هذا المريض")}
                </div>
                {(data.prescriptions ?? []).map((presc: any, i: number) => {
                  const avail = presc.stockAvailability;
                  const pct = avail ? Math.min(100, Math.round((avail.daysOfStock / 45) * 100)) : 0;
                  const barColor = !avail ? "bg-muted" : avail.status === "critical" ? "bg-danger" : avail.status === "low" ? "bg-risk-high" : "bg-success";
                  return (
                    <div key={i} className={`px-4 py-4 rounded-2xl border ${avail?.status === "critical" ? "border-danger/30 bg-danger-bg" : avail?.status === "low" ? "border-risk-high/20 bg-risk-high-bg" : "border-border bg-card"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Package className={`w-4 h-4 shrink-0 ${avail?.status === "critical" ? "text-danger" : avail?.status === "low" ? "text-risk-high" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-bold text-sm text-foreground">{presc.drugName}</p>
                            <p className="text-[11px] text-muted-foreground">{presc.dosage}</p>
                          </div>
                        </div>
                        {avail ? (
                          <div className="text-right">
                            <Badge variant={avail.status === "critical" ? "destructive" : avail.status === "low" ? "warning" : "success"} className="text-[10px] mb-1">
                              {avail.status === "critical" ? "⚠ Critical" : avail.status === "low" ? "Low Stock" : "Available"}
                            </Badge>
                            <p className="text-xs font-bold text-foreground">{avail.stock?.toLocaleString()} {avail.unit}</p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">{text("Not tracked", "غير مُتتبَّع")}</Badge>
                        )}
                      </div>
                      {avail && (
                        <>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{text("Stock level", "مستوى المخزون")}</span>
                            <span>{avail.daysOfStock} {text("days of supply", "يوم من الإمدادات")}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </Layout>
  );
}

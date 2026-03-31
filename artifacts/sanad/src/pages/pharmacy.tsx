import React, { useState, useRef, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Badge, PageHeader, DataLabel
} from "@/components/shared";
import {
  Pill, Search, AlertTriangle, CheckCircle2, Shield, ShieldAlert,
  Brain, CreditCard, Zap, Clock, X, BookOpen, ChevronDown, ChevronUp,
  FlaskConical, Printer, History, ClipboardList, Package, Plus,
  Users, TrendingDown, Activity, Grid3X3, Receipt, Bell, Beaker,
  ArrowRight, RefreshCw, Hash, ChevronRight, Info, Minus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { useSseAlerts } from "@/hooks/use-sse-alerts";

async function fetchPharmacyPatient(nationalId: string) {
  const res = await fetch(`/api/pharmacy/patient/${nationalId}`);
  if (!res.ok) throw new Error("Patient not found");
  return res.json();
}

async function dispenseMed(medicationId: number, pharmacistName: string, notes?: string) {
  const res = await fetch(`/api/pharmacy/dispense/${medicationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pharmacistName, notes }),
  });
  if (!res.ok) throw new Error("Failed to dispense");
  return res.json();
}

type PharmTab = "prescriptions" | "matrix" | "history" | "stock";

interface QueueEntry {
  nationalId: string;
  name: string;
  addedAt: Date;
  active: boolean;
}

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

const SEVERITY_ORDER: Record<string, number> = { CONTRAINDICATED: 0, MAJOR: 1, HIGH: 2, MODERATE: 3, MINOR: 4 };
const SEVERITY_COLOR: Record<string, string> = {
  CONTRAINDICATED: "bg-red-600 text-white",
  MAJOR: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MODERATE: "bg-amber-100 text-amber-700",
  MINOR: "bg-yellow-100 text-yellow-700",
};
const SEVERITY_CELL: Record<string, string> = {
  CONTRAINDICATED: "bg-red-600 text-white font-bold",
  MAJOR: "bg-red-200 text-red-800",
  HIGH: "bg-orange-200 text-orange-800",
  MODERATE: "bg-amber-100 text-amber-800",
  MINOR: "bg-yellow-100 text-yellow-800",
};

function generateRefNo() {
  return `SANAD-RX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function InteractionMatrix({ prescriptions }: { prescriptions: any[] }) {
  const drugs = prescriptions.map(p => p.drugName);
  const [selected, setSelected] = useState<{ a: string; b: string; warnings: any[] } | null>(null);

  const matrix: Record<string, Record<string, any>> = useMemo(() => {
    const m: Record<string, Record<string, any>> = {};
    for (const presc of prescriptions) {
      m[presc.drugName] = {};
      for (const other of prescriptions) {
        if (presc.drugName === other.drugName) continue;
        const dws = presc.dispenseCheck?.detailedWarnings ?? [];
        const relevantWarnings = dws.filter((w: any) => {
          const bLow = other.drugName.toLowerCase();
          return (w.drugA && bLow.includes(w.drugA.toLowerCase())) || (w.drugB && bLow.includes(w.drugB.toLowerCase()));
        });
        m[presc.drugName]![other.drugName] = relevantWarnings;
      }
    }
    return m;
  }, [prescriptions]);

  if (drugs.length < 2) {
    return (
      <div className="p-8 text-center">
        <Grid3X3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-bold text-foreground mb-1">Need 2+ Active Medications</p>
        <p className="text-sm text-muted-foreground">Interaction matrix shows drug-drug conflicts across all active prescriptions simultaneously.</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-violet-50 border border-violet-100 rounded-2xl text-xs text-violet-700">
        <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">Full Drug-Drug Interaction Matrix</span>
        <span className="text-violet-500 ml-1">— Click any cell to see clinical details</span>
        <div className="ml-auto flex items-center gap-3">
          {(["CONTRAINDICATED", "MAJOR", "MODERATE"] as const).map(s => (
            <span key={s} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[s]}`}>{s}</span>
          ))}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">SAFE</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="bg-secondary text-muted-foreground font-bold px-3 py-2.5 text-left border-r border-border min-w-[140px]">Drug ↓ vs →</th>
              {drugs.map(d => (
                <th key={d} className="bg-secondary text-muted-foreground font-semibold px-2 py-2.5 text-center border-r border-border min-w-[110px]">
                  {d.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drugs.map((rowDrug, ri) => (
              <tr key={rowDrug} className="border-t border-border">
                <td className="bg-secondary font-bold text-foreground px-3 py-2.5 border-r border-border text-xs">{rowDrug.split(" ")[0]}</td>
                {drugs.map((colDrug, ci) => {
                  if (rowDrug === colDrug) {
                    return (
                      <td key={colDrug} className="bg-gray-100 text-center px-2 py-2.5 border-r border-border text-muted-foreground">
                        <Minus className="w-3 h-3 mx-auto" />
                      </td>
                    );
                  }
                  const warnings = matrix[rowDrug]?.[colDrug] ?? [];
                  const topSeverity = warnings.reduce((best: string, w: any) => {
                    const s = w.severity ?? "MINOR";
                    return (SEVERITY_ORDER[s] ?? 99) < (SEVERITY_ORDER[best] ?? 99) ? s : best;
                  }, "");
                  const hasConflict = warnings.length > 0;

                  return (
                    <td
                      key={colDrug}
                      className={`text-center px-2 py-2.5 border-r border-border transition-all cursor-pointer hover:opacity-80 ${
                        hasConflict ? SEVERITY_CELL[topSeverity] ?? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                      onClick={() => hasConflict && setSelected({ a: rowDrug, b: colDrug, warnings })}
                    >
                      {hasConflict ? (
                        <span className="font-bold text-[9px]">{topSeverity.slice(0, 3)}</span>
                      ) : (
                        <CheckCircle2 className="w-3 h-3 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-red-600" />
              <p className="font-bold text-sm text-foreground">{selected.a} ↔ {selected.b}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          {selected.warnings.map((w: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-red-100 p-3 mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[w.severity] ?? "bg-gray-100 text-gray-700"}`}>{w.severity}</span>
                <p className="text-xs font-bold text-foreground">{w.text ?? `${w.drugA} ↔ ${w.drugB}`}</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">Mechanism: </span>{w.mechanism}</p>
              <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">Clinical basis: </span>{w.clinicalBasis}</p>
              <p className="text-[11px] font-semibold text-red-700 mb-2">{w.recommendation}</p>
              <div className="flex flex-wrap gap-1">
                {(w.sources ?? [w.source]).filter(Boolean).map((src: string, si: number) => (
                  <span key={si} className="text-[9px] font-mono bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded-md">{src}</span>
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
  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Dispense Receipt — ${receipt.refNo}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; color: #111; background: white; }
        .header { text-align: center; border-bottom: 3px double #007AFF; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 900; color: #007AFF; letter-spacing: -0.5px; }
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
        .ins-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f0f9ff; border-radius: 10px; margin-top: 12px; font-size: 12px; }
        .safe-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .safe { background: #dcfce7; color: #166534; }
        .warn { background: #fee2e2; color: #991b1b; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 10px; color: #aaa; }
        .barcode { font-family: monospace; font-size: 10px; color: #999; letter-spacing: .3em; margin-top: 4px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">🏥 SANAD</div>
        <div class="sub">National AI Health Platform — Ministry of Health, Kingdom of Saudi Arabia</div>
        <div class="ref">REF: ${receipt.refNo}</div>
        <div class="timestamp">${receipt.dispensedAt}</div>
      </div>
      <div class="section-title">Patient Information</div>
      <div class="info-grid">
        <div class="info-cell"><label>Full Name</label><p>${receipt.patient}</p></div>
        <div class="info-cell"><label>National ID</label><p>${receipt.nationalId}</p></div>
        <div class="info-cell"><label>Dispensed By</label><p>${receipt.pharmacist}</p></div>
        <div class="info-cell"><label>AI Safety</label><p><span class="safe-badge ${receipt.safe ? "safe" : "warn"}">${receipt.safe ? "✓ CLEARED" : "⚠ OVERRIDE"}</span></p></div>
      </div>
      <div class="section-title">Medication Dispensed</div>
      <div class="drug-box">
        <div class="drug-name">${receipt.drugName}</div>
        <div class="drug-detail">${receipt.dosage} · ${receipt.frequency}</div>
        ${receipt.insurance.eligible ? `
        <div class="ins-row">
          <span><b>${receipt.insurance.provider}</b> — ${receipt.insurance.coveragePercent}% covered</span>
          <span>Copay: <b>SAR ${receipt.insurance.copay}</b></span>
        </div>` : `<div class="ins-row"><span>Insurance: Not eligible for this medication</span></div>`}
      </div>
      <div class="footer">
        <div>SANAD Pharmacy Portal · Powered by AI Safety Engine v1.5</div>
        <div class="barcode">${receipt.refNo.replace(/-/g, " ")}</div>
        <div style="margin-top:6px;">This receipt is an official record. Retain for 7 years per MOH regulations.</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="bg-emerald-600 text-white p-5 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
          <p className="font-bold text-lg">Medication Dispensed</p>
          <p className="text-emerald-100 text-sm font-mono mt-1">{receipt.refNo}</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-secondary rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-bold text-foreground">{receipt.patient}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">National ID</span>
              <span className="font-mono font-bold text-foreground">{receipt.nationalId}</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Medication</span>
              <span className="font-bold text-foreground">{receipt.drugName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dosage</span>
              <span className="font-mono text-foreground">{receipt.dosage} · {receipt.frequency}</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AI Status</span>
              <Badge variant={receipt.safe ? "success" : "warning"} className="text-[10px]">
                {receipt.safe ? "✓ Cleared" : "⚠ Override"}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Insurance</span>
              <span className="font-bold text-foreground">
                {receipt.insurance.eligible ? `${receipt.insurance.coveragePercent}% · SAR ${receipt.insurance.copay} copay` : "Not covered"}
              </span>
            </div>
            {receipt.supplyChainStatus?.warning && (
              <div className="flex items-start gap-2 mt-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-medium">{receipt.supplyChainStatus.warning}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
            <Button onClick={handlePrint} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PharmacyPortal() {
  const { user } = useAuth();
  const pharmacistName = user?.name ?? "Pharmacist";
  const { alerts: sseAlerts, connected: sseConnected, unreadCount: sseUnread } = useSseAlerts("pharmacy");

  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [queue, setQueue] = useState<QueueEntry[]>([]);
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
      setDispensedResults(prev => ({ ...prev, [id]: result }));
      setDispensingId(null);
      qc.invalidateQueries({ queryKey: ["pharmacy-patient", nationalId] });

      const presc = data?.prescriptions?.find((p: any) => p.id === id);
      if (presc && data?.patient) {
        const newReceipt: DispenseReceipt = {
          refNo: generateRefNo(),
          drugName: presc.drugName,
          dosage: presc.dosage,
          frequency: presc.frequency,
          patient: data.patient.name,
          nationalId: data.patient.nationalId,
          pharmacist: pharmacistName,
          dispensedAt: new Date().toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" }),
          insurance: result.insurance ?? presc.insurance,
          supplyChainStatus: result.supplyChainStatus,
          safe: presc.dispenseCheck?.safe ?? true,
        };
        setReceipt(newReceipt);
        setTodayLog(prev => [newReceipt, ...prev]);
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim();
    if (!id) return;
    setNationalId(id);
    if (!queue.find(q => q.nationalId === id)) {
      setQueue(prev => [...prev, { nationalId: id, name: "Loading...", addedAt: new Date(), active: true }]);
    }
  };

  const switchQueue = (qNationalId: string) => {
    setQueue(prev => prev.map(q => ({ ...q, active: q.nationalId === qNationalId })));
    setNationalId(qNationalId);
    setSearchId(qNationalId);
    setActiveTab("prescriptions");
  };

  const removeQueue = (qNationalId: string) => {
    const remaining = queue.filter(q => q.nationalId !== qNationalId);
    setQueue(remaining);
    if (qNationalId === nationalId && remaining.length > 0) {
      switchQueue(remaining[0]!.nationalId);
    } else if (remaining.length === 0) {
      setNationalId("");
      setSearchId("");
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
        .rx-drug { font-size: 15px; font-weight: bold; color: #111; }
        .rx-details { font-size: 12px; color: #555; margin: 4px 0; }
        .rx-warn { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #b91c1c; margin-top: 8px; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
        .allergy-bar { background: #dc2626; color: white; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <div class="header"><h1>🏥 SANAD National Health Platform</h1>
        <p>Ministry of Health — Kingdom of Saudi Arabia</p>
        <p>Prescription Reference: SANAD-RX-${Date.now()} · ${new Date().toLocaleDateString("en-SA")}</p>
      </div>
      ${data.patient.allergies?.length ? `<div class="allergy-bar">⚠ KNOWN ALLERGIES: ${data.patient.allergies.join(" · ")}</div>` : ""}
      <div class="patient-row">
        <div><label>Patient Name</label><p>${data.patient.name}</p></div>
        <div><label>National ID</label><p>${data.patient.nationalId}</p></div>
        <div><label>Age</label><p>${data.patient.age} years</p></div>
        <div><label>Blood Type</label><p>${data.patient.bloodType}</p></div>
      </div>
      <h3 style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Active Prescriptions</h3>
      ${(data.prescriptions || []).map((p: any) => `
        <div class="rx-item">
          <div class="rx-drug">${p.drugName}</div>
          <div class="rx-details">${p.dosage} · ${p.frequency} · ${p.prescribedBy ?? "Prescribing Physician"}</div>
          <div class="rx-details">Started: ${p.startDate ?? "N/A"}</div>
          ${!p.dispenseCheck?.safe ? `<div class="rx-warn">⚠ AI Safety Flag: ${p.dispenseCheck?.warnings?.join(" | ") ?? ""}</div>` : ""}
        </div>
      `).join("")}
      <div class="footer">
        <span>Dispensed by: ${pharmacistName}</span>
        <span>SANAD Pharmacy Portal · ${new Date().toISOString()}</span>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const TABS: { id: PharmTab; label: string; icon: React.ElementType }[] = [
    { id: "prescriptions", label: "Active Prescriptions", icon: Pill },
    { id: "matrix", label: "Interaction Matrix", icon: Grid3X3 },
    { id: "history", label: "Med History", icon: History },
    { id: "stock", label: "Stock", icon: Package },
  ];

  const totalDispensedToday = todayLog.length;
  const totalConflicts = data?.summary?.interactions ?? 0;
  const totalInsured = data?.summary?.insuranceCovered ?? 0;

  return (
    <Layout role="pharmacy">
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}

      <div className="flex items-start justify-between mb-5">
        <PageHeader
          title="Pharmacy Portal"
          subtitle="Prescription dispensing · AI drug safety · Insurance verification"
        />
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={() => setShowLog(v => !v)}
            className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl border border-border bg-white hover:bg-secondary transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-violet-600" />
            Today's Log
            {totalDispensedToday > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{totalDispensedToday}</span>
            )}
          </button>
          <div className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl border border-border bg-white">
            <Bell className={`w-3.5 h-3.5 ${sseConnected ? "text-emerald-500" : "text-gray-400"}`} />
            <span className="text-muted-foreground">{sseConnected ? "Live" : "Connecting..."}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${sseConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
          </div>
        </div>
      </div>

      {/* Today's Dispense Log Panel */}
      {showLog && (
        <Card className="mb-5 border-violet-200">
          <CardHeader>
            <Receipt className="w-4 h-4 text-violet-600" />
            <CardTitle>Today's Dispense Log — {new Date().toLocaleDateString("en-SA", { dateStyle: "long" })}</CardTitle>
            <Badge variant="outline" className="ml-auto">{totalDispensedToday} dispensed</Badge>
            <button onClick={() => setShowLog(false)} className="ml-2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </CardHeader>
          {totalDispensedToday === 0 ? (
            <CardBody className="py-8 text-center text-sm text-muted-foreground">No medications dispensed yet today</CardBody>
          ) : (
            <div className="divide-y divide-border">
              {todayLog.map((log, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{log.drugName} <span className="text-xs font-normal text-muted-foreground">{log.dosage}</span></p>
                    <p className="text-xs text-muted-foreground">{log.patient} · {log.nationalId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-muted-foreground">{log.refNo.slice(-8)}</p>
                    <p className="text-[10px] text-muted-foreground">{log.dispensedAt}</p>
                  </div>
                  <Badge variant={log.safe ? "success" : "warning"} className="text-[9px] shrink-0">{log.safe ? "Cleared" : "Override"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* SSE Critical Alerts */}
      {sseAlerts.filter(a => a.severity === "critical").length > 0 && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-700 mb-1">Critical Pharmacy Alerts</p>
            {sseAlerts.filter(a => a.severity === "critical").slice(0, 3).map((a, i) => (
              <p key={i} className="text-xs text-red-600">{a.title}: {a.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Stats + Search Row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="px-4 py-3.5 bg-white rounded-2xl border border-border">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Receipt className="w-3 h-3 text-violet-600" /> Dispensed Today
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalDispensedToday}</p>
        </div>
        <div className="px-4 py-3.5 bg-white rounded-2xl border border-border">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-blue-600" /> Queue
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{queue.length}</p>
        </div>
        <div className="px-4 py-3.5 bg-white rounded-2xl border border-border">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-red-600" /> Interactions
          </p>
          <p className={`text-2xl font-bold tabular-nums ${totalConflicts > 0 ? "text-red-600" : "text-foreground"}`}>{totalConflicts}</p>
        </div>
        <div className="px-4 py-3.5 bg-white rounded-2xl border border-border">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <CreditCard className="w-3 h-3 text-emerald-600" /> Insured
          </p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{totalInsured}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Queue Sidebar */}
        <div className="col-span-3 space-y-3">
          <Card>
            <CardHeader><Users className="w-3.5 h-3.5 text-blue-600" /><CardTitle>Patient Queue</CardTitle></CardHeader>
            <CardBody className="p-3 space-y-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="National ID"
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                    className="pl-7 text-xs h-8"
                  />
                </div>
                <Button type="submit" size="sm" className="h-8 px-2.5" disabled={!searchId.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </form>

              {queue.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Enter a National ID to add to queue</p>
              ) : (
                queue.map(q => (
                  <div
                    key={q.nationalId}
                    onClick={() => switchQueue(q.nationalId)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      q.active ? "bg-violet-50 border-violet-300" : "bg-white border-border hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${q.active ? "bg-violet-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                      {q.nationalId.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{q.nationalId}</p>
                      <p className="text-[10px] text-muted-foreground">{format(q.addedAt, "HH:mm")}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeQueue(q.nationalId); }}
                      className="text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Main Area */}
        <div className="col-span-9" ref={printRef}>
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
              <span className="text-sm font-medium">Retrieving prescription data...</span>
            </div>
          )}

          {error && (
            <Card>
              <CardBody className="py-12 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="font-bold text-foreground">Patient Not Found</p>
                <p className="text-sm text-muted-foreground mt-1">No records for National ID: {nationalId}</p>
              </CardBody>
            </Card>
          )}

          {!nationalId && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
                <Pill className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-foreground mb-2">Pharmacy Portal</p>
              <p className="text-sm text-muted-foreground max-w-sm">Add a patient National ID to the queue to retrieve active prescriptions and begin the AI-verified dispensing workflow.</p>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* Patient Header */}
              <div className={`rounded-3xl p-5 flex items-start justify-between gap-5 ${
                data.summary.interactions > 0 ? "bg-red-600" : "bg-gradient-to-br from-violet-600 to-purple-700"
              } text-white`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Patient Record</p>
                  <p className="text-xl font-bold">{data.patient.name}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-white/80">
                    <span className="font-mono">{data.patient.nationalId}</span>
                    <span>·</span>
                    <span>{data.patient.age}y</span>
                    <span>·</span>
                    <span>{data.patient.bloodType}</span>
                    <span>·</span>
                    <span>Risk: {data.patient.riskScore ?? "—"}/100</span>
                  </div>
                  {data.patient.chronicConditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.patient.chronicConditions.map((c: string) => (
                        <span key={c} className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                  {data.patient.allergies?.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-xs font-bold">ALLERGIES: {data.patient.allergies.join(", ")}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-white/70">Active Rx</p>
                    <p className="text-3xl font-bold">{data.summary.active}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-white/70">Conflicts</p>
                    <p className={`text-3xl font-bold ${data.summary.interactions > 0 ? "text-yellow-300" : ""}`}>{data.summary.interactions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-white/70">Insured</p>
                    <p className="text-3xl font-bold">{data.summary.insuranceCovered}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintRx}
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Rx
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Card>
                <div className="flex border-b border-border">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                          activeTab === tab.id
                            ? "border-violet-600 text-violet-700 bg-violet-50/60"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.id === "matrix" && data.summary.interactions > 0 && (
                          <span className="ml-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{data.summary.interactions}</span>
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
                        <p className="font-bold text-foreground">No active prescriptions</p>
                      </div>
                    ) : (
                      data.prescriptions.map((presc: any) => {
                        const dispensedResult = dispensedResults[presc.id];
                        const isDispensed = !!dispensedResult;
                        const check = presc.dispenseCheck;
                        const ins = presc.insurance;

                        return (
                          <div key={presc.id} className={`p-5 ${!check.safe ? "bg-red-50/40" : ""}`}>
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-base text-foreground">{presc.drugName}</p>
                                  {!check.safe && <Badge variant="destructive" className="text-[9px]">⚠ CONFLICT</Badge>}
                                  {check.safe && <Badge variant="success" className="text-[9px]">✓ SAFE</Badge>}
                                  {isDispensed && <Badge variant="info" className="text-[9px]">DISPENSED</Badge>}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                  <span className="font-mono font-bold text-foreground">{presc.dosage}</span>
                                  <span>·</span>
                                  <span>{presc.frequency}</span>
                                  {presc.prescribedBy && <><span>·</span><span>Rx: {presc.prescribedBy}</span></>}
                                  {presc.startDate && <><span>·</span><span>Since {presc.startDate}</span></>}
                                </div>
                              </div>
                              {!isDispensed ? (
                                <Button
                                  onClick={() => {
                                    setDispensingId(presc.id);
                                    dispenseMutation.mutate({ id: presc.id });
                                  }}
                                  disabled={dispenseMutation.isPending && dispensingId === presc.id}
                                  variant={check.safe ? "default" : "outline"}
                                  className={`shrink-0 ${check.safe ? "bg-violet-600 hover:bg-violet-700 text-white" : "border-red-300 text-red-600 hover:bg-red-50"}`}
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  {dispensingId === presc.id && dispenseMutation.isPending ? "Dispensing..." : check.safe ? "Dispense" : "Override & Dispense"}
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 shrink-0">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Dispensed
                                </div>
                              )}
                            </div>

                            {/* AI Safety Check */}
                            <div className={`px-3.5 py-3 rounded-2xl border mb-2 ${!check.safe ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <Brain className="w-3.5 h-3.5 text-violet-600" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Dispense Safety Check</p>
                                <span className="text-[10px] font-mono text-muted-foreground ml-auto">Confidence: {Math.round(check.confidenceScore * 100)}%</span>
                              </div>
                              {check.warnings.map((w: string, i: number) => (
                                <p key={i} className="text-xs font-semibold text-foreground mb-1">{w}</p>
                              ))}
                              {check.detailedWarnings?.length > 0 && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => setExpandedWarnings(prev => ({ ...prev, [presc.id]: !prev[presc.id] }))}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-violet-700 hover:text-violet-900 transition-colors"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    {expandedWarnings[presc.id] ? "Hide" : "Show"} Clinical References ({check.detailedWarnings.length})
                                    {expandedWarnings[presc.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                  {expandedWarnings[presc.id] && (
                                    <div className="mt-2 space-y-2">
                                      {check.detailedWarnings.map((dw: any, wi: number) => (
                                        <div key={wi} className="rounded-xl bg-white/80 border border-red-100 p-3">
                                          <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <FlaskConical className="w-3 h-3 text-red-500 shrink-0" />
                                              <p className="text-[11px] font-bold text-foreground">{dw.drugA} ↔ {dw.drugB}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SEVERITY_COLOR[dw.severity] ?? "bg-gray-100"}`}>{dw.severity}</span>
                                          </div>
                                          <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">Mechanism: </span>{dw.mechanism}</p>
                                          <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">Clinical basis: </span>{dw.clinicalBasis}</p>
                                          <p className="text-[11px] font-semibold text-red-700 mb-2">{dw.recommendation}</p>
                                          <div className="flex flex-wrap gap-1">
                                            {(dw.sources ?? [dw.source]).filter(Boolean).map((src: string, si: number) => (
                                              <span key={si} className="text-[9px] font-mono bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded-md">{src}</span>
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
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Insurance · {ins.provider}</p>
                                <p className="text-xs text-foreground truncate">{ins.notes}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-xs">
                                <div className="text-center">
                                  <p className="text-[10px] text-muted-foreground">Coverage</p>
                                  <p className="font-bold text-foreground">{ins.eligible ? `${ins.coveragePercent}%` : "None"}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] text-muted-foreground">Copay</p>
                                  <p className="font-bold text-foreground">SAR {ins.copay}</p>
                                </div>
                                {ins.preAuthRequired && <Badge variant="warning" className="text-[9px]">Pre-Auth</Badge>}
                                <Badge variant={ins.eligible ? "success" : "destructive"} className="text-[9px]">{ins.eligible ? "Eligible" : "Not Eligible"}</Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── Interaction Matrix ── */}
                {activeTab === "matrix" && (
                  <InteractionMatrix prescriptions={data.prescriptions} />
                )}

                {/* ── Medication History ── */}
                {activeTab === "history" && (
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-secondary rounded-2xl text-xs text-muted-foreground">
                      <History className="w-3.5 h-3.5" />
                      Full medication history — active and discontinued for {data.patient.name}
                      <span className="ml-auto font-bold text-foreground">{(data.allMedications ?? data.prescriptions)?.length ?? 0} total</span>
                    </div>
                    {(data.allMedications ?? data.prescriptions ?? []).length === 0 ? (
                      <p className="text-center py-10 text-muted-foreground text-sm">No medication history</p>
                    ) : (
                      <div className="space-y-2">
                        {(data.allMedications ?? data.prescriptions).map((med: any, i: number) => (
                          <div key={i} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border ${med.isActive ? "bg-white border-emerald-200" : "bg-gray-50 border-gray-200 opacity-70"}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${med.isActive ? "bg-purple-100" : "bg-gray-100"}`}>
                              <Pill className={`w-4 h-4 ${med.isActive ? "text-purple-600" : "text-gray-400"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm ${med.isActive ? "text-foreground" : "text-muted-foreground"}`}>{med.drugName}</p>
                              <p className="text-[11px] text-muted-foreground">{med.dosage} · {med.frequency}{med.prescribedBy ? ` · ${med.prescribedBy}` : ""}</p>
                              {med.notes && <p className="text-[11px] text-muted-foreground italic mt-0.5">{med.notes}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant={med.isActive ? "success" : "outline"} className="text-[10px] mb-1">
                                {med.isActive ? "Active" : "Discontinued"}
                              </Badge>
                              {med.startDate && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Since {med.startDate}</p>}
                              {med.endDate && <p className="text-[10px] text-muted-foreground font-mono">Until {med.endDate}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Stock Check ── */}
                {activeTab === "stock" && (
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-secondary rounded-2xl text-xs text-muted-foreground">
                      <Package className="w-3.5 h-3.5" />
                      Real-time inventory check for this patient's prescribed medications
                    </div>
                    {(data.prescriptions ?? []).map((presc: any, i: number) => {
                      const avail = presc.stockAvailability;
                      const pct = avail ? Math.min(100, Math.round((avail.daysOfStock / 45) * 100)) : 0;
                      const barColor = !avail ? "bg-gray-300" : avail.status === "critical" ? "bg-red-500" : avail.status === "low" ? "bg-amber-500" : "bg-emerald-500";
                      return (
                        <div key={i} className={`px-4 py-4 rounded-2xl border ${
                          avail?.status === "critical" ? "border-red-300 bg-red-50" : avail?.status === "low" ? "border-amber-200 bg-amber-50" : "border-border bg-white"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Package className={`w-4 h-4 shrink-0 ${avail?.status === "critical" ? "text-red-600" : avail?.status === "low" ? "text-amber-600" : "text-muted-foreground"}`} />
                              <div>
                                <p className="font-bold text-sm text-foreground">{presc.drugName}</p>
                                <p className="text-[11px] text-muted-foreground">{presc.dosage}</p>
                              </div>
                            </div>
                            {avail ? (
                              <div className="text-right">
                                <Badge
                                  variant={avail.status === "critical" ? "destructive" : avail.status === "low" ? "warning" : "success"}
                                  className="text-[10px] mb-1"
                                >
                                  {avail.status === "critical" ? "⚠ Critical Stock" : avail.status === "low" ? "Low Stock" : "Available"}
                                </Badge>
                                <p className="text-xs font-bold text-foreground">{avail.stock?.toLocaleString()} {avail.unit}</p>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Not tracked</Badge>
                            )}
                          </div>
                          {avail && (
                            <div>
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                <span>Stock level</span>
                                <span>{avail.daysOfStock} days of supply</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

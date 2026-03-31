import React, { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Badge, PageHeader, DataLabel
} from "@/components/shared";
import {
  Pill, Search, AlertTriangle, CheckCircle2, Shield, ShieldAlert,
  Brain, CreditCard, Zap, Clock, X, BookOpen, ChevronDown, ChevronUp,
  FlaskConical, Printer, History, ClipboardList, Package
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";

async function fetchPharmacyPatient(nationalId: string) {
  const res = await fetch(`/api/pharmacy/patient/${nationalId}`);
  if (!res.ok) throw new Error("Patient not found");
  return res.json();
}

async function dispenseMed(medicationId: number, pharmacistName: string) {
  const res = await fetch(`/api/pharmacy/dispense/${medicationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pharmacistName }),
  });
  if (!res.ok) throw new Error("Failed to dispense");
  return res.json();
}

type PharmTab = "prescriptions" | "history" | "stock";

export default function PharmacyPortal() {
  const { user } = useAuth();
  const pharmacistName = user?.name ?? "Pharmacist";
  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dispensing, setDispensing] = useState<number | null>(null);
  const [dispensedResults, setDispensedResults] = useState<Record<number, any>>({});
  const [expandedWarnings, setExpandedWarnings] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<PharmTab>("prescriptions");
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
      setDispensing(null);
      qc.invalidateQueries({ queryKey: ["pharmacy-patient", nationalId] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) setNationalId(searchId.trim());
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content || !data) return;
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
      <div class="header">
        <h1>🏥 SANAD National Health Platform</h1>
        <p>Ministry of Health — Kingdom of Saudi Arabia</p>
        <p>Prescription Reference: SANAD-RX-${Date.now()} · ${new Date().toLocaleDateString("en-SA")} ${new Date().toLocaleTimeString("en-SA", { hour: "2-digit", minute: "2-digit" })}</p>
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
          <div class="rx-details">${p.dosage} · ${p.frequency} · Prescribed by ${p.prescribedBy}</div>
          <div class="rx-details">${p.hospital} · Started: ${p.startDate ?? "N/A"}</div>
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
    { id: "history", label: "Medication History", icon: History },
    { id: "stock", label: "Stock Check", icon: Package },
  ];

  return (
    <Layout role="pharmacy">
      <PageHeader
        title="Pharmacy Portal"
        subtitle="Prescription dispensing · AI drug safety · Insurance verification"
      />

      {/* Search */}
      <Card className="mb-5">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Patient National ID"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!searchId.trim()}>
              <Search className="w-4 h-4" /> Retrieve Prescriptions
            </Button>
          </form>
        </CardBody>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          <span className="text-sm font-medium">Loading prescriptions...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardBody className="py-10 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-bold text-foreground">Patient Not Found</p>
            <p className="text-sm text-muted-foreground mt-1">No records for National ID: {nationalId}</p>
          </CardBody>
        </Card>
      )}

      {data && (
        <div className="space-y-4" ref={printRef}>
          {/* Patient + Allergy Strip */}
          <div className={`rounded-3xl p-5 flex items-start justify-between gap-5 ${
            data.summary.interactions > 0 ? "bg-red-600" : "bg-purple-500"
          } text-white`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Patient Record</p>
              <p className="text-xl font-bold">{data.patient.name}</p>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-white/80">
                <span>ID: {data.patient.nationalId}</span>
                <span>Age: {data.patient.age}</span>
                <span>Blood: {data.patient.bloodType}</span>
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
                  <p className="text-xs font-bold">KNOWN ALLERGIES: {data.patient.allergies.join(", ")}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-white/70">Active Rx</p>
                <p className="text-3xl font-bold">{data.summary.active}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">Interactions</p>
                <p className={`text-3xl font-bold ${data.summary.interactions > 0 ? "text-yellow-300" : ""}`}>{data.summary.interactions}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">Insured</p>
                <p className="text-3xl font-bold">{data.summary.insuranceCovered}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Rx
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
                        ? "border-purple-600 text-purple-700 bg-purple-50/60"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Active Prescriptions Tab ── */}
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
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-base text-foreground">{presc.drugName}</p>
                              {!check.safe && <Badge variant="destructive" className="text-[9px]">⚠ CONFLICT</Badge>}
                              {check.safe && <Badge variant="success" className="text-[9px]">✓ SAFE</Badge>}
                              {isDispensed && <Badge variant="info" className="text-[9px]">DISPENSED</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono font-bold text-foreground">{presc.dosage}</span>
                              <span>·</span><span>{presc.frequency}</span>
                              <span>·</span><span>Rx by {presc.prescribedBy}</span>
                              <span>·</span><span>{presc.hospital}</span>
                            </div>
                          </div>
                          {!isDispensed ? (
                            <Button
                              onClick={() => { setDispensing(presc.id); dispenseMutation.mutate({ id: presc.id }); }}
                              disabled={!check.safe || dispenseMutation.isPending}
                              variant={check.safe ? "default" : "outline"}
                              className={check.safe ? "" : "border-red-300 text-red-600"}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              {dispensing === presc.id ? "Dispensing..." : check.safe ? "Dispense" : "Override & Dispense"}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Dispensed — {dispensedResult?.dispensedAt ? format(new Date(dispensedResult.dispensedAt), "HH:mm dd MMM") : ""}
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

                          {check.detailedWarnings && check.detailedWarnings.length > 0 && (
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
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                          dw.severity === "CONTRAINDICATED" ? "bg-red-600 text-white" :
                                          dw.severity === "MAJOR" ? "bg-red-100 text-red-700" :
                                          dw.severity === "MODERATE" ? "bg-amber-100 text-amber-700" :
                                          "bg-yellow-100 text-yellow-700"
                                        }`}>{dw.severity}</span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">Mechanism: </span>{dw.mechanism}</p>
                                      <p className="text-[11px] text-muted-foreground mb-1"><span className="font-semibold text-foreground">Clinical basis: </span>{dw.clinicalBasis}</p>
                                      <div className="flex items-start gap-1.5 mb-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-semibold text-foreground">{dw.recommendation}</p>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {dw.sources?.map((src: string, si: number) => (
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

                        {/* Insurance */}
                        <div className="flex items-center gap-4 px-3.5 py-2.5 bg-secondary rounded-2xl border border-border">
                          <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Insurance · {ins.provider}</p>
                            <p className="text-xs text-foreground">{ins.notes}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-xs">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">Coverage</p>
                              <p className="font-bold text-foreground">{ins.eligible ? `${ins.coveragePercent}%` : "Not Covered"}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">Copay</p>
                              <p className="font-bold text-foreground">SAR {ins.copay}</p>
                            </div>
                            {ins.preAuthRequired && <Badge variant="warning" className="text-[9px]">Pre-Auth Req.</Badge>}
                            <Badge variant={ins.eligible ? "success" : "destructive"} className="text-[9px]">{ins.eligible ? "Eligible" : "Not Eligible"}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Medication History Tab ── */}
            {activeTab === "history" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-secondary rounded-2xl text-xs text-muted-foreground">
                  <History className="w-3.5 h-3.5" />
                  Full medication history — active and discontinued prescriptions for {data.patient.name}
                </div>
                {(data.allMedications ?? data.prescriptions ?? []).length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground text-sm">No medication history available</p>
                ) : (
                  <div className="space-y-2">
                    {(data.allMedications ?? data.prescriptions).map((med: any, i: number) => (
                      <div key={i} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border ${med.isActive ? "bg-white border-emerald-200" : "bg-gray-50 border-gray-200 opacity-70"}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${med.isActive ? "bg-purple-100" : "bg-gray-100"}`}>
                          <Pill className={`w-4 h-4 ${med.isActive ? "text-purple-600" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${med.isActive ? "text-foreground" : "text-muted-foreground"}`}>{med.drugName}</p>
                          <p className="text-[11px] text-muted-foreground">{med.dosage} · {med.frequency} · {med.prescribedBy}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant={med.isActive ? "success" : "outline"} className="text-[10px] mb-1">
                            {med.isActive ? "Active" : "Discontinued"}
                          </Badge>
                          {med.startDate && (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              Since {med.startDate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Stock Check Tab ── */}
            {activeTab === "stock" && (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-secondary rounded-2xl text-xs text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  Real-time availability check for this patient's prescribed medications
                </div>
                {(data.prescriptions ?? []).map((presc: any, i: number) => {
                  const avail = presc.stockAvailability;
                  const statusColor = !avail ? "text-muted-foreground" :
                    avail.status === "critical" ? "text-red-600" :
                    avail.status === "low" ? "text-amber-600" : "text-emerald-600";
                  return (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-border bg-white">
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-foreground">{presc.drugName}</p>
                        <p className="text-[11px] text-muted-foreground">{presc.dosage}</p>
                      </div>
                      {avail ? (
                        <div className="text-right shrink-0">
                          <Badge
                            variant={avail.status === "critical" ? "destructive" : avail.status === "low" ? "warning" : "success"}
                            className="text-[10px] mb-1"
                          >
                            {avail.status === "critical" ? "Critical Stock" : avail.status === "low" ? "Low Stock" : "Available"}
                          </Badge>
                          <p className={`text-xs font-bold ${statusColor}`}>
                            {avail.stock?.toLocaleString()} {avail.unit}
                          </p>
                          {avail.daysOfStock && (
                            <p className="text-[10px] text-muted-foreground">{avail.daysOfStock} days of stock</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Not tracked</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {!nationalId && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
            <Pill className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2">Pharmacy Portal</p>
          <p className="text-sm text-muted-foreground max-w-sm">Enter a patient's National ID to view active prescriptions and dispense medications with AI safety verification.</p>
        </div>
      )}
    </Layout>
  );
}

async function fetchPharmacyPatient(nationalId: string) {
  const res = await fetch(`/api/pharmacy/patient/${nationalId}`);
  if (!res.ok) throw new Error("Patient not found");
  return res.json();
}

async function dispenseMed(medicationId: number, pharmacistName: string) {
  const res = await fetch(`/api/pharmacy/dispense/${medicationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pharmacistName }),
  });
  if (!res.ok) throw new Error("Failed to dispense");
  return res.json();
}

export default function PharmacyPortal() {
  const { user } = useAuth();
  const pharmacistName = user?.name ?? "Pharmacist";
  const [searchId, setSearchId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dispensing, setDispensing] = useState<number | null>(null);
  const [dispensedResults, setDispensedResults] = useState<Record<number, any>>({});
  const [expandedWarnings, setExpandedWarnings] = useState<Record<number, boolean>>({});

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
      setDispensing(null);
      qc.invalidateQueries({ queryKey: ["pharmacy-patient", nationalId] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) setNationalId(searchId.trim());
  };

  return (
    <Layout role="pharmacy">
      <PageHeader
        title="Pharmacy Portal"
        subtitle="Prescription dispensing · AI drug safety · Insurance verification"
      />

      {/* Search */}
      <Card className="mb-5">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Patient National ID"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!searchId.trim()}>
              <Search className="w-4 h-4" /> Retrieve Prescriptions
            </Button>
          </form>
        </CardBody>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          <span className="text-sm font-medium">Loading prescriptions...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardBody className="py-10 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-bold text-foreground">Patient Not Found</p>
            <p className="text-sm text-muted-foreground mt-1">No records for National ID: {nationalId}</p>
          </CardBody>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          {/* Patient + Allergy Strip */}
          <div className={`rounded-3xl p-5 flex items-start justify-between gap-5 ${
            data.summary.interactions > 0 ? "bg-red-600" : "bg-purple-500"
          } text-white`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Patient Record</p>
              <p className="text-xl font-bold">{data.patient.name}</p>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-white/80">
                <span>ID: {data.patient.nationalId}</span>
                <span>Age: {data.patient.age}</span>
                <span>Blood: {data.patient.bloodType}</span>
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
                  <p className="text-xs font-bold">KNOWN ALLERGIES: {data.patient.allergies.join(", ")}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-white/70">Active Rx</p>
                <p className="text-3xl font-bold">{data.summary.active}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">Interactions</p>
                <p className={`text-3xl font-bold ${data.summary.interactions > 0 ? "text-yellow-300" : ""}`}>{data.summary.interactions}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/70">Insured</p>
                <p className="text-3xl font-bold">{data.summary.insuranceCovered}</p>
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <Pill className="w-4 h-4 text-purple-600" />
              <CardTitle>Active Prescriptions</CardTitle>
              <Badge variant="outline" className="ml-auto">{data.prescriptions.length} prescriptions</Badge>
            </CardHeader>
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
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-base text-foreground">{presc.drugName}</p>
                            {!check.safe && <Badge variant="destructive" className="text-[9px]">⚠ CONFLICT</Badge>}
                            {check.safe && <Badge variant="success" className="text-[9px]">✓ SAFE</Badge>}
                            {isDispensed && <Badge variant="info" className="text-[9px]">DISPENSED</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono font-bold text-foreground">{presc.dosage}</span>
                            <span>·</span>
                            <span>{presc.frequency}</span>
                            <span>·</span>
                            <span>Rx by {presc.prescribedBy}</span>
                            <span>·</span>
                            <span>{presc.hospital}</span>
                          </div>
                        </div>
                        {!isDispensed ? (
                          <Button
                            onClick={() => {
                              setDispensing(presc.id);
                              dispenseMutation.mutate({ id: presc.id });
                            }}
                            disabled={!check.safe || dispenseMutation.isPending}
                            variant={check.safe ? "default" : "outline"}
                            className={check.safe ? "" : "border-red-300 text-red-600"}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {dispensing === presc.id ? "Dispensing..." : check.safe ? "Dispense" : "Override & Dispense"}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
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

                        {/* Detailed Clinical References */}
                        {check.detailedWarnings && check.detailedWarnings.length > 0 && (
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
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                        dw.severity === "CONTRAINDICATED" ? "bg-red-600 text-white" :
                                        dw.severity === "MAJOR" ? "bg-red-100 text-red-700" :
                                        dw.severity === "MODERATE" ? "bg-amber-100 text-amber-700" :
                                        "bg-yellow-100 text-yellow-700"
                                      }`}>{dw.severity}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-1">
                                      <span className="font-semibold text-foreground">Mechanism: </span>{dw.mechanism}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mb-1">
                                      <span className="font-semibold text-foreground">Clinical basis: </span>{dw.clinicalBasis}
                                    </p>
                                    <div className="flex items-start gap-1.5 mb-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                      <p className="text-[11px] font-semibold text-foreground">{dw.recommendation}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {dw.sources?.map((src: string, si: number) => (
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

                      {/* Insurance */}
                      <div className="flex items-center gap-4 px-3.5 py-2.5 bg-secondary rounded-2xl border border-border">
                        <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Insurance · {ins.provider}</p>
                          <p className="text-xs text-foreground">{ins.notes}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Coverage</p>
                            <p className="font-bold text-foreground">{ins.eligible ? `${ins.coveragePercent}%` : "Not Covered"}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Copay</p>
                            <p className="font-bold text-foreground">SAR {ins.copay}</p>
                          </div>
                          {ins.preAuthRequired && (
                            <Badge variant="warning" className="text-[9px]">Pre-Auth Req.</Badge>
                          )}
                          <Badge variant={ins.eligible ? "success" : "destructive"} className="text-[9px]">
                            {ins.eligible ? "Eligible" : "Not Eligible"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {!nationalId && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
            <Pill className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2">Pharmacy Portal</p>
          <p className="text-sm text-muted-foreground max-w-sm">Enter a patient's National ID to view active prescriptions and dispense medications with AI safety verification.</p>
        </div>
      )}
    </Layout>
  );
}

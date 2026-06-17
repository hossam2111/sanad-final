import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardBody, Badge, PageHeader, KpiCard , SkeletonCard, ErrorBanner} from "@/components/shared";
import {
  Package, AlertTriangle, TrendingUp, Brain, Truck, Zap, CheckCircle2,
  BarChart2, Globe, AlertCircle, ArrowUpRight, Clock, RefreshCw,
  MapPin, ShoppingCart, Calendar, ChevronRight, TrendingDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend, ReferenceLine
} from "recharts";

async function fetchInventory() {
  const res = await apiFetch("/api/supply-chain/inventory");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
async function submitReorder(body: Record<string, any>) {
  const res = await apiFetch("/api/supply-chain/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const STATUS_CFG: Record<string, { bg: string; border: string; text: string; badge: any; dot: string }> = {
  critical: { bg: "bg-danger-bg", border: "border-danger/30", text: "text-danger", badge: "destructive" as const, dot: "bg-danger animate-pulse" },
  low: { bg: "bg-risk-high-bg", border: "border-risk-high/20", text: "text-risk-high", badge: "warning" as const, dot: "bg-risk-high" },
  adequate: { bg: "bg-success-bg", border: "border-success/30", text: "text-success", badge: "success" as const, dot: "bg-success" },
  High: { bg: "bg-success-bg", border: "border-success/30", text: "text-success", badge: "success" as const, dot: "bg-success" },
  Medium: { bg: "bg-risk-high-bg", border: "border-risk-high/20", text: "text-risk-high", badge: "warning" as const, dot: "bg-risk-high" },
  Low: { bg: "bg-danger-bg", border: "border-danger/30", text: "text-danger", badge: "destructive" as const, dot: "bg-danger" },
};

type ShortagePrediction = { drug: string; day30: number; day60: number; day90: number; current: number; min: number };

async function fetchRegionalDistribution() {
  const res = await apiFetch("/api/supply-chain/regional-distribution");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const CONSUMPTION_TREND = [
  { month: "Jul", metformin: 7800, insulin: 2400, lisinopril: 4900, atorvastatin: 5600 },
  { month: "Aug", metformin: 8100, insulin: 2550, lisinopril: 5100, atorvastatin: 5750 },
  { month: "Sep", metformin: 8300, insulin: 2600, lisinopril: 5200, atorvastatin: 5900 },
  { month: "Oct", metformin: 8400, insulin: 2700, lisinopril: 5300, atorvastatin: 6000 },
  { month: "Nov", metformin: 8500, insulin: 2750, lisinopril: 5450, atorvastatin: 6100 },
  { month: "Dec", metformin: 8500, insulin: 2800, lisinopril: 5500, atorvastatin: 6200 },
];

type ViewTab = "inventory" | "predictions" | "distribution" | "reorder";

export default function SupplyChainPortal() {
  const { text, dir, locale, toggleLocale } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewTab>("inventory");
  const [reorderResults, setReorderResults] = useState<Record<string, any>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPO, setNewPO] = useState({ item: "", quantity: 1, supplier: "", urgency: "routine" as "routine" | "urgent" | "critical" });
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);

  React.useEffect(() => {
    apiFetch("/api/alerts?type=LOW_STOCK&limit=10")
      .then(r => r.json())
      .then(data => setLowStockAlerts(data.alerts ?? []));
  }, []);

  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["supply-inventory"], queryFn: fetchInventory, refetchInterval: 60000 });
  const { data: regionalData, isLoading: loadingRegional } = useQuery({
    queryKey: ["supply-regional"],
    queryFn: fetchRegionalDistribution,
    refetchInterval: 120000,
  });
  const regionalDistribution = regionalData?.distribution ?? [];
  const regionalSummary = regionalData?.summary ?? null;
  const regionalRecs = regionalData?.recommendations ?? [];

  const reorderMutation = useMutation({
    mutationFn: (body: Record<string, any>) => submitReorder(body),
    onSuccess: (result, body) => {
      setReorderResults(prev => ({ ...prev, [body.drugName]: result }));
      qc.invalidateQueries({ queryKey: ["supply-inventory"] });
    },
  });

  const { data: poData } = useQuery({ queryKey: ["supply-pos"], queryFn: async () => (await apiFetch("/api/supply-chain/purchase-orders")).json() });
  
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/supply-chain/orders/${id}/approve`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supply-pos"] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/supply-chain/orders/${id}/reject`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supply-pos"] }),
  });
  const createMutation = useMutation({
    mutationFn: (body: any) => apiFetch("/api/supply-chain/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply-pos"] });
      setShowCreateForm(false);
      setNewPO({ item: "", quantity: 1, supplier: "", urgency: "routine" });
    },
  });

  if (isLoading) {
    return (
      <Layout role="supply-chain" localized>
        <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span className="text-sm font-medium">{text("Loading inventory data...", "جارٍ تحميل بيانات المخزون...")}</span>
        </div>
      </Layout>
    );
  }

  const TABS: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: "inventory", label: text("Inventory Status", "حالة المخزون"), icon: Package },
    { id: "predictions", label: text("AI Shortage Predictions", "تنبؤات النقص الذكية"), icon: Brain },
    { id: "distribution", label: text("Regional Distribution", "التوزيع الإقليمي"), icon: Globe },
    { id: "reorder", label: text("Purchase Orders", "أوامر الشراء"), icon: ShoppingCart },
  ];

  const criticals = data?.summary?.criticalShortages ?? 0;

  return (
    <Layout role="supply-chain" localized>
      {/* Priority Strip */}
      {criticals > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-danger text-white rounded-2xl mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest">
            {text(`${criticals} CRITICAL SHORTAGE${criticals > 1 ? "S" : ""} —`, `${criticals} نقص حرج —`)}{" "}
            {data?.criticalAlerts?.map((a: any) => a.drug).join(" · ")}
          </p>
          <button onClick={() => setActiveTab("reorder")} className="ms-auto text-[11px] font-bold bg-card/20 hover:bg-card/30 px-3 py-1 rounded-full transition-colors">
            {text("Issue Purchase Orders →", "إصدار أوامر شراء ←")}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-lime-750 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest">
          <Package className="w-3 h-3" />
          {text("Supply Chain", "سلسلة الإمداد")}
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${criticals > 0 ? "text-danger bg-danger-bg" : "text-success bg-success-bg"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${criticals > 0 ? "bg-danger animate-pulse" : "bg-success"}`} />
          {criticals > 0 ? text(`${criticals} Critical Shortages`, `${criticals} نقص حرج`) : text("No Critical Shortages", "لا يوجد نقص حرج")}
        </div>
        <div className="ms-auto font-mono text-[11px] text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-full">
          {text("Inventory Value:", "قيمة المخزون:")} {text("SAR", "ر.س")} {data?.summary?.totalInventoryValue?.toLocaleString()}
        </div>
      </div>

      {lowStockAlerts.length > 0 && (
        <div className="mb-5 rounded-lg border border-[hsl(var(--risk-high)/0.4)] bg-[hsl(var(--risk-high)/0.08)] p-3 flex items-start gap-2" dir={dir}>
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--risk-high))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {text(`${lowStockAlerts.length} low-stock alerts`, `${lowStockAlerts.length} تنبيه مخزون منخفض`)}
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
              {lowStockAlerts.map(a => <li key={a.id}>{a.message}</li>)}
            </ul>
          </div>
        </div>
      )}

      <PageHeader
        title={text("National Drug Supply Chain", "سلسلة إمداد الأدوية الوطنية")}
        subtitle={text("Real-time inventory · AI shortage prediction · Regional distribution optimization · Procurement management", "مخزون فوري · تنبؤ النقص بالذكاء · تحسين التوزيع الإقليمي · إدارة المشتريات")}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard title={text("Total Drug Lines", "إجمالي أصناف الأدوية")} value={data?.summary?.totalDrugs} sub={text("Tracked nationally", "متابَعة وطنيًا")} icon={Package} iconBg="bg-lime-100" iconColor="text-lime-700" />
        <KpiCard
          title={text("Critical Shortages", "النقص الحرج")} value={data?.summary?.criticalShortages}
          sub={text(`${data?.summary?.reorderAlerts} reorder alerts active`, `${data?.summary?.reorderAlerts} تنبيه إعادة طلب`)}
          icon={AlertTriangle} iconBg={criticals > 0 ? "bg-danger-bg" : "bg-success-bg"} iconColor={criticals > 0 ? "text-danger" : "text-success"}
        />
        <KpiCard title={text("Adequate Stock", "مخزون كافٍ")} value={data?.summary?.adequate} sub={text("Lines fully stocked", "أصناف مكتملة المخزون")} icon={CheckCircle2} iconBg="bg-success-bg" iconColor="text-success" />
        <KpiCard title={text("Inventory Value", "قيمة المخزون")} value={`${text("SAR", "ر.س")} ${data?.summary?.totalInventoryValue?.toLocaleString()}`} sub={text("Current stock value", "قيمة المخزون الحالية")} icon={BarChart2} iconBg="bg-primary/10" iconColor="text-primary" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
              {tab.id === "reorder" && criticals > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {criticals}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── INVENTORY ─── */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-8">
              <CardHeader><Package className="w-4 h-4 text-lime-700" /><CardTitle>{text("Drug Inventory — All Lines", "Drug Inventory — All Lines")}</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      {["Drug", "Category", "Stock", "Min Required", "Days Remaining", "Status"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.inventory?.map((item: any, i: number) => {
                      const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.adequate;
                      return (
                        <tr key={i} className={`${item.status === "critical" ? "bg-danger-bg/50" : ""} hover:bg-secondary/20`}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-foreground">{item.drugName}</p>
                            <p className="text-[10px] text-muted-foreground">{item.supplier}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">{item.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-foreground">{item.stock.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-muted-foreground">{item.minStock.toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-secondary rounded-full h-1.5">
                                <div className={`h-full rounded-full ${item.daysOfStock < 14 ? "bg-danger" : item.daysOfStock < 30 ? "bg-risk-high" : "bg-success"}`} style={{ width: `${Math.min((item.daysOfStock / 90) * 100, 100)}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${item.daysOfStock < 14 ? "text-danger" : item.daysOfStock < 30 ? "text-risk-high" : "text-foreground"}`}>{item.daysOfStock}{text("d", "d")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={cfg.badge} className="text-[9px]">{item.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="col-span-4 space-y-4">
              {/* Distribution Centers */}
              <Card>
                <CardHeader><MapPin className="w-4 h-4 text-primary" /><CardTitle>{text("Distribution Centers", "Distribution Centers")}</CardTitle></CardHeader>
                <CardBody className="space-y-2.5">
                  {data?.distributionCenters?.map((dc: any, i: number) => {
                    const cfg = STATUS_CFG[dc.stock] ?? STATUS_CFG.adequate;
                    return (
                      <div key={i} className={`px-3.5 py-3 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold text-foreground">{dc.name}</p>
                          <Badge variant={cfg.badge} className="text-[9px]">{dc.stock}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{text("Capacity:", "Capacity:")} <span className="font-bold text-foreground">{dc.capacity}</span></span>
                          <span>·</span>
                          <span>{text("Next delivery:", "Next delivery:")} <span className="font-bold text-foreground">{dc.nextDelivery}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>

              {/* Consumption Trend */}
              <Card>
                <CardHeader><TrendingUp className="w-4 h-4 text-lime-700" /><CardTitle>{text("6-Month Consumption", "6-Month Consumption")}</CardTitle></CardHeader>
                <CardBody>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={CONSUMPTION_TREND} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 9 }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 11 }} />
                        <Line type="monotone" dataKey="metformin" stroke="#007AFF" strokeWidth={2} dot={false} name="Metformin" />
                        <Line type="monotone" dataKey="insulin" stroke="#ef4444" strokeWidth={2} dot={false} name="Insulin" />
                        <Line type="monotone" dataKey="lisinopril" stroke="#10b981" strokeWidth={2} dot={false} name="Lisinopril" />
                        <Line type="monotone" dataKey="atorvastatin" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Atorvastatin" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI SHORTAGE PREDICTIONS ─── */}
      {activeTab === "predictions" && (
        <div className="space-y-5">
          <div className="flex items-start gap-4 px-5 py-4 bg-violet-50 border border-violet-200 rounded-2xl">
            <Brain className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-violet-800">{text("AI Supply Forecasting Engine v2.1", "AI Supply Forecasting Engine v2.1")}</p>
              <p className="text-xs text-violet-600 mt-0.5">
                {text("Machine learning demand prediction using 24-month historical consumption, prescription trends, disease prevalence, and seasonal patterns. Predictions recalculated daily at 02:00 AST.", "Machine learning demand prediction using 24-month historical consumption, prescription trends, disease prevalence, and seasonal patterns. Predictions recalculated daily at 02:00 AST.")}
              </p>
            </div>
            <Badge variant="info">{text("Updated Today", "Updated Today")}</Badge>
          </div>

          {/* AI Predictions from backend */}
          <Card>
            <CardHeader><Brain className="w-4 h-4 text-violet-600" /><CardTitle>{text("AI Demand Predictions", "AI Demand Predictions")}</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {data?.aiPredictions?.map((pred: any, i: number) => (
                <div key={i} className="flex items-start gap-4 px-4 py-3.5 bg-violet-50 border border-violet-100 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{pred.prediction}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                      {pred.action}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-violet-700">{pred.confidence}%</p>
                    <p className="text-[10px] text-muted-foreground">{text("confidence", "confidence")}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* 30/60/90 Day Forecast */}
          <Card>
            <CardHeader><Calendar className="w-4 h-4 text-primary" /><CardTitle>{text("30/60/90-Day Stock Forecast", "30/60/90-Day Stock Forecast")}</CardTitle><span className="ml-auto text-[11px] text-muted-foreground">{text("Units remaining", "Units remaining")}</span></CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.shortagePredictions ?? []) as ShortagePrediction[]} layout="vertical" margin={{ top: 0, right: 30, left: 140, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <YAxis dataKey="drug" type="category" axisLine={false} tickLine={false} tick={{ fill: "#374151", fontSize: 10, fontWeight: 500 }} width={135} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="current" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} name="Now" />
                    <Bar dataKey="day30" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={10} name="30 Days" />
                    <Bar dataKey="day60" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={10} name="60 Days" />
                    <Bar dataKey="day90" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} name="90 Days" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Critical shortages countdown */}
          <div className="grid grid-cols-2 gap-4">
            {data?.inventory?.filter((i: any) => i.status !== "adequate").map((item: any, idx: number) => {
              const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.adequate;
              return (
                <div key={idx} className={`px-4 py-3.5 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                        <p className="text-xs font-bold text-foreground">{item.drugName}</p>
                        <Badge variant={cfg.badge} className="text-[9px]">{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{text("Stock:", "Stock:")} {item.stock.toLocaleString()} {item.unit} {text("· Min:", "· Min:")} {item.minStock.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{text("Supplier:", "Supplier:")} {item.supplier} {text("· Lead time:", "· Lead time:")} {item.leadTimeDays}{text("d", "d")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${item.daysOfStock < 14 ? "text-danger" : "text-risk-high"}`}>{item.daysOfStock}{text("d", "d")}</p>
                      <p className="text-[10px] text-muted-foreground">{text("stock left", "stock left")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => reorderMutation.mutate({ drugName: item.drugName, quantity: item.avgMonthlyDemand * 3, supplier: item.supplier, requestedBy: "Ibrahim Al-Dosari" })}
                    disabled={reorderMutation.isPending || !!reorderResults[item.drugName]}
                    className={`mt-3 w-full text-xs font-semibold py-1.5 rounded-xl transition-colors ${reorderResults[item.drugName] ? "bg-success-bg text-success border border-success/30" : "bg-danger hover:bg-danger text-white"}`}
                  >
                    {reorderResults[item.drugName] ? `✓ Order Placed: ${reorderResults[item.drugName]?.orderId}` : "Issue Emergency Order"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── REGIONAL DISTRIBUTION ─── */}
      {activeTab === "distribution" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 bg-info-bg border border-info/20 rounded-2xl">
            <Globe className="w-4 h-4 text-info shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">{text("National Drug Distribution Optimization", "National Drug Distribution Optimization")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{text("AI redistribution model identifies supply-demand gaps per region — redistribution recommendations updated every 6 hours", "AI redistribution model identifies supply-demand gaps per region — redistribution recommendations updated every 6 hours")}</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-7">
              <CardHeader><Globe className="w-4 h-4 text-primary" /><CardTitle>{text("Regional Stock vs. Demand", "Regional Stock vs. Demand")}</CardTitle>
                {regionalSummary && (
                  <Badge variant={regionalSummary.shortageRegions > 3 ? "destructive" : "warning"} className="ml-auto text-[10px]">
                    {regionalSummary.shortageRegions} {text("shortage regions", "shortage regions")}
                  </Badge>
                )}
              </CardHeader>
              <CardBody>
                <div className="h-72">
                  {loadingRegional ? (
                     <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" /> {text("Loading regional data...", "Loading regional data...")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionalDistribution} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }}
                          formatter={(value: any, name: string) => [value.toLocaleString(), name]} />
                        <Legend />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                        <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} name="Stock (units)" />
                        <Bar dataKey="demand" fill="#007AFF" radius={[4, 4, 0, 0]} barSize={22} name="Demand (units)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {regionalSummary && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="text-xs"><span className="font-bold text-foreground">{regionalSummary.totalStock.toLocaleString()}</span><span className="text-muted-foreground ml-1">{text("total stock units", "total stock units")}</span></div>
                    <div className="text-xs"><span className="font-bold text-foreground">{regionalSummary.totalDemand.toLocaleString()}</span><span className="text-muted-foreground ml-1">{text("monthly demand", "monthly demand")}</span></div>
                    <Badge variant={regionalSummary.nationalGapPct > 0 ? "destructive" : "success"} className="ml-auto text-[10px]">
                      {text("National gap:", "National gap:")} {regionalSummary.nationalGapPct > 0 ? "+" : ""}{regionalSummary.nationalGapPct}%
                    </Badge>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-5">
              <CardHeader><MapPin className="w-4 h-4 text-primary" /><CardTitle>{text("Gap Analysis by Region", "Gap Analysis by Region")}</CardTitle></CardHeader>
              <CardBody className="space-y-2.5">
                {loadingRegional ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" /> {text("Loading...", "Loading...")}
                  </div>
                ) : regionalDistribution.map((r: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${r.gap < 0 ? "bg-danger-bg border-danger/30" : "bg-success-bg border-success/30"}`}>
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${r.gap < 0 ? "text-danger" : "text-success"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{r.region}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {text("Stock", "Stock")} {r.stock.toLocaleString()} {text("· Demand", "· Demand")} {r.demand.toLocaleString()}
                        {r.criticalDrugs > 0 && <span className="text-danger font-bold"> · {r.criticalDrugs} {text("critical drugs", "critical drugs")}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${r.gap < 0 ? "text-danger" : "text-success"}`}>
                        {r.gap > 0 ? "+" : ""}{r.gapPct}%
                      </p>
                      <p className={`text-[9px] font-bold ${r.gap < 0 ? "text-danger" : "text-success"}`}>
                        {r.gap < 0 ? "DEFICIT" : "SURPLUS"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* AI Redistribution Recommendations */}
          <Card>
            <CardHeader><Brain className="w-4 h-4 text-violet-600" /><CardTitle>{text("AI Redistribution Recommendations", "AI Redistribution Recommendations")}</CardTitle><Badge variant="info">{text("Live · computed from inventory", "Live · computed from inventory")}</Badge></CardHeader>
            <CardBody className="space-y-3">
              {loadingRegional ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600" /> {text("Computing recommendations...", "Computing recommendations...")}
                </div>
              ) : regionalRecs.length > 0 ? regionalRecs.map((rec: any, i: number) => (
                <div key={i} className={`flex items-start gap-4 px-4 py-3.5 rounded-2xl border ${rec.urgency === "critical" ? "bg-danger-bg border-danger/30" : "bg-risk-high-bg border-risk-high/20"}`}>
                  <Truck className={`w-4 h-4 shrink-0 mt-0.5 ${rec.urgency === "critical" ? "text-danger" : "text-risk-high"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{rec.region} — {rec.action}</p>
                    {rec.criticalDrugs > 0 && (
                      <p className="text-xs text-danger font-semibold mt-0.5">{rec.criticalDrugs} {text("critical drug(s) below minimum threshold in this region", "critical drug(s) below minimum threshold in this region")}</p>
                    )}
                    <Badge variant={rec.urgency === "critical" ? "destructive" : "warning"} className="text-[9px] mt-1">{rec.urgency.toUpperCase()}</Badge>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2 text-sm text-success bg-success-bg px-4 py-3 rounded-2xl border border-success/30">
                  <CheckCircle2 className="w-4 h-4" /> {text("All regions within acceptable supply thresholds — no redistribution needed.", "All regions within acceptable supply thresholds — no redistribution needed.")}
                </div>
              )}
              {/* Static historical recs if API has none yet */}
              {!loadingRegional && regionalRecs.length === 0 && (
                <div className="text-[11px] text-muted-foreground mt-1">{text("Last computed:", "Last computed:")} {new Date().toLocaleString()}</div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── PURCHASE ORDERS ─── */}
      {activeTab === "reorder" && (
        <div className="space-y-5">
          {/* New Purchase Order Form & PO List */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{text("Purchase Orders", "أوامر الشراء")}</h3>
              <button onClick={() => setShowCreateForm(true)} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
                {text("New Purchase Order", "أمر شراء جديد")}
              </button>
            </div>
            {showCreateForm && (
              <Card className="border-primary/30 bg-primary/5" dir={dir}>
                <CardBody className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder={text("Item name", "اسم المادة")} value={newPO.item}
                      onChange={e => setNewPO(p => ({...p, item: e.target.value}))}
                      className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm" />
                    <input type="number" placeholder={text("Quantity", "الكمية")} value={newPO.quantity}
                      onChange={e => setNewPO(p => ({...p, quantity: parseInt(e.target.value) || 1}))}
                      className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm" dir="ltr" />
                    <input placeholder={text("Supplier", "المورد")} value={newPO.supplier}
                      onChange={e => setNewPO(p => ({...p, supplier: e.target.value}))}
                      className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm" />
                    <select value={newPO.urgency} onChange={e => setNewPO(p => ({...p, urgency: e.target.value as "routine" | "urgent" | "critical"}))}
                      className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm">
                      <option value="routine">{text("Routine", "اعتيادي")}</option>
                      <option value="urgent">{text("Urgent", "عاجل")}</option>
                      <option value="critical">{text("Critical", "حرج")}</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createMutation.mutate({ drugName: newPO.item, quantity: newPO.quantity, supplier: newPO.supplier })}
                      className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90" disabled={createMutation.isPending}>
                      {text("Submit Order", "إرسال الطلب")}
                    </button>
                    <button onClick={() => setShowCreateForm(false)}
                      className="rounded-md border border-border text-foreground px-4 py-2 text-sm hover:bg-muted">
                      {text("Cancel", "إلغاء")}
                    </button>
                  </div>
                </CardBody>
              </Card>
            )}
            
            <div className="grid gap-3">
              {poData?.orders?.map((order: any) => (
                <div key={order.id} className="p-4 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{order.drugName}</span>
                      <span className="text-xs text-muted-foreground">x{order.quantity}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{order.supplier} • {order.id}</p>
                  </div>
                  {order.status === "submitted" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => approveMutation.mutate(order.id)} disabled={approveMutation.isPending}
                        className="text-xs rounded bg-primary/10 text-primary px-3 py-1.5 hover:bg-primary/20">
                        {text("Approve", "اعتماد")}
                      </button>
                      <button onClick={() => rejectMutation.mutate(order.id)} disabled={rejectMutation.isPending}
                        className="text-xs rounded bg-destructive/10 text-destructive px-3 py-1.5 hover:bg-destructive/20">
                        {text("Reject", "رفض")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Critical alerts */}
          {data?.criticalAlerts?.length > 0 && (
            <Card>
              <CardHeader><AlertTriangle className="w-4 h-4 text-danger" /><CardTitle>{text("Emergency Purchase Orders Required", "Emergency Purchase Orders Required")}</CardTitle><Badge variant="destructive">{data.criticalAlerts.length} {text("critical", "critical")}</Badge></CardHeader>
              <div className="divide-y divide-border">
                {data.criticalAlerts.map((alert: any, i: number) => {
                  const result = reorderResults[alert.drug];
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 bg-danger-bg/30">
                      <div className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{alert.drug}</p>
                        <p className="text-xs text-muted-foreground">
                          {text("Current:", "Current:")} {alert.currentStock.toLocaleString()} {text("· Required:", "· Required:")} {alert.minRequired.toLocaleString()} {text("· Deficit:", "· Deficit:")} <span className="font-bold text-danger">{alert.deficit.toLocaleString()}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{text("Supplier:", "Supplier:")} {alert.supplier} {text("· Lead time:", "· Lead time:")} {alert.leadTimeDays} {text("days", "days")}</p>
                      </div>
                      {result ? (
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-success flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {text("Order Placed", "Order Placed")}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{result.orderId}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const drug = data.inventory?.find((d: any) => d.drugName === alert.drug);
                            reorderMutation.mutate({ drugName: alert.drug, quantity: (drug?.avgMonthlyDemand ?? alert.minRequired) * 3, supplier: alert.supplier, requestedBy: "Ibrahim Al-Dosari" });
                          }}
                          disabled={reorderMutation.isPending}
                          className="flex items-center gap-1.5 text-xs font-bold bg-danger hover:bg-danger text-white px-3 py-1.5 rounded-xl transition-colors shrink-0"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {text("Issue Order", "Issue Order")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* All reorder alerts */}
          <Card>
            <CardHeader><ShoppingCart className="w-4 h-4 text-primary" /><CardTitle>{text("All Reorder Recommendations", "All Reorder Recommendations")}</CardTitle><Badge variant="warning">{data?.summary?.reorderAlerts} {text("items", "items")}</Badge></CardHeader>
            <div className="divide-y divide-border">
              {data?.inventory?.filter((i: any) => i.reorderNeeded).map((item: any, idx: number) => {
                const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.low;
                const result = reorderResults[item.drugName];
                return (
                  <div key={idx} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.drugName}</p>
                      <p className="text-xs text-muted-foreground">{item.category} · {item.daysOfStock} {text("days stock · SAR", "days stock · SAR")} {(item.avgMonthlyDemand * item.price * 3).toFixed(0)} {text("estimated order value", "estimated order value")}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">{item.stock.toLocaleString()} / {item.minStock.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{text("Current / Min", "Current / Min")}</p>
                      </div>
                      <Badge variant={cfg.badge} className="text-[9px]">{item.status}</Badge>
                      {result ? (
                        <span className="text-[10px] font-bold text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{result.orderId}</span>
                      ) : (
                        <button
                          onClick={() => reorderMutation.mutate({ drugName: item.drugName, quantity: item.avgMonthlyDemand * 3, supplier: item.supplier, requestedBy: "Ibrahim Al-Dosari" })}
                          disabled={reorderMutation.isPending}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${item.status === "critical" ? "bg-danger hover:bg-danger text-white" : "bg-risk-high-bg hover:bg-risk-high/30 text-risk-high"}`}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {text("Order", "Order")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

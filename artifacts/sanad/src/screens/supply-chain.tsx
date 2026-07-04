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
import { useRegionStore } from "@/hooks/useRegionStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend, ReferenceLine
} from "recharts";

async function fetchInventory() {
  const res = await apiFetch("/api/supply-chain/inventory");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
type BadgeVariant = "success" | "warning" | "info" | "destructive" | "outline" | "default";
type LowStockAlert = { id: string | number; message: string };
type ReorderResult = { id?: string; orderId?: string };
type InventoryItem = {
  drugName: string; category: string; stock: number; minStock: number; unit: string;
  supplier: string; leadTimeDays: number; avgMonthlyDemand: number; price: number;
  daysOfStock: number; status: string; reorderNeeded: boolean;
  projectedStockoutDays: number | null; monthlyValue: number;
};
type CriticalAlert = { drug: string; currentStock: number; minRequired: number; deficit: number; supplier: string; leadTimeDays: number; urgentOrder: boolean };
type AiPrediction = { prediction: string; confidence: number; action: string };
type DistributionCenter = { name: string; stock: string; capacity: string; nextDelivery: string };
type SupplyChainSummary = { totalDrugs: number; criticalShortages: number; lowStock: number; adequate: number; totalInventoryValue: number; reorderAlerts: number };
type SupplyChainData = { inventory: InventoryItem[]; shortagePredictions: ShortagePrediction[]; summary: SupplyChainSummary; criticalAlerts: CriticalAlert[]; aiPredictions: AiPrediction[]; distributionCenters: DistributionCenter[] };
type RegionalDistributionItem = { region: string; population: number; stock: number; demand: number; gap: number; gapPct: number; color: string; criticalDrugs: number };
type RegionalRec = { region: string; action: string; urgency: string; criticalDrugs: number };
type PurchaseOrder = { id: string; drugName: string; quantity: number; supplier: string; status: string; requestedBy?: string; estimatedDelivery?: string; totalValue?: number };
type ReorderBody = { drugName: string; quantity: number; supplier: string; requestedBy?: string };
type CreateOrderBody = { drugName: string; quantity: number; supplier: string };

async function submitReorder(body: ReorderBody) {
  const res = await apiFetch("/api/supply-chain/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const STATUS_CFG: Record<string, { bg: string; border: string; text: string; badge: BadgeVariant; dot: string }> = {
  critical: { bg: "bg-danger-bg", border: "border-danger/30", text: "text-danger", badge: "destructive" as const, dot: "bg-danger animate-pulse" },
  low: { bg: "bg-risk-high-bg", border: "border-risk-high/20", text: "text-risk-high", badge: "warning" as const, dot: "bg-risk-high" },
  adequate: { bg: "bg-success-bg", border: "border-success/30", text: "text-success", badge: "success" as const, dot: "bg-success" },
  High: { bg: "bg-success-bg", border: "border-success/30", text: "text-success", badge: "success" as const, dot: "bg-success" },
  Medium: { bg: "bg-risk-high-bg", border: "border-risk-high/20", text: "text-risk-high", badge: "warning" as const, dot: "bg-risk-high" },
  Low: { bg: "bg-danger-bg", border: "border-danger/30", text: "text-danger", badge: "destructive" as const, dot: "bg-danger" },
};

const STATUS_LABEL_AR: Record<string, string> = {
  critical: "حرج", low: "منخفض", adequate: "كافٍ",
  High: "مرتفع", Medium: "متوسط", Low: "منخفض",
};
const STATUS_LABEL_EN: Record<string, string> = {
  critical: "Critical", low: "Low", adequate: "Adequate",
  High: "High", Medium: "Medium", Low: "Low",
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
  const { config } = useRegionStore();
  const [activeTab, setActiveTab] = useState<ViewTab>("inventory");
  const [reorderResults, setReorderResults] = useState<Record<string, ReorderResult>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPO, setNewPO] = useState({ item: "", quantity: 1, supplier: "", urgency: "routine" as "routine" | "urgent" | "critical" });
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);

  React.useEffect(() => {
    apiFetch("/api/alerts/system?limit=10")
      .then(r => r.json())
      .then(data => setLowStockAlerts((data.alerts ?? []).filter((a: { alertType?: string }) => a.alertType === "LOW_STOCK")));
  }, []);

  const qc = useQueryClient();
  const { data, isLoading } = useQuery<SupplyChainData>({ queryKey: ["supply-inventory"], queryFn: fetchInventory, refetchInterval: 60000 });
  const { data: regionalData, isLoading: loadingRegional } = useQuery({
    queryKey: ["supply-regional"],
    queryFn: fetchRegionalDistribution,
    refetchInterval: 120000,
  });
  const regionalDistribution = regionalData?.distribution ?? [];
  const regionalSummary = regionalData?.summary ?? null;
  const regionalRecs = regionalData?.recommendations ?? [];

  const reorderMutation = useMutation({
    mutationFn: (body: ReorderBody) => submitReorder(body),
    onSuccess: (result, body) => {
      setReorderResults(prev => ({ ...prev, [body.drugName]: result }));
      qc.invalidateQueries({ queryKey: ["supply-inventory"] });
    },
  });

  const { data: poData } = useQuery({ queryKey: ["supply-pos"], queryFn: async () => (await apiFetch("/api/supply-chain/purchase-orders")).json(), staleTime: 30000 });
  
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/supply-chain/orders/${id}/approve`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supply-pos"] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/supply-chain/orders/${id}/reject`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supply-pos"] }),
  });
  const createMutation = useMutation({
    mutationFn: (body: CreateOrderBody) => apiFetch("/api/supply-chain/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
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
            {data?.criticalAlerts?.map((a: CriticalAlert) => a.drug).join(" · ")}
          </p>
          <button onClick={() => setActiveTab("reorder")} className="ms-auto text-[11px] font-bold bg-card/20 hover:bg-card/30 px-3 py-1 rounded-full transition-colors">
            {text("Issue Purchase Orders →", "إصدار أوامر شراء ←")}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-success text-success-foreground text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest">
          <Package className="w-3 h-3" />
          {text("Supply Chain", "سلسلة الإمداد")}
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${criticals > 0 ? "text-danger bg-danger-bg" : "text-success bg-success-bg"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${criticals > 0 ? "bg-danger animate-pulse" : "bg-success"}`} />
          {criticals > 0 ? text(`${criticals} Critical Shortages`, `${criticals} نقص حرج`) : text("No Critical Shortages", "لا يوجد نقص حرج")}
        </div>
        <div className="ms-auto font-mono text-[11px] text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-full">
          {text("Inventory Value:", "قيمة المخزون:")} {text(config.currencyEn, config.currency)} {data?.summary?.totalInventoryValue?.toLocaleString()}
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

      <div className="mb-8 relative rounded-3xl overflow-hidden glass-panel border border-primary/20 shadow-xl bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="absolute top-0 ltr:right-0 rtl:left-0 w-[500px] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {text("National Drug Supply Chain", "سلسلة إمداد الأدوية الوطنية")}
              </h1>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl text-[13px] sm:text-sm leading-relaxed">
              {text("Real-time inventory · AI shortage prediction · Regional distribution optimization · Procurement management", "مخزون فوري · تنبؤ النقص بالذكاء · تحسين التوزيع الإقليمي · إدارة المشتريات")}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title={text("Total Drug Lines", "إجمالي أصناف الأدوية")} value={data?.summary?.totalDrugs ?? 0} sub={text("Tracked nationally", "متابَعة وطنيًا")} icon={Package} iconBg="bg-success-bg" iconColor="text-success" />
        <KpiCard
          title={text("Critical Shortages", "النقص الحرج")} value={data?.summary?.criticalShortages ?? 0}
          sub={text(`${data?.summary?.reorderAlerts} reorder alerts active`, `${data?.summary?.reorderAlerts} تنبيه إعادة طلب`)}
          icon={AlertTriangle} iconBg={criticals > 0 ? "bg-danger-bg" : "bg-success-bg"} iconColor={criticals > 0 ? "text-danger" : "text-success"}
        />
        <KpiCard title={text("Adequate Stock", "مخزون كافٍ")} value={data?.summary?.adequate ?? 0} sub={text("Lines fully stocked", "أصناف مكتملة المخزون")} icon={CheckCircle2} iconBg="bg-success-bg" iconColor="text-success" />
        <KpiCard title={text("Inventory Value", "قيمة المخزون")} value={`${text(config.currencyEn, config.currency)} ${data?.summary?.totalInventoryValue?.toLocaleString()}`} sub={text("Current stock value", "قيمة المخزون الحالية")} icon={BarChart2} iconBg="bg-primary/10" iconColor="text-primary" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="col-span-full lg:col-span-8">
              <CardHeader><Package className="w-4 h-4 text-success" /><CardTitle>{text("Drug Inventory — All Lines", "مخزون الأدوية — جميع البنود")}</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      {([
                        { en: "Drug", ar: "الدواء" },
                        { en: "Category", ar: "الفئة" },
                        { en: "Stock", ar: "المخزون" },
                        { en: "Min Required", ar: "الحد الأدنى" },
                        { en: "Days Remaining", ar: "أيام متبقية" },
                        { en: "Status", ar: "الحالة" },
                      ]).map(h => (
                        <th key={h.en} className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{locale === "ar" ? h.ar : h.en}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.inventory?.map((item: InventoryItem, i: number) => {
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
                              <span className={`text-xs font-bold ${item.daysOfStock < 14 ? "text-danger" : item.daysOfStock < 30 ? "text-risk-high" : "text-foreground"}`}>{item.daysOfStock}{text("d", "ي")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={cfg.badge} className="text-[9px]">{text(STATUS_LABEL_EN[item.status] ?? item.status, STATUS_LABEL_AR[item.status] ?? item.status)}</Badge>
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
                <CardHeader><MapPin className="w-4 h-4 text-primary" /><CardTitle>{text("Distribution Centers", "مراكز التوزيع")}</CardTitle></CardHeader>
                <CardBody className="space-y-2.5">
                  {data?.distributionCenters?.map((dc: DistributionCenter, i: number) => {
                    const cfg = STATUS_CFG[dc.stock] ?? STATUS_CFG.adequate;
                    return (
                      <div key={i} className={`px-3.5 py-3 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold text-foreground">{dc.name}</p>
                          <Badge variant={cfg.badge} className="text-[9px]">{text(STATUS_LABEL_EN[dc.stock] ?? dc.stock, STATUS_LABEL_AR[dc.stock] ?? dc.stock)}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{text("Capacity:", "الطاقة:")} <span className="font-bold text-foreground">{dc.capacity}</span></span>
                          <span>·</span>
                          <span>{text("Next delivery:", "التسليم القادم:")} <span className="font-bold text-foreground">{dc.nextDelivery}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>

              {/* Consumption Trend */}
              <Card>
                <CardHeader><TrendingUp className="w-4 h-4 text-success" /><CardTitle>{text("6-Month Consumption", "الاستهلاك لـ 6 أشهر")}</CardTitle></CardHeader>
                <CardBody>
                  <div className="h-48">
                    <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                      <LineChart data={CONSUMPTION_TREND} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                        <Line type="monotone" dataKey="metformin" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Metformin" />
                        <Line type="monotone" dataKey="insulin" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Insulin" />
                        <Line type="monotone" dataKey="lisinopril" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Lisinopril" />
                        <Line type="monotone" dataKey="atorvastatin" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Atorvastatin" />
                      </LineChart>
                    </ResponsiveContainer></div>
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
          <div className="flex items-start gap-4 px-5 py-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">{text("AI Supply Forecasting Engine v2.1", "محرك التنبؤ بالإمدادات v2.1")}</p>
              <p className="text-xs text-primary/80 mt-0.5">
                {text("Machine learning demand prediction using 24-month historical consumption, prescription trends, disease prevalence, and seasonal patterns. Predictions recalculated daily at 02:00 AST.", "تنبؤ الطلب بالتعلم الآلي باستخدام 24 شهراً من بيانات الاستهلاك والوصفات الطبية وانتشار الأمراض والأنماط الموسمية. يُعاد الحساب يومياً الساعة 02:00.")}
              </p>
            </div>
            <Badge variant="info">{text("Updated Today", "محدَّث اليوم")}</Badge>
          </div>

          {/* AI Predictions from backend */}
          <Card>
            <CardHeader><Brain className="w-4 h-4 text-primary" /><CardTitle>{text("AI Demand Predictions", "تنبؤات الطلب بالذكاء الاصطناعي")}</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {data?.aiPredictions?.map((pred: AiPrediction, i: number) => (
                <div key={i} className="flex items-start gap-4 px-4 py-3.5 bg-primary/10 border border-primary/20 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{pred.prediction}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                      {pred.action}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{pred.confidence}%</p>
                    <p className="text-[10px] text-muted-foreground">{text("confidence", "ثقة")}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* 30/60/90 Day Forecast */}
          <Card>
            <CardHeader><Calendar className="w-4 h-4 text-primary" /><CardTitle>{text("30/60/90-Day Stock Forecast", "توقعات المخزون 30/60/90 يوم")}</CardTitle><span className="ml-auto text-[11px] text-muted-foreground">{text("Units remaining", "Units remaining")}</span></CardHeader>
            <CardBody>
              <div className="min-h-[350px] h-full w-full py-4">
                <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.shortagePredictions ?? []) as ShortagePrediction[]} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis dataKey="drug" type="category" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }} width={135} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="current" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} barSize={10} name="Now" />
                    <Bar dataKey="day30" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={10} name="30 Days" />
                    <Bar dataKey="day60" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} barSize={10} name="60 Days" />
                    <Bar dataKey="day90" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={10} name="90 Days" />
                  </BarChart>
                </ResponsiveContainer></div>
              </div>
            </CardBody>
          </Card>

          {/* Critical shortages countdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.inventory?.filter((i: InventoryItem) => i.status !== "adequate").map((item: InventoryItem, idx: number) => {
              const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.adequate;
              return (
                <div key={idx} className={`px-4 py-3.5 ${cfg.bg} border ${cfg.border} rounded-2xl`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                        <p className="text-xs font-bold text-foreground">{item.drugName}</p>
                        <Badge variant={cfg.badge} className="text-[9px]">{text(STATUS_LABEL_EN[item.status] ?? item.status, STATUS_LABEL_AR[item.status] ?? item.status)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{text("Stock:", "المخزون:")} {item.stock.toLocaleString()} {item.unit} {text("· Min:", "· الحد الأدنى:")} {item.minStock.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{text("Supplier:", "المورد:")} {item.supplier} {text("· Lead time:", "· وقت التوريد:")} {item.leadTimeDays}{text("d", "ي")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${item.daysOfStock < 14 ? "text-danger" : "text-risk-high"}`}>{item.daysOfStock}<span className="text-xs font-normal opacity-60"> {text("d", "ي")}</span></p>
                      <p className="text-[10px] text-muted-foreground">{text("stock left", "متبقية")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => reorderMutation.mutate({ drugName: item.drugName, quantity: item.avgMonthlyDemand * 3, supplier: item.supplier, requestedBy: "Ibrahim Al-Dosari" })}
                    disabled={reorderMutation.isPending || !!reorderResults[item.drugName]}
                    className={`mt-3 w-full text-xs font-semibold py-1.5 rounded-xl transition-colors ${reorderResults[item.drugName] ? "bg-success-bg text-success border border-success/30" : "bg-danger hover:bg-danger text-white"}`}
                  >
                    {reorderResults[item.drugName] ? text(`✓ Order Placed: ${reorderResults[item.drugName]?.orderId}`, `✓ تم الطلب: ${reorderResults[item.drugName]?.orderId}`) : text("Issue Emergency Order", "إصدار أمر شراء عاجل")}
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
              <p className="text-xs font-bold text-foreground">{text("National Drug Distribution Optimization", "تحسين التوزيع الوطني للأدوية")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{text("AI redistribution model identifies supply-demand gaps per region — redistribution recommendations updated every 6 hours", "نموذج الذكاء يحدد فجوات العرض والطلب إقليمياً — التوصيات تُحدَّث كل 6 ساعات")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="col-span-full lg:col-span-7">
              <CardHeader><Globe className="w-4 h-4 text-primary" /><CardTitle>{text("Regional Stock vs. Demand", "المخزون الإقليمي مقابل الطلب")}</CardTitle>
                {regionalSummary && (
                  <Badge variant={regionalSummary.shortageRegions > 3 ? "destructive" : "warning"} className="ml-auto text-[10px]">
                    {regionalSummary.shortageRegions} {text("shortage regions", "منطقة نقص")}
                  </Badge>
                )}
              </CardHeader>
              <CardBody>
                <div className="min-h-[350px] h-full w-full py-4">
                  {loadingRegional ? (
                     <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" /> {text("Loading regional data...", "جارٍ تحميل البيانات الإقليمية...")}
                    </div>
                  ) : (
                    <div dir="ltr" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionalDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }}
                          formatter={(value: number | string, name: string) => [typeof value === "number" ? value.toLocaleString() : value, name]} />
                        <Legend />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                        <Bar dataKey="stock" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={22} name="Stock (units)" />
                        <Bar dataKey="demand" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={22} name="Demand (units)" />
                      </BarChart>
                    </ResponsiveContainer></div>
                  )}
                </div>
                {regionalSummary && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="text-xs"><span className="font-bold text-foreground">{regionalSummary.totalStock.toLocaleString()}</span><span className="text-muted-foreground ml-1">{text("total stock units", "وحدة مخزون إجمالية")}</span></div>
                    <div className="text-xs"><span className="font-bold text-foreground">{regionalSummary.totalDemand.toLocaleString()}</span><span className="text-muted-foreground ml-1">{text("monthly demand", "الطلب الشهري")}</span></div>
                    <Badge variant={regionalSummary.nationalGapPct > 0 ? "destructive" : "success"} className="ml-auto text-[10px]">
                      {text("National gap:", "الفجوة الوطنية:")} {regionalSummary.nationalGapPct > 0 ? "+" : ""}{regionalSummary.nationalGapPct}%
                    </Badge>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-full lg:col-span-5">
              <CardHeader><MapPin className="w-4 h-4 text-primary" /><CardTitle>{text("Gap Analysis by Region", "تحليل الفجوات حسب المنطقة")}</CardTitle></CardHeader>
              <CardBody className="space-y-2.5">
                {loadingRegional ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" /> {text("Loading...", "جارٍ التحميل...")}
                  </div>
                ) : (regionalDistribution as RegionalDistributionItem[]).map((r: RegionalDistributionItem, i: number) => (
                  <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${r.gap < 0 ? "bg-danger-bg border-danger/30" : "bg-success-bg border-success/30"}`}>
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${r.gap < 0 ? "text-danger" : "text-success"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{r.region}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {text("Stock", "المخزون")} {r.stock.toLocaleString()} {text("· Demand", "· Demand")} {r.demand.toLocaleString()}
                        {r.criticalDrugs > 0 && <span className="text-danger font-bold"> · {r.criticalDrugs} {text("critical drugs", "دواء حرج")}</span>}
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
            <CardHeader><Brain className="w-4 h-4 text-primary" /><CardTitle>{text("AI Redistribution Recommendations", "توصيات إعادة التوزيع")}</CardTitle><Badge variant="info">{text("Live · computed from inventory", "Live · computed from inventory")}</Badge></CardHeader>
            <CardBody className="space-y-3">
              {loadingRegional ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> {text("Computing recommendations...", "جارٍ حساب التوصيات...")}
                </div>
              ) : regionalRecs.length > 0 ? (regionalRecs as RegionalRec[]).map((rec: RegionalRec, i: number) => (
                <div key={i} className={`flex items-start gap-4 px-4 py-3.5 rounded-2xl border ${rec.urgency === "critical" ? "bg-danger-bg border-danger/30" : "bg-risk-high-bg border-risk-high/20"}`}>
                  <Truck className={`w-4 h-4 shrink-0 mt-0.5 ${rec.urgency === "critical" ? "text-danger" : "text-risk-high"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{rec.region} — {rec.action}</p>
                    {rec.criticalDrugs > 0 && (
                      <p className="text-xs text-danger font-semibold mt-0.5">{rec.criticalDrugs} {text("critical drug(s) below minimum threshold in this region", "دواء حرج تحت الحد الأدنى في هذه المنطقة")}</p>
                    )}
                    <Badge variant={rec.urgency === "critical" ? "destructive" : "warning"} className="text-[9px] mt-1">{rec.urgency.toUpperCase()}</Badge>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2 text-sm text-success bg-success-bg px-4 py-3 rounded-2xl border border-success/30">
                  <CheckCircle2 className="w-4 h-4" /> {text("All regions within acceptable supply thresholds — no redistribution needed.", "جميع المناطق ضمن حدود الإمداد المقبولة — لا حاجة لإعادة التوزيع.")}
                </div>
              )}
              {/* Static historical recs if API has none yet */}
              {!loadingRegional && regionalRecs.length === 0 && (
                <div className="text-[11px] text-muted-foreground mt-1">{text("Last computed:", "آخر حساب:")} {new Date().toLocaleString()}</div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              {poData?.orders?.map((order: PurchaseOrder) => (
                <div key={order.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{order.drugName}</span>
                      <span className="text-xs text-muted-foreground">x{order.quantity}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{order.supplier} • {order.id}</p>
                  </div>
                  {order.status === "submitted" && (
                    <div className="flex gap-2">
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
          {(data?.criticalAlerts?.length ?? 0) > 0 && (
            <Card>
              <CardHeader><AlertTriangle className="w-4 h-4 text-danger" /><CardTitle>{text("Emergency Purchase Orders Required", "أوامر شراء طارئة مطلوبة")}</CardTitle><Badge variant="destructive">{data?.criticalAlerts?.length} {text("critical", "critical")}</Badge></CardHeader>
              <div className="divide-y divide-border">
                {data?.criticalAlerts?.map((alert: CriticalAlert, i: number) => {
                  const result = reorderResults[alert.drug];
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 bg-danger-bg/30">
                      <div className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{alert.drug}</p>
                        <p className="text-xs text-muted-foreground">
                          {text("Current:", "الحالي:")} {alert.currentStock.toLocaleString()} {text("· Required:", "· Required:")} {alert.minRequired.toLocaleString()} {text("· Deficit:", "· Deficit:")} <span className="font-bold text-danger">{alert.deficit.toLocaleString()}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{text("Supplier:", "المورّد:")} {alert.supplier} {text("· Lead time:", "· Lead time:")} {alert.leadTimeDays} {text("days", "days")}</p>
                      </div>
                      {result ? (
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-success flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {text("Order Placed", "تم إرسال الطلب")}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{result.orderId}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const drug = data?.inventory?.find((d: InventoryItem) => d.drugName === alert.drug);
                            reorderMutation.mutate({ drugName: alert.drug, quantity: (drug?.avgMonthlyDemand ?? alert.minRequired) * 3, supplier: alert.supplier, requestedBy: "Ibrahim Al-Dosari" });
                          }}
                          disabled={reorderMutation.isPending}
                          className="flex items-center gap-1.5 text-xs font-bold bg-danger hover:bg-danger text-white px-3 py-1.5 rounded-xl transition-colors shrink-0"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {text("Issue Order", "إصدار طلب")}
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
            <CardHeader><ShoppingCart className="w-4 h-4 text-primary" /><CardTitle>{text("All Reorder Recommendations", "جميع توصيات إعادة الطلب")}</CardTitle><Badge variant="warning">{data?.summary?.reorderAlerts} {text("items", "items")}</Badge></CardHeader>
            <div className="divide-y divide-border">
              {data?.inventory?.filter((i: InventoryItem) => i.reorderNeeded).map((item: InventoryItem, idx: number) => {
                const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.low;
                const result = reorderResults[item.drugName];
                return (
                  <div key={idx} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.drugName}</p>
                      <p className="text-xs text-muted-foreground">{item.category} · {item.daysOfStock} {text("days stock · SAR", "يوم مخزون · ر.س")} {(item.avgMonthlyDemand * item.price * 3).toFixed(0)} {text("estimated order value", "estimated order value")}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">{item.stock.toLocaleString()} / {item.minStock.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{text("Current / Min", "الحالي / الأدنى")}</p>
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
                          {text("Order", "طلب")}
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

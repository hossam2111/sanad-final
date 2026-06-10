"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert, HeartPulse, User, Building2,
  LayoutDashboard, LogOut, Bell, Settings, LifeBuoy,
  Activity, FlaskConical, Pill, BedDouble,
  Shield, Brain, Users, Package, AlertTriangle, CheckCircle2, X
} from "lucide-react";
import { cn } from "./shared";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { LanguageThemeToggle } from "@/components/language-theme-toggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Role = "emergency" | "doctor" | "citizen" | "admin" | "lab" | "pharmacy" | "hospital" | "insurance" | "ai-control" | "research" | "family" | "supply-chain";

const roleConfigs: Record<Role, {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
  nav: { href: string; icon: React.ElementType; label: string }[];
  user: string;
  userRole: string;
  userInitial: string;
}> = {
  emergency: {
    label: "Sanad",
    sublabel: "Emergency Response",
    icon: ShieldAlert,
    accentBg: "bg-red-500",
    accentText: "text-white",
    user: "Unit 7 — Riyadh Central",
    userRole: "First Responder",
    userInitial: "U",
    nav: [
      { href: "/emergency", icon: ShieldAlert, label: "Emergency Lookup" },
    ],
  },
  doctor: {
    label: "Sanad",
    sublabel: "Health Intelligence",
    icon: HeartPulse,
    accentBg: "bg-primary",
    accentText: "text-white",
    user: "Dr. Ahmed Al-Rashidi",
    userRole: "Physician · King Fahd MC",
    userInitial: "A",
    nav: [
      { href: "/doctor", icon: LayoutDashboard, label: "Patient Dashboard" },
    ],
  },
  citizen: {
    label: "Sanad",
    sublabel: "Citizen Portal",
    icon: User,
    accentBg: "bg-amber-500",
    accentText: "text-white",
    user: "Citizen Portal",
    userRole: "National Health Record",
    userInitial: "C",
    nav: [
      { href: "/citizen", icon: User, label: "My Health Records" },
    ],
  },
  admin: {
    label: "Sanad",
    sublabel: "Ministry Dashboard",
    icon: Building2,
    accentBg: "bg-primary",
    accentText: "text-white",
    user: "Ministry Admin",
    userRole: "Population Health Intelligence",
    userInitial: "M",
    nav: [
      { href: "/admin", icon: LayoutDashboard, label: "Analytics Dashboard" },
    ],
  },
  lab: {
    label: "Sanad",
    sublabel: "Lab Portal",
    icon: FlaskConical,
    accentBg: "bg-teal-500",
    accentText: "text-white",
    user: "Lab Tech. Sara Al-Otaibi",
    userRole: "Senior Lab Technician",
    userInitial: "S",
    nav: [
      { href: "/lab", icon: FlaskConical, label: "Lab Results" },
    ],
  },
  pharmacy: {
    label: "Sanad",
    sublabel: "Pharmacy Portal",
    icon: Pill,
    accentBg: "bg-purple-500",
    accentText: "text-white",
    user: "Hassan Al-Ghamdi",
    userRole: "Clinical Pharmacist",
    userInitial: "H",
    nav: [
      { href: "/pharmacy", icon: Pill, label: "Dispense & Check" },
    ],
  },
  hospital: {
    label: "Sanad",
    sublabel: "Hospital Operations",
    icon: BedDouble,
    accentBg: "bg-blue-600",
    accentText: "text-white",
    user: "Operations Manager",
    userRole: "King Fahd Medical City",
    userInitial: "O",
    nav: [
      { href: "/hospital", icon: BedDouble, label: "Hospital Overview" },
    ],
  },
  insurance: {
    label: "Sanad",
    sublabel: "Insurance Operations",
    icon: Shield,
    accentBg: "bg-violet-600",
    accentText: "text-white",
    user: "Nora Al-Qahtani",
    userRole: "Insurance Operations Lead",
    userInitial: "N",
    nav: [
      { href: "/insurance", icon: Shield, label: "Claims & Fraud Detection" },
    ],
  },
  "ai-control": {
    label: "Sanad",
    sublabel: "AI Control Center",
    icon: Brain,
    accentBg: "bg-violet-700",
    accentText: "text-white",
    user: "Dr. Khalid Al-Mansouri",
    userRole: "AI Systems Lead",
    userInitial: "K",
    nav: [
      { href: "/ai-control", icon: Brain, label: "Engine Monitor" },
    ],
  },
  research: {
    label: "Sanad",
    sublabel: "Clinical Research",
    icon: FlaskConical,
    accentBg: "bg-teal-700",
    accentText: "text-white",
    user: "Dr. Reem Al-Zahrani",
    userRole: "Health Data Scientist",
    userInitial: "R",
    nav: [
      { href: "/research", icon: FlaskConical, label: "Research Insights" },
    ],
  },
  family: {
    label: "Sanad",
    sublabel: "Family Health Portal",
    icon: Users,
    accentBg: "bg-pink-700",
    accentText: "text-white",
    user: "Family Health Coordinator",
    userRole: "Preventive Care Unit",
    userInitial: "F",
    nav: [
      { href: "/family", icon: Users, label: "Family Health Map" },
    ],
  },
  "supply-chain": {
    label: "Sanad",
    sublabel: "Supply Chain Intel",
    icon: Package,
    accentBg: "bg-orange-600",
    accentText: "text-white",
    user: "Faisal Al-Harbi",
    userRole: "Drug Supply Chain Manager",
    userInitial: "F",
    nav: [
      { href: "/supply-chain", icon: Package, label: "Inventory & Logistics" },
    ],
  },
};

const roleText: Record<Role, { sublabel: string; nav: string; userRole: string }> = {
  emergency: { sublabel: "الاستجابة للطوارئ", nav: "بحث الطوارئ", userRole: "مستجيب أول" },
  doctor: { sublabel: "الاستخبارات الصحية", nav: "لوحة المريض", userRole: "طبيب - مدينة الملك فهد الطبية" },
  citizen: { sublabel: "بوابة المواطن", nav: "سجلاتي الصحية", userRole: "السجل الصحي الوطني" },
  admin: { sublabel: "لوحة الوزارة", nav: "لوحة التحليلات", userRole: "استخبارات صحة السكان" },
  lab: { sublabel: "بوابة المختبر", nav: "نتائج المختبر", userRole: "فني مختبر أول" },
  pharmacy: { sublabel: "بوابة الصيدلية", nav: "الصرف وفحص السلامة", userRole: "صيدلي سريري" },
  hospital: { sublabel: "عمليات المستشفى", nav: "نظرة عامة على المستشفى", userRole: "مدينة الملك فهد الطبية" },
  insurance: { sublabel: "عمليات التأمين", nav: "المطالبات وكشف الاحتيال", userRole: "قائد عمليات التأمين" },
  "ai-control": { sublabel: "مركز التحكم بالذكاء الاصطناعي", nav: "مراقبة المحركات", userRole: "قائد أنظمة الذكاء الاصطناعي" },
  research: { sublabel: "البحث السريري", nav: "رؤى البحث", userRole: "عالم بيانات صحية" },
  family: { sublabel: "بوابة صحة الأسرة", nav: "خريطة صحة الأسرة", userRole: "وحدة الرعاية الوقائية" },
  "supply-chain": { sublabel: "ذكاء سلسلة الإمداد", nav: "المخزون واللوجستيات", userRole: "مدير سلسلة إمداد الأدوية" },
};

export function Layout({ children, role }: { children: React.ReactNode; role: Role }) {
  const location = usePathname();
  const config = roleConfigs[role];
  const { user: authUser, logout } = useAuth();
  const { locale, text } = useLanguage();
  const router = useRouter();
  const [showAlerts, setShowAlerts] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: alertsData } = useQuery({
    queryKey: ["system-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts/system?limit=10");
      if (!res.ok) return { alerts: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 15000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/alerts/read-all", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-alerts"] }),
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = alertsData?.unreadCount ?? 0;
  const systemAlerts = alertsData?.alerts ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ─── Sidebar ─── */}
      <aside
        className="w-[220px] shrink-0 flex flex-col h-full border-e border-border bg-sidebar text-sidebar-foreground shadow-sm"
      >
        {/* Logo block */}
        <div className="h-[60px] flex items-center gap-3 px-5 border-b border-border">
          <div className={cn(
            "w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0",
            config.accentBg
          )}>
            <img
              src="/images/sanad-logo.png"
              alt="Sanad"
              className="w-4 h-4 object-contain brightness-0 invert"
            />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground leading-none tracking-tight">{config.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{locale === "ar" ? roleText[role].sublabel : config.sublabel}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto sidebar-scroll">
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] px-2.5 mb-2 ml-0.5">
            {text("Menu", "القائمة")}
          </p>
          {config.nav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px] font-medium cursor-pointer transition-all duration-150",
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
                )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{locale === "ar" ? roleText[role].nav : item.label}</span>
                </div>
              </Link>
            );
          })}

          <div className="pt-5 pb-1">
            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] px-2.5 mb-2 ml-0.5">
              {text("System", "النظام")}
            </p>
          </div>
          {[
            { icon: Bell, label: text("Notifications", "الإشعارات") },
            { icon: LifeBuoy, label: text("Support", "الدعم") },
            { icon: Settings, label: text("Settings", "الإعدادات") },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] cursor-pointer transition-all duration-150"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </nav>

        {/* User block */}
        <div className="px-3 pb-4 border-t border-border pt-3">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] mb-1 bg-secondary"
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold",
              config.accentBg, config.accentText
            )}>
              {authUser?.initial ?? config.userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-foreground truncate leading-tight">{authUser?.name ?? config.user}</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">{authUser?.jobTitle ?? (locale === "ar" ? roleText[role].userRole : config.userRole)}</p>
            </div>
          </div>
          <div
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2 rounded-[10px] text-muted-foreground hover:text-red-600 hover:bg-red-50 text-[12px] font-medium cursor-pointer transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>{text("Sign Out", "تسجيل الخروج")}</span>
          </div>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="h-[60px] shrink-0 flex items-center justify-between px-7 border-b border-border bg-card/85 backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? roleText[role].sublabel : config.sublabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageThemeToggle />
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {text("All Systems Operational", "كل الأنظمة تعمل")}
            </div>

            {/* Alerts Bell */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setShowAlerts(v => !v)}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/[0.05] hover:text-foreground transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div
                  ref={dropdownRef}
                  className="absolute end-0 top-10 w-[340px] bg-card rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{text("System Alerts", "تنبيهات النظام")}</p>
                      {unreadCount > 0 && (
                        <p className="text-[11px] text-muted-foreground">{text(`${unreadCount} unread`, `${unreadCount} غير مقروء`)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-[11px] font-medium text-primary hover:text-primary/80"
                        >
                          {text("Mark all read", "تحديد الكل كمقروء")}
                        </button>
                      )}
                      <button onClick={() => setShowAlerts(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {systemAlerts.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                        <p className="text-[13px] font-medium">{text("No alerts", "لا توجد تنبيهات")}</p>
                      </div>
                    ) : (
                      systemAlerts.map((alert: any) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "px-4 py-3 border-b border-black/[0.04] last:border-0 transition-colors",
                            !alert.isRead ? "bg-blue-50/60" : ""
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              alert.severity === "critical" ? "bg-red-100" :
                              alert.severity === "warning" ? "bg-amber-100" : "bg-blue-100"
                            )}>
                              <AlertTriangle className={cn(
                                "w-3 h-3",
                                alert.severity === "critical" ? "text-red-600" :
                                alert.severity === "warning" ? "text-amber-600" : "text-blue-600"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={cn("text-[12px] font-semibold leading-snug", !alert.isRead ? "text-foreground" : "text-muted-foreground")}>
                                  {alert.title}
                                </p>
                                {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                              </div>
                              {alert.patientName && (
                                <p className="text-[10px] text-muted-foreground font-mono mb-0.5">
                                  Patient: {alert.patientName} · {alert.patientNationalId}
                                </p>
                              )}
                              <p className="text-[11px] text-muted-foreground leading-snug">{alert.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ml-1",
              config.accentBg, config.accentText
            )}>
              {authUser?.initial ?? config.userInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-7 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

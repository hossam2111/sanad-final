"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert, HeartPulse, User, Building2,
  LayoutDashboard, LogOut, Bell, Activity, FlaskConical, Pill, BedDouble,
  Shield, Brain, Users, Package, AlertTriangle, CheckCircle2, X, Menu, Languages, Moon, Sun,
} from "lucide-react";
import { cn } from "./shared";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Role = "emergency" | "doctor" | "citizen" | "admin" | "lab" | "pharmacy" | "hospital" | "insurance" | "ai-control" | "research" | "family" | "supply-chain";

type SystemAlert = {
  id: number;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info" | string;
  isRead: boolean;
  patientName?: string | null;
  patientNationalId?: string | null;
};

const roleConfigs: Record<Role, {
  sublabel: string;
  icon: React.ElementType;
  nav: { href: string; icon: React.ElementType; label: string }[];
  user: string;
  userRole: string;
  userInitial: string;
}> = {
  emergency: {
    sublabel: "Emergency Response",
    icon: ShieldAlert,
    user: "Unit 7 — Riyadh Central",
    userRole: "First Responder",
    userInitial: "U",
    nav: [{ href: "/emergency", icon: ShieldAlert, label: "Emergency Lookup" }],
  },
  doctor: {
    sublabel: "Physician Workspace",
    icon: HeartPulse,
    user: "Dr. Ahmed Al-Rashidi",
    userRole: "Physician · King Fahd MC",
    userInitial: "A",
    nav: [{ href: "/doctor", icon: LayoutDashboard, label: "Patient Dashboard" }],
  },
  citizen: {
    sublabel: "Citizen Health",
    icon: User,
    user: "Citizen Portal",
    userRole: "National Health Record",
    userInitial: "C",
    nav: [{ href: "/citizen", icon: User, label: "My Health Records" }],
  },
  admin: {
    sublabel: "Ministry Command",
    icon: Building2,
    user: "Ministry Admin",
    userRole: "Population Health Intelligence",
    userInitial: "M",
    nav: [{ href: "/admin", icon: LayoutDashboard, label: "Analytics Dashboard" }],
  },
  lab: {
    sublabel: "Laboratory",
    icon: FlaskConical,
    user: "Lab Tech. Sara Al-Otaibi",
    userRole: "Senior Lab Technician",
    userInitial: "S",
    nav: [{ href: "/lab", icon: FlaskConical, label: "Lab Results" }],
  },
  pharmacy: {
    sublabel: "Pharmacy",
    icon: Pill,
    user: "Hassan Al-Ghamdi",
    userRole: "Clinical Pharmacist",
    userInitial: "H",
    nav: [{ href: "/pharmacy", icon: Pill, label: "Dispense & Check" }],
  },
  hospital: {
    sublabel: "Hospital Operations",
    icon: BedDouble,
    user: "Operations Manager",
    userRole: "King Fahd Medical City",
    userInitial: "O",
    nav: [{ href: "/hospital", icon: BedDouble, label: "Hospital Overview" }],
  },
  insurance: {
    sublabel: "Insurance",
    icon: Shield,
    user: "Nora Al-Qahtani",
    userRole: "Insurance Operations Lead",
    userInitial: "N",
    nav: [{ href: "/insurance", icon: Shield, label: "Claims & Fraud Detection" }],
  },
  "ai-control": {
    sublabel: "AI Control Center",
    icon: Brain,
    user: "Dr. Khalid Al-Mansouri",
    userRole: "AI Systems Lead",
    userInitial: "K",
    nav: [{ href: "/ai-control", icon: Brain, label: "Engine Monitor" }],
  },
  research: {
    sublabel: "Research",
    icon: FlaskConical,
    user: "Dr. Reem Al-Zahrani",
    userRole: "Health Data Scientist",
    userInitial: "R",
    nav: [{ href: "/research", icon: FlaskConical, label: "Research Insights" }],
  },
  family: {
    sublabel: "Family Health",
    icon: Users,
    user: "Family Health Coordinator",
    userRole: "Preventive Care Unit",
    userInitial: "F",
    nav: [{ href: "/family", icon: Users, label: "Family Health Map" }],
  },
  "supply-chain": {
    sublabel: "Supply Chain",
    icon: Package,
    user: "Faisal Al-Harbi",
    userRole: "Drug Supply Chain Manager",
    userInitial: "F",
    nav: [{ href: "/supply-chain", icon: Package, label: "Inventory & Logistics" }],
  },
};

const roleText: Record<Role, { sublabel: string; nav: string; userRole: string }> = {
  emergency: { sublabel: "الاستجابة للطوارئ", nav: "بحث الطوارئ", userRole: "مستجيب أول" },
  doctor: { sublabel: "بوابة الطبيب", nav: "لوحة المريض", userRole: "طبيب · مدينة الملك فهد الطبية" },
  citizen: { sublabel: "صحة المواطن", nav: "سجلاتي الصحية", userRole: "السجل الصحي الوطني" },
  admin: { sublabel: "قيادة الوزارة", nav: "لوحة التحليلات", userRole: "ذكاء صحة السكان" },
  lab: { sublabel: "المختبر", nav: "نتائج المختبر", userRole: "فني مختبر أول" },
  pharmacy: { sublabel: "الصيدلية", nav: "الصرف وفحص السلامة", userRole: "صيدلي سريري" },
  hospital: { sublabel: "عمليات المستشفى", nav: "نظرة عامة على المستشفى", userRole: "مدينة الملك فهد الطبية" },
  insurance: { sublabel: "التأمين", nav: "المطالبات وكشف الاحتيال", userRole: "قائد عمليات التأمين" },
  "ai-control": { sublabel: "مركز التحكم بالذكاء الاصطناعي", nav: "مراقبة المحركات", userRole: "قائد أنظمة الذكاء الاصطناعي" },
  research: { sublabel: "الأبحاث", nav: "رؤى البحث", userRole: "عالم بيانات صحية" },
  family: { sublabel: "صحة الأسرة", nav: "خريطة صحة الأسرة", userRole: "وحدة الرعاية الوقائية" },
  "supply-chain": { sublabel: "سلسلة الإمداد", nav: "المخزون واللوجستيات", userRole: "مدير سلسلة إمداد الأدوية" },
};

/* Brand mark — the same pulse-tile used on the landing and sign-in pages. */
function SanadMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[9px]"
      style={{ width: size, height: size, background: "linear-gradient(135deg, #0A84FF 0%, #0048C0 100%)" }}
    >
      <Activity className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.4} />
    </div>
  );
}

export function Layout({ children, role, localized = false }: { children: React.ReactNode; role: Role; localized?: boolean }) {
  const location = usePathname();
  const { theme, setTheme } = useTheme();
  const config = roleConfigs[role];
  const { user: authUser, logout } = useAuth();
  const { locale, dir, text, toggleLocale } = useLanguage();
  const router = useRouter();
  const [showAlerts, setShowAlerts] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: alertsData } = useQuery({
    queryKey: ["system-alerts"],
    queryFn: async () => {
      const res = await apiFetch("/api/alerts/system?limit=10");
      if (!res.ok) return { alerts: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 15000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/alerts/read-all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
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
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowAlerts(false);
        setMobileNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Close the drawer on navigation.
  useEffect(() => { setMobileNavOpen(false); }, [location]);

  const unreadCount: number = alertsData?.unreadCount ?? 0;
  const systemAlerts: SystemAlert[] = alertsData?.alerts ?? [];

  const sidebarContent = (
    <>
      {/* Logo block */}
      <div className="flex h-[60px] items-center gap-3 border-b border-border px-5">
        <SanadMark />
        <div>
          <p className="text-[15px] font-bold leading-none tracking-tight text-foreground">{text("SANAD", "سند")}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            {locale === "ar" ? roleText[role].sublabel : config.sublabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label={text("Close menu", "إغلاق القائمة")}
          className="ms-auto flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto px-3 pb-2 pt-4">
        <p className="mb-2 ms-0.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
          {text("Workspace", "مساحة العمل")}
        </p>
        {config.nav.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{locale === "ar" ? roleText[role].nav : item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User block */}
      <div className="border-t border-border px-3 pb-4 pt-3">
        <div className="mb-1 flex items-center gap-2.5 rounded-[14px] bg-secondary px-3 py-2.5" suppressHydrationWarning>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white" suppressHydrationWarning>
            {authUser?.initial ?? config.userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold leading-tight text-foreground" suppressHydrationWarning>{authUser?.name ?? config.user}</p>
            <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground" suppressHydrationWarning>
              {authUser?.jobTitle ?? (locale === "ar" ? roleText[role].userRole : config.userRole)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { logout(); router.push("/login"); }}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>{text("Sign Out", "تسجيل الخروج")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ─── Sidebar: static on desktop, drawer on mobile ─── */}
      <aside className="hidden h-full w-[220px] shrink-0 flex-col border-e border-border bg-sidebar text-sidebar-foreground shadow-sm lg:flex">
        {sidebarContent}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 start-0 flex w-[270px] flex-col border-e border-border bg-sidebar text-sidebar-foreground shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ─── Main Area ─── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="relative z-50 flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur lg:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={text("Open menu", "فتح القائمة")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="hidden h-4 w-4 text-muted-foreground sm:block" />
              <span className="text-sm font-medium text-muted-foreground">
                {locale === "ar" ? roleText[role].sublabel : config.sublabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLocale}
              className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[12px] font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground"
              title={text("Switch language", "تغيير اللغة")}
            >
              <Languages className="h-3.5 w-3.5" />
              {locale === "ar" ? "EN" : "عربي"}
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
              className="h-8 w-8 rounded-full bg-card border border-border"
            >
              {mounted ? (theme === "dark" ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />) : <span className="w-3.5 h-3.5" />}
            </Button>

            {/* Alerts Bell */}
            <div className="relative">
              <button
                ref={bellRef}
                type="button"
                onClick={() => setShowAlerts(v => !v)}
                aria-label={text("System alerts", "تنبيهات النظام")}
                aria-expanded={showAlerts}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -end-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div
                  ref={dropdownRef}
                  className="fixed end-4 top-[64px] z-[9999] w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{text("System Alerts", "تنبيهات النظام")}</p>
                      {unreadCount > 0 && (
                        <p className="text-[11px] text-muted-foreground">{text(`${unreadCount} unread`, `${unreadCount} غير مقروء`)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-[11px] font-medium text-primary hover:text-primary/80"
                        >
                          {text("Mark all read", "تحديد الكل كمقروء")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAlerts(false)}
                        aria-label={text("Close", "إغلاق")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {systemAlerts.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <CheckCircle2 className="mb-2 h-8 w-8 text-success" />
                        <p className="text-[13px] font-medium">{text("No alerts", "لا توجد تنبيهات")}</p>
                      </div>
                    ) : (
                      systemAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "border-b border-border/60 px-4 py-3 transition-colors last:border-0",
                            !alert.isRead ? "bg-primary/5" : ""
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={cn(
                              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                              alert.severity === "critical" ? "bg-danger-bg" :
                              alert.severity === "warning" ? "bg-warning-bg" : "bg-info-bg"
                            )}>
                              <AlertTriangle className={cn(
                                "h-3 w-3",
                                alert.severity === "critical" ? "text-danger" :
                                alert.severity === "warning" ? "text-warning" : "text-info"
                              )} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex items-center gap-2">
                                <p className={cn("text-[12px] font-semibold leading-snug", !alert.isRead ? "text-foreground" : "text-muted-foreground")}>
                                  {alert.title}
                                </p>
                                {!alert.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                              </div>
                              {alert.patientName && (
                                <p className="mb-0.5 font-mono text-[10px] text-muted-foreground" dir="ltr">
                                  {alert.patientName} · {alert.patientNationalId}
                                </p>
                              )}
                              <p className="text-[11px] leading-snug text-muted-foreground">{alert.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content. Localized screens follow the active locale's direction
            (RTL for Arabic); screens still pending the i18n pass pass no
            `localized` flag and stay pinned LTR so their English content isn't
            bidi-mangled inside the RTL chrome. `text-start` resolves to the
            correct edge under either direction. */}
        <main dir={localized ? dir : "ltr"} className="page-enter flex-1 overflow-y-auto p-4 text-start sm:p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}

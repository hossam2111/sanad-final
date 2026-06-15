"use client"

import { Languages, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

export function LanguageThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { locale, toggleLocale, text } = useLanguage()
  const isDark = theme === "dark"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleLocale}
        className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={text("Switch language", "تغيير اللغة")}
      >
        <Languages className="h-3.5 w-3.5" />
        {locale === "ar" ? "EN" : "عربي"}
      </button>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={text("Toggle night mode", "تفعيل الوضع الليلي")}
      >
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        {isDark ? text("Light", "نهاري") : text("Night", "ليلي")}
      </button>
    </div>
  )
}

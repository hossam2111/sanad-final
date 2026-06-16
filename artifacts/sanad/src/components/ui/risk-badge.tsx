import * as React from "react"

import { cn } from "@/lib/utils"

type RiskLevel = "low" | "medium" | "high" | "critical"

const riskLabels: Record<RiskLevel, string> = {
  critical: "حرج",
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
}

const riskStyles: Record<RiskLevel, string> = {
  critical: "bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.3)]",
  high:     "bg-[hsl(var(--risk-high)/0.15)]     text-[hsl(var(--risk-high))]     border-[hsl(var(--risk-high)/0.3)]",
  medium:   "bg-[hsl(var(--risk-medium)/0.15)]   text-[hsl(var(--risk-medium))]   border-[hsl(var(--risk-medium)/0.3)]",
  low:      "bg-[hsl(var(--risk-low)/0.15)]       text-[hsl(var(--risk-low))]       border-[hsl(var(--risk-low)/0.3)]",
}

const dotStyles: Record<RiskLevel, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
}

export interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel
  label?: string
}

function RiskBadge({ level, label, className, ...props }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        riskStyles[level],
        className,
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[level])} />
      {label ?? riskLabels[level]}
    </span>
  )
}

export { RiskBadge }

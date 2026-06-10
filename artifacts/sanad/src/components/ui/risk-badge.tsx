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
  critical: "border-risk-critical/20 bg-risk-critical-bg text-risk-critical",
  high: "border-risk-high/20 bg-risk-high-bg text-risk-high",
  medium: "border-risk-medium/25 bg-risk-medium-bg text-risk-medium",
  low: "border-risk-low/20 bg-risk-low-bg text-risk-low",
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

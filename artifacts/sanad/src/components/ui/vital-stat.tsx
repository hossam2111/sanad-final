import * as React from "react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

type VitalStatus = "normal" | "warning" | "critical"
type VitalTrend = "up" | "down" | "stable"

const statusStyles: Record<VitalStatus, string> = {
  normal: "border-risk-low bg-risk-low-bg",
  warning: "border-risk-medium bg-risk-medium-bg",
  critical: "border-risk-critical bg-risk-critical-bg",
}

const valueStyles: Record<VitalStatus, string> = {
  normal: "text-risk-low",
  warning: "text-risk-medium",
  critical: "text-risk-critical",
}

const trendConfig = {
  up: { icon: TrendingUp, label: "Rising" },
  down: { icon: TrendingDown, label: "Falling" },
  stable: { icon: Minus, label: "Stable" },
} satisfies Record<VitalTrend, { icon: React.ElementType; label: string }>

export interface VitalStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  unit?: string
  status?: VitalStatus
  trend?: VitalTrend
}

function VitalStat({
  label,
  value,
  unit,
  status = "normal",
  trend,
  className,
  ...props
}: VitalStatProps) {
  const trendItem = trend ? trendConfig[trend] : null
  const TrendIcon = trendItem?.icon

  return (
    <div
      className={cn(
        "rounded-xl border-l-4 bg-card p-4 shadow-sm",
        statusStyles[status],
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("text-2xl font-bold leading-none tabular-nums", valueStyles[status])}>
            {value}
            {unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
          </div>
          <div className="mt-2 text-xs font-medium text-muted-foreground">{label}</div>
        </div>
        {TrendIcon && trendItem && (
          <div className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{trendItem.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export { VitalStat }

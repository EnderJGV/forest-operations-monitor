"use client"

import { Globe, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  variant?: "default" | "success" | "danger" | "warning"
}) {
  const variants = {
    default: {
      icon: "text-muted-foreground",
      bg: "bg-muted/30",
    },
    success: {
      icon: "text-success",
      bg: "bg-success/10",
    },
    danger: {
      icon: "text-destructive",
      bg: "bg-destructive/10",
    },
    warning: {
      icon: "text-warning",
      bg: "bg-warning/10",
    },
  }

  const v = variants[variant]

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${v.bg}`}>
        <Icon className={`h-5 w-5 ${v.icon}`} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-card-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard
        label="Total de Sistemas"
        value={stats.total}
        icon={Globe}
        variant="default"
      />
      <StatCard
        label="Sistemas Online"
        value={stats.online}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        label="Sistemas Offline"
        value={stats.offline}
        icon={XCircle}
        variant="danger"
      />
      <StatCard
        label="Tempo Medio (ms)"
        value={stats.avgResponseTime ? `${stats.avgResponseTime}` : "-"}
        icon={Clock}
        variant="default"
      />
      <StatCard
        label="Alertas Ativos"
        value={stats.activeAlerts}
        icon={AlertTriangle}
        variant={stats.activeAlerts > 0 ? "warning" : "default"}
      />
    </div>
  )
}

"use client"

import { CheckCircle2, XCircle, AlertTriangle, Clock, Loader2 } from "lucide-react"
import type { MonitoredSite, DashboardStats } from "@/lib/types"

interface OperationsPanelProps {
  sites: MonitoredSite[]
  stats: DashboardStats
  lastFullCheck: string | null
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "online":
      return <CheckCircle2 className="h-5 w-5 text-success" />
    case "offline":
      return <XCircle className="h-5 w-5 text-destructive" />
    case "unstable":
      return <AlertTriangle className="h-5 w-5 text-warning" />
    case "checking":
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

export function OperationsPanel({ sites, stats, lastFullCheck }: OperationsPanelProps) {
  const sla = stats.total > 0
    ? ((stats.online / stats.total) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Aiko Digital - Painel de Operacoes
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real de sistemas florestais
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className={`text-3xl font-bold ${Number(sla) >= 99 ? "text-success" : Number(sla) >= 95 ? "text-warning" : "text-destructive"}`}>
              {sla}%
            </p>
            <p className="text-xs text-muted-foreground">SLA</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{stats.online}/{stats.total}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          {lastFullCheck && (
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                {new Date(lastFullCheck).toLocaleTimeString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Ultima verificacao</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of sites */}
      <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {sites.map(site => (
          <div
            key={site.id}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
              site.currentStatus === "online"
                ? "border-success/30 bg-success/5"
                : site.currentStatus === "offline"
                  ? "border-destructive/30 bg-destructive/10 animate-pulse"
                  : site.currentStatus === "unstable"
                    ? "border-warning/30 bg-warning/5"
                    : "border-border bg-card"
            }`}
          >
            <StatusIcon status={site.currentStatus} />
            <span className="text-center font-mono text-xs font-bold text-foreground">
              {site.name}
            </span>
            {site.responseTime !== null && (
              <span className="text-[10px] text-muted-foreground">
                {site.responseTime}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

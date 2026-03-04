"use client"

import { useState, useMemo } from "react"
import {
  ArrowUpDown,
  Search,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MonitoredSite, SiteStatus } from "@/lib/types"

interface SitesTableProps {
  sites: MonitoredSite[]
}

const PAGE_SIZE = 12

type SortKey = "name" | "currentStatus" | "responseTime" | "httpCode" | "category"
type SortDir = "asc" | "desc"

function StatusBadge({ status }: { status: SiteStatus }) {
  const config = {
    online: { label: "Online", dot: "bg-success", bg: "bg-success/10", text: "text-success" },
    offline: { label: "Offline", dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive" },
    unstable: { label: "Instavel", dot: "bg-warning", bg: "bg-warning/10", text: "text-warning" },
    checking: { label: "Verificando", dot: "bg-muted-foreground animate-pulse", bg: "bg-muted", text: "text-muted-foreground" },
    unknown: { label: "Pendente", dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground" },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function PerformanceBar({ time }: { time: number | null }) {
  if (time === null) return <span className="text-muted-foreground">-</span>
  const perc = Math.min((time / 5000) * 100, 100)
  const color = time < 1000 ? "bg-success" : time < 3000 ? "bg-warning" : "bg-destructive"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${perc}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums">{time}ms</span>
    </div>
  )
}

export function SitesTable({ sites }: SitesTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SiteStatus | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(0)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(0)
  }

  const filtered = useMemo(() => {
    let result = [...sites]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter(s => s.currentStatus === statusFilter)
    }

    if (categoryFilter !== "all") {
      result = result.filter(s => s.category === categoryFilter)
    }

    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name)
        case "currentStatus":
          return dir * a.currentStatus.localeCompare(b.currentStatus)
        case "responseTime":
          return dir * ((a.responseTime ?? 99999) - (b.responseTime ?? 99999))
        case "httpCode":
          return dir * ((a.httpCode ?? 0) - (b.httpCode ?? 0))
        case "category":
          return dir * a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return result
  }, [sites, search, statusFilter, categoryFilter, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou URL..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="h-9 border-border bg-background pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as SiteStatus | "all"); setPage(0) }}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="unstable">Instavel</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas categorias</option>
            <option value="Operacional">Operacional</option>
            <option value="Cliente">Cliente</option>
            <option value="Interno">Interno</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <SortHeader label="Sistema" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Status" sortKey="currentStatus" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="HTTP" sortKey="httpCode" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Tempo" sortKey="responseTime" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Categoria" sortKey="category" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Verificacao</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Link</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {sites.length === 0
                    ? "Nenhum sistema importado. Use o botao Importar Excel para comecar."
                    : "Nenhum resultado encontrado para os filtros aplicados."}
                </td>
              </tr>
            ) : (
              paginated.map(site => (
                <tr
                  key={site.id}
                  className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${
                    site.currentStatus === "offline"
                      ? "bg-destructive/5"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-card-foreground">
                      {site.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {site.currentStatus === "checking" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verificando
                      </span>
                    ) : (
                      <StatusBadge status={site.currentStatus} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs ${
                      site.httpCode && site.httpCode >= 200 && site.httpCode < 300
                        ? "text-success"
                        : site.httpCode && site.httpCode >= 400
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}>
                      {site.httpCode ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PerformanceBar time={site.responseTime} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      site.category === "Operacional"
                        ? "bg-primary/10 text-primary"
                        : site.category === "Cliente"
                          ? "bg-chart-5/10 text-chart-5"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {site.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {site.lastChecked
                      ? new Date(site.lastChecked).toLocaleTimeString("pt-BR")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {filtered.length} sistema{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${currentKey === sortKey ? "text-primary" : ""}`}
        />
        {currentKey === sortKey && (
          <span className="text-[9px] text-primary">
            {dir === "asc" ? "A" : "D"}
          </span>
        )}
      </button>
    </th>
  )
}

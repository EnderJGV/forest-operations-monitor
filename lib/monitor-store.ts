import type { MonitoredSite, SiteCheck, SiteStatus, DashboardStats } from "./types"

const STORAGE_KEY = "aiko-monitor-sites"

function categorize(name: string): "Operacional" | "Cliente" | "Interno" {
  const n = name.toUpperCase()
  const clientKeywords = ["ABE", "CJR", "ABF", "CVF", "ABR", "BRF", "VAF", "MEN", "INP", "RCF", "SML", "RFT", "CNE", "GLM", "CST", "VAP", "VLI", "FTM", "AGP", "LDC", "CBM", "JFI", "KLB", "CNB", "ELD", "SYL", "ARC", "ANG", "VRC", "TNS", "VPC"]
  const internalKeywords = ["TMP", "DEX", "EDC", "WST", "MTM"]

  if (internalKeywords.some(k => n.includes(k))) return "Interno"
  if (clientKeywords.some(k => n.includes(k))) return "Cliente"
  return "Operacional"
}

export function loadSites(): MonitoredSite[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function saveSites(sites: MonitoredSite[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
  } catch {}
}

export function parseSitesFromData(data: Array<{ name: string; url: string }>): MonitoredSite[] {
  return data.map((item, index) => ({
    id: `site-${index}-${Date.now()}`,
    name: item.name.trim(),
    url: item.url.trim(),
    category: categorize(item.name),
    currentStatus: "unknown" as SiteStatus,
    httpCode: null,
    responseTime: null,
    lastChecked: null,
    history: [],
  }))
}

export function updateSiteCheck(site: MonitoredSite, check: SiteCheck): MonitoredSite {
  const history = [check, ...site.history].slice(0, 10)
  return {
    ...site,
    currentStatus: check.status,
    httpCode: check.httpCode,
    responseTime: check.responseTime,
    lastChecked: check.timestamp,
    history,
  }
}

export function calculateStats(sites: MonitoredSite[]): DashboardStats {
  const online = sites.filter(s => s.currentStatus === "online").length
  const offline = sites.filter(s => s.currentStatus === "offline").length
  const unstable = sites.filter(s => s.currentStatus === "unstable").length
  const responseTimes = sites
    .map(s => s.responseTime)
    .filter((t): t is number => t !== null)
  const avgResponseTime = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0

  return {
    total: sites.length,
    online,
    offline,
    unstable,
    avgResponseTime,
    activeAlerts: offline + unstable,
  }
}

export function exportToCSV(sites: MonitoredSite[]): void {
  const headers = ["Sistema", "URL", "Status", "Codigo HTTP", "Tempo de Resposta (ms)", "Ultima Verificacao", "Categoria"]
  const rows = sites.map(s => [
    s.name,
    s.url,
    s.currentStatus,
    s.httpCode ?? "-",
    s.responseTime ?? "-",
    s.lastChecked ?? "-",
    s.category,
  ])

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `aiko-monitor-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

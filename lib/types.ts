export type SiteStatus = "online" | "offline" | "unstable" | "checking" | "unknown"

export interface SiteCheck {
  status: SiteStatus
  httpCode: number | null
  responseTime: number | null
  timestamp: string
}

export interface MonitoredSite {
  id: string
  name: string
  url: string
  category: "Operacional" | "Cliente" | "Interno"
  currentStatus: SiteStatus
  httpCode: number | null
  responseTime: number | null
  lastChecked: string | null
  history: SiteCheck[]
}

export interface DashboardStats {
  total: number
  online: number
  offline: number
  unstable: number
  avgResponseTime: number
  activeAlerts: number
}

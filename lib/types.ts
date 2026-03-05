export type SiteStatus = "online" | "offline" | "unstable" | "checking" | "unknown"

export interface SiteCheck {
  /**
   * Normalized status used across the UI.
   * This is derived from the external checker API response.
   */
  status: SiteStatus
  httpCode: number | null
  responseTime: number | null
  timestamp: string
}

export interface MonitoredSite {
  /**
   * Canonical representation of a monitored system used by the UI.
   * Stored in localStorage so the dashboard state survives refresh.
   */
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

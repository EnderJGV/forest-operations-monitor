"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MonitoredSite, SiteCheck } from "@/lib/types"
import { loadSites, saveSites, updateSiteCheck, calculateStats, parseSitesFromData } from "@/lib/monitor-store"
import { toast } from "sonner"
import { createLogger } from "@/lib/logger"

const CHECK_INTERVAL = 60000
const log = createLogger("useMonitor")

export function useMonitor() {
  const [sites, setSites] = useState<MonitoredSite[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastFullCheck, setLastFullCheck] = useState<string | null>(null)
  const [isOperationsMode, setIsOperationsMode] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    // Prevents running twice in React StrictMode (dev) and avoids double-import/double-check.
    if (initializedRef.current) return
    initializedRef.current = true
    const stored = loadSites()
    if (stored.length > 0) {
      log.info("Sites carregados do localStorage", { count: stored.length })
      setSites(stored)
    }
  }, [])

  // Save to localStorage whenever sites change
  useEffect(() => {
    if (sites.length > 0) {
      saveSites(sites)
    }
  }, [sites])

  const checkSite = useCallback(async (site: MonitoredSite): Promise<SiteCheck> => {
    log.info("Iniciando checagem de site", {
      id: site.id,
      name: site.name,
      url: site.url,
    })

    try {
      const res = await fetch("/api/check-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: site.url }),
      })

      log.debug("Resposta bruta de /api/check-site", {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      })

      const data = await res.json()

      log.debug("JSON recebido de /api/check-site", data)

      return data as SiteCheck
    } catch (error) {
      log.error("Erro ao checar site", {
        id: site.id,
        name: site.name,
        url: site.url,
        error,
      })

      toast.error(`Erro ao checar o sistema ${site.name}`, {
        description: "Veja o console do navegador para mais detalhes.",
      })

      return {
        status: "offline",
        httpCode: 0,
        responseTime: null,
        timestamp: new Date().toISOString(),
      }
    }
  }, [])

  const checkAllSites = useCallback(async (currentSites?: MonitoredSite[]) => {
    const sitesToCheck = currentSites || sites
    if (sitesToCheck.length === 0) return

    log.info("Iniciando checagem em lote", { count: sitesToCheck.length })
    setIsChecking(true)

    // Mark all as checking
    setSites(prev =>
      prev.map(s => ({ ...s, currentStatus: "checking" as const }))
    )

    // Run all checks concurrently
    const checks = await Promise.all(
      sitesToCheck.map(async (site) => {
        const check = await checkSite(site)
        return { siteId: site.id, check }
      })
    )

    setSites(prev => {
      const updated = prev.map(site => {
        const result = checks.find(c => c.siteId === site.id)
        if (result) {
          const updatedSite = updateSiteCheck(site, result.check)
          // Alert if critical system went offline
          if (result.check.status === "offline" && site.currentStatus !== "offline" && site.currentStatus !== "checking" && site.currentStatus !== "unknown") {
            toast.error(`Sistema ${site.name} ficou OFFLINE!`, {
              description: `URL: ${site.url}`,
              duration: 10000,
            })
          }
          return updatedSite
        }
        return site
      })
      return updated
    })

    setLastFullCheck(new Date().toISOString())
    setIsChecking(false)
  }, [sites, checkSite])

  const importSites = useCallback((data: Array<{ name: string; url: string }>) => {
    const newSites = parseSitesFromData(data)
    setSites(newSites)
    saveSites(newSites)
    toast.success(`${newSites.length} sistemas importados com sucesso!`)
    // Run initial check after import
    setTimeout(() => {
      checkAllSites(newSites)
    }, 500)
  }, [checkAllSites])

  // Auto-refresh interval
  useEffect(() => {
    if (sites.length === 0) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      checkAllSites()
    }, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sites.length, checkAllSites])

  const stats = calculateStats(sites)

  return {
    sites,
    stats,
    isChecking,
    lastFullCheck,
    isOperationsMode,
    setIsOperationsMode,
    importSites,
    checkAllSites,
  }
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MonitoredSite, SiteCheck } from "@/lib/types"
import { loadSites, saveSites, updateSiteCheck, calculateStats, parseSitesFromData } from "@/lib/monitor-store"
import { toast } from "sonner"

const CHECK_INTERVAL = 60000

export function useMonitor() {
  const [sites, setSites] = useState<MonitoredSite[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastFullCheck, setLastFullCheck] = useState<string | null>(null)
  const [isOperationsMode, setIsOperationsMode] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const stored = loadSites()
    if (stored.length > 0) {
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
    try {
      const res = await fetch("/api/check-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: site.url }),
      })
      const data = await res.json()
      return data as SiteCheck
    } catch {
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

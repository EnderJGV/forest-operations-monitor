"use client"

import { useState, useEffect, useRef } from "react"
import { useMonitor } from "@/hooks/use-monitor"
import { exportToCSV } from "@/lib/monitor-store"
import { DEFAULT_SITES } from "@/lib/default-sites"
import { Header } from "./header"
import { StatsCards } from "./stats-cards"
import { Charts } from "./charts"
import { SitesTable } from "./sites-table"
import { UploadModal } from "./upload-modal"
import { OperationsPanel } from "./operations-panel"
import { EmptyState } from "./empty-state"

export function Dashboard() {
  const {
    sites,
    stats,
    isChecking,
    lastFullCheck,
    isOperationsMode,
    setIsOperationsMode,
    importSites,
    checkAllSites,
  } = useMonitor()

  const [uploadOpen, setUploadOpen] = useState(false)
  const autoLoadedRef = useRef(false)

  // Auto-load default sites on first visit if no sites stored
  useEffect(() => {
    if (autoLoadedRef.current) return
    autoLoadedRef.current = true

    // Small delay to allow localStorage to load
    const timer = setTimeout(() => {
      if (sites.length === 0) {
        importSites(DEFAULT_SITES)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [sites.length, importSites])

  if (isOperationsMode) {
    return (
      <div
        className="cursor-pointer"
        onDoubleClick={() => setIsOperationsMode(false)}
        title="Duplo clique para sair do modo Painel TV"
      >
        <OperationsPanel
          sites={sites}
          stats={stats}
          lastFullCheck={lastFullCheck}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        onRefresh={() => checkAllSites()}
        onExport={() => exportToCSV(sites)}
        onToggleOpsMode={() => setIsOperationsMode(true)}
        isChecking={isChecking}
        isOperationsMode={isOperationsMode}
        lastFullCheck={lastFullCheck}
        sitesCount={sites.length}
        onUploadClick={() => setUploadOpen(true)}
      />

      {sites.length === 0 ? (
        <EmptyState onUploadClick={() => setUploadOpen(true)} />
      ) : (
        <main className="flex flex-col gap-4 p-4 lg:p-6">
          <StatsCards stats={stats} />
          <Charts sites={sites} stats={stats} />
          <SitesTable sites={sites} />
        </main>
      )}

      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={importSites}
      />
    </div>
  )
}

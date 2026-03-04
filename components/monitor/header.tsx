"use client"

import { RefreshCw, Download, Monitor, Upload, TreePine } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onRefresh: () => void
  onExport: () => void
  onToggleOpsMode: () => void
  isChecking: boolean
  isOperationsMode: boolean
  lastFullCheck: string | null
  sitesCount: number
  onUploadClick: () => void
}

export function Header({
  onRefresh,
  onExport,
  onToggleOpsMode,
  isChecking,
  isOperationsMode,
  lastFullCheck,
  sitesCount,
  onUploadClick,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <TreePine className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Aiko Digital
          </h1>
          <p className="text-xs text-muted-foreground">
            Forest Operations Web Monitor
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {lastFullCheck && (
          <span className="text-xs text-muted-foreground">
            Ultima verificacao:{" "}
            {new Date(lastFullCheck).toLocaleTimeString("pt-BR")}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onUploadClick}
          className="gap-2 border-border bg-card text-card-foreground hover:bg-muted"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Importar Excel</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={sitesCount === 0}
          className="gap-2 border-border bg-card text-card-foreground hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">CSV</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleOpsMode}
          className={`gap-2 border-border ${isOperationsMode ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card text-card-foreground hover:bg-muted"}`}
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Painel TV</span>
        </Button>

        <Button
          size="sm"
          onClick={() => onRefresh()}
          disabled={isChecking || sitesCount === 0}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
    </header>
  )
}

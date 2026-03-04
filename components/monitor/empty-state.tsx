"use client"

import { TreePine, Upload, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onUploadClick: () => void
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <TreePine className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Centro de Monitoramento
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Importe seu arquivo Excel com os sistemas para iniciar o monitoramento em tempo real. O arquivo deve conter a sigla do sistema na Coluna A e a URL na Coluna B.
        </p>
      </div>

      <Button
        onClick={onUploadClick}
        size="lg"
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Upload className="h-4 w-4" />
        Importar Arquivo Excel
      </Button>

      <div className="mt-4 grid max-w-lg grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-primary">60s</p>
          <p className="text-[10px] text-muted-foreground">Auto-refresh</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-primary">Async</p>
          <p className="text-[10px] text-muted-foreground">Verificacao paralela</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-primary">CSV</p>
          <p className="text-[10px] text-muted-foreground">Exportar relatorio</p>
        </div>
      </div>
    </div>
  )
}

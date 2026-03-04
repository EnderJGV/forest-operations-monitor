"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import * as XLSX from "xlsx"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: Array<{ name: string; url: string }>) => void
}

export function UploadModal({ open, onOpenChange, onImport }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Array<{ name: string; url: string }> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    setError(null)
    setPreview(null)

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Formato invalido. Use arquivos .xlsx, .xls ou .csv")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { header: 1 }) as unknown as string[][]

        const parsed: Array<{ name: string; url: string }> = []

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length < 2) continue

          const name = String(row[0] || "").trim()
          const url = String(row[1] || "").trim()

          // Skip header rows
          if (i === 0 && (name.toLowerCase().includes("sigla") || name.toLowerCase().includes("nome") || name.toLowerCase().includes("cliente"))) {
            continue
          }

          if (name && url && url.startsWith("http")) {
            parsed.push({ name, url })
          }
        }

        if (parsed.length === 0) {
          setError("Nenhum sistema valido encontrado. Verifique se o arquivo tem Coluna A (Nome) e Coluna B (URL)")
          return
        }

        setPreview(parsed)
      } catch {
        setError("Erro ao ler o arquivo. Verifique se o formato esta correto.")
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleConfirm = () => {
    if (preview) {
      onImport(preview)
      setPreview(null)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setPreview(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-card-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Sistemas
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Importe um arquivo Excel (.xlsx) com os sistemas para monitorar. O arquivo deve ter a sigla na Coluna A e a URL na Coluna B.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-card-foreground">
                Arraste o arquivo aqui ou{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  clique para selecionar
                </button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Suporta .xlsx, .xls e .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm font-medium text-card-foreground">
                {preview.length} sistemas encontrados
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreview(null)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-card-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Sigla</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 font-mono font-medium text-card-foreground">{item.name}</td>
                      <td className="max-w-[250px] truncate px-3 py-1.5 text-muted-foreground">{item.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleConfirm} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Importar {preview.length} Sistemas
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

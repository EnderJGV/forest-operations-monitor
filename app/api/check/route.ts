import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { checkUrl } from "@/lib/check-url"

const log = createLogger("api:check")

/**
 * GET /api/check?url=...
 * Retorna o formato completo da API original (request + response).
 * Compatível com o endpoint Express /check.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  log.info("Requisição GET /check recebida", { requestId, url })

  if (!url || typeof url !== "string") {
    log.warn("URL não informada", { requestId })
    return NextResponse.json({ error: "URL não informada" }, { status: 400 })
  }

  try {
    const result = await checkUrl(url)
    return NextResponse.json(result)
  } catch (error: unknown) {
    log.error("Erro ao checar site", {
      requestId,
      url,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        request: { url },
        response: { online: false },
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: null,
          type: null,
        },
      },
      { status: 500 },
    )
  }
}

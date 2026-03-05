import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const log = createLogger("api:check-site")

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  log.info("Requisição recebida", { requestId, url })

  if (!url || typeof url !== "string") {
    log.warn("URL inválida recebida", { requestId, url })
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    /**
     * We proxy the checker service through the Next.js backend to:
     * - avoid browser CORS constraints
     * - keep the UI contract stable (returns `SiteCheck`)
     * - centralize mapping from the external API shape -> internal types
     */
    const externalUrl = `http://localhost:3001/check?url=${encodeURIComponent(
      url,
    )}`

    // log.debug("Chamando serviço externo", { requestId, externalUrl })

    const res = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Aiko-Monitor/1.0",
      },
    })

    const rawText = await res.text()

    // log.debug("Resposta bruta do serviço externo", {
    //   requestId,
    //   ok: res.ok,
    //   status: res.status,
    //   statusText: res.statusText,
    //   rawText,
    // })

    if (!res.ok) {
      throw new Error(
        `Serviço externo retornou status inválido: ${res.status} ${res.statusText}`,
      )
    }

    let data: unknown
    try {
      data = JSON.parse(rawText)
    } catch (parseError) {
      log.error("Erro ao fazer parse do JSON", {
        requestId,
        parseError,
        rawText,
      })
      throw parseError
    }

    const response = (data as any)?.response

    const online = Boolean(response?.online)
    const httpStatusRaw = (response as any)?.httpStatus
    const httpStatus =
      typeof httpStatusRaw === "number"
        ? httpStatusRaw
        : typeof httpStatusRaw === "string"
        ? Number(httpStatusRaw)
        : null

    const responseTimeRaw = (response as any)?.responseTimeMs
    const responseTimeMs =
      typeof responseTimeRaw === "number"
        ? responseTimeRaw
        : typeof responseTimeRaw === "string"
        ? Number(responseTimeRaw)
        : null

    let status: "online" | "offline" | "unstable" = "online"
    if (!online) {
      status = "offline"
    } else if (httpStatus !== null && httpStatus >= 500) {
      status = "offline"
    } else if (httpStatus !== null && httpStatus >= 400) {
      status = "unstable"
    } else if (responseTimeMs !== null && responseTimeMs > 5000) {
      status = "unstable"
    }

    const responseTime = Date.now() - startTime

    const payload = {
      status,
      httpCode: httpStatus,
      responseTime: responseTimeMs ?? responseTime,
      timestamp: new Date().toISOString(),
    }

    // log.info("Payload retornado para o front", { requestId, payload })

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime

    // log.error("Erro ao checar site", {
    //   requestId,
    //   url,
    //   error,
    //   responseTime,
    // })

    return NextResponse.json(
      {
        status: "offline",
        httpCode: 0,
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

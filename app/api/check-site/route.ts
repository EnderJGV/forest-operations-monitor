import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { checkUrl } from "@/lib/check-url"

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
    const result = await checkUrl(url)
    const response = result.response

    const online = Boolean(response?.online)
    const httpStatusRaw =
      "httpStatus" in response ? response.httpStatus : null
    const httpStatus =
      typeof httpStatusRaw === "number"
        ? httpStatusRaw
        : typeof httpStatusRaw === "string"
          ? Number(httpStatusRaw)
          : null

    const responseTimeRaw =
      "responseTimeMs" in response ? response.responseTimeMs : null
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

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime

    log.error("Erro ao checar site", {
      requestId,
      url,
      error: error instanceof Error ? error.message : String(error),
      responseTime,
    })

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

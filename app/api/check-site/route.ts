import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  console.log("[API /api/check-site] Requisição recebida", { url })

  if (!url || typeof url !== "string") {
    console.warn("[API /api/check-site] URL inválida recebida", { url })
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    const externalUrl = `http://localhost:3001/check?url=${encodeURIComponent(
      url,
    )}`

    console.log("[API /api/check-site] Chamando serviço externo", {
      externalUrl,
    })

    const res = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Aiko-Monitor/1.0",
      },
    })

    const rawText = await res.text()

    console.log("[API /api/check-site] Resposta bruta do serviço externo", {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      rawText,
    })

    if (!res.ok) {
      throw new Error(
        `Serviço externo retornou status inválido: ${res.status} ${res.statusText}`,
      )
    }

    let data: unknown
    try {
      data = JSON.parse(rawText)
    } catch (parseError) {
      console.error("[API /api/check-site] Erro ao fazer parse do JSON", {
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

    console.log("[API /api/check-site] Payload retornado para o front", payload)

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime

    console.error("[API /api/check-site] Erro ao checar site", {
      url,
      error,
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

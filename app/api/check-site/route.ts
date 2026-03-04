import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Aiko-Monitor/1.0",
      },
    })

    clearTimeout(timeout)
    const responseTime = Date.now() - startTime

    let status: "online" | "offline" | "unstable" = "online"
    if (response.status >= 500) {
      status = "offline"
    } else if (response.status >= 400) {
      status = "unstable"
    } else if (responseTime > 5000) {
      status = "unstable"
    }

    return NextResponse.json({
      status,
      httpCode: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const isTimeout = error instanceof DOMException && error.name === "AbortError"

    return NextResponse.json({
      status: isTimeout ? "unstable" : "offline",
      httpCode: isTimeout ? 408 : 0,
      responseTime,
      timestamp: new Date().toISOString(),
    })
  }
}

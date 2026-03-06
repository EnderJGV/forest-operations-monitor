/**
 * Lógica interna de checagem de URL (portada da API Express original).
 * Usa DNS lookup, axios com timeout e HTTPS sem validação de certificado.
 */

import axios from "axios"
import https from "https"
import dns from "dns/promises"
import { performance } from "perf_hooks"

const REQUEST_TIMEOUT_MS = 8000
const MAX_REDIRECTS = 10

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

export interface CheckUrlRequest {
  url: string
  method: string
  protocol: string
  host: string
  ipAddress: string | null
}

export interface CheckUrlResponseSuccess {
  online: true
  httpStatus: number
  statusText: string
  finalUrl: string
  redirects: number
  responseTimeMs: string
}

export interface CheckUrlResponseError {
  online: false
}

export interface CheckUrlError {
  message: string
  code: string | null
  type: string | null
}

export interface CheckUrlResult {
  request: CheckUrlRequest
  response: CheckUrlResponseSuccess | CheckUrlResponseError
  error?: CheckUrlError
}

/**
 * Verifica se uma URL está online.
 * Retorna o mesmo formato da API Express original.
 */
export async function checkUrl(url: string): Promise<CheckUrlResult> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return {
      request: {
        url,
        method: "GET",
        protocol: "",
        host: "",
        ipAddress: "URL inválida",
      },
      response: { online: false },
      error: {
        message: "URL inválida",
        code: null,
        type: "TypeError",
      },
    }
  }

  // Resolve DNS
  let ipAddress: string | null = null
  try {
    const dnsResult = await dns.lookup(parsedUrl.hostname)
    ipAddress = dnsResult.address
  } catch {
    ipAddress = "Não resolvido"
  }

  const request: CheckUrlRequest = {
    url,
    method: "GET",
    protocol: parsedUrl.protocol,
    host: parsedUrl.hostname,
    ipAddress,
  }

  try {
    const startTime = performance.now()

    const response = await axios({
      method: "GET",
      url,
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      validateStatus: () => true,
      httpsAgent,
    })

    const endTime = performance.now()
    const responseTimeMs = (endTime - startTime).toFixed(2)

    const req = response.request as { _redirectable?: { _redirectCount?: number }; res?: { responseUrl?: string } } | undefined
    const redirectCount = req?._redirectable?._redirectCount ?? 0
    const finalUrl = req?.res?.responseUrl ?? response.config?.url ?? url

    return {
      request,
      response: {
        online: true,
        httpStatus: response.status,
        statusText: response.statusText,
        finalUrl,
        redirects: redirectCount,
        responseTimeMs,
      },
    }
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    return {
      request: {
        ...request,
        ipAddress: ipAddress ?? "Não resolvido",
      },
      response: { online: false },
      error: {
        message: err.message ?? "Erro desconhecido",
        code: err.code ?? null,
        type: err.name ?? null,
      },
    }
  }
}

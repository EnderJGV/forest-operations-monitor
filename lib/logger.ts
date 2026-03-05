type LogMethod = (...args: unknown[]) => void

function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes" || v === "on"
}

const LOGS_ENABLED =
  typeof window === "undefined"
    ? parseEnvFlag(process.env.MONITOR_DEBUG_LOGS)
    : parseEnvFlag(process.env.NEXT_PUBLIC_MONITOR_DEBUG_LOGS)

/**
 * Small logger wrapper to keep debug logs easy to toggle.
 *
 * - **Client logs**: enabled via `NEXT_PUBLIC_MONITOR_DEBUG_LOGS=1` (needs dev server restart).
 * - **Server logs**: enabled via `MONITOR_DEBUG_LOGS=1` (needs dev server restart).
 *
 * Use `createLogger("scope")` to get consistent prefixes.
 */
export function createLogger(scope: string) {
  const prefix = `[${scope}]`

  const wrap = (method: LogMethod): LogMethod => {
    return (...args: unknown[]) => {
      if (!LOGS_ENABLED) return
      method(prefix, ...args)
    }
  }

  return {
    enabled: LOGS_ENABLED,
    debug: wrap(console.debug.bind(console)),
    info: wrap(console.info.bind(console)),
    warn: wrap(console.warn.bind(console)),
    error: wrap(console.error.bind(console)),
  }
}


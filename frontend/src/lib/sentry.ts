import * as Sentry from "@sentry/react"

const DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
    ignoreErrors: [
      "ResizeObserver loop",
      "Network request failed",
      "Load failed",
    ],
  })
}

export function captureException(error: unknown) {
  if (DSN && import.meta.env.PROD) {
    Sentry.captureException(error)
  }
}

export { Sentry }

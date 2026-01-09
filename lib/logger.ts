const isDevelopment = process.env.NODE_ENV === "development"

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  error?: string
}

function formatLog(entry: LogEntry): string {
  const timestamp = entry.timestamp
  return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${
    entry.data ? ` ${JSON.stringify(entry.data)}` : ""
  }${entry.error ? ` Error: ${entry.error}` : ""}`
}

export const logger = {
  info(message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      data,
    }
    console.log(formatLog(entry))
    // In production, send to logging service (Sentry, LogRocket, etc.)
  },

  warn(message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      data,
    }
    console.warn(formatLog(entry))
  },

  error(message: string, error?: Error | unknown, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      data,
      error: error instanceof Error ? error.message : String(error),
    }
    console.error(formatLog(entry))

    // In production, send critical errors to monitoring service
    if (!isDevelopment && error instanceof Error) {
      // Example: Sentry.captureException(error)
    }
  },

  debug(message: string, data?: unknown) {
    if (isDevelopment) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        data,
      }
      console.debug(formatLog(entry))
    }
  },
}

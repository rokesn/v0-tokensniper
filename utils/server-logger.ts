// Server-side logger that stores logs in memory and can be fetched via API

import type { LogEntry } from "@/types"

class ServerLogger {
  private logs: Map<string, LogEntry[]> = new Map()
  private globalLogs: LogEntry[] = []
  private maxLogsPerSession = 500
  private maxGlobalLogs = 2000

  log(level: LogEntry["level"], message: string, sessionId?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      timestamp: Date.now(),
      sessionId,
    }

    // Add to global logs
    this.globalLogs.unshift(entry)
    if (this.globalLogs.length > this.maxGlobalLogs) {
      this.globalLogs.pop()
    }

    // Add to session-specific logs
    if (sessionId) {
      if (!this.logs.has(sessionId)) {
        this.logs.set(sessionId, [])
      }
      const sessionLogs = this.logs.get(sessionId)!
      sessionLogs.unshift(entry)
      if (sessionLogs.length > this.maxLogsPerSession) {
        sessionLogs.pop()
      }
    }

    // Also log to console for debugging
    console.log(`[${level}] ${message}${sessionId ? ` (${sessionId})` : ""}`)
  }

  info(message: string, sessionId?: string) {
    this.log("INFO", message, sessionId)
  }

  success(message: string, sessionId?: string) {
    this.log("SUCCESS", message, sessionId)
  }

  error(message: string, sessionId?: string) {
    this.log("ERROR", message, sessionId)
  }

  warning(message: string, sessionId?: string) {
    this.log("WARNING", message, sessionId)
  }

  getSessionLogs(sessionId: string): LogEntry[] {
    return this.logs.get(sessionId) || []
  }

  getGlobalLogs(): LogEntry[] {
    return this.globalLogs
  }

  clearSessionLogs(sessionId: string) {
    this.logs.delete(sessionId)
  }

  clearAllLogs() {
    this.logs.clear()
    this.globalLogs = []
  }
}

export const serverLogger = new ServerLogger()

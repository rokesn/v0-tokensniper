// Centralized logging system with real-time updates

import type { LogEntry } from "@/types"

class Logger {
  private logs: LogEntry[] = []
  private listeners: ((logs: LogEntry[]) => void)[] = []
  private maxLogs = 1000

  log(level: LogEntry["level"], message: string, sessionId?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      timestamp: Date.now(),
      sessionId,
    }

    this.logs.unshift(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }

    this.notifyListeners()
    console.log(`[${level}] ${message}`)
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

  getLogs(): LogEntry[] {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.notifyListeners()
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.logs))
  }
}

export const logger = new Logger()

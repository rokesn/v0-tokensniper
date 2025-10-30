"use client"

import { useEffect, useState } from "react"
import type { LogEntry } from "@/types"
import { Card } from "@/components/ui/card"

interface LogConsoleProps {
  sessionId?: string
}

export function LogConsole({ sessionId }: LogConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch logs from server periodically
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        const url = sessionId ? `/api/sniper/logs?sessionId=${sessionId}` : "/api/sniper/logs"
        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          setLogs(data.logs)
        }
      } catch (error) {
        console.error("Error fetching logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 500) // Fetch logs every 500ms for real-time updates
    return () => clearInterval(interval)
  }, [sessionId])

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "SUCCESS":
        return "text-green-400"
      case "ERROR":
        return "text-red-400"
      case "WARNING":
        return "text-yellow-400"
      default:
        return "text-blue-400"
    }
  }

  const scrollToBottom = () => {
    const element = document.getElementById("log-container")
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Live Logs {sessionId && `(${sessionId.slice(0, 20)}...)`}
        </h3>
        <div className="flex gap-2">
          {isLoading && <span className="text-xs text-muted-foreground">Updating...</span>}
        </div>
      </div>
      <div id="log-container" className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-muted-foreground">Waiting for logs...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={`font-semibold ${getLevelColor(log.level)}`}>[{log.level}]</span>
              <span className="text-foreground">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

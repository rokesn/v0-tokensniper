"use client"

import type { SniperSession } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SessionsListProps {
  sessions: SniperSession[]
  onStop: (sessionId: string) => Promise<void>
  onSelectSession?: (sessionId: string) => void
}

export function SessionsList({ sessions, onStop, onSelectSession }: SessionsListProps) {
  const handleStop = async (sessionId: string) => {
    try {
      await onStop(sessionId)
    } catch (error) {
      console.error(`Error stopping session: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const getStatusColor = (status: SniperSession["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "monitoring":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "stopped":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <p className="text-muted-foreground text-center">No active sessions</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h2>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession?.(session.id)}
            className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-foreground">{session.tokenAddress.slice(0, 10)}...</span>
                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Amount: {session.buyAmountEth} ETH | Slippage: {session.slippage} BPS
                </div>
                <div>Started: {new Date(session.startTime).toLocaleTimeString()}</div>
              </div>
            </div>

            {session.status !== "stopped" && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStop(session.id)
                }}
                variant="destructive"
                size="sm"
                className="ml-4"
              >
                Stop
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

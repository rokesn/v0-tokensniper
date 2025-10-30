"use client"

import type { SystemStatus } from "@/types"
import { Card } from "@/components/ui/card"

interface StatusIndicatorProps {
  status: SystemStatus
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 bg-card border-border">
        <div className="text-xs text-muted-foreground mb-1">Status</div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${status.isRunning ? "bg-green-500 animate-pulse-glow" : "bg-red-500"}`}
          />
          <span className="text-sm font-semibold text-foreground">{status.isRunning ? "Running" : "Stopped"}</span>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="text-xs text-muted-foreground mb-1">Active Sessions</div>
        <div className="text-2xl font-bold text-primary">{status.activeSessions}</div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="text-xs text-muted-foreground mb-1">Monitored</div>
        <div className="text-2xl font-bold text-accent">{status.totalMonitored}</div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="text-xs text-muted-foreground mb-1">Wallet Balance</div>
        <div className="text-sm font-semibold text-foreground">{status.walletBalance} ETH</div>
      </Card>
    </div>
  )
}

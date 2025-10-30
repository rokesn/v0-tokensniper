"use client"

import { useEffect, useState } from "react"
import type { SniperSession, SystemStatus } from "@/types"
import { SniperControls } from "@/components/sniper-controls"
import { SessionsList } from "@/components/sessions-list"
import { LogConsole } from "@/components/log-console"
import { StatusIndicator } from "@/components/status-indicator"
import { PnLTracker } from "@/components/pnl-tracker"
import { PerformanceMetrics } from "@/components/performance-metrics"
import { SecurityWarning } from "@/components/security-warning"
import { SecurityCheck } from "@/components/security-check"

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus>({
    isRunning: false,
    activeSessions: 0,
    totalMonitored: 0,
    lastUpdate: Date.now(),
    walletBalance: "0",
    gasPrice: "0",
  })

  const [sessions, setSessions] = useState<SniperSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>()

  // Fetch status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/sniper/status")
        const data = await response.json()
        if (data.success) {
          setStatus(data.status)
          setSessions(data.sessions)
          // Auto-select the first active session if none selected
          if (!selectedSessionId && data.sessions.length > 0) {
            setSelectedSessionId(data.sessions[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching status:", error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [selectedSessionId])

  const handleStartSniper = async (tokenAddress: string, buyAmountEth: number, slippage: number) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sniper/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress, buyAmountEth, slippage }),
      })

      const data = await response.json()
      if (data.success) {
        setSelectedSessionId(data.sessionId)
      }
    } catch (error) {
      console.error("Error starting sniper:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopSniper = async (sessionId: string) => {
    try {
      const response = await fetch("/api/sniper/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()
      if (data.success) {
        setSelectedSessionId(undefined)
      }
    } catch (error) {
      console.error("Error stopping sniper:", error)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Token Sniper</h1>
          <p className="text-muted-foreground">Ultra-fast token sniping on Base blockchain</p>
        </div>

        {/* Security Warning */}
        <div className="mb-8">
          <SecurityWarning />
        </div>

        {/* Status Indicators */}
        <div className="mb-8">
          <StatusIndicator status={status} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <SniperControls onStart={handleStartSniper} isLoading={isLoading} />
            <SecurityCheck />
            <SessionsList sessions={sessions} onStop={handleStopSniper} onSelectSession={setSelectedSessionId} />
          </div>

          {/* Right Column - Logs */}
          <div className="lg:col-span-2">
            <LogConsole sessionId={selectedSessionId} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <PerformanceMetrics />
        </div>

        {/* PnL Tracker */}
        <div className="mb-8">
          <PnLTracker />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-8 border-t border-border">
          <p>
            This is an educational tool for learning about token sniping. Always conduct thorough research and test with
            small amounts first.
          </p>
        </div>
      </div>
    </main>
  )
}

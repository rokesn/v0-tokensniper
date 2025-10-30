"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface PerformanceMetrics {
  avgExecutionTime: number
  successRate: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgGasUsed: string
  lastUpdate: number
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/monitoring/metrics")
        const data = await response.json()
        if (data.success) {
          setMetrics(data.metrics)
        }
      } catch (error) {
        console.error("Error fetching metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <Card className="p-6 bg-card border-border text-muted-foreground">Loading...</Card>
  }

  if (!metrics) {
    return <Card className="p-6 bg-card border-border text-muted-foreground">No metrics available</Card>
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-6">Performance Metrics</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Avg Execution Time</div>
          <div className="text-2xl font-bold text-foreground">{metrics.avgExecutionTime.toFixed(0)}ms</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-green-400">{metrics.successRate.toFixed(1)}%</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Executions</div>
          <div className="text-2xl font-bold text-foreground">{metrics.totalExecutions}</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Successful</div>
          <div className="text-2xl font-bold text-green-400">{metrics.successfulExecutions}</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-400">{metrics.failedExecutions}</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Avg Gas Used</div>
          <div className="text-lg font-bold text-foreground">{Number(metrics.avgGasUsed).toLocaleString()}</div>
        </div>
      </div>
    </Card>
  )
}

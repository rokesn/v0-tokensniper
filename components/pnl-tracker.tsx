"use client"

import { useEffect, useState } from "react"
import type { PnLData } from "@/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function PnLTracker() {
  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPnL = async () => {
      try {
        const response = await fetch("/api/pnl/data")
        const data = await response.json()
        if (data.success) {
          setPnlData(data.data)
        }
      } catch (error) {
        console.error("Error fetching PnL data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPnL()
    const interval = setInterval(fetchPnL, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleExport = async () => {
    try {
      const response = await fetch("/api/pnl/export")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "pnl-export.csv"
      a.click()
    } catch (error) {
      console.error("Error exporting PnL:", error)
    }
  }

  if (loading) {
    return <Card className="p-6 bg-card border-border text-muted-foreground">Loading...</Card>
  }

  if (!pnlData) {
    return <Card className="p-6 bg-card border-border text-muted-foreground">No PnL data available</Card>
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Profit & Loss</h2>
        <Button onClick={handleExport} variant="outline" size="sm" className="text-xs bg-transparent">
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-foreground">{pnlData.totalTrades}</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-green-400">{pnlData.winRate.toFixed(1)}%</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Profit</div>
          <div className="text-2xl font-bold text-green-400">${pnlData.totalProfit.toFixed(2)}</div>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Loss</div>
          <div className="text-2xl font-bold text-red-400">${pnlData.totalLoss.toFixed(2)}</div>
        </div>
      </div>

      {pnlData.trades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground">Token</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Buy Price</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Sell Price</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Profit</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {pnlData.trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-2 px-2 text-foreground">{trade.tokenSymbol}</td>
                  <td className="text-right py-2 px-2 text-foreground">${trade.buyPrice.toFixed(8)}</td>
                  <td className="text-right py-2 px-2 text-foreground">${trade.sellPrice.toFixed(8)}</td>
                  <td className={`text-right py-2 px-2 ${trade.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${trade.profit.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

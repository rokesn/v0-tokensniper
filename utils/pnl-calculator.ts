// Profit/Loss tracking and analytics

import type { PnLData, Trade } from "@/types"

class PnLCalculator {
  private trades: Trade[] = []

  addTrade(trade: Trade) {
    this.trades.push(trade)
  }

  getTrades(): Trade[] {
    return this.trades
  }

  calculatePnL(): PnLData {
    const successfulTrades = this.trades.filter((t) => t.profit >= 0)
    const totalProfit = this.trades.reduce((sum, t) => sum + (t.profit > 0 ? t.profit : 0), 0)
    const totalLoss = this.trades.reduce((sum, t) => sum + (t.profit < 0 ? Math.abs(t.profit) : 0), 0)

    return {
      totalTrades: this.trades.length,
      successfulTrades: successfulTrades.length,
      totalProfit,
      totalLoss,
      winRate: this.trades.length > 0 ? (successfulTrades.length / this.trades.length) * 100 : 0,
      trades: this.trades,
    }
  }

  exportToCSV(): string {
    const headers = ["ID", "Token", "Buy Price", "Sell Price", "Amount", "Profit", "Timestamp", "TX Hash"]
    const rows = this.trades.map((t) => [
      t.id,
      t.tokenSymbol,
      t.buyPrice.toFixed(8),
      t.sellPrice.toFixed(8),
      t.amount.toFixed(8),
      t.profit.toFixed(8),
      new Date(t.timestamp).toISOString(),
      t.txHash,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    return csv
  }

  clearTrades() {
    this.trades = []
  }
}

export const pnlCalculator = new PnLCalculator()

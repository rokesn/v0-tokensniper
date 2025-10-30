// Core type definitions for the token sniper system

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
}

export interface LiquidityResult {
  exists: boolean
  dex: string
  reserves?: {
    token0: string
    token1: string
    reserve0: string
    reserve1: string
  }
  error?: string
  detectionTime: number
}

export interface SniperSession {
  id: string
  tokenAddress: string
  buyAmountEth: number
  slippage: number
  status: "active" | "monitoring" | "stopped" | "error"
  startTime: number
  lastUpdate: number
}

export interface TradeResult {
  success: boolean
  txHash?: string
  error?: string
  gasUsed?: string
  effectiveGasPrice?: string
  amountOut?: string
}

export interface PnLData {
  totalTrades: number
  successfulTrades: number
  totalProfit: number
  totalLoss: number
  winRate: number
  trades: Trade[]
}

export interface Trade {
  id: string
  tokenAddress: string
  tokenSymbol: string
  buyPrice: number
  sellPrice: number
  amount: number
  profit: number
  timestamp: number
  txHash: string
}

export interface SystemStatus {
  isRunning: boolean
  activeSessions: number
  totalMonitored: number
  lastUpdate: number
  walletBalance: string
  gasPrice: string
}

export interface LogEntry {
  id: string
  level: "INFO" | "SUCCESS" | "ERROR" | "WARNING"
  message: string
  timestamp: number
  sessionId?: string
}

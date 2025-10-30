// Real-time monitoring service for token prices and liquidity

import { ethers } from "ethers"
import { BASE_CONFIG, DEX_ADDRESSES, PERFORMANCE_CONFIG } from "./constants"
import { logger } from "./logger"
import { pnlCalculator } from "./pnl-calculator"
import type { Trade } from "@/types"

const UNISWAP_V2_ABI = [
  "function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]

export class MonitoringService {
  private provider: ethers.JsonRpcProvider
  private priceCache: Map<string, number> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    const rpcUrl = BASE_CONFIG.ALCHEMY_RPC_URL || BASE_CONFIG.RPC_URL
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  async startPriceMonitoring(
    tokenAddress: string,
    sessionId: string,
    onPriceUpdate: (price: number) => void,
  ): Promise<void> {
    logger.info(`Starting price monitoring for ${tokenAddress}`, sessionId)

    const monitoringInterval = setInterval(async () => {
      try {
        const price = await this.getCurrentPrice(tokenAddress)
        if (price > 0) {
          this.priceCache.set(tokenAddress, price)
          onPriceUpdate(price)
        }
      } catch (error) {
        logger.warning(`Price monitoring error: ${error instanceof Error ? error.message : String(error)}`, sessionId)
      }
    }, PERFORMANCE_CONFIG.MONITORING_INTERVAL_MS)

    this.monitoringIntervals.set(sessionId, monitoringInterval)
  }

  stopPriceMonitoring(sessionId: string): void {
    const interval = this.monitoringIntervals.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(sessionId)
      logger.info(`Stopped price monitoring for session ${sessionId}`, sessionId)
    }
  }

  private async getCurrentPrice(tokenAddress: string): Promise<number> {
    try {
      // Get Uniswap V2 pair reserves
      const factory = new ethers.Contract(
        DEX_ADDRESSES.UNISWAP_V2.FACTORY,
        ["function getPair(address tokenA, address tokenB) public view returns (address pair)"],
        this.provider,
      )

      const pairAddress = await factory.getPair(tokenAddress, BASE_CONFIG.WETH_ADDRESS)

      if (pairAddress === ethers.ZeroAddress) {
        return 0
      }

      const pair = new ethers.Contract(pairAddress, UNISWAP_V2_ABI, this.provider)
      const [reserve0, reserve1] = await pair.getReserves()

      if (reserve0 === 0n || reserve1 === 0n) {
        return 0
      }

      // Calculate price: ETH per token
      const price = Number(ethers.formatEther(reserve1)) / Number(ethers.formatEther(reserve0))
      return price
    } catch (error) {
      logger.warning(`Error getting current price: ${error instanceof Error ? error.message : String(error)}`)
      return 0
    }
  }

  recordTrade(
    tokenAddress: string,
    tokenSymbol: string,
    buyPrice: number,
    sellPrice: number,
    amount: number,
    txHash: string,
  ): void {
    const profit = (sellPrice - buyPrice) * amount
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random()}`,
      tokenAddress,
      tokenSymbol,
      buyPrice,
      sellPrice,
      amount,
      profit,
      timestamp: Date.now(),
      txHash,
    }

    pnlCalculator.addTrade(trade)
    logger.success(`Trade recorded: ${tokenSymbol} profit: $${profit.toFixed(2)}`)
  }

  getPriceHistory(tokenAddress: string): number | undefined {
    return this.priceCache.get(tokenAddress)
  }

  clearCache(): void {
    this.priceCache.clear()
  }
}

export const monitoringService = new MonitoringService()

import { ethers } from "ethers"
import { BASE_CONFIG, DEX_ADDRESSES, PERFORMANCE_CONFIG } from "./constants"
import { serverLogger } from "./server-logger"

const UNISWAP_V2_ABI = [
  "function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
]

const FACTORY_ABI = ["function getPair(address tokenA, address tokenB) public view returns (address pair)"]

const PAIR_ABI = [
  "function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]

export class FastLiquidityDetector {
  private provider: ethers.JsonRpcProvider
  private timeout: number
  private maxRetries: number

  constructor(timeout = PERFORMANCE_CONFIG.LIQUIDITY_TIMEOUT_MS, maxRetries = PERFORMANCE_CONFIG.MAX_RETRIES) {
    const rpcUrl = BASE_CONFIG.ALCHEMY_RPC_URL || BASE_CONFIG.RPC_URL
    console.log("[v0] Liquidity detector initialized with RPC:", rpcUrl)
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.timeout = timeout
    this.maxRetries = maxRetries
  }

  async checkLiquidityExists(tokenAddress: string, sessionId?: string) {
    const startTime = Date.now()

    try {
      const normalizedToken = tokenAddress.toLowerCase()

      if (!ethers.isAddress(normalizedToken)) {
        serverLogger.error(`Invalid token address: ${tokenAddress}`, sessionId)
        return { exists: false, dex: "none", error: "Invalid address format" }
      }

      serverLogger.info(`\n[LIQUIDITY CHECK] Checking token: ${normalizedToken}`, sessionId)

      // Check Uniswap V2
      const v2Result = await this.checkDEX("Uniswap V2", DEX_ADDRESSES.UNISWAP_V2.FACTORY, normalizedToken, sessionId)

      if (v2Result.exists) {
        serverLogger.success(`✓ LIQUIDITY FOUND on Uniswap V2 in ${Date.now() - startTime}ms`, sessionId)
        return { ...v2Result, detectionTime: Date.now() - startTime }
      }

      // Check Aerodrome
      const aeroResult = await this.checkDEX("Aerodrome", DEX_ADDRESSES.AERODROME.FACTORY, normalizedToken, sessionId)

      if (aeroResult.exists) {
        serverLogger.success(`✓ LIQUIDITY FOUND on Aerodrome in ${Date.now() - startTime}ms`, sessionId)
        return { ...aeroResult, detectionTime: Date.now() - startTime }
      }

      serverLogger.info(`No liquidity found after ${Date.now() - startTime}ms`, sessionId)
      return { exists: false, dex: "none", error: "No liquidity found" }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      serverLogger.error(`Liquidity check error: ${errorMsg}`, sessionId)
      return { exists: false, dex: "none", error: errorMsg }
    }
  }

  private async checkDEX(dexName: string, factoryAddress: string, tokenAddress: string, sessionId?: string) {
    try {
      serverLogger.info(`  Checking ${dexName}...`, sessionId)

      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, this.provider)
      const pairAddress = await factory.getPair(tokenAddress, BASE_CONFIG.WETH_ADDRESS)

      if (pairAddress === ethers.ZeroAddress) {
        serverLogger.info(`    No pair found`, sessionId)
        return { exists: false, dex: dexName.toLowerCase() }
      }

      serverLogger.info(`    Pair found: ${pairAddress}`, sessionId)

      // Check reserves
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider)
      const reserves = await pair.getReserves()

      const reserve0 = reserves[0]
      const reserve1 = reserves[1]

      serverLogger.info(`    Reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`, sessionId)

      const hasLiquidity = reserve0 > 0n && reserve1 > 0n

      if (hasLiquidity) {
        serverLogger.success(`    ✓ Liquidity confirmed!`, sessionId)
        return {
          exists: true,
          dex: dexName.toLowerCase(),
          reserves: { reserve0: reserve0.toString(), reserve1: reserve1.toString() },
        }
      }

      return { exists: false, dex: dexName.toLowerCase() }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      serverLogger.warning(`    ${dexName} error: ${errorMsg}`, sessionId)
      return { exists: false, dex: dexName.toLowerCase(), error: errorMsg }
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ])
  }
}

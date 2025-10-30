import { ethers } from "ethers"
import type { TradeResult } from "@/types"
import { BASE_CONFIG, DEX_ADDRESSES, TRADING_CONFIG } from "./constants"
import { serverLogger } from "./server-logger"
import { sessionManager } from "./session-manager"
import { FastLiquidityDetector } from "./liquidity-detector"

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
]

const ERC20_ABI = [
  "function balanceOf(address account) public view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transfer(address to, uint256 amount) public returns (bool)",
]

export class SniperEngine {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet | null = null
  private liquidityDetector: FastLiquidityDetector
  private activeSessions: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    const rpcUrl = BASE_CONFIG.ALCHEMY_RPC_URL || BASE_CONFIG.RPC_URL
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.liquidityDetector = new FastLiquidityDetector()

    // Initialize wallet if private key is available
    const privateKey = process.env.PRIVATE_KEY
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider)
      serverLogger.success("✓ Wallet initialized")
      serverLogger.info(`Wallet address: ${this.wallet.address}`)
    } else {
      serverLogger.warning("⚠ No private key configured - dry run mode only")
    }
  }

  async startSniping(tokenAddress: string, buyAmountEth: number, slippage: number): Promise<string> {
    const sessionId = sessionManager.createSession(tokenAddress, buyAmountEth, slippage)
    serverLogger.info(`═══════════════════════════════════════════════════════════`, sessionId)
    serverLogger.success(`✓ Sniper started with session ID: ${sessionId}`, sessionId)
    serverLogger.info(`═══════════════════════════════════════════════════════════`, sessionId)
    serverLogger.info(`Token: ${tokenAddress}`, sessionId)
    serverLogger.info(`Buy amount: ${buyAmountEth} ETH`, sessionId)
    serverLogger.info(`Slippage: ${slippage}%`, sessionId)

    serverLogger.info(`\n[STEP 1] Checking liquidity immediately...`, sessionId)
    const liquidityResult = await this.liquidityDetector.checkLiquidityExists(tokenAddress, sessionId)

    if (liquidityResult.exists) {
      serverLogger.success(`✓ LIQUIDITY CONFIRMED on ${liquidityResult.dex}!`, sessionId)
      serverLogger.info(
        `Reserves: ${liquidityResult.reserves?.reserve0} / ${liquidityResult.reserves?.reserve1}`,
        sessionId,
      )
      serverLogger.info(`\n[STEP 2] Executing buy transaction...`, sessionId)
      // Execute buy transaction
      await this.executeBuy(sessionId, tokenAddress, buyAmountEth, slippage, liquidityResult.dex)
    } else {
      serverLogger.warning(`⚠ No liquidity found - starting continuous monitoring`, sessionId)
      serverLogger.info(`Monitoring interval: 500ms`, sessionId)
      sessionManager.updateSession(sessionId, { status: "monitoring" })
      // Start monitoring for liquidity
      this.startMonitoring(sessionId, tokenAddress, buyAmountEth, slippage)
    }

    return sessionId
  }

  private startMonitoring(sessionId: string, tokenAddress: string, buyAmountEth: number, slippage: number) {
    serverLogger.info(`\n[MONITORING] Starting continuous liquidity monitoring...`, sessionId)
    let checkCount = 0

    const monitoringInterval = setInterval(async () => {
      const session = sessionManager.getSession(sessionId)
      if (!session || session.status === "stopped") {
        serverLogger.info(`[MONITORING] Stopping monitoring for session ${sessionId}`, sessionId)
        clearInterval(monitoringInterval)
        this.activeSessions.delete(sessionId)
        return
      }

      checkCount++
      if (checkCount % 5 === 0) {
        serverLogger.info(`[MONITORING] Check #${checkCount}...`, sessionId)
      }

      const liquidityResult = await this.liquidityDetector.checkLiquidityExists(tokenAddress, sessionId)

      if (liquidityResult.exists) {
        serverLogger.success(`✓✓✓ LIQUIDITY DETECTED on ${liquidityResult.dex} after ${checkCount} checks!`, sessionId)
        serverLogger.info(
          `Reserves: ${liquidityResult.reserves?.reserve0} / ${liquidityResult.reserves?.reserve1}`,
          sessionId,
        )
        serverLogger.info(`\n[STEP 2] Executing buy transaction...`, sessionId)
        clearInterval(monitoringInterval)
        this.activeSessions.delete(sessionId)
        await this.executeBuy(sessionId, tokenAddress, buyAmountEth, slippage, liquidityResult.dex)
      }
    }, 500) // Check every 500ms for ultra-fast detection

    this.activeSessions.set(sessionId, monitoringInterval)
  }

  private async executeBuy(
    sessionId: string,
    tokenAddress: string,
    buyAmountEth: number,
    slippage: number,
    dex: string,
  ): Promise<TradeResult> {
    try {
      if (!this.wallet) {
        serverLogger.error("✗ Dry run mode - no wallet configured", sessionId)
        return {
          success: false,
          error: "No wallet configured",
        }
      }

      serverLogger.info(`Building buy transaction for ${buyAmountEth} ETH on ${dex}`, sessionId)

      const balance = await this.provider.getBalance(this.wallet.address)
      const balanceEth = ethers.formatEther(balance)
      serverLogger.info(`Wallet balance: ${balanceEth} ETH`, sessionId)

      if (balance < ethers.parseEther(buyAmountEth.toString())) {
        serverLogger.error(`✗ Insufficient balance: ${balanceEth} ETH < ${buyAmountEth} ETH required`, sessionId)
        return {
          success: false,
          error: `Insufficient balance: ${balanceEth} ETH < ${buyAmountEth} ETH required`,
        }
      }

      const routerAddress = dex === "uniswap-v2" ? DEX_ADDRESSES.UNISWAP_V2.ROUTER : DEX_ADDRESSES.AERODROME.ROUTER
      serverLogger.info(`Using router: ${routerAddress}`, sessionId)

      const router = new ethers.Contract(routerAddress, ROUTER_ABI, this.wallet)

      // Calculate minimum output with slippage
      const amountOutMin = ethers
        .parseEther(buyAmountEth.toString())
        .mul(10000n - BigInt(slippage))
        .div(10000n)

      serverLogger.info(`Amount out min: ${ethers.formatEther(amountOutMin)} tokens`, sessionId)

      const path = [BASE_CONFIG.WETH_ADDRESS, tokenAddress]
      const deadline = Math.floor(Date.now() / 1000) + TRADING_CONFIG.TRANSACTION_DEADLINE

      serverLogger.info(`Executing swap: ${buyAmountEth} ETH -> ${tokenAddress}`, sessionId)
      serverLogger.info(`Path: ${path.join(" -> ")}`, sessionId)

      try {
        const gasEstimate = await router.swapExactETHForTokens.estimateGas(
          amountOutMin,
          path,
          this.wallet.address,
          deadline,
          {
            value: ethers.parseEther(buyAmountEth.toString()),
          },
        )
        serverLogger.info(`Estimated gas: ${gasEstimate.toString()}`, sessionId)
      } catch (gasError) {
        serverLogger.warning(
          `Gas estimation failed: ${gasError instanceof Error ? gasError.message : String(gasError)}`,
          sessionId,
        )
      }

      const tx = await router.swapExactETHForTokens(amountOutMin, path, this.wallet.address, deadline, {
        value: ethers.parseEther(buyAmountEth.toString()),
        gasLimit: 500000n,
      })

      serverLogger.success(`✓ Transaction sent: ${tx.hash}`, sessionId)
      sessionManager.updateSession(sessionId, { status: "active", txHash: tx.hash })

      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        serverLogger.success(`✓✓✓ Buy transaction confirmed: ${tx.hash}`, sessionId)
        serverLogger.info(`Gas used: ${receipt.gasUsed.toString()}`, sessionId)
        return {
          success: true,
          txHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.gasPrice.toString(),
        }
      } else {
        serverLogger.error(`✗ Transaction failed: ${tx.hash}`, sessionId)
        return {
          success: false,
          error: "Transaction reverted",
          txHash: tx.hash,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      serverLogger.error(`✗ Buy execution failed: ${errorMessage}`, sessionId)
      serverLogger.info(`Error details: ${JSON.stringify(error)}`, sessionId)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async stopSniping(sessionId: string) {
    serverLogger.info(`Stopping sniper session ${sessionId}`, sessionId)
    sessionManager.stopSession(sessionId)

    const interval = this.activeSessions.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.activeSessions.delete(sessionId)
    }
  }

  getSessionStatus(sessionId: string) {
    return sessionManager.getSession(sessionId)
  }

  getAllSessions() {
    return sessionManager.getAllSessions()
  }

  getActiveSessions() {
    return sessionManager.getActiveSessions()
  }
}

export const sniperEngine = new SniperEngine()

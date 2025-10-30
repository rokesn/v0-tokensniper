import { type NextRequest, NextResponse } from "next/server"
import { sniperEngine } from "@/utils/sniper-engine"
import { logger } from "@/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress, buyAmountEth, slippage } = await request.json()

    // Validate inputs
    if (!tokenAddress || typeof tokenAddress !== "string") {
      return NextResponse.json({ error: "Invalid token address" }, { status: 400 })
    }

    if (!buyAmountEth || typeof buyAmountEth !== "number" || buyAmountEth <= 0) {
      return NextResponse.json({ error: "Invalid buy amount" }, { status: 400 })
    }

    if (!slippage || typeof slippage !== "number" || slippage < 0 || slippage > 5000) {
      return NextResponse.json({ error: "Invalid slippage" }, { status: 400 })
    }

    logger.info(`API: Starting sniper for ${tokenAddress} with ${buyAmountEth} ETH`)

    const sessionId = await sniperEngine.startSniping(tokenAddress, buyAmountEth, slippage)

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Sniper started successfully",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`API Error in /sniper/start: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

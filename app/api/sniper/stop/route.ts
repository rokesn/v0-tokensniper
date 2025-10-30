import { type NextRequest, NextResponse } from "next/server"
import { sniperEngine } from "@/utils/sniper-engine"
import { logger } from "@/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    logger.info(`API: Stopping sniper session ${sessionId}`)
    await sniperEngine.stopSniping(sessionId)

    return NextResponse.json({
      success: true,
      message: "Sniper stopped successfully",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`API Error in /sniper/stop: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

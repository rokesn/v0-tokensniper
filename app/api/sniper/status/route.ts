import { NextResponse } from "next/server"
import { sniperEngine } from "@/utils/sniper-engine"

export async function GET() {
  try {
    const activeSessions = sniperEngine.getActiveSessions()
    const allSessions = sniperEngine.getAllSessions()

    const status = {
      isRunning: activeSessions.length > 0,
      activeSessions: activeSessions.length,
      totalMonitored: allSessions.length,
      lastUpdate: Date.now(),
    }

    return NextResponse.json({
      success: true,
      status,
      sessions: allSessions,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

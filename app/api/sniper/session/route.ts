import { type NextRequest, NextResponse } from "next/server"
import { sniperEngine } from "@/utils/sniper-engine"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("id")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const session = sniperEngine.getSessionStatus(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session,
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

import { NextResponse } from "next/server"
import { serverLogger } from "@/utils/server-logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    let logs
    if (sessionId) {
      logs = serverLogger.getSessionLogs(sessionId)
    } else {
      logs = serverLogger.getGlobalLogs()
    }

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      sessionId: sessionId || "global",
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

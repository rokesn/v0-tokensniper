import { NextResponse } from "next/server"
import { logger } from "@/utils/logger"

export async function GET() {
  try {
    const logs = logger.getLogs()

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
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

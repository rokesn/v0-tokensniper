import { NextResponse } from "next/server"
import { performanceTracker } from "@/utils/performance-tracker"

export async function GET() {
  try {
    const metrics = performanceTracker.getMetrics()

    return NextResponse.json({
      success: true,
      metrics,
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

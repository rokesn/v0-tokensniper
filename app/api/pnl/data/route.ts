import { NextResponse } from "next/server"
import { pnlCalculator } from "@/utils/pnl-calculator"

export async function GET() {
  try {
    const pnlData = pnlCalculator.calculatePnL()

    return NextResponse.json({
      success: true,
      data: pnlData,
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

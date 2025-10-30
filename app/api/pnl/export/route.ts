import { NextResponse } from "next/server"
import { pnlCalculator } from "@/utils/pnl-calculator"

export async function GET() {
  try {
    const csv = pnlCalculator.exportToCSV()

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="pnl-export.csv"',
      },
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

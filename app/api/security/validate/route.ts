import { type NextRequest, NextResponse } from "next/server"
import { securityValidator } from "@/utils/security-validator"
import { InputValidator } from "@/utils/input-validator"
import { logger } from "@/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress } = await request.json()

    // Validate input
    const validation = InputValidator.validateTokenAddress(tokenAddress)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    logger.info(`Security validation requested for ${tokenAddress}`)

    // Run security checks
    const result = await securityValidator.validateToken(tokenAddress)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Security validation error: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

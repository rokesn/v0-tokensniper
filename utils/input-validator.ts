// Input validation and sanitization

import { ethers } from "ethers"

export class InputValidator {
  static validateTokenAddress(address: string): { valid: boolean; error?: string } {
    if (!address || typeof address !== "string") {
      return { valid: false, error: "Token address is required" }
    }

    if (!ethers.isAddress(address)) {
      return { valid: false, error: "Invalid token address format" }
    }

    return { valid: true }
  }

  static validateBuyAmount(amount: number): { valid: boolean; error?: string } {
    if (typeof amount !== "number" || isNaN(amount)) {
      return { valid: false, error: "Buy amount must be a number" }
    }

    if (amount <= 0) {
      return { valid: false, error: "Buy amount must be greater than 0" }
    }

    if (amount > 10) {
      return { valid: false, error: "Buy amount cannot exceed 10 ETH" }
    }

    return { valid: true }
  }

  static validateSlippage(slippage: number): { valid: boolean; error?: string } {
    if (typeof slippage !== "number" || isNaN(slippage)) {
      return { valid: false, error: "Slippage must be a number" }
    }

    if (slippage < 0 || slippage > 5000) {
      return { valid: false, error: "Slippage must be between 0 and 5000 BPS" }
    }

    return { valid: true }
  }

  static sanitizeAddress(address: string): string {
    return address.toLowerCase().trim()
  }

  static validateSessionId(sessionId: string): { valid: boolean; error?: string } {
    if (!sessionId || typeof sessionId !== "string") {
      return { valid: false, error: "Session ID is required" }
    }

    if (sessionId.length < 10 || sessionId.length > 100) {
      return { valid: false, error: "Invalid session ID format" }
    }

    return { valid: true }
  }
}

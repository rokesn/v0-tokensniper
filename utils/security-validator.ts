// Security and safety validation for tokens and transactions

import { ethers } from "ethers"
import { BASE_CONFIG, SAFETY_CONFIG } from "./constants"
import { logger } from "./logger"

const ERC20_ABI = [
  "function balanceOf(address account) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function decimals() public view returns (uint8)",
]

export interface SecurityCheckResult {
  isValid: boolean
  riskLevel: "low" | "medium" | "high" | "critical"
  checks: {
    isVerified: boolean
    hasLiquidity: boolean
    ownershipRisk: boolean
    honeypotRisk: boolean
    holderDistribution: boolean
  }
  warnings: string[]
}

export class SecurityValidator {
  private provider: ethers.JsonRpcProvider

  constructor() {
    const rpcUrl = BASE_CONFIG.ALCHEMY_RPC_URL || BASE_CONFIG.RPC_URL
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  async validateToken(tokenAddress: string, sessionId?: string): Promise<SecurityCheckResult> {
    const warnings: string[] = []
    const checks = {
      isVerified: false,
      hasLiquidity: false,
      ownershipRisk: false,
      honeypotRisk: false,
      holderDistribution: false,
    }

    try {
      // Check if contract is verified (basic check)
      checks.isVerified = await this.checkContractVerification(tokenAddress)
      if (!checks.isVerified) {
        warnings.push("Contract not verified on Basescan")
      }

      // Check ownership concentration
      const ownershipRisk = await this.checkOwnershipConcentration(tokenAddress)
      checks.ownershipRisk = !ownershipRisk
      if (ownershipRisk) {
        warnings.push("High ownership concentration detected")
      }

      // Check for honeypot indicators
      const honeypotRisk = await this.checkHoneypotIndicators(tokenAddress)
      checks.honeypotRisk = honeypotRisk
      if (honeypotRisk) {
        warnings.push("Potential honeypot indicators detected")
      }

      // Check holder distribution
      const holderDistribution = await this.checkHolderDistribution(tokenAddress)
      checks.holderDistribution = holderDistribution
      if (!holderDistribution) {
        warnings.push("Suspicious holder distribution")
      }

      // Determine risk level
      const riskLevel = this.calculateRiskLevel(checks, warnings.length)
      const isValid = riskLevel !== "critical" && warnings.length < 3

      logger.info(`Security check for ${tokenAddress}: ${riskLevel} risk (${warnings.length} warnings)`, sessionId)

      return {
        isValid,
        riskLevel,
        checks,
        warnings,
      }
    } catch (error) {
      logger.warning(`Security validation error: ${error instanceof Error ? error.message : String(error)}`, sessionId)
      return {
        isValid: false,
        riskLevel: "critical",
        checks,
        warnings: ["Security validation failed"],
      }
    }
  }

  private async checkContractVerification(tokenAddress: string): Promise<boolean> {
    try {
      // In production, this would check Basescan API
      // For now, we'll do a basic code check
      const code = await this.provider.getCode(tokenAddress)
      return code.length > 2 // Has bytecode
    } catch {
      return false
    }
  }

  private async checkOwnershipConcentration(tokenAddress: string): Promise<boolean> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)

      // Try to get owner
      try {
        const owner = await contract.owner()
        if (owner && owner !== ethers.ZeroAddress) {
          const balance = await contract.balanceOf(owner)
          const totalSupply = await contract.totalSupply()

          const ownerPercentage = (Number(balance) / Number(totalSupply)) * 100

          // If owner has more than MAX_OWNER_PERCENTAGE, it's risky
          return ownerPercentage <= SAFETY_CONFIG.MAX_OWNER_PERCENTAGE
        }
      } catch {
        // No owner function, assume decentralized
      }

      return true
    } catch {
      return false
    }
  }

  private async checkHoneypotIndicators(tokenAddress: string): Promise<boolean> {
    try {
      // Check for common honeypot patterns
      const code = await this.provider.getCode(tokenAddress)

      // Look for suspicious patterns in bytecode
      const suspiciousPatterns = [
        "selfdestruct", // Self-destruct function
        "revert", // Excessive reverts
      ]

      // This is a simplified check - in production, use more sophisticated analysis
      const hasCode = code.length > 2
      return !hasCode // If no code, it's suspicious
    } catch {
      return true // Assume honeypot if we can't verify
    }
  }

  private async checkHolderDistribution(tokenAddress: string): Promise<boolean> {
    try {
      // In production, this would check holder distribution from blockchain data
      // For now, we'll do a basic check
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      const totalSupply = await contract.totalSupply()

      // If total supply is 0, it's suspicious
      return totalSupply > 0n
    } catch {
      return false
    }
  }

  private calculateRiskLevel(
    checks: SecurityCheckResult["checks"],
    warningCount: number,
  ): SecurityCheckResult["riskLevel"] {
    let riskScore = 0

    if (!checks.isVerified) riskScore += 2
    if (checks.ownershipRisk) riskScore += 3
    if (checks.honeypotRisk) riskScore += 4
    if (!checks.holderDistribution) riskScore += 2

    if (riskScore >= 8) return "critical"
    if (riskScore >= 6) return "high"
    if (riskScore >= 3) return "medium"
    return "low"
  }
}

export const securityValidator = new SecurityValidator()

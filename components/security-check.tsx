"use client"

import { useState } from "react"
import type { SecurityCheckResult } from "@/utils/security-validator"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SecurityCheck() {
  const [tokenAddress, setTokenAddress] = useState("")
  const [result, setResult] = useState<SecurityCheckResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    if (!tokenAddress.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/security/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.result)
      }
    } catch (error) {
      console.error("Security check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-400"
      case "medium":
        return "text-yellow-400"
      case "high":
        return "text-orange-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Security Check</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="security-token" className="text-sm text-muted-foreground mb-2 block">
            Token Address
          </Label>
          <div className="flex gap-2">
            <Input
              id="security-token"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground flex-1"
              disabled={loading}
            />
            <Button onClick={handleCheck} disabled={loading || !tokenAddress.trim()} className="bg-primary">
              {loading ? "Checking..." : "Check"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Level:</span>
              <span className={`font-semibold ${getRiskColor(result.riskLevel)}`}>
                {result.riskLevel.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Checks:</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className={result.checks.isVerified ? "text-green-400" : "text-red-400"}>
                    {result.checks.isVerified ? "✓" : "✗"}
                  </span>
                  <span>Contract Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={!result.checks.ownershipRisk ? "text-green-400" : "text-red-400"}>
                    {!result.checks.ownershipRisk ? "✓" : "✗"}
                  </span>
                  <span>Ownership Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={!result.checks.honeypotRisk ? "text-green-400" : "text-red-400"}>
                    {!result.checks.honeypotRisk ? "✓" : "✗"}
                  </span>
                  <span>No Honeypot Indicators</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={result.checks.holderDistribution ? "text-green-400" : "text-red-400"}>
                    {result.checks.holderDistribution ? "✓" : "✗"}
                  </span>
                  <span>Good Holder Distribution</span>
                </div>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-xs text-yellow-400 font-semibold">Warnings:</div>
                <ul className="text-xs text-yellow-300/80 space-y-1">
                  {result.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logger } from "@/utils/logger"
import { TRADING_CONFIG } from "@/utils/constants"

interface SniperControlsProps {
  onStart: (tokenAddress: string, buyAmountEth: number, slippage: number) => Promise<void>
  isLoading?: boolean
}

export function SniperControls({ onStart, isLoading = false }: SniperControlsProps) {
  const [tokenAddress, setTokenAddress] = useState("")
  const [buyAmountEth, setBuyAmountEth] = useState(String(TRADING_CONFIG.DEFAULT_BUY_AMOUNT_ETH))
  const [slippage, setSlippage] = useState(String(TRADING_CONFIG.DEFAULT_SLIPPAGE_BPS))

  const handleStart = async () => {
    if (!tokenAddress.trim()) {
      logger.error("Token address is required")
      return
    }

    try {
      const amount = Number.parseFloat(buyAmountEth)
      const slip = Number.parseInt(slippage)

      if (isNaN(amount) || amount <= 0) {
        logger.error("Invalid buy amount")
        return
      }

      if (isNaN(slip) || slip < 0 || slip > 5000) {
        logger.error("Slippage must be between 0 and 5000 BPS")
        return
      }

      await onStart(tokenAddress, amount, slip)
      setTokenAddress("")
      setBuyAmountEth(String(TRADING_CONFIG.DEFAULT_BUY_AMOUNT_ETH))
      setSlippage(String(TRADING_CONFIG.DEFAULT_SLIPPAGE_BPS))
    } catch (error) {
      logger.error(`Error starting sniper: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-6">Start Sniping</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="token" className="text-sm text-muted-foreground mb-2 block">
            Token Address
          </Label>
          <Input
            id="token"
            placeholder="0x..."
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount" className="text-sm text-muted-foreground mb-2 block">
              Buy Amount (ETH)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder={String(TRADING_CONFIG.DEFAULT_BUY_AMOUNT_ETH)}
              value={buyAmountEth}
              onChange={(e) => setBuyAmountEth(e.target.value)}
              step="0.001"
              min="0"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="slippage" className="text-sm text-muted-foreground mb-2 block">
              Slippage (BPS)
            </Label>
            <Input
              id="slippage"
              type="number"
              placeholder={String(TRADING_CONFIG.DEFAULT_SLIPPAGE_BPS)}
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              step="10"
              min="0"
              max="5000"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={isLoading || !tokenAddress.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {isLoading ? "Starting..." : "Start Sniper"}
        </Button>
      </div>
    </Card>
  )
}

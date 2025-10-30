"use client"

import { Card } from "@/components/ui/card"

export function SecurityWarning() {
  return (
    <Card className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex gap-3">
        <div className="text-red-400 font-bold text-lg">⚠️</div>
        <div>
          <h3 className="font-semibold text-red-400 mb-2">Security & Risk Disclaimer</h3>
          <ul className="text-xs text-red-300/80 space-y-1">
            <li>• Token sniping involves significant financial risk - you may lose all invested funds</li>
            <li>• Many tokens are scams, honeypots, or rugpulls - always verify before investing</li>
            <li>• This tool is for educational purposes only - use at your own risk</li>
            <li>• Always test with small amounts first on testnet</li>
            <li>• Never share your private key or seed phrase with anyone</li>
            <li>• Keep your wallet secure and use a dedicated account for sniping</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

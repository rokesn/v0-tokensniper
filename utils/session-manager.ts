// Session management for concurrent sniper instances

import type { SniperSession } from "@/types"

class SessionManager {
  private sessions: Map<string, SniperSession> = new Map()

  createSession(tokenAddress: string, buyAmountEth: number, slippage: number): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const session: SniperSession = {
      id: sessionId,
      tokenAddress,
      buyAmountEth,
      slippage,
      status: "active",
      startTime: Date.now(),
      lastUpdate: Date.now(),
    }

    this.sessions.set(sessionId, session)
    return sessionId
  }

  getSession(sessionId: string): SniperSession | undefined {
    return this.sessions.get(sessionId)
  }

  updateSession(sessionId: string, updates: Partial<SniperSession>) {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        ...updates,
        lastUpdate: Date.now(),
      })
    }
  }

  stopSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        status: "stopped",
      })
    }
  }

  getAllSessions(): SniperSession[] {
    return Array.from(this.sessions.values())
  }

  getActiveSessions(): SniperSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.status === "active" || s.status === "monitoring")
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId)
  }
}

export const sessionManager = new SessionManager()

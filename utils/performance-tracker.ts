// Track system performance metrics

interface PerformanceMetrics {
  avgExecutionTime: number
  successRate: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgGasUsed: string
  lastUpdate: number
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    avgExecutionTime: 0,
    successRate: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgGasUsed: "0",
    lastUpdate: Date.now(),
  }

  private executionTimes: number[] = []
  private gasUsages: bigint[] = []

  recordExecution(executionTime: number, success: boolean, gasUsed?: string): void {
    this.executionTimes.push(executionTime)
    this.metrics.totalExecutions++

    if (success) {
      this.metrics.successfulExecutions++
    } else {
      this.metrics.failedExecutions++
    }

    if (gasUsed) {
      try {
        this.gasUsages.push(BigInt(gasUsed))
      } catch {
        // Invalid gas value, skip
      }
    }

    this.updateMetrics()
  }

  private updateMetrics(): void {
    // Calculate average execution time
    if (this.executionTimes.length > 0) {
      const sum = this.executionTimes.reduce((a, b) => a + b, 0)
      this.metrics.avgExecutionTime = sum / this.executionTimes.length
    }

    // Calculate success rate
    if (this.metrics.totalExecutions > 0) {
      this.metrics.successRate = (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100
    }

    // Calculate average gas used
    if (this.gasUsages.length > 0) {
      const sum = this.gasUsages.reduce((a, b) => a + b, 0n)
      this.metrics.avgGasUsed = (sum / BigInt(this.gasUsages.length)).toString()
    }

    this.metrics.lastUpdate = Date.now()

    // Keep only last 1000 execution times to prevent memory bloat
    if (this.executionTimes.length > 1000) {
      this.executionTimes = this.executionTimes.slice(-1000)
    }

    if (this.gasUsages.length > 1000) {
      this.gasUsages = this.gasUsages.slice(-1000)
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.metrics = {
      avgExecutionTime: 0,
      successRate: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgGasUsed: "0",
      lastUpdate: Date.now(),
    }
    this.executionTimes = []
    this.gasUsages = []
  }
}

export const performanceTracker = new PerformanceTracker()

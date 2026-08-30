export class StatsService {
  private startTime = Date.now();
  private commandCount = 0;
  private searchCount = 0;
  private buttonInteractions = 0;

  public recordCommand(): void {
    this.commandCount++;
  }

  public recordSearch(): void {
    this.searchCount++;
  }

  public recordButton(): void {
    this.buttonInteractions++;
  }

  public getStats(): {
    uptimeSeconds: number;
    totalCommands: number;
    totalSearches: number;
    totalButtonClicks: number;
    memoryUsageMB: number;
  } {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsageMB = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;

    return {
      uptimeSeconds,
      totalCommands: this.commandCount,
      totalSearches: this.searchCount,
      totalButtonClicks: this.buttonInteractions,
      memoryUsageMB,
    };
  }
}

export const statsService = new StatsService();

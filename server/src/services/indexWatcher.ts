import { FileService } from './fileService.js';

/**
 * 索引监控服务 - 自动检测新文章并更新索引
 */
export class IndexWatcher {
  private fileService: FileService;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number;
  private isRunning: boolean = false;

  constructor(checkIntervalSeconds: number = 10) {
    this.fileService = new FileService();
    this.checkInterval = checkIntervalSeconds * 1000;
  }

  /**
   * 启动监控
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Index watcher is already running');
      return;
    }

    console.log(`👁️  Index watcher started (checking every ${this.checkInterval / 1000}s)`);
    this.isRunning = true;

    // 立即执行一次同步
    this.checkAndSync();

    // 定期检查
    this.intervalId = setInterval(() => {
      this.checkAndSync();
    }, this.checkInterval);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('👁️  Index watcher stopped');
    }
  }

  /**
   * 检查并同步索引
   */
  private async checkAndSync(): Promise<void> {
    try {
      const { added, removed } = await this.fileService.syncIndex();
      
      if (added.length === 0 && removed.length === 0) {
        // 没有变化，不输出日志
        return;
      }

      console.log('📋 Index synchronized:');
      if (added.length > 0) {
        console.log(`   ➕ Added: ${added.length} article(s)`);
      }
      if (removed.length > 0) {
        console.log(`   ➖ Removed: ${removed.length} article(s)`);
      }
    } catch (error) {
      console.error('❌ Failed to sync index:', error);
    }
  }

  /**
   * 手动触发同步
   */
  async manualSync(): Promise<{ added: string[], removed: string[] }> {
    return await this.fileService.syncIndex();
  }
}



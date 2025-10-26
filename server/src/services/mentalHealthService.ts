import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { CONFIG } from '../config/index.js';
import type { MentalHealthSession, MentalHealthMessage, SessionIndex } from '../types/index.js';

/**
 * 生成 16 位随机 UUID（使用 hex 编码）
 */
function generateId(): string {
  return randomBytes(8).toString('hex'); // 8 字节 = 16 个十六进制字符
}

/**
 * 心理咨询服务 - 处理会话文件夹存储和管理
 * 结构: mentalhealth/{sessionId}/session.json
 */
export class MentalHealthService {
  private sessionsBasePath: string;
  private indexPath: string;

  constructor() {
    this.sessionsBasePath = CONFIG.storage.mentalHealthBasePath;
    this.indexPath = path.join(this.sessionsBasePath, 'index.json');
  }

  /**
   * 初始化心理咨询目录
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsBasePath, { recursive: true });
      console.log(`✓ Mental health sessions directory ready: ${this.sessionsBasePath}`);
    } catch (error) {
      console.error('Failed to initialize mental health sessions directory:', error);
      throw error;
    }
  }

  /**
   * 生成新的会话 ID
   */
  generateSessionId(): string {
    return generateId();
  }

  /**
   * 获取会话文件夹路径
   */
  private getSessionFolderPath(sessionId: string): string {
    return path.join(this.sessionsBasePath, sessionId);
  }

  /**
   * 获取会话文件路径
   */
  private getSessionFilePath(sessionId: string): string {
    return path.join(this.getSessionFolderPath(sessionId), 'session.json');
  }

  /**
   * 读取索引文件
   */
  async readIndex(): Promise<SessionIndex> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      // 如果文件不存在，返回空索引
      if (error.code === 'ENOENT') {
        return { sessions: [] };
      }
      throw error;
    }
  }

  /**
   * 更新索引文件
   */
  async updateIndex(index: SessionIndex): Promise<void> {
    await fs.writeFile(
      this.indexPath,
      JSON.stringify(index, null, 2) + '\n',
      'utf-8'
    );
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(): Promise<MentalHealthSession[]> {
    const index = await this.readIndex();
    const sessions: MentalHealthSession[] = [];

    for (const sessionId of index.sessions) {
      try {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      } catch (error) {
        console.error(`Failed to load session ${sessionId}:`, error);
      }
    }

    // 按创建时间倒序排列（最新的在前）
    return sessions.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 获取单个会话
   */
  async getSession(sessionId: string): Promise<MentalHealthSession | null> {
    try {
      const sessionPath = this.getSessionFilePath(sessionId);
      const content = await fs.readFile(sessionPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 创建新会话
   */
  async createSession(): Promise<MentalHealthSession> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: MentalHealthSession = {
      id: sessionId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    // 创建会话文件夹
    const sessionFolderPath = this.getSessionFolderPath(sessionId);
    await fs.mkdir(sessionFolderPath, { recursive: true });

    // 保存会话文件
    const sessionPath = this.getSessionFilePath(sessionId);
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2) + '\n', 'utf-8');

    // 更新索引
    const index = await this.readIndex();
    if (!index.sessions.includes(sessionId)) {
      index.sessions.unshift(sessionId); // 新会话放在最前面
      await this.updateIndex(index);
    }

    console.log(`✓ Created session folder: ${sessionId}`);
    return session;
  }

  /**
   * 更新会话
   */
  async updateSession(sessionId: string, session: MentalHealthSession): Promise<MentalHealthSession> {
    // 确保 ID 匹配
    if (session.id !== sessionId) {
      throw new Error('Session ID mismatch');
    }

    // 检查会话是否存在
    const exists = await this.sessionExists(sessionId);
    if (!exists) {
      throw new Error('Session not found');
    }

    // 更新时间戳
    session.updatedAt = new Date().toISOString();

    // 保存更新后的会话
    const sessionPath = this.getSessionFilePath(sessionId);
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2) + '\n', 'utf-8');

    console.log(`✓ Updated session: ${sessionId}`);
    return session;
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionFolderPath = this.getSessionFolderPath(sessionId);

    try {
      // 递归删除整个文件夹
      await fs.rm(sessionFolderPath, { recursive: true, force: true });

      // 从索引中移除
      const index = await this.readIndex();
      index.sessions = index.sessions.filter(id => id !== sessionId);
      await this.updateIndex(index);

      console.log(`✓ Deleted session folder: ${sessionId}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // 文件夹不存在，只从索引中移除
        const index = await this.readIndex();
        index.sessions = index.sessions.filter(id => id !== sessionId);
        await this.updateIndex(index);
      } else {
        throw error;
      }
    }
  }

  /**
   * 检查会话是否存在
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const sessionPath = this.getSessionFilePath(sessionId);
    try {
      await fs.access(sessionPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 添加消息到会话
   */
  async addMessage(sessionId: string, message: MentalHealthMessage): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    session.messages.push(message);
    await this.updateSession(sessionId, session);
    console.log(`✓ Added message to session: ${sessionId}`);
  }

  /**
   * 获取会话的所有消息
   */
  async getMessages(sessionId: string): Promise<MentalHealthMessage[]> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session.messages;
  }

  /**
   * 扫描所有会话文件夹，同步索引
   */
  async syncIndex(): Promise<{ added: string[], removed: string[] }> {
    try {
      const entries = await fs.readdir(this.sessionsBasePath, { withFileTypes: true });
      const actualSessions = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      const index = await this.readIndex();
      const indexedSessions = new Set(index.sessions);

      const added: string[] = [];
      const removed: string[] = [];

      // 找出需要添加的会话
      for (const sessionId of actualSessions) {
        if (!indexedSessions.has(sessionId)) {
          added.push(sessionId);
        }
      }

      // 找出需要删除的会话
      const actualSessionsSet = new Set(actualSessions);
      for (const sessionId of index.sessions) {
        if (!actualSessionsSet.has(sessionId)) {
          removed.push(sessionId);
        }
      }

      // 更新索引
      if (added.length > 0 || removed.length > 0) {
        const newIndex: SessionIndex = {
          sessions: actualSessions.sort().reverse(), // 降序排列
        };
        await this.updateIndex(newIndex);

        if (added.length > 0) {
          console.log(`✓ Added sessions to index: ${added.join(', ')}`);
        }
        if (removed.length > 0) {
          console.log(`✓ Removed sessions from index: ${removed.join(', ')}`);
        }
      }

      return { added, removed };
    } catch (error) {
      console.error('Failed to sync sessions index:', error);
      return { added: [], removed: [] };
    }
  }
}

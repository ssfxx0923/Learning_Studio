import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { CONFIG } from '../config/index.js';
import type { ChatMessage, SessionIndex } from '../types/index.js';

/**
 * 生成 16 位随机 UUID（使用 hex 编码）
 */
function generateId(): string {
  return randomBytes(8).toString('hex'); // 8 字节 = 16 个十六进制字符
}

/**
 * 研究会话接口
 */
export interface ResearchSession {
  id: string;
  topic?: string;
  title?: string;  // 会话标题，由AI生成
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 研究服务 - 处理会话文件夹存储和管理
 * 结构: research/{sessionId}/session.json
 */
export class ResearchService {
  private sessionsBasePath: string;
  private indexPath: string;

  constructor() {
    this.sessionsBasePath = CONFIG.storage.researchBasePath || path.join(CONFIG.storage.basePath, 'research');
    this.indexPath = path.join(this.sessionsBasePath, 'index.json');
  }

  /**
   * 初始化研究目录
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsBasePath, { recursive: true });
      console.log(`✓ Research sessions directory ready: ${this.sessionsBasePath}`);
    } catch (error) {
      console.error('Failed to initialize research sessions directory:', error);
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
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * 获取所有研究会话
   */
  async getAllSessions(): Promise<ResearchSession[]> {
    try {
      const index = await this.readIndex();
      const sessions: ResearchSession[] = [];

      for (const sessionId of index.sessions) {
        try {
          const session = await this.getSession(sessionId);
          if (session) {
            sessions.push(session);
          }
        } catch (error) {
          console.error(`Failed to load research session ${sessionId}:`, error);
        }
      }

      // 按更新时间排序（最新的在前）
      return sessions.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get all research sessions:', error);
      throw error;
    }
  }

  /**
   * 获取单个研究会话
   */
  async getSession(sessionId: string): Promise<ResearchSession | null> {
    try {
      const filePath = this.getSessionFilePath(sessionId);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 创建新研究会话
   */
  async createSession(topic?: string): Promise<ResearchSession> {
    try {
      const sessionId = this.generateSessionId();
      const sessionFolder = this.getSessionFolderPath(sessionId);

      // 创建会话文件夹
      await fs.mkdir(sessionFolder, { recursive: true });

      const newSession: ResearchSession = {
        id: sessionId,
        topic: topic,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 写入会话文件
      const sessionFilePath = this.getSessionFilePath(sessionId);
      await fs.writeFile(sessionFilePath, JSON.stringify(newSession, null, 2), 'utf-8');

      // 更新索引
      const index = await this.readIndex();
      index.sessions.push(sessionId);
      await this.updateIndex(index);

      console.log(`✓ Created research session: ${sessionId}`);

      return newSession;
    } catch (error) {
      console.error('Failed to create research session:', error);
      throw error;
    }
  }

  /**
   * 更新研究会话
   */
  async updateSession(sessionId: string, sessionData: Partial<ResearchSession>): Promise<ResearchSession> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Research session ${sessionId} not found`);
      }

      const updatedSession: ResearchSession = {
        ...session,
        ...sessionData,
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: new Date().toISOString(),
      };

      const sessionFilePath = this.getSessionFilePath(sessionId);
      await fs.writeFile(sessionFilePath, JSON.stringify(updatedSession, null, 2), 'utf-8');

      return updatedSession;
    } catch (error) {
      console.error('Failed to update research session:', error);
      throw error;
    }
  }

  /**
   * 删除研究会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionFolder = this.getSessionFolderPath(sessionId);

      // 删除会话文件夹
      await fs.rm(sessionFolder, { recursive: true, force: true });

      // 从索引中移除
      const index = await this.readIndex();
      index.sessions = index.sessions.filter((id) => id !== sessionId);
      await this.updateIndex(index);

      console.log(`✓ Deleted research session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to delete research session:', error);
      throw error;
    }
  }

  /**
   * 获取会话的所有消息
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const session = await this.getSession(sessionId);
      return session?.messages || [];
    } catch (error) {
      console.error('Failed to get research session messages:', error);
      throw error;
    }
  }

  /**
   * 添加消息到研究会话
   */
  async addSessionMessage(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Research session ${sessionId} not found`);
      }

      session.messages.push(message);
      session.updatedAt = new Date().toISOString();

      await this.updateSession(sessionId, session);
    } catch (error) {
      console.error('Failed to add message to research session:', error);
      throw error;
    }
  }
}

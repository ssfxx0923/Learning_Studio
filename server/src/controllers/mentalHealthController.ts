import { Request, Response } from 'express';
import { MentalHealthService } from '../services/mentalHealthService.js';
import type { MentalHealthMessage } from '../types/index.js';

const mentalHealthService = new MentalHealthService();

// 初始化服务
mentalHealthService.initialize().catch(console.error);

/**
 * 获取所有会话
 */
export async function getAllSessions(req: Request, res: Response) {
  try {
    const sessions = await mentalHealthService.getAllSessions();
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error('Failed to get sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions',
      details: error.message,
    });
  }
}

/**
 * 获取单个会话
 */
export async function getSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = await mentalHealthService.getSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Failed to get session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session',
      details: error.message,
    });
  }
}

/**
 * 创建新会话
 */
export async function createSession(req: Request, res: Response) {
  try {
    const session = await mentalHealthService.createSession();

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Failed to create session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      details: error.message,
    });
  }
}

/**
 * 更新会话
 */
export async function updateSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sessionData = req.body;

    const updatedSession = await mentalHealthService.updateSession(id, sessionData);

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error: any) {
    console.error('Failed to update session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session',
      details: error.message,
    });
  }
}

/**
 * 删除会话
 */
export async function deleteSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await mentalHealthService.deleteSession(id);

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session',
      details: error.message,
    });
  }
}

/**
 * 获取会话的所有消息
 */
export async function getMessages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const messages = await mentalHealthService.getMessages(id);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error('Failed to get messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages',
      details: error.message,
    });
  }
}

/**
 * 添加消息到会话
 */
export async function addMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const message: MentalHealthMessage = req.body;

    // 验证消息数据
    if (!message.role || !message.content) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message data: role and content are required',
      });
    }

    // 确保有时间戳
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    await mentalHealthService.addMessage(id, message);

    res.json({
      success: true,
      message: 'Message added successfully',
    });
  } catch (error: any) {
    console.error('Failed to add message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add message',
      details: error.message,
    });
  }
}

/**
 * 同步会话索引
 */
export async function syncSessionsIndex(req: Request, res: Response) {
  try {
    const result = await mentalHealthService.syncIndex();

    res.json({
      success: true,
      data: result,
      message: `Synchronized index: ${result.added.length} added, ${result.removed.length} removed`,
    });
  } catch (error: any) {
    console.error('Failed to sync index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync index',
      details: error.message,
    });
  }
}

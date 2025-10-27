import { Request, Response } from 'express';
import { ResearchService } from '../services/researchService.js';
import type { ChatMessage } from '../types/index.js';

const researchService = new ResearchService();

// 初始化服务
researchService.initialize().catch(console.error);

/**
 * 获取所有研究会话
 */
export async function getAllSessions(req: Request, res: Response) {
  try {
    const sessions = await researchService.getAllSessions();
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error('Failed to get research sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve research sessions',
      details: error.message,
    });
  }
}

/**
 * 获取单个研究会话
 */
export async function getSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = await researchService.getSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Research session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Failed to get research session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve research session',
      details: error.message,
    });
  }
}

/**
 * 创建新研究会话
 */
export async function createSession(req: Request, res: Response) {
  try {
    const { topic } = req.body;
    const newSession = await researchService.createSession(topic);

    res.json({
      success: true,
      data: newSession,
    });
  } catch (error: any) {
    console.error('Failed to create research session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create research session',
      details: error.message,
    });
  }
}

/**
 * 更新研究会话
 */
export async function updateSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sessionData = req.body;

    const updatedSession = await researchService.updateSession(id, sessionData);

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error: any) {
    console.error('Failed to update research session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update research session',
      details: error.message,
    });
  }
}

/**
 * 删除研究会话
 */
export async function deleteSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await researchService.deleteSession(id);

    res.json({
      success: true,
      message: 'Research session deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete research session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete research session',
      details: error.message,
    });
  }
}

/**
 * 获取会话的所有消息
 */
export async function getSessionMessages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const messages = await researchService.getSessionMessages(id);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error('Failed to get research session messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve research session messages',
      details: error.message,
    });
  }
}

/**
 * 添加消息到研究会话
 */
export async function addSessionMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const message: ChatMessage = req.body;

    await researchService.addSessionMessage(id, message);

    res.json({
      success: true,
      message: 'Message added successfully',
    });
  } catch (error: any) {
    console.error('Failed to add message to research session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add message to research session',
      details: error.message,
    });
  }
}

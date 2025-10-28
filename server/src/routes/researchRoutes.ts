import { Router } from 'express';
import * as researchController from '../controllers/researchController.js';

const router = Router();

/**
 * 研究功能路由
 * 基础路径: /api/research
 */

// 获取所有研究会话
router.get('/', researchController.getAllSessions);

// 创建新研究会话
router.post('/', researchController.createSession);

// 获取单个研究会话
router.get('/:id', researchController.getSession);

// 更新研究会话
router.put('/:id', researchController.updateSession);

// 删除研究会话
router.delete('/:id', researchController.deleteSession);

// 获取会话的所有消息
router.get('/:id/messages', researchController.getSessionMessages);

// 添加消息到研究会话
router.post('/:id/messages', researchController.addSessionMessage);

// 生成研究会话标题
router.post('/:id/generate-title', researchController.generateSessionTitle);

export default router;

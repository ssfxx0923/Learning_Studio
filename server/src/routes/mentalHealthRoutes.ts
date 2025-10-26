import { Router } from 'express';
import {
  getAllSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getMessages,
  addMessage,
  syncSessionsIndex,
} from '../controllers/mentalHealthController.js';

const router = Router();

// 获取所有会话
router.get('/', getAllSessions);

// 获取单个会话
router.get('/:id', getSession);

// 创建新会话
router.post('/', createSession);

// 更新会话
router.put('/:id', updateSession);

// 删除会话
router.delete('/:id', deleteSession);

// 获取会话的所有消息
router.get('/:id/messages', getMessages);

// 添加消息到会话
router.post('/:id/messages', addMessage);

// 同步索引
router.post('/sync-index', syncSessionsIndex);

export default router;

import { Router } from 'express';
import {
  getAllPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  syncPlansIndex,
  getChatHistory,
  saveChatMessage,
  createPlanFromAI,
} from '../controllers/planController.js';

const router = Router();

// 获取所有计划
router.get('/', getAllPlans);

// 获取单个计划
router.get('/:id', getPlan);

// 创建新计划
router.post('/', createPlan);

// AI创建计划（n8n webhook）
router.post('/ai-create', createPlanFromAI);

// 同步索引
router.post('/sync-index', syncPlansIndex);

// 更新计划
router.put('/:id', updatePlan);

// 删除计划
router.delete('/:id', deletePlan);

// 获取聊天历史
router.get('/:id/chat-history', getChatHistory);

// 保存聊天消息
router.post('/:id/chat-message', saveChatMessage);

export default router;


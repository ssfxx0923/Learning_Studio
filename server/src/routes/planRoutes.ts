import { Router } from 'express';
import {
  getAllPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  syncPlansIndex,
} from '../controllers/planController.js';

const router = Router();

// 获取所有计划
router.get('/', getAllPlans);

// 获取单个计划
router.get('/:id', getPlan);

// 创建新计划
router.post('/', createPlan);

// 更新计划
router.put('/:id', updatePlan);

// 删除计划
router.delete('/:id', deletePlan);

// 同步索引
router.post('/sync-index', syncPlansIndex);

export default router;


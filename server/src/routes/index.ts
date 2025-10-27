import { Router } from 'express';
import articleRoutes from './articleRoutes.js';
import planRoutes from './planRoutes.js';
import mentalHealthRoutes from './mentalHealthRoutes.js';
import noteRoutes from './noteRoutes.js';
import researchRoutes from './researchRoutes.js';

const router = Router();

// 文章相关路由
router.use('/articles', articleRoutes);

// 计划相关路由
router.use('/plans', planRoutes);

// 心理咨询相关路由
router.use('/mental-health', mentalHealthRoutes);

// 笔记相关路由
router.use('/notes', noteRoutes);

// 研究功能相关路由
router.use('/research', researchRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;


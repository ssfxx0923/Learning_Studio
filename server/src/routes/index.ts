import { Router } from 'express';
import articleRoutes from './articleRoutes.js';
import planRoutes from './planRoutes.js';

const router = Router();

// 文章相关路由
router.use('/articles', articleRoutes);

// 计划相关路由
router.use('/plans', planRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;


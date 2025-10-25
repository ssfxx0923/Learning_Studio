import { Router } from 'express';
import articleRoutes from './articleRoutes.js';

const router = Router();

// 文章相关路由
router.use('/articles', articleRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;


import { Router } from 'express';
import {
  generateArticle,
  deleteArticle,
  getArticles,
} from '../controllers/articleController.js';

const router = Router();

/**
 * POST /api/articles/generate
 * 生成新文章
 */
router.post('/generate', generateArticle);

/**
 * DELETE /api/articles/:articleId
 * 删除指定文章
 */
router.delete('/:articleId', deleteArticle);

/**
 * GET /api/articles
 * 获取文章列表
 */
router.get('/', getArticles);

export default router;


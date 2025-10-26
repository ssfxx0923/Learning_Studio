import { Router } from 'express';
import {
  createArticleFolder,
  deleteArticle,
  getArticles,
} from '../controllers/articleController.js';

const router = Router();

/**
 * POST /api/articles/create-folder
 * 创建文章文件夹（为n8n写入准备）
 */
router.post('/create-folder', createArticleFolder);

/**
 * DELETE /api/articles/:articleId
 * 删除指定文章（从文件系统和索引中删除）
 */
router.delete('/:articleId', deleteArticle);

/**
 * GET /api/articles
 * 获取文章列表（读取index.json）
 */
router.get('/', getArticles);

export default router;


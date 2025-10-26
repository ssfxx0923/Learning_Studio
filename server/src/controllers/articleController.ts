import { Request, Response } from 'express';
import { FileService } from '../services/fileService.js';
import type {
  ErrorResponse,
} from '../types/index.js';

const fileService = new FileService();

/**
 * 工作流程：
 * 1. 前端生成UUID
 * 2. 前端调用后端创建文件夹 (POST /api/articles/create-folder)
 * 3. 前端调用n8n生成内容
 * 4. n8n将文件写入已创建的文件夹
 */

/**
 * 创建文章文件夹控制器
 */
export const createArticleFolder = async (
  req: Request<{}, {}, { articleId: string }>,
  res: Response<{ success: boolean; articleId: string; path: string } | ErrorResponse>
) => {
  try {
    const { articleId } = req.body;

    // 验证输入
    if (!articleId || typeof articleId !== 'string' || !articleId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }

    // 创建文件夹
    const path = await fileService.createArticleFolder(articleId);

    console.log(`✓ Created folder for article: ${articleId}`);

    return res.status(200).json({
      success: true,
      articleId,
      path,
    });
  } catch (error: any) {
    console.error('Failed to create article folder:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create article folder',
      details: error.message,
    });
  }
};

/**
 * 删除文章控制器
 */
export const deleteArticle = async (
  req: Request<{ articleId: string }>,
  res: Response<{ success: boolean; message: string } | ErrorResponse>
) => {
  try {
    const { articleId } = req.params;

    // 验证文章是否存在
    const exists = await fileService.articleExists(articleId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
      });
    }

    // 删除文件夹
    await fileService.deleteArticleFolder(articleId);

    // 从索引中移除
    await fileService.removeFromIndex(articleId);

    return res.status(200).json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete article:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete article',
      details: error.message,
    });
  }
};

/**
 * 获取文章列表控制器
 */
export const getArticles = async (
  req: Request,
  res: Response
) => {
  try {
    const index = await fileService.readIndex();
    return res.status(200).json({
      success: true,
      articles: index.articles,
    });
  } catch (error: any) {
    console.error('Failed to get articles:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get articles',
      details: error.message,
    });
  }
};


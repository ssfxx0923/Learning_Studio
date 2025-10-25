import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FileService } from '../services/fileService.js';
import { N8nService } from '../services/n8nService.js';
import type {
  GenerateArticleRequest,
  GenerateArticleResponse,
  ErrorResponse,
} from '../types/index.js';

const fileService = new FileService();
const n8nService = new N8nService();

/**
 * 生成文章控制器
 */
export const generateArticle = async (
  req: Request<{}, {}, GenerateArticleRequest>,
  res: Response<GenerateArticleResponse | ErrorResponse>
) => {
  try {
    const { message } = req.body;

    // 验证输入
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string',
      });
    }

    // 生成唯一的文章 ID (16位 UUID)
    const articleId = uuidv4().replace(/-/g, '').substring(0, 16);

    console.log(`\n=== Starting article generation ===`);
    console.log(`Article ID: ${articleId}`);
    console.log(`User Input: ${message}`);

    // 步骤 1: 创建文章文件夹
    try {
      await fileService.createArticleFolder(articleId);
    } catch (error: any) {
      console.error('Failed to create article folder:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to create article folder',
        details: error.message,
      });
    }

    // 步骤 2: 调用 n8n webhook
    let n8nResponse;
    
    try {
      n8nResponse = await n8nService.generateArticle(message.trim(), articleId);
    } catch (error: any) {
      console.error('n8n webhook call failed:', error.message);
      
      // 清理已创建的文件夹
      try {
        await fileService.deleteArticleFolder(articleId);
      } catch (cleanupError) {
        console.error('Failed to cleanup folder:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to call n8n webhook',
        details: error.message,
      });
    }

    // 步骤 3: 等待文件生成并验证
    console.log('Waiting for n8n to generate files...');
    
    // 轮询检查文件是否生成（最多等待5分钟）
    const maxAttempts = 60; // 60次 * 5秒 = 5分钟
    let attempts = 0;
    let filesReady = false;

    while (attempts < maxAttempts && !filesReady) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
      filesReady = await fileService.validateArticleFiles(articleId);
      attempts++;
      
      if (!filesReady) {
        console.log(`Waiting... (${attempts}/${maxAttempts})`);
      }
    }

    if (!filesReady) {
      console.error('Files were not generated within timeout period');
      return res.status(500).json({
        success: false,
        error: 'Article generation timeout',
        details: 'n8n did not generate files within the expected time',
      });
    }

    console.log('✓ Files validated successfully');

    // 步骤 4: 更新索引
    try {
      await fileService.updateIndex(articleId);
    } catch (error: any) {
      console.error('Failed to update index:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Article generated but failed to update index',
        details: error.message,
      });
    }

    // 成功响应
    console.log('=== Article generation completed successfully ===\n');
    
    return res.status(200).json({
      success: true,
      articleId,
      message: 'Article generated successfully',
      data: {
        inputMessage: message.trim(),
      },
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
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


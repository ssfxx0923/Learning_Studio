import fs from 'fs/promises';
import path from 'path';
import { CONFIG } from '../config/index.js';
import type { ArticleIndex } from '../types/index.js';

/**
 * 文件服务 - 处理文章文件夹和索引管理
 */
export class FileService {
  private articlesBasePath: string;
  private indexPath: string;

  constructor() {
    this.articlesBasePath = CONFIG.storage.articlesBasePath;
    this.indexPath = path.join(this.articlesBasePath, 'index.json');
  }

  /**
   * 创建文章文件夹
   */
  async createArticleFolder(articleId: string): Promise<string> {
    const articlePath = path.join(this.articlesBasePath, articleId);

    try {
      // 检查文件夹是否已存在
      await fs.access(articlePath);
      throw new Error(`Article folder already exists: ${articleId}`);
    } catch (error: any) {
      // 文件夹不存在，创建它
      if (error.code === 'ENOENT') {
        await fs.mkdir(articlePath, { recursive: true });
        console.log(`✓ Created article folder: ${articlePath}`);
        return articlePath;
      }
      throw error;
    }
  }

  /**
   * 验证文章文件是否存在
   */
  async validateArticleFiles(articleId: string): Promise<boolean> {
    const articlePath = path.join(this.articlesBasePath, articleId);
    const requiredFiles = ['content.json', 'cover.png'];

    try {
      for (const file of requiredFiles) {
        const filePath = path.join(articlePath, file);
        await fs.access(filePath);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 读取索引文件
   */
  async readIndex(): Promise<ArticleIndex> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      // 如果文件不存在，返回空索引
      if (error.code === 'ENOENT') {
        return { articles: [] };
      }
      throw error;
    }
  }

  /**
   * 更新索引文件
   */
  async updateIndex(articleId: string): Promise<void> {
    const index = await this.readIndex();

    // 检查是否已存在
    if (!index.articles.includes(articleId)) {
      index.articles.push(articleId);
      
      // 写入索引文件
      await fs.writeFile(
        this.indexPath,
        JSON.stringify(index, null, 2) + '\n',
        'utf-8'
      );
      
      console.log(`✓ Updated index with article: ${articleId}`);
    }
  }

  /**
   * 从索引中移除文章
   */
  async removeFromIndex(articleId: string): Promise<void> {
    const index = await this.readIndex();
    index.articles = index.articles.filter(id => id !== articleId);
    
    await fs.writeFile(
      this.indexPath,
      JSON.stringify(index, null, 2) + '\n',
      'utf-8'
    );
    
    console.log(`✓ Removed article from index: ${articleId}`);
  }

  /**
   * 删除文章文件夹
   */
  async deleteArticleFolder(articleId: string): Promise<void> {
    const articlePath = path.join(this.articlesBasePath, articleId);
    
    try {
      await fs.rm(articlePath, { recursive: true, force: true });
      console.log(`✓ Deleted article folder: ${articlePath}`);
    } catch (error) {
      console.error(`Failed to delete folder: ${articlePath}`, error);
      throw error;
    }
  }

  /**
   * 检查文章是否存在
   */
  async articleExists(articleId: string): Promise<boolean> {
    const articlePath = path.join(this.articlesBasePath, articleId);
    try {
      await fs.access(articlePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 扫描所有文章文件夹，返回完整的文章ID列表
   */
  async scanAllArticles(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.articlesBasePath, { withFileTypes: true });
      const completeArticles: string[] = [];

      for (const entry of entries) {
        // 跳过文件，只处理文件夹
        if (!entry.isDirectory()) continue;
        
        // 跳过 index.json
        if (entry.name === 'index.json') continue;

        // 检查文章是否完整
        const isComplete = await this.validateArticleFiles(entry.name);
        if (isComplete) {
          completeArticles.push(entry.name);
        }
      }

      return completeArticles;
    } catch (error) {
      console.error('Failed to scan articles:', error);
      return [];
    }
  }

  /**
   * 同步索引：扫描文件夹并更新 index.json
   */
  async syncIndex(): Promise<{ added: string[], removed: string[] }> {
    const actualArticles = await this.scanAllArticles();
    const index = await this.readIndex();
    const indexedArticles = new Set(index.articles);
    
    const added: string[] = [];
    const removed: string[] = [];

    // 找出需要添加的文章
    for (const articleId of actualArticles) {
      if (!indexedArticles.has(articleId)) {
        added.push(articleId);
      }
    }

    // 找出需要删除的文章（索引中有但文件夹中没有）
    const actualArticlesSet = new Set(actualArticles);
    for (const articleId of index.articles) {
      if (!actualArticlesSet.has(articleId)) {
        removed.push(articleId);
      }
    }

    // 更新索引
    if (added.length > 0 || removed.length > 0) {
      const newIndex: ArticleIndex = {
        articles: actualArticles.sort(), // 按字母排序
      };

      await fs.writeFile(
        this.indexPath,
        JSON.stringify(newIndex, null, 2) + '\n',
        'utf-8'
      );

      if (added.length > 0) {
        console.log(`✓ Added to index: ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        console.log(`✓ Removed from index: ${removed.join(', ')}`);
      }
    }

    return { added, removed };
  }
}


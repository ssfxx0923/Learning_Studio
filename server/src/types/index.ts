// API 类型定义（简化版，仅用于文件系统操作）

// 文章索引结构
export interface ArticleIndex {
  articles: string[];
}

// 错误响应
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}


// API 请求和响应类型定义

// 生成文章请求
export interface GenerateArticleRequest {
  message: string;
}

// 生成文章响应
export interface GenerateArticleResponse {
  success: boolean;
  articleId: string;
  message: string;
  data?: {
    title?: string;
    inputMessage: string;
    content?: string;
  };
}

// n8n Webhook 请求
export interface N8nWebhookPayload {
  message: string;
  request_id: string;
}

// n8n Webhook 响应（根据实际返回调整）
export interface N8nWebhookResponse {
  success?: boolean;
  data?: any;
  [key: string]: any;
}

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


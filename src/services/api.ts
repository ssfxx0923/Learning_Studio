import apiClient from '@/lib/api'

// ============================================
// Backend API - 纯文件系统服务
// ============================================

export const backendAPI = {
  // 创建文章文件夹（为n8n写入准备）
  createArticleFolder: async (articleId: string) => {
    return apiClient.post('/api/articles/create-folder', { articleId })
  },

  // 获取文章列表
  getArticles: async () => {
    return apiClient.get('/api/articles')
  },

  // 删除文章
  deleteArticle: async (articleId: string) => {
    return apiClient.delete(`/api/articles/${articleId}`)
  },

  // 健康检查
  healthCheck: async () => {
    return apiClient.get('/api/health')
  },
}

// ============================================
// n8n Client - 直接导出供前端使用
// ============================================
// 使用示例：
// import { n8nClient } from '@/services/api'
// await n8nClient.post('/english/generate', { message, request_id })
// ============================================

export { default as n8nClient } from '@/lib/n8nClient'

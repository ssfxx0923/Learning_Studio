import apiClient from '@/lib/api'

// ============================================
// 类型定义
// ============================================

export interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  dueDate?: string
  createdAt: string
  completedAt?: string  // 任务完成时间
}

export interface Plan {
  id: string
  title: string
  description: string
  priority: number
  tasks: Task[]
  progress: number
  dueDate?: string
  createdAt: string
  aiSuggestion?: string
}

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

  // ============================================
  // 计划相关 API
  // ============================================

  // 获取所有计划
  getAllPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/api/plans')
    return response.data
  },

  // 获取单个计划
  getPlan: async (planId: string): Promise<Plan> => {
    const response = await apiClient.get(`/api/plans/${planId}`)
    return response.data
  },

  // 创建计划
  createPlan: async (planData: Omit<Plan, 'id'>): Promise<Plan> => {
    const response = await apiClient.post('/api/plans', planData)
    return response.data
  },

  // 更新计划
  updatePlan: async (planId: string, planData: Plan): Promise<Plan> => {
    const response = await apiClient.put(`/api/plans/${planId}`, planData)
    return response.data
  },

  // 删除计划
  deletePlan: async (planId: string): Promise<void> => {
    await apiClient.delete(`/api/plans/${planId}`)
  },

  // 同步计划索引
  syncPlansIndex: async () => {
    return apiClient.post('/api/plans/sync-index')
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

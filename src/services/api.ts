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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatHistory {
  messages: ChatMessage[]
}

// 心理咨询相关类型
export interface MentalHealthMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface MentalHealthSession {
  id: string
  title?: string  // 会话标题，可选
  messages: MentalHealthMessage[]
  createdAt: string
  updatedAt: string
}

// 笔记相关类型
export interface Note {
  id: string
  title: string
  content: string  // Markdown 内容
  tags: string[]   // 标签
  category?: string // 分类
  createdAt: string
  updatedAt: string
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

  // 获取聊天历史
  getChatHistory: async (planId: string): Promise<ChatHistory> => {
    const response = await apiClient.get(`/api/plans/${planId}/chat-history`)
    return response.data
  },

  // 保存聊天消息
  saveChatMessage: async (planId: string, message: ChatMessage): Promise<void> => {
    await apiClient.post(`/api/plans/${planId}/chat-message`, message)
  },

  // ============================================
  // 心理咨询相关 API
  // ============================================

  // 获取所有会话
  getAllSessions: async (): Promise<MentalHealthSession[]> => {
    const response = await apiClient.get('/api/mental-health')
    return response.data.data || response.data
  },

  // 获取单个会话
  getSession: async (sessionId: string): Promise<MentalHealthSession> => {
    const response = await apiClient.get(`/api/mental-health/${sessionId}`)
    return response.data.data || response.data
  },

  // 创建新会话
  createSession: async (): Promise<MentalHealthSession> => {
    const response = await apiClient.post('/api/mental-health')
    return response.data.data || response.data
  },

  // 更新会话
  updateSession: async (sessionId: string, session: MentalHealthSession): Promise<MentalHealthSession> => {
    const response = await apiClient.put(`/api/mental-health/${sessionId}`, session)
    return response.data.data || response.data
  },

  // 删除会话
  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/api/mental-health/${sessionId}`)
  },

  // 获取会话的所有消息
  getSessionMessages: async (sessionId: string): Promise<MentalHealthMessage[]> => {
    const response = await apiClient.get(`/api/mental-health/${sessionId}/messages`)
    return response.data.data || response.data
  },

  // 添加消息到会话
  addSessionMessage: async (sessionId: string, message: MentalHealthMessage): Promise<void> => {
    await apiClient.post(`/api/mental-health/${sessionId}/messages`, message)
  },

  // 同步会话索引
  syncSessionsIndex: async () => {
    return apiClient.post('/api/mental-health/sync-index')
  },

  // ============================================
  // 笔记相关 API
  // ============================================

  // 获取所有笔记
  getAllNotes: async (): Promise<Note[]> => {
    const response = await apiClient.get('/api/notes')
    return response.data.data || response.data
  },

  // 获取单个笔记
  getNote: async (noteId: string): Promise<Note> => {
    const response = await apiClient.get(`/api/notes/${noteId}`)
    return response.data.data || response.data
  },

  // 创建笔记
  createNote: async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const response = await apiClient.post('/api/notes', noteData)
    return response.data.data || response.data
  },

  // 更新笔记
  updateNote: async (noteId: string, noteData: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> => {
    const response = await apiClient.put(`/api/notes/${noteId}`, noteData)
    return response.data.data || response.data
  },

  // 删除笔记
  deleteNote: async (noteId: string): Promise<void> => {
    await apiClient.delete(`/api/notes/${noteId}`)
  },

  // 搜索笔记
  searchNotes: async (query: string): Promise<Note[]> => {
    const response = await apiClient.get(`/api/notes/search?q=${encodeURIComponent(query)}`)
    return response.data.data || response.data
  },

  // 根据标签获取笔记
  getNotesByTag: async (tag: string): Promise<Note[]> => {
    const response = await apiClient.get(`/api/notes/tag/${encodeURIComponent(tag)}`)
    return response.data.data || response.data
  },

  // 根据分类获取笔记
  getNotesByCategory: async (category: string): Promise<Note[]> => {
    const response = await apiClient.get(`/api/notes/category/${encodeURIComponent(category)}`)
    return response.data.data || response.data
  },

  // 同步笔记索引
  syncNotesIndex: async () => {
    return apiClient.post('/api/notes/sync-index')
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

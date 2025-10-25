import apiClient from '@/lib/api'

// 英语学习模块API
export const englishAPI = {
  // 生成文章
  generateArticle: async (message: string) => {
    return apiClient.post('/api/articles/generate', { message })
  },
  // 生成配图
  generateImage: async (text: string) => {
    return apiClient.post('/webhook/english/generate-image', { text })
  },
  // 翻译单词
  translateWord: async (word: string) => {
    return apiClient.post('/webhook/english/translate', { word })
  },
  // 生成朗读音频
  generateAudio: async (text: string) => {
    return apiClient.post('/webhook/english/generate-audio', { text })
  },
}

// 课程学习模块API
export const courseAPI = {
  // 添加视频课程
  addVideoLesson: async (url: string) => {
    return apiClient.post('/webhook/course/add-video', { url })
  },
  // 添加书本教材
  addBook: async (bookData: any) => {
    return apiClient.post('/webhook/course/add-book', bookData)
  },
  // 获取视频解析
  analyzeVideo: async (videoId: string) => {
    return apiClient.post('/webhook/course/analyze-video', { videoId })
  },
  // 获取课程规划
  getCoursePlan: async (courseId: string) => {
    return apiClient.post('/webhook/course/get-plan', { courseId })
  },
}

// 规划模块API
export const planningAPI = {
  // 创建计划
  createPlan: async (planData: any) => {
    return apiClient.post('/webhook/planning/create', planData)
  },
  // 更新计划进度
  updateProgress: async (planId: string, progress: any) => {
    return apiClient.post('/webhook/planning/update-progress', { planId, progress })
  },
  // 获取AI建议
  getAISuggestion: async (planId: string) => {
    return apiClient.post('/webhook/planning/ai-suggestion', { planId })
  },
}

// 笔记模块API
export const noteAPI = {
  // 保存笔记
  saveNote: async (noteData: any) => {
    return apiClient.post('/webhook/note/save', noteData)
  },
  // AI优化笔记
  optimizeNote: async (noteId: string) => {
    return apiClient.post('/webhook/note/optimize', { noteId })
  },
  // 手写笔记转换
  convertHandwriting: async (imageData: string) => {
    return apiClient.post('/webhook/note/convert-handwriting', { imageData })
  },
  // 笔记自动补全
  autoComplete: async (content: string) => {
    return apiClient.post('/webhook/note/auto-complete', { content })
  },
}

// 心理健康模块API
export const mentalHealthAPI = {
  // 开始对话
  startConversation: async () => {
    return apiClient.post('/webhook/mental-health/start')
  },
  // 发送消息
  sendMessage: async (message: string, sessionId: string) => {
    return apiClient.post('/webhook/mental-health/message', { message, sessionId })
  },
}

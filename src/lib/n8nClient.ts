import axios from 'axios'

// n8n Webhook 基础URL（无环境变量时使用默认值）
const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://now.ssfxx.cloud:5678/webhook'

// 创建 n8n 专用的 axios 客户端
const n8nClient = axios.create({
  baseURL: N8N_BASE_URL,
  timeout: 300000, // 5分钟超时（生成文章需要较长时间）
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
n8nClient.interceptors.request.use(
  (config) => {
    console.log(`🔗 Calling n8n webhook: ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
n8nClient.interceptors.response.use(
  (response) => {
    console.log(`✅ n8n webhook responded successfully`)
    console.log('📦 Response data:', response.data)
    return response.data
  },
  (error) => {
    console.error('❌ n8n webhook error:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
    }
    return Promise.reject(error)
  }
)

// AI 补全相关的接口
export interface AICompletionRequest {
  context: string // 光标上下文（上下10行）
  cursorPosition: number // 光标在上下文中的位置
}

export interface AICompletionResponse {
  suggestion: string // AI 建议的文本
}

// AI 补全 API
export const getAICompletion = async (request: AICompletionRequest): Promise<string> => {
  try {
    const response: any = await n8nClient.post('/note/autocomplete', request)
    // n8n AI Agent 返回格式: { output: "text" }
    return response.output || response.text || response.suggestion || ''
  } catch (error) {
    console.error('AI 补全失败:', error)
    return ''
  }
}

// 笔记划词提问接口
export interface NoteQuestionRequest {
  selectedText: string // 选中的文本
  question?: string // 用户的问题（可选）
  noteContext?: string // 笔记上下文（可选）
}

export interface NoteQuestionResponse {
  answer: string // AI 的回答
}

// 笔记划词提问 API
export const askNoteQuestion = async (request: NoteQuestionRequest): Promise<string> => {
  try {
    const response: any = await n8nClient.post('/english/analyze', {
      text: request.selectedText,
      question: request.question,
      context: request.noteContext,
    })
    // n8n AI Agent 返回格式: { output: "text" }
    return response.output || response.text || response.answer || response
  } catch (error) {
    console.error('笔记提问失败:', error)
    throw error
  }
}

export default n8nClient


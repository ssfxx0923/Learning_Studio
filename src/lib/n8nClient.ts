import axios from 'axios'

// n8n Webhook 基础URL
const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'

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

export default n8nClient


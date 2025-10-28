import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lightbulb, Send, Sparkles, Trash2, MessageCircle, Loader } from 'lucide-react'
import { n8nClient, backendAPI, type ChatMessage } from '@/services/api'
import { AIGreeting } from '@/components/AIGreeting'

interface ResearchSession {
  id: string
  title?: string
  topic?: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export default function ResearchPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([])
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 加载所有研究会话
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const sessionsData = await backendAPI.getAllResearchSessions()
      setSessions(sessionsData || [])
    } catch (error) {
      console.error('加载会话失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewSession = async (initialTopic?: string) => {
    try {
      const newSession = await backendAPI.createResearchSession(initialTopic)

      // 添加欢迎消息
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `你好！我是你的AI研究助手。我可以帮助你深入研究任何主题。${
          initialTopic ? `让我们开始研究 "${initialTopic}" 吧！` : '请告诉我你想研究什么主题？'
        }`,
        timestamp: new Date().toISOString(),
      }

      await backendAPI.addResearchSessionMessage(newSession.id, welcomeMessage)

      const sessionsWithWelcome: ResearchSession = {
        ...newSession,
        messages: [welcomeMessage],
      }

      setCurrentSession(sessionsWithWelcome)
      setMessages([welcomeMessage])
      setSessions([...sessions, sessionsWithWelcome])
    } catch (error) {
      console.error('启动会话失败:', error)
      alert('启动会话失败，请检查后端服务是否正常运行')
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const session = await backendAPI.getResearchSession(sessionId)
      if (session) {
        setCurrentSession(session)
        setMessages(session.messages || [])
      }
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个研究会话吗？')) return

    try {
      await backendAPI.deleteResearchSession(sessionId)

      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }

      setSessions(sessions.filter((s) => s.id !== sessionId))
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isTyping) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0

    setMessages([...messages, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // 保存用户消息到后端
      await backendAPI.addResearchSessionMessage(currentSession.id, userMessage)

      // 调用n8n的研究接口
      const response: any = await n8nClient.post('/research/generate', {
        message: inputMessage,
        topic: currentSession.topic || '',
        context: messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n'),
      })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response || response.message || '抱歉，我没有得到响应。',
        timestamp: new Date().toISOString(),
      }

      // 保存助手消息到后端
      await backendAPI.addResearchSessionMessage(currentSession.id, assistantMessage)

      const newMessages = [...messages, assistantMessage]
      setMessages(newMessages)

      // 更新当前会话
      const updatedSession: ResearchSession = {
        ...currentSession,
        messages: newMessages,
        updatedAt: new Date().toISOString(),
      }
      setCurrentSession(updatedSession)

      // 更新会话列表
      setSessions(sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)))

      // 如果是第一条用户消息，生成标题
      if (isFirstUserMessage && !currentSession.title) {
        generateSessionTitle(currentSession.id, userMessage.content)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '抱歉，发送消息失败。请检查网络连接并重试。',
        timestamp: new Date().toISOString(),
      }
      setMessages([...messages, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // 生成会话标题
  const generateSessionTitle = async (sessionId: string, firstMessage: string) => {
    try {
      // 使用n8n生成简短标题
      const response: any = await n8nClient.post('/research/session/generate-title', {
        sessionId,
        firstMessage,
      })

      const title = response.title || response.output || firstMessage.slice(0, 30)

      // 更新会话标题
      const updatedSession = await backendAPI.getResearchSession(sessionId)
      updatedSession.title = title
      await backendAPI.updateResearchSession(sessionId, updatedSession)

      // 更新本地状态
      setCurrentSession(updatedSession)
      await loadSessions()
    } catch (error) {
      console.error('生成标题失败:', error)
      // 如果生成失败，使用消息前30个字符作为标题
      try {
        const updatedSession = await backendAPI.getResearchSession(sessionId)
        updatedSession.title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
        await backendAPI.updateResearchSession(sessionId, updatedSession)
        setCurrentSession(updatedSession)
        await loadSessions()
      } catch (err) {
        console.error('设置默认标题失败:', err)
      }
    }
  }

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col lg:flex-row gap-0">
      {/* 左侧边栏 - 会话列表 */}
      <div className="w-full lg:w-64 border-r border-border bg-muted/30 overflow-hidden flex flex-col">
        {/* 标题和新建按钮 */}
        <div className="p-4 border-b border-border space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            研究助手
          </h2>
          <Button onClick={() => startNewSession()} className="w-full" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            新建研究
          </Button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>暂无研究会话</p>
              <p className="mt-2 text-xs">点击上方按钮开始新研究</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-all ${
                    currentSession?.id === session.id
                      ? 'border-primary/50 bg-primary/5'
                      : 'hover:border-primary/30 hover:bg-muted/60'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {session.title || session.topic || `研究 ${new Date(session.createdAt).toLocaleDateString()}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {session.messages.length} 条消息
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => deleteSession(session.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* 对话标题 */}
            <div className="border-b border-border bg-card p-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                {currentSession.title || currentSession.topic || '研究讨论'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                创建于 {new Date(currentSession.createdAt).toLocaleString()}
              </p>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AIGreeting />

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none border border-border'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg rounded-bl-none px-4 py-3 border border-border">
                    <div className="flex gap-1 items-center">
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce delay-100" />
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="border-t border-border bg-card p-4">
              <div className="flex gap-3">
                <Input
                  placeholder="输入你的问题或想法..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isTyping || !inputMessage.trim()}
                  size="icon"
                  className="h-10 w-10"
                >
                  {isTyping ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Shift+Enter 换行，Enter 发送</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="rounded-full bg-yellow-500/10 p-8 mb-4">
              <Lightbulb className="h-16 w-16 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">开始研究</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              与AI助手进行深入讨论，探索任何你感兴趣的主题
            </p>
            <Button size="lg" onClick={() => startNewSession()}>
              <MessageCircle className="h-5 w-5 mr-2" />
              创建新研究会话
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

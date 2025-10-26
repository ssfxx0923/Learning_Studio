import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heart, Send, Sparkles, Trash2, MessageCircle } from 'lucide-react'
import { n8nClient, backendAPI, type MentalHealthSession, type MentalHealthMessage } from '@/services/api'
import { AIGreeting } from '@/components/AIGreeting'

export default function MentalHealth() {
  const [sessions, setSessions] = useState<MentalHealthSession[]>([])
  const [currentSession, setCurrentSession] = useState<MentalHealthSession | null>(null)
  const [messages, setMessages] = useState<MentalHealthMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 加载所有会话
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const sessionsData = await backendAPI.getAllSessions()
      console.log('Sessions data:', sessionsData)
      setSessions(sessionsData || [])
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  const startNewSession = async () => {
    try {
      const newSession = await backendAPI.createSession()
      console.log('Create session response:', newSession)

      // 添加欢迎消息
      const welcomeMessage: MentalHealthMessage = {
        role: 'assistant',
        content: '你好！我是你的AI心理助手。无论你有什么压力、困扰或想法，都可以和我分享。这里是一个安全、保密的空间。请告诉我，今天你感觉怎么样？',
        timestamp: new Date().toISOString(),
      }

      await backendAPI.addSessionMessage(newSession.id, welcomeMessage)

      setCurrentSession(newSession)
      setMessages([welcomeMessage])
      await loadSessions()
    } catch (error) {
      console.error('启动会话失败:', error)
      alert('启动会话失败，请检查后端服务是否正常运行')
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const session = await backendAPI.getSession(sessionId)
      console.log('Load session data:', session)
      setCurrentSession(session)
      setMessages(session.messages || [])
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个会话吗？')) return

    try {
      await backendAPI.deleteSession(sessionId)

      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }

      await loadSessions()
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return

    const userMessage: MentalHealthMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0

    // 添加用户消息到UI
    setMessages([...messages, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // 保存用户消息到后端
      await backendAPI.addSessionMessage(currentSession.id, userMessage)

      // 调用n8n获取AI回复
      const response: any = await n8nClient.post('/mental-health/chat', {
        sessionId: currentSession.id,
        userMessage: inputMessage,
      })

      const aiMessage: MentalHealthMessage = {
        role: 'assistant',
        content: response.message || response.output || '抱歉，我现在无法回复。请稍后再试。',
        timestamp: new Date().toISOString(),
      }

      // 保存AI消息到后端
      await backendAPI.addSessionMessage(currentSession.id, aiMessage)

      setMessages((prev) => [...prev, aiMessage])

      // 如果是第一条用户消息，生成标题
      if (isFirstUserMessage && !currentSession.title) {
        generateSessionTitle(currentSession.id, userMessage.content)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: MentalHealthMessage = {
        role: 'assistant',
        content: '抱歉，发送消息时出现了问题。请检查网络连接后重试。',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // 生成会话标题
  const generateSessionTitle = async (sessionId: string, firstMessage: string) => {
    try {
      // 使用n8n生成简短标题
      const response: any = await n8nClient.post('/mental-health/session/generate-title', {
        sessionId,
        firstMessage,
      })

      const title = response.title || response.output || firstMessage.slice(0, 20)

      // 更新会话标题
      const updatedSession = await backendAPI.getSession(sessionId)
      updatedSession.title = title
      await backendAPI.updateSession(sessionId, updatedSession)

      // 更新本地状态
      setCurrentSession(updatedSession)
      await loadSessions()
    } catch (error) {
      console.error('生成标题失败:', error)
      // 如果生成失败，使用消息前20个字符作为标题
      try {
        const updatedSession = await backendAPI.getSession(sessionId)
        updatedSession.title = firstMessage.slice(0, 20) + (firstMessage.length > 20 ? '...' : '')
        await backendAPI.updateSession(sessionId, updatedSession)
        setCurrentSession(updatedSession)
        await loadSessions()
      } catch (err) {
        console.error('设置默认标题失败:', err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            心理健康
          </h1>
          <p className="text-muted-foreground mt-2">
            与AI心理助手交流，缓解压力，促进身心健康
          </p>
        </div>

        {/* AI问候组件 */}
        <AIGreeting />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 会话列表 */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">会话历史</CardTitle>
            <Button onClick={startNewSession} size="sm" className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              新建会话
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] overflow-y-auto space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无会话历史
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      currentSession?.id === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <p className="text-sm font-medium truncate">
                            {session.title || `会话 ${session.id.slice(0, 8)}`}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(session.createdAt).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.messages.length} 条消息
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => deleteSession(session.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 对话区域 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>心理咨询对话</CardTitle>
            <CardDescription>
              这是一个安全、保密的交流空间，你可以自由表达你的想法和感受
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!currentSession ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">欢迎来到心理健康中心</h3>
                    <p className="text-muted-foreground mb-6">
                      开始一次温暖的对话，让AI陪伴你度过每一个需要倾诉的时刻
                    </p>
                    <Button onClick={startNewSession} size="lg">
                      <Sparkles className="mr-2 h-5 w-5" />
                      开始对话
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 消息列表 */}
                  <div className="h-[500px] overflow-y-auto space-y-4 p-4 rounded-lg bg-muted/30">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              message.role === 'user'
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-card border rounded-lg p-4">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* 输入框 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入你的想法..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* 温馨提示 - 始终显示 */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium mb-1">温馨提示:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>这是一个AI辅助工具，不能替代专业心理咨询</li>
                  <li>如有严重心理问题，请及时寻求专业帮助</li>
                  <li>你的对话内容受到保护，请放心交流</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

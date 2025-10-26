import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heart, Send, Sparkles } from 'lucide-react'
import { n8nClient } from '@/services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function MentalHealth() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startSession = async () => {
    try {
      const response: any = await n8nClient.post('/mental-health/start')
      setSessionId(response.sessionId)

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '你好!我是你的AI心理助手。无论你有什么压力、困扰或想法,都可以和我分享。这里是一个安全、保密的空间。请告诉我,今天你感觉怎么样?',
        timestamp: new Date(),
      }

      setMessages([welcomeMessage])
    } catch (error) {
      console.error('启动会话失败:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      const response: any = await n8nClient.post('/mental-health/message', { message: inputMessage, sessionId })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary" />
          心理健康
        </h1>
        <p className="text-muted-foreground mt-2">
          与AI心理助手交流,缓解压力,促进身心健康
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>心理咨询对话</CardTitle>
          <CardDescription>
            这是一个安全、保密的交流空间,你可以自由表达你的想法和感受
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sessionId ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">欢迎来到心理健康中心</h3>
              <p className="text-muted-foreground mb-6">
                开始一次温暖的对话,让AI陪伴你度过每一个需要倾诉的时刻
              </p>
              <Button onClick={startSession} size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                开始对话
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 消息列表 */}
              <div className="h-[500px] overflow-y-auto space-y-4 p-4 rounded-lg bg-muted/30">
                {messages.map((message) => (
                  <div
                    key={message.id}
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
                        {message.timestamp.toLocaleTimeString()}
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* 温馨提示 */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium mb-1">温馨提示:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>这是一个AI辅助工具,不能替代专业心理咨询</li>
                  <li>如有严重心理问题,请及时寻求专业帮助</li>
                  <li>你的对话内容受到保护,请放心交流</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

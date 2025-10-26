import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, Sparkles } from 'lucide-react'
import { n8nClient, backendAPI } from '@/services/api'
import type { Plan, ChatMessage } from '@/services/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PlanningChatDialogProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan | null
}

export function PlanningChatDialog({ isOpen, onClose, plan }: PlanningChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isEyeLookingDown, setIsEyeLookingDown] = useState(false)
  const [leftEyeX, setLeftEyeX] = useState(0)
  const [rightEyeX, setRightEyeX] = useState(0)

  // 加载聊天历史
  useEffect(() => {
    if (isOpen && plan?.id) {
      loadChatHistory()
    }
  }, [isOpen, plan?.id])

  const loadChatHistory = async () => {
    if (!plan) return

    try {
      const chatHistory = await backendAPI.getChatHistory(plan.id)
      const loadedMessages: Message[] = chatHistory.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      setMessages(loadedMessages)
    } catch (error) {
      console.error('加载聊天历史失败:', error)
    }
  }

  // 保存消息到后端
  const saveChatMessage = async (message: Message) => {
    if (!plan) return

    try {
      const chatMessage: ChatMessage = {
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString()
      }
      await backendAPI.saveChatMessage(plan.id, chatMessage)
    } catch (error) {
      console.error('保存聊天消息失败:', error)
    }
  }

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 眼睛动画效果
  useEffect(() => {
    if (!isOpen) return

    const lookDownInterval = setInterval(() => {
      setIsEyeLookingDown(true)
      setTimeout(() => setIsEyeLookingDown(false), 1500)
    }, 4000)

    const eyeMoveInterval = setInterval(() => {
      const randomLeftX = Math.random() * 4 - 2
      const randomRightX = Math.random() * 4 - 2
      setLeftEyeX(randomLeftX)
      setRightEyeX(randomRightX)
    }, 3000)

    return () => {
      clearInterval(lookDownInterval)
      clearInterval(eyeMoveInterval)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputValue.trim() || !plan) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // 保存用户消息
    await saveChatMessage(userMessage)

    try {
      const requestData = {
        planId: plan.id,
        plan: JSON.stringify({
          title: plan.title,
          description: plan.description,
          priority: plan.priority,
          progress: plan.progress,
          dueDate: plan.dueDate,
          tasks: plan.tasks.map(task => ({
            title: task.title,
            priority: task.priority,
            completed: task.completed,
            dueDate: task.dueDate
          }))
        }, null, 2),
        userMessage: userMessage.content,  // 添加用户消息
      }

      // 调用n8n的plan/analyze接口（与获取建议相同）
      const response: any = await n8nClient.post('/plan/analyze', requestData)
      const aiResponse = response?.output || response?.text || response?.message || '抱歉，我无法生成回复'

      const assistantMessage: Message = {
        role: 'assistant',
        content: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // 保存AI消息
      await saveChatMessage(assistantMessage)
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，发送消息失败，请检查n8n服务是否正常运行',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      // 保存错误消息
      await saveChatMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-background border-t border-x rounded-t-2xl shadow-2xl pointer-events-auto animate-slide-up h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            {/* AI 机器人表情头像 */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm animate-bounce-subtle">
              <div className="relative w-8 h-5 flex items-center justify-center gap-1.5">
                {/* 左眼 */}
                <div className="w-2.5 h-3 bg-background rounded-full flex items-center justify-center overflow-hidden">
                  <div
                    className="w-1.5 h-1.5 bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{
                      transform: `translate(${leftEyeX}px, ${isEyeLookingDown ? '2px' : '0px'})`,
                    }}
                  />
                </div>
                {/* 右眼 */}
                <div className="w-2.5 h-3 bg-background rounded-full flex items-center justify-center overflow-hidden">
                  <div
                    className="w-1.5 h-1.5 bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{
                      transform: `translate(${rightEyeX}px, ${isEyeLookingDown ? '2px' : '0px'})`,
                    }}
                  />
                </div>
              </div>
              {/* 装饰性粒子 */}
              <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold">AI 助手</h3>
              <p className="text-xs text-muted-foreground">
                关于 "{plan?.title || '未选择计划'}" 的学习规划咨询
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>开始与AI助手对话</p>
                <p className="text-xs mt-2">询问关于学习规划的任何问题</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={isLoading || !plan}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || !plan}
              size="icon"
              className="rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

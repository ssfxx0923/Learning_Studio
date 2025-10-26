import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

// AI 问候语列表
const greetings = [
  '嗨，你又回来了！继续加油吧~ 💪',
  '看起来是一个有趣的计划呢 🎯',
  '拖延症吗？有点意思... 🤔',
  '今天也要好好学习哦！✨',
  '嘿，让我看看你的进度如何... 👀',
  '不错不错，有在认真规划呢 📚',
  '我注意到你有新的想法了 💡',
  '坚持就是胜利！我看好你 🌟',
]

export function AIGreeting() {
  const [greeting, setGreeting] = useState('')
  const [isEyeLookingDown, setIsEyeLookingDown] = useState(false)
  const [leftEyeX, setLeftEyeX] = useState(0)
  const [rightEyeX, setRightEyeX] = useState(0)

  // 随机选择问候语
  useEffect(() => {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    setGreeting(randomGreeting)
  }, [])

  // 眼睛动画效果
  useEffect(() => {
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
  }, [])

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* AI 机器人脸 */}
          <div className="relative flex-shrink-0 animate-bounce-subtle">
            <div className="w-11 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:rotate-3 active:scale-95">
              {/* 机器人脸容器 */}
              <div className="relative w-10 h-6 flex items-center justify-center gap-1.5">
                {/* 左眼 */}
                <div className="w-3 h-4 bg-background rounded-full flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-2 h-2 bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      transform: `translate(${leftEyeX}px, ${isEyeLookingDown ? '3px' : '0px'})`,
                    }}
                  />
                </div>
                
                {/* 右眼 */}
                <div className="w-3 h-4 bg-background rounded-full flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-2 h-2 bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      transform: `translate(${rightEyeX}px, ${isEyeLookingDown ? '3px' : '0px'})`,
                    }}
                  />
                </div>
              </div>

              {/* 光环效果 */}
              <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse" />
            </div>

            {/* 装饰性粒子 */}
            <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-primary animate-pulse" />
          </div>

          {/* AI 问候文字 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary/80 tracking-wide">AI 助手</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {greeting}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


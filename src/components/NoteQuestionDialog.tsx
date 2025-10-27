import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Sparkles, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { HighlightedCodeBlock } from './HighlightedCodeBlock'
import { askNoteQuestion } from '@/lib/n8nClient'

interface NoteQuestionDialogProps {
  selectedText: string
  noteContext?: string
  onClose: () => void
}

export function NoteQuestionDialog({
  selectedText,
  noteContext,
  onClose,
}: NoteQuestionDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef({ top: 0, left: 0 })
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const [userQuestion, setUserQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const rafIdRef = useRef<number | null>(null)

  // 初始化位置（居中显示）
  useEffect(() => {
    const centerX = window.innerWidth / 2 - 200 // 对话框宽度约 400px
    const centerY = window.innerHeight / 2 - 250 // 对话框高度约 500px
    const initialPos = {
      top: Math.max(20, centerY),
      left: Math.max(20, centerX),
    }
    positionRef.current = initialPos
    setPosition(initialPos)
  }, [])

  // 处理拖动开始
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('[data-drag-handle]')) return

    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect()
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      setIsDragging(true)
    }
  }, [])

  // 处理拖动移动 - 使用 CSS transform 直接修改 DOM，避免 React 重新渲染
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)

      rafIdRef.current = requestAnimationFrame(() => {
        if (dialogRef.current) {
          const newLeft = Math.max(0, e.clientX - dragOffsetRef.current.x)
          const newTop = Math.max(0, e.clientY - dragOffsetRef.current.y)

          // 直接修改 DOM 元素的样式，避免 React 重新渲染
          // 使用 top/left 直接定位，不用 transform
          dialogRef.current.style.top = `${newTop}px`
          dialogRef.current.style.left = `${newLeft}px`

          // 同时更新 ref 以保持状态同步
          positionRef.current = { left: newLeft, top: newTop }
        }
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      // 拖动结束时同步位置到 state（这样下次会正确显示）
      setPosition(positionRef.current)
    }

    // 使用 passive: true 提升性能
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [isDragging])

  // 处理提问
  const handleAskQuestion = useCallback(async () => {
    if (!userQuestion.trim()) return

    setIsAsking(true)
    setAiAnswer('AI 正在思考中...')

    try {
      const answer = await askNoteQuestion({
        selectedText,
        question: userQuestion,
        noteContext,
      })
      setAiAnswer(answer)
    } catch (error: any) {
      setAiAnswer(`提问失败: ${error.message || '未知错误'}`)
    } finally {
      setIsAsking(false)
    }
  }, [selectedText, userQuestion, noteContext])

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : undefined,
      }}
      onMouseDown={handleDragStart}
    >
      <div className="bg-background/98 backdrop-blur-xl border-2 border-primary/20 rounded-xl shadow-2xl min-w-[400px] max-w-[600px]">
        {/* 可拖动的标题栏 */}
        <div
          data-drag-handle
          className="flex items-center justify-between px-4 py-2 border-b border-primary/10 cursor-move select-none bg-primary/5 rounded-t-xl"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">AI 问答助手</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-primary/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {/* 选中文本显示 */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1.5">选中内容</p>
              <p className="text-sm font-medium leading-relaxed bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                {selectedText}
              </p>
            </div>
          </div>

          {/* 提问输入框 */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">向 AI 提问</p>
            <div className="flex gap-2">
              <Textarea
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAskQuestion()
                  }
                }}
                placeholder="例如：这段话是什么意思？能详细解释一下吗？"
                className="flex-1 min-h-[80px] resize-none border-2 text-sm"
                disabled={isAsking}
              />
            </div>
            <Button
              onClick={handleAskQuestion}
              disabled={!userQuestion.trim() || isAsking}
              size="sm"
              className="w-full gap-2 border-2"
            >
              {isAsking ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  AI 思考中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  发送提问
                </>
              )}
            </Button>
          </div>

          {/* AI回答显示 - 支持Markdown渲染 */}
          {aiAnswer && (
            <div className="pt-3 border-t">
              <p className="text-xs font-semibold mb-2 text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI 回答
              </p>
              <div
                className="text-sm bg-muted/30 rounded-lg p-3 max-h-[300px] overflow-y-auto
                [&_.prose]:max-w-none
                [&_p]:text-foreground/90 [&_p]:leading-relaxed [&_p]:my-2
                [&_h1]:text-foreground [&_h1]:font-semibold [&_h1]:text-lg
                [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-base
                [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-sm
                [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:text-foreground/90
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_code]:text-foreground [&_code]:bg-muted/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
                [&_pre]:!bg-[#0d1117] [&_pre]:!text-[#c9d1d9] [&_pre]:text-xs [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2 [&_pre]:overflow-x-auto
                [&_pre_code]:!text-[#c9d1d9] [&_pre_code]:!bg-transparent [&_pre_code]:!p-0
                [&_blockquote]:border-l-primary [&_blockquote]:border-l-4 [&_blockquote]:bg-muted/50 [&_blockquote]:py-0.5 [&_blockquote]:pl-3 [&_blockquote]:my-2
                [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
                [&_table]:text-sm [&_table]:my-2 [&_table]:w-full
                [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold
                [&_td]:px-2 [&_td]:py-1 [&_td]:border-t [&_td]:border-border"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children }: any) {
                      return (
                        <HighlightedCodeBlock
                          className={className}
                          inline={inline}
                        >
                          {String(children).replace(/\n$/, '')}
                        </HighlightedCodeBlock>
                      )
                    },
                  }}
                >
                  {aiAnswer}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}


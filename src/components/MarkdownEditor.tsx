import { useEffect, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import { cn } from '@/lib/utils'
import { getAICompletion } from '@/lib/n8nClient'
import { HighlightedCodeBlock } from './HighlightedCodeBlock'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionOverlayRef = useRef<HTMLDivElement>(null)

  // 撤销/重做历史记录
  const historyRef = useRef<Array<{ content: string; cursor: number }>>([{ content: value, cursor: 0 }])
  const historyIndexRef = useRef(0)
  const isUndoRedoRef = useRef(false) // 标记是否正在执行撤销/重做操作

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current && !isPreview) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value, isPreview])

  // 提取光标上下10行的上下文
  const getContext = useCallback((text: string, cursorPos: number) => {
    const lines = text.substring(0, cursorPos).split('\n')
    const currentLineIndex = lines.length - 1

    // 获取光标前10行和后10行
    const allLines = text.split('\n')
    const startLine = Math.max(0, currentLineIndex - 10)
    const endLine = Math.min(allLines.length, currentLineIndex + 11)

    const contextLines = allLines.slice(startLine, endLine)
    const context = contextLines.join('\n')

    // 计算光标在上下文中的位置
    const beforeContext = allLines.slice(startLine, currentLineIndex).join('\n')
    const contextCursorPos = beforeContext.length + (beforeContext.length > 0 ? 1 : 0) + lines[currentLineIndex].length

    return { context, contextCursorPos }
  }, [])

  // 请求 AI 补全建议
  const fetchAISuggestion = useCallback(async (text: string, cursorPos: number) => {
    // 如果在预览模式，不请求建议
    if (isPreview) return

    // 如果光标不在文本末尾，不请求建议
    if (cursorPos < text.length) {
      setAiSuggestion('')
      return
    }

    setIsLoadingSuggestion(true)

    try {
      const { context, contextCursorPos } = getContext(text, cursorPos)

      // 如果上下文太短，不请求
      if (context.trim().length < 10) {
        setAiSuggestion('')
        setIsLoadingSuggestion(false)
        return
      }

      const suggestion = await getAICompletion({
        context,
        cursorPosition: contextCursorPos,
      })

      setAiSuggestion(suggestion)
    } catch (error) {
      console.error('获取 AI 建议失败:', error)
      setAiSuggestion('')
    } finally {
      setIsLoadingSuggestion(false)
    }
  }, [isPreview, getContext])

  // 处理文本变化，带防抖
  const handleTextChange = useCallback((newValue: string, newCursorPos?: number) => {
    // 如果不是撤销/重做操作，添加到历史记录
    if (!isUndoRedoRef.current) {
      const cursor = newCursorPos ?? textareaRef.current?.selectionStart ?? 0

      // 删除当前索引之后的所有历史记录
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)

      // 添加新的历史记录
      historyRef.current.push({ content: newValue, cursor })
      historyIndexRef.current = historyRef.current.length - 1

      // 限制历史记录数量为 50 条
      if (historyRef.current.length > 50) {
        historyRef.current.shift()
        historyIndexRef.current--
      }
    }

    onChange(newValue)

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 清除旧的建议
    setAiSuggestion('')

    // 设置新的防抖定时器（800ms 后请求 AI 建议）
    debounceTimerRef.current = setTimeout(() => {
      const cursor = newCursorPos ?? textareaRef.current?.selectionStart ?? 0
      fetchAISuggestion(newValue, cursor)
    }, 800)
  }, [onChange, fetchAISuggestion])

  // 撤销操作 (Ctrl+Z)
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return

    isUndoRedoRef.current = true
    historyIndexRef.current--

    const historyItem = historyRef.current[historyIndexRef.current]
    onChange(historyItem.content)

    setTimeout(() => {
      if (textareaRef.current) {
        const scrollTop = textareaRef.current.scrollTop
        const scrollLeft = textareaRef.current.scrollLeft

        textareaRef.current.focus({ preventScroll: true })
        textareaRef.current.setSelectionRange(historyItem.cursor, historyItem.cursor)

        textareaRef.current.scrollTop = scrollTop
        textareaRef.current.scrollLeft = scrollLeft
      }
      isUndoRedoRef.current = false
    }, 0)
  }, [onChange])

  // 重做操作 (Ctrl+Y)
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return

    isUndoRedoRef.current = true
    historyIndexRef.current++

    const historyItem = historyRef.current[historyIndexRef.current]
    onChange(historyItem.content)

    setTimeout(() => {
      if (textareaRef.current) {
        const scrollTop = textareaRef.current.scrollTop
        const scrollLeft = textareaRef.current.scrollLeft

        textareaRef.current.focus({ preventScroll: true })
        textareaRef.current.setSelectionRange(historyItem.cursor, historyItem.cursor)

        textareaRef.current.scrollTop = scrollTop
        textareaRef.current.scrollLeft = scrollLeft
      }
      isUndoRedoRef.current = false
    }, 0)
  }, [onChange])

  // 处理光标位置变化
  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current) return
    const pos = textareaRef.current.selectionStart

    // 如果光标不在末尾，清除建议
    if (pos < value.length) {
      setAiSuggestion('')
    }
  }, [value.length])

  // 接受 AI 建议 (Tab 键)
  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion) return

    const newValue = value + aiSuggestion
    const newCursorPos = newValue.length

    // 通过 handleTextChange 触发，这样会添加到历史记录
    handleTextChange(newValue, newCursorPos)
    setAiSuggestion('')

    // 将光标移到末尾（保持滚动位置）
    setTimeout(() => {
      if (textareaRef.current) {
        const scrollTop = textareaRef.current.scrollTop
        const scrollLeft = textareaRef.current.scrollLeft

        textareaRef.current.focus({ preventScroll: true })
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)

        // 恢复滚动位置
        textareaRef.current.scrollTop = scrollTop
        textareaRef.current.scrollLeft = scrollLeft
      }
    }, 0)
  }, [aiSuggestion, value, handleTextChange])

  // 拒绝 AI 建议 (Esc 键)
  const rejectSuggestion = useCallback(() => {
    setAiSuggestion('')
  }, [])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
      return
    }

    // Ctrl+Y 或 Ctrl+Shift+Z 重做
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
      e.preventDefault()
      redo()
      return
    }

    // Tab 键接受建议
    if (e.key === 'Tab' && aiSuggestion) {
      e.preventDefault()
      acceptSuggestion()
      return
    }

    // Esc 键拒绝建议
    if (e.key === 'Escape' && aiSuggestion) {
      e.preventDefault()
      rejectSuggestion()
      return
    }
  }, [aiSuggestion, acceptSuggestion, rejectSuggestion, undo, redo])

  // 插入 Markdown 语法
  const insertMarkdown = useCallback((before: string, after = '', placeholder = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = before + (selectedText || placeholder) + after

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    const newCursorPos = start + before.length + (selectedText || placeholder).length

    // 通过 handleTextChange 触发，这样会添加到历史记录
    handleTextChange(newValue, newCursorPos)

    // 清除 AI 建议
    setAiSuggestion('')

    // 设置新的光标位置（保存当前滚动位置，防止跳转）
    setTimeout(() => {
      const scrollTop = textarea.scrollTop
      const scrollLeft = textarea.scrollLeft

      textarea.focus({ preventScroll: true }) // 防止自动滚动
      textarea.setSelectionRange(newCursorPos, newCursorPos)

      // 恢复滚动位置
      textarea.scrollTop = scrollTop
      textarea.scrollLeft = scrollLeft
    }, 0)
  }, [value, handleTextChange])

  // 计算建议文本的位置（显示在光标后面）
  useEffect(() => {
    if (!textareaRef.current || !suggestionOverlayRef.current || !aiSuggestion) return

    const textarea = textareaRef.current
    const overlay = suggestionOverlayRef.current

    // 同步滚动位置
    overlay.scrollTop = textarea.scrollTop
    overlay.scrollLeft = textarea.scrollLeft
  }, [aiSuggestion, value])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        <button
          onClick={() => insertMarkdown('**', '**', '加粗文本')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="加粗 (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => insertMarkdown('*', '*', '斜体文本')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="斜体 (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => insertMarkdown('~~', '~~', '删除线')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="删除线"
        >
          <s>S</s>
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => insertMarkdown('# ', '', '标题')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="标题 1"
        >
          H1
        </button>
        <button
          onClick={() => insertMarkdown('## ', '', '标题')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="标题 2"
        >
          H2
        </button>
        <button
          onClick={() => insertMarkdown('### ', '', '标题')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="标题 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => insertMarkdown('[', '](url)', '链接文本')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="链接"
        >
          🔗
        </button>
        <button
          onClick={() => insertMarkdown('![', '](url)', '图片描述')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="图片"
        >
          🖼️
        </button>
        <button
          onClick={() => insertMarkdown('```\n', '\n```', '代码')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="代码块"
        >
          {'</>'}
        </button>
        <button
          onClick={() => insertMarkdown('`', '`', '代码')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="行内代码"
        >
          Code
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => insertMarkdown('- ', '', '列表项')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="无序列表"
        >
          • List
        </button>
        <button
          onClick={() => insertMarkdown('1. ', '', '列表项')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="有序列表"
        >
          1. List
        </button>
        <button
          onClick={() => insertMarkdown('> ', '', '引用')}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="引用"
        >
          " Quote
        </button>

        {/* AI 状态指示器 */}
        {isLoadingSuggestion && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            AI 思考中...
          </div>
        )}

        {aiSuggestion && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            按 Tab 接受建议 | 按 Esc 拒绝
          </div>
        )}

        <div className="flex-1" />
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={cn(
            'px-3 py-1 text-sm rounded',
            isPreview ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          )}
          title={isPreview ? '编辑' : '预览'}
        >
          {isPreview ? '✏️ 编辑' : '👁️ 预览'}
        </button>
      </div>

      {/* 编辑器/预览区域 */}
      <div className="flex-1 overflow-auto relative">
        {isPreview ? (
          <div
            ref={previewRef}
            className="p-6 prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-h1:text-3xl prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-8
              prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-6
              prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-bold
              prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:!bg-[#0d1117] prose-pre:!text-[#c9d1d9] prose-pre:!p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
              prose-li:my-1 prose-li:text-foreground
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
              prose-img:rounded-lg prose-img:shadow-lg
              prose-hr:border-border prose-hr:my-8
              prose-table:border-collapse prose-table:w-full
              prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2
              prose-td:border prose-td:border-border prose-td:p-2
              [&_pre_code]:!text-inherit [&_pre_code]:!bg-transparent [&_pre_code]:!p-0"
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
              {value || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* AI 建议覆盖层 */}
            {aiSuggestion && (
              <div
                ref={suggestionOverlayRef}
                className="absolute inset-0 pointer-events-none overflow-auto"
                style={{
                  padding: '24px',
                }}
              >
                <pre className="w-full min-h-full font-mono text-sm whitespace-pre-wrap break-words">
                  {/* 原文本（不可见） */}
                  <span className="invisible">{value}</span>
                  {/* AI 建议（半透明） */}
                  <span className="text-primary/40 font-mono">
                    {aiSuggestion}
                  </span>
                </pre>
              </div>
            )}

            {/* 实际的 textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              className="relative w-full min-h-full p-6 bg-transparent border-none outline-none resize-none font-mono text-sm z-10"
              placeholder="开始写下你的想法..."
              style={{
                caretColor: 'auto',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

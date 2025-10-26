import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // 可以选择其他主题
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current && !isPreview) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value, isPreview])

  // 高亮代码块
  useEffect(() => {
    if (isPreview && previewRef.current) {
      const codeBlocks = previewRef.current.querySelectorAll('pre code')
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement)
      })
    }
  }, [isPreview, value])

  // 插入 Markdown 语法
  const insertMarkdown = (before: string, after = '', placeholder = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = before + (selectedText || placeholder) + after

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)

    // 设置新的光标位置
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText || placeholder).length
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

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
      <div className="flex-1 overflow-auto">
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
                code({ node, inline, className, children, ...props }: any) {
                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                  // 代码块：不额外包裹 pre，ReactMarkdown 会自动处理
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {value || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-full p-6 bg-transparent border-none outline-none resize-none font-mono text-sm"
            placeholder="开始写下你的想法..."
          />
        )}
      </div>
    </div>
  )
}

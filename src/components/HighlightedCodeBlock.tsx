import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'

interface HighlightedCodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

/**
 * 直接在 ReactMarkdown 组件中处理代码高亮
 * 这样可以避免与 Hook 的冲突
 */
export const HighlightedCodeBlock = ({
  children,
  className = '',
  inline = false,
}: HighlightedCodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!inline && codeRef.current) {
      try {
        hljs.highlightElement(codeRef.current)
      } catch (error) {
        console.error('代码高亮失败:', error)
      }
    }
  }, [children, className, inline])

  if (inline) {
    return (
      <code className={className}>
        {children}
      </code>
    )
  }

  return (
    <code ref={codeRef} className={className}>
      {children}
    </code>
  )
}

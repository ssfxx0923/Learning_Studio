import { useEffect, useRef, memo } from 'react'
import hljs from 'highlight.js'

interface HighlightedCodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

/**
 * 直接在 ReactMarkdown 组件中处理代码高亮
 * 这样可以避免与 Hook 的冲突
 * 使用 memo 优化，避免不必要的重新渲染
 */
export const HighlightedCodeBlock = memo(
  function HighlightedCodeBlock({
    children,
    className = '',
    inline = false,
  }: HighlightedCodeBlockProps) {
    const codeRef = useRef<HTMLElement>(null)

    useEffect(() => {
      if (!inline && codeRef.current) {
        try {
          // 移除已有的高亮标记以确保重新高亮
          codeRef.current.classList.remove('hljs')
          hljs.highlightElement(codeRef.current)
        } catch (error) {
          console.error('代码高亮失败:', error)
        }
      }
    }, [children, className, inline])

    if (inline) {
      return <code className={className}>{children}</code>
    }

    return <code ref={codeRef} className={className}>{children}</code>
  },
  (prevProps, nextProps) => {
    // 自定义 memo 比较：只当这些属性相等时才跳过重新渲染
    return (
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className &&
      prevProps.inline === nextProps.inline
    )
  }
)

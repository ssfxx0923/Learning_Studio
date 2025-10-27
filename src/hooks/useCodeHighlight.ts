import { useEffect, RefObject, useRef } from 'react'
import hljs from 'highlight.js'

/**
 * 列表视图专用的代码高亮 Hook
 * 性能优化：使用 IntersectionObserver 只高亮可见的代码块
 * 优化：避免重复高亮和频繁的观察器创建
 */
export const useLazyCodeHighlight = (
  containerRef: RefObject<HTMLElement>,
  dependencies: any[] = []
) => {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 如果观察器已存在，先断开旧的
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const codeBlocks = (entry.target as HTMLElement).querySelectorAll('pre code')
            codeBlocks.forEach((block) => {
              const htmlBlock = block as HTMLElement

              // 检查是否已经高亮过，避免重复高亮
              if (htmlBlock.dataset.highlighted !== 'yes') {
                try {
                  hljs.highlightElement(htmlBlock)
                  htmlBlock.dataset.highlighted = 'yes'
                } catch (error) {
                  console.error('代码高亮失败:', error)
                }
              }
            })

            // 高亮完成后停止观察
            if (observerRef.current) {
              observerRef.current.unobserve(entry.target)
            }
          }
        })
      },
      { rootMargin: '50px' } // 提前 50px 开始加载
    )

    // 观察所有包含代码块的卡片
    const cards = containerRef.current.querySelectorAll('[data-note-card]')
    cards.forEach((card) => {
      if (observerRef.current) {
        observerRef.current.observe(card)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, dependencies)
}



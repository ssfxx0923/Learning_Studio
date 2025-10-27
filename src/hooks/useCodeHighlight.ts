import { useEffect, RefObject } from 'react'
import hljs from 'highlight.js'

/**
 * 列表视图专用的代码高亮 Hook
 * 性能优化：使用 IntersectionObserver 只高亮可见的代码块
 */
export const useLazyCodeHighlight = (
  containerRef: RefObject<HTMLElement>,
  dependencies: any[] = []
) => {
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const codeBlocks = entry.target.querySelectorAll('pre code')
            codeBlocks.forEach((block) => {
              const htmlBlock = block as HTMLElement

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
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '50px' } // 提前 50px 开始加载
    )

    // 观察所有包含代码块的卡片
    const cards = containerRef.current.querySelectorAll('[data-note-card]')
    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, dependencies)
}


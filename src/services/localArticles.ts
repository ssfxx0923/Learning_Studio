// 本地文章数据服务
export interface LocalArticle {
  id: string
  title: string
  words: string[]
  content: string
  imageUrl: string
  middleImageUrl?: string
  audioUrl?: string
  createdAt: Date
}

// 从文件系统加载的文章列表缓存
let articlesCache: LocalArticle[] | null = null

// 从 content.json 解析文章数据
async function loadArticleFromJson(articleId: string): Promise<LocalArticle | null> {
  try {
    const response = await fetch(`/data/english/artikel/${articleId}/content.json`)
    if (!response.ok) return null
    
    const data = await response.json()
    const articleData = data[0]?.output
    
    if (!articleData) return null
    
    // 检查文件是否存在的辅助函数
    const checkFileExists = async (url: string): Promise<boolean> => {
      try {
        const res = await fetch(url, { method: 'HEAD' })
        return res.ok
      } catch {
        return false
      }
    }
    
    // 构建文件路径
    const basePath = `/data/english/artikel/${articleId}`
    const coverPath = `${basePath}/cover.png`
    const middlePath = `${basePath}/middle.png`
    const audioPath = `${basePath}/audio.mp3`
    
    // 检查可选文件是否存在
    const [hasMiddle, hasAudio] = await Promise.all([
      checkFileExists(middlePath),
      checkFileExists(audioPath)
    ])
    
    return {
      id: articleId,
      title: articleData.Title || 'Untitled',
      words: articleData.Words || [],
      content: articleData.Body || '',
      imageUrl: coverPath,
      middleImageUrl: hasMiddle ? middlePath : undefined,
      audioUrl: hasAudio ? audioPath : undefined,
      createdAt: new Date()
    }
  } catch (error) {
    console.error(`Failed to load article ${articleId}:`, error)
    return null
  }
}

// 加载所有文章
export async function loadLocalArticles(): Promise<LocalArticle[]> {
  // 如果有缓存，直接返回
  if (articlesCache) {
    return articlesCache
  }
  
  try {
    // 读取文章索引
    const indexResponse = await fetch('/data/english/artikel/index.json')
    if (!indexResponse.ok) {
      console.error('Failed to load articles index')
      return []
    }
    
    const indexData = await indexResponse.json()
    const articleIds: string[] = indexData.articles || []
    
    // 并行加载所有文章
    const articles = await Promise.all(
      articleIds.map(id => loadArticleFromJson(id))
    )
    
    // 过滤掉加载失败的文章
    articlesCache = articles.filter((article): article is LocalArticle => article !== null)
    
    return articlesCache
  } catch (error) {
    console.error('Failed to load articles:', error)
    return []
  }
}

// 重新加载文章列表（清除缓存）
export function reloadArticles(): void {
  articlesCache = null
}

// 添加新文章到索引（需要手动更新 index.json）
export function getArticleIndexPath(): string {
  return '/data/english/artikel/index.json'
}

// 删除文章（需要手动从文件系统和 index.json 中删除）
export function deleteArticle(articleId: string): void {
  console.warn('Please manually delete the article folder and update index.json')
  console.log(`Article to delete: /data/english/artikel/${articleId}`)
  // 清除缓存，强制重新加载
  reloadArticles()
}


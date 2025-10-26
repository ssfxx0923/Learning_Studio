import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles, Plus, X, BookOpen, Volume2, Languages, Trash2, Play, Pause, RefreshCw } from 'lucide-react'
import { englishAPI } from '@/services/api'
import { loadLocalArticles, reloadArticles, deleteArticle as deleteLocalArticle } from '@/services/localArticles'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Article {
  id: string
  title: string
  words: string[]
  content: string
  imageUrl: string
  middleImageUrl?: string
  audioUrl?: string
  createdAt: Date
}

export default function EnglishLearning() {
  const [articles, setArticles] = useState<Article[]>([])
  const [inputText, setInputText] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [translation, setTranslation] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null)
  const [isWordsExpanded, setIsWordsExpanded] = useState(false)
  const [isLoadingArticles, setIsLoadingArticles] = useState(true)

  // 加载本地文章数据
  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    setIsLoadingArticles(true)
    try {
      const localArticles = await loadLocalArticles()
      setArticles(localArticles)
    } catch (error) {
      console.error('Failed to load articles:', error)
    } finally {
      setIsLoadingArticles(false)
    }
  }

  const refreshArticles = async () => {
    reloadArticles() // 清除缓存
    await loadArticles()
  }

  const generateArticle = async () => {
    if (!inputText.trim()) return

    setIsGenerating(true)
    try {
      // 调用后端 API 生成文章
      await englishAPI.generateArticle(inputText.trim())
      
      // 生成成功后提示用户
      alert('文章生成请求已提交！\n\nn8n 工作流正在生成文章，请稍等片刻后点击"刷新"按钮查看新文章。')
      
      setInputText('')
      setIsDialogOpen(false)
      
      // 3秒后自动刷新
      setTimeout(() => {
        refreshArticles()
      }, 3000)
    } catch (error: any) {
      console.error('生成文章失败:', error)
      const errorMsg = error.response?.data?.error || error.message || '未知错误'
      alert(`文章生成失败：${errorMsg}\n\n请检查：\n1. 后端服务是否运行（http://localhost:3001）\n2. n8n 工作流是否正确配置\n3. 网络连接是否正常`)
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteArticle = (id: string) => {
    if (confirm('确定要删除这篇文章吗？\n\n注意：你需要手动：\n1. 删除文件夹 public/data/english/artikel/' + id + '\n2. 从 index.json 中移除该文章ID\n3. 点击刷新按钮')) {
      deleteLocalArticle(id)
      setArticles(articles.filter((a) => a.id !== id))
      if (selectedArticle?.id === id) {
        setSelectedArticle(null)
      }
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString()
    if (text && text.trim()) {
      setSelectedText(text.trim())
      setTranslation('')
      
      // 获取选中文本的位置
      const range = selection?.getRangeAt(0)
      if (range) {
        const rect = range.getBoundingClientRect()
        setToolbarPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        })
      }
    } else {
      setSelectedText('')
      setTranslation('')
      setToolbarPosition(null)
    }
  }

  const translateText = async () => {
    if (!selectedText) return
    try {
      const response: any = await englishAPI.translateWord(selectedText)
      setTranslation(response.translation || `${selectedText} 的翻译`)
    } catch (error) {
      console.error('翻译失败:', error)
      setTranslation(`示例翻译: ${selectedText} → (需要配置后端)`)
    }
  }

  const playAudio = async () => {
    if (!selectedText) return
    try {
      const response: any = await englishAPI.generateAudio(selectedText)
      const audio = new Audio(response.audioUrl)
      audio.play()
    } catch (error) {
      console.error('生成音频失败:', error)
      alert('音频生成功能需要配置n8n后端')
    }
  }

  // 播放文章完整音频
  const toggleArticleAudio = () => {
    if (!selectedArticle?.audioUrl) {
      alert('该文章没有音频文件')
      return
    }

    if (isPlaying && audioElement) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      if (audioElement) {
        audioElement.play()
        setIsPlaying(true)
      } else {
        const audio = new Audio(selectedArticle.audioUrl)
        audio.onended = () => setIsPlaying(false)
        audio.onerror = () => {
          alert('音频加载失败')
          setIsPlaying(false)
        }
        setAudioElement(audio)
        audio.play()
        setIsPlaying(true)
      }
    }
  }

  // 清理音频
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        setAudioElement(null)
      }
    }
  }, [audioElement])

  // 切换文章时重置音频
  useEffect(() => {
    if (audioElement) {
      audioElement.pause()
      setAudioElement(null)
      setIsPlaying(false)
    }
    setIsWordsExpanded(false)
  }, [selectedArticle])

  // 点击页面其他地方时关闭工具栏
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (selectedText && !target.closest('.prose') && !target.closest('[data-toolbar]')) {
        setSelectedText('')
        setTranslation('')
        setToolbarPosition(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [selectedText])

  // 如果正在阅读文章，显示阅读视图
  if (selectedArticle) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b z-10">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedArticle(null)
                  setSelectedText('')
                  setTranslation('')
                  setToolbarPosition(null)
                  setIsWordsExpanded(false)
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                返回列表
              </Button>
              
              <div className="flex items-center gap-2">
                {selectedArticle.audioUrl && (
                  <Button
                    onClick={toggleArticleAudio}
                    variant={isPlaying ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        暂停
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        朗读
                      </>
                    )}
                  </Button>
                )}
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteArticle(selectedArticle.id)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 文章内容 */}
        <article className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          {/* 文章头部 */}
          <header className="mb-8 lg:mb-12 space-y-6">
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent">
              {selectedArticle.title}
            </h1>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(isWordsExpanded ? selectedArticle.words : selectedArticle.words.slice(0, 20)).map((word) => (
                  <span
                    key={word}
                    className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-primary/10 to-pink-500/10 text-primary font-medium border border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    {word}
                  </span>
                ))}
              </div>
              
              {selectedArticle.words.length > 20 && (
                <button
                  onClick={() => setIsWordsExpanded(!isWordsExpanded)}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1.5"
                >
                  {isWordsExpanded ? (
                    <>
                      <span>收起</span>
                      <span className="text-xs">↑</span>
                    </>
                  ) : (
                    <>
                      <span>显示全部 {selectedArticle.words.length} 个单词</span>
                      <span className="text-xs">↓</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 封面图 */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/10">
              <div className="aspect-[21/9] lg:aspect-[21/8]">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </header>

          {/* 文章正文 */}
          <div className="space-y-8 lg:space-y-12">
            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-p:text-lg prose-p:leading-loose prose-p:text-foreground/90
                prose-headings:text-foreground
                selection:bg-primary/20 selection:text-primary-foreground
                cursor-text"
              onMouseUp={handleTextSelection}
            >
              <p className="whitespace-pre-line text-justify first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-1 first-letter:float-left first-letter:leading-tight">
                {selectedArticle.content}
              </p>
            </div>

            {/* 中间配图 */}
            {selectedArticle.middleImageUrl && (
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-primary/10 my-8 lg:my-12">
                <div className="aspect-[16/9]">
                  <img
                    src={selectedArticle.middleImageUrl}
                    alt="Illustration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 划词工具栏 */}
          {selectedText && toolbarPosition && (
            <div 
              data-toolbar
              className="absolute z-20 animate-in fade-in zoom-in-95 duration-200"
              style={{
                top: `${toolbarPosition.top + 10}px`,
                left: `${toolbarPosition.left}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="bg-background/98 backdrop-blur-xl border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[500px]">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1.5">选中文本</p>
                      <p className="text-sm font-medium leading-relaxed bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                        {selectedText}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedText('')
                        setTranslation('')
                        setToolbarPosition(null)
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={translateText} 
                      variant="outline" 
                      size="sm"
                      className="flex-1 gap-2 border-2"
                    >
                      <Languages className="h-4 w-4" />
                      翻译
                    </Button>
                    <Button 
                      onClick={playAudio} 
                      variant="outline" 
                      size="sm"
                      className="flex-1 gap-2 border-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      朗读
                    </Button>
                  </div>

                  {/* 翻译结果 */}
                  {translation && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold mb-2 text-primary">翻译结果</p>
                      <p className="text-sm leading-relaxed text-foreground/90">{translation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    )
  }

  // 文章列表视图
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            英语学习
          </h1>
          <p className="text-muted-foreground">
            输入你想要学习的单词,我们将为你生成包含这些单词的文章
          </p>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">我的文章</h2>
          <div className="flex gap-2">
            <Button
              onClick={refreshArticles}
              variant="outline"
              className="gap-2"
              disabled={isLoadingArticles}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingArticles ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gap-2 shadow-lg shadow-primary/30"
            >
              <Plus className="h-4 w-4" />
              创建文章
            </Button>
          </div>
        </div>

        {isLoadingArticles ? (
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">加载中...</h3>
              <p className="text-muted-foreground text-center">
                正在读取文章数据
              </p>
            </CardContent>
          </Card>
        ) : articles.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">创建新文章</h3>
              <p className="text-muted-foreground text-center mb-6">
                添加单词并生成新文章
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                开始创建
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-pink-500/10">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium">点击阅读 →</p>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.words.slice(0, 6).map((word) => (
                      <span
                        key={word}
                        className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium"
                      >
                        {word}
                      </span>
                    ))}
                    {article.words.length > 6 && (
                      <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground">
                        +{article.words.length - 6}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.content}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedArticle(article)}
                    >
                      阅读文章
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteArticle(article.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 生成文章对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>生成文章</DialogTitle>
            <DialogDescription>
              输入你想学习的内容，AI 将为你生成一篇有趣的文章
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">输入内容</label>
              <Textarea
                placeholder="例如：输入单词列表（adventure, mystery, journey）或描述你想学习的主题（我想学习关于太空探险的英语表达）"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[120px] border-2 focus-visible:ring-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                提示：你可以输入单词列表、短语或描述，AI 会智能解析并生成合适的文章
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-pink-500/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">示例输入：</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• whisper, lantern, horizon, puzzle</li>
                    <li>• 我想学习关于旅行的英语单词</li>
                    <li>• 生成一篇包含科技词汇的文章</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={generateArticle}
              disabled={!inputText.trim() || isGenerating}
              className="w-full shadow-lg shadow-primary/30"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? '正在生成...' : '生成文章'}
            </Button>

            {isGenerating && (
              <p className="text-xs text-muted-foreground text-center">
                AI 正在生成文章，这可能需要几分钟时间，请耐心等待...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Search,
  Tag,
  Folder,
  Save,
  Trash2,
  X,
  ArrowLeft,
  Calendar,
  Edit,
} from 'lucide-react'
import { backendAPI, type Note } from '@/services/api'
import MarkdownEditor from '@/components/MarkdownEditor'
import { HighlightedCodeBlock } from '@/components/HighlightedCodeBlock'
import { NoteQuestionDialog } from '@/components/NoteQuestionDialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import { cn } from '@/lib/utils'
import { useLazyCodeHighlight } from '@/hooks/useCodeHighlight'

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const listContainerRef = useRef<HTMLDivElement>(null)

  // 划词提问对话框状态
  const [selectedText, setSelectedText] = useState('')
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editCategory, setEditCategory] = useState('')
  const [tagInput, setTagInput] = useState('')

  // 加载所有笔记
  const loadNotes = async () => {
    setLoading(true)
    try {
      const data = await backendAPI.getAllNotes()
      setNotes(data)
    } catch (error) {
      console.error('加载笔记失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  // 过滤笔记 - 使用 useMemo 缓存结果，避免不必要的重新计算
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        searchQuery === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTag = filterTag === null || note.tags.includes(filterTag)

      return matchesSearch && matchesTag
    })
  }, [notes, searchQuery, filterTag])

  // 获取所有标签 - 使用 useMemo 缓存
  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))), [notes])

  // 只在列表视图使用懒加载高亮
  useLazyCodeHighlight(listContainerRef, [filteredNotes])

  // 创建新笔记
  const handleCreateNote = () => {
    setSelectedNote(null)
    setEditTitle('')
    setEditContent('')
    setEditTags([])
    setEditCategory('')
    setIsEditing(true)
  }

  // 打开笔记（预览模式）
  const handleOpenNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags)
    setEditCategory(note.category || '')
    setIsEditing(false) // 先进入预览模式
  }

  // 进入编辑模式
  const handleEditNote = () => {
    setIsEditing(true)
  }

  // 保存笔记
  const handleSaveNote = async () => {
    if (!editTitle.trim()) {
      alert('请输入标题')
      return
    }

    setLoading(true)
    try {
      if (selectedNote) {
        // 更新现有笔记
        const updatedNote = await backendAPI.updateNote(selectedNote.id, {
          title: editTitle,
          content: editContent,
          tags: editTags,
          category: editCategory || undefined,
        })
        setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)))
        setSelectedNote(updatedNote)
      } else {
        // 创建新笔记
        const newNote = await backendAPI.createNote({
          title: editTitle,
          content: editContent,
          tags: editTags,
          category: editCategory || undefined,
        })
        setNotes([newNote, ...notes])
        setSelectedNote(newNote)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('保存笔记失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除笔记
  const handleDeleteNote = async () => {
    if (!selectedNote) return

    if (!confirm('确定要删除这篇笔记吗？')) return

    setLoading(true)
    try {
      await backendAPI.deleteNote(selectedNote.id)
      setNotes(notes.filter((n) => n.id !== selectedNote.id))
      setSelectedNote(null)
      setIsEditing(false)
    } catch (error) {
      console.error('删除笔记失败:', error)
      alert('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      setEditTags([...editTags, trimmedTag])
      setTagInput('')
    }
  }

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag))
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString()
    if (text && text.trim()) {
      setSelectedText(text.trim())
      setShowQuestionDialog(true)
    } else {
      setSelectedText('')
      setShowQuestionDialog(false)
    }
  }

  // 如果选中了笔记且不在编辑模式，显示预览
  if (selectedNote && !isEditing) {
    return (
      <div className="h-screen flex flex-col">
        {/* 顶部工具栏 */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedNote(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{selectedNote.title}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteNote}
              disabled={loading}
            >
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
            <Button onClick={handleEditNote}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </div>

          {/* 标签和分类 */}
          <div className="px-6 pb-4 space-y-2">
            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              {selectedNote.category && (
                <div className="flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  <span>{selectedNote.category}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>更新于 {formatDate(selectedNote.updatedAt)}</span>
              </div>
              {selectedNote.tags.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {selectedNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Markdown 预览 */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <article
              className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mb-4
              prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-foreground/90 prose-p:leading-7
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:!bg-[#0d1117] prose-pre:!text-[#c9d1d9] prose-pre:!p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
              prose-pre:shadow-lg prose-pre:border-0
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
              prose-ul:my-4 prose-ol:my-4
              prose-li:my-1
              prose-img:rounded-lg prose-img:shadow-md
              prose-hr:my-8
              selection:bg-primary/20 selection:text-primary-foreground
              cursor-text
              [&_pre]:!bg-[#0d1117] [&_pre]:!text-[#c9d1d9]
              [&_pre_code]:!text-inherit [&_pre_code]:!bg-transparent [&_pre_code]:!p-0 [&_pre_code]:!text-[#c9d1d9]"
              onMouseUp={handleTextSelection}
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
                {selectedNote.content || '暂无内容'}
              </ReactMarkdown>
            </article>
          </div>
        </div>

        {/* 划词提问对话框 */}
        {selectedText && showQuestionDialog && (
          <NoteQuestionDialog
            selectedText={selectedText}
            noteContext={selectedNote?.content}
            onClose={() => {
              setSelectedText('')
              setShowQuestionDialog(false)
            }}
          />
        )}
      </div>
    )
  }

  // 如果在编辑模式，显示编辑器
  if (isEditing) {
    return (
      <div className="h-screen flex flex-col">
        {/* 顶部工具栏 */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-6 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (selectedNote) {
                  // 如果是编辑现有笔记，检查是否有未保存的更改
                  if (
                    editTitle === selectedNote.title &&
                    editContent === selectedNote.content &&
                    JSON.stringify(editTags) === JSON.stringify(selectedNote.tags) &&
                    editCategory === (selectedNote.category || '')
                  ) {
                    // 没有更改，返回预览模式
                    setIsEditing(false)
                  } else {
                    // 有更改，提示用户
                    if (confirm('有未保存的更改，确定要退出吗？')) {
                      setIsEditing(false)
                    }
                  }
                } else {
                  // 如果是新建笔记，直接返回列表
                  if (editTitle.trim() || editContent.trim()) {
                    if (confirm('有未保存的更改，确定要退出吗？')) {
                      setIsEditing(false)
                      setSelectedNote(null)
                    }
                  } else {
                    setIsEditing(false)
                    setSelectedNote(null)
                  }
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="笔记标题..."
              className="flex-1 text-lg font-semibold border-none shadow-none focus-visible:ring-0"
            />
            {selectedNote && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteNote}
                disabled={loading}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            )}
            <Button onClick={handleSaveNote} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>

          {/* 标签和分类 */}
          <div className="px-6 pb-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <Input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="分类（可选）"
                className="w-40 h-7 text-sm"
              />
              <Tag className="h-4 w-4 text-muted-foreground ml-2" />
              {editTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="添加标签..."
                className="w-32 h-7 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Markdown 编辑器 */}
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor value={editContent} onChange={setEditContent} />
        </div>
      </div>
    )
  }

  // 列表视图
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">笔记</h1>
            <p className="text-muted-foreground mt-2">
              使用 Markdown 编写和管理你的学习笔记
            </p>
          </div>
          <Button onClick={handleCreateNote} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            新建笔记
          </Button>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记..."
              className="pl-10"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={filterTag === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTag(null)}
              >
                全部
              </Button>
              {allTags.slice(0, 5).map((tag) => (
                <Button
                  key={tag}
                  variant={filterTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 笔记列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-primary/10 p-6 mb-4">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || filterTag ? '未找到匹配的笔记' : '还没有笔记'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || filterTag
              ? '尝试修改搜索条件'
              : '点击右上角按钮创建你的第一篇笔记'}
          </p>
        </div>
      ) : (
        <div ref={listContainerRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              data-note-card
              onClick={() => handleOpenNote(note)}
              className={cn(
                'group cursor-pointer rounded-lg border-2 p-5 transition-all duration-200',
                'hover:shadow-lg hover:border-primary/50 hover:-translate-y-1'
              )}
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {note.title}
                  </h3>
                  <div className="text-sm text-muted-foreground line-clamp-3 mt-2 prose prose-sm max-w-none
                    prose-headings:text-foreground prose-headings:font-semibold
                    prose-p:text-muted-foreground prose-p:my-0
                    prose-strong:text-foreground
                    prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-pre:!bg-[#0d1117] prose-pre:!text-[#c9d1d9] prose-pre:text-xs prose-pre:p-2 prose-pre:rounded prose-pre:my-1
                    prose-ul:my-0 prose-ol:my-0 prose-li:my-0
                    [&_pre_code]:!text-inherit [&_pre_code]:!bg-transparent [&_pre_code]:!p-0">
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
                      {note.content || '暂无内容'}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* 标签 */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* 元信息 */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  {note.category && (
                    <div className="flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      <span>{note.category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Plus, Sparkles, Upload, Lightbulb, Save, Trash2, Clock } from 'lucide-react'
import { n8nClient } from '@/services/api'

interface Note {
  id: string
  title: string
  content: string
  optimizedContent?: string
  aiSuggestions?: string
  createdAt: Date
}

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const openNewNoteDialog = () => {
    setIsEditMode(false)
    setSelectedNote(null)
    setNoteTitle('')
    setNoteContent('')
    setIsDialogOpen(true)
  }

  const openEditNoteDialog = (note: Note) => {
    setIsEditMode(true)
    setSelectedNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setIsDialogOpen(true)
  }

  const saveNote = async () => {
    if (isEditMode && selectedNote) {
      // 更新现有笔记
      const updatedNote = {
        ...selectedNote,
        title: noteTitle || '无标题笔记',
        content: noteContent,
      }

      try {
        await n8nClient.post('/note/save', updatedNote)
        const updatedNotes = notes.map((n) =>
          n.id === selectedNote.id ? updatedNote : n
        )
        setNotes(updatedNotes)
        setSelectedNote(updatedNote)
        setIsDialogOpen(false)
      } catch (error) {
        console.error('保存笔记失败:', error)
      }
    } else {
      // 创建新笔记
      const newNote: Note = {
        id: Date.now().toString(),
        title: noteTitle || '无标题笔记',
        content: noteContent,
        createdAt: new Date(),
      }

      try {
        await n8nClient.post('/note/save', newNote)
        setNotes([newNote, ...notes])
        setNoteTitle('')
        setNoteContent('')
        setIsDialogOpen(false)
      } catch (error) {
        console.error('创建笔记失败:', error)
      }
    }
  }

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter((n) => n.id !== noteId))
  }

  const optimizeNote = async () => {
    if (!selectedNote) return

    setIsOptimizing(true)
    try {
      const response: any = await n8nClient.post('/note/optimize', { noteId: selectedNote.id })
      const updatedNote = {
        ...selectedNote,
        optimizedContent: response.optimizedContent,
        aiSuggestions: response.suggestions,
      }
      const updatedNotes = notes.map((n) =>
        n.id === selectedNote.id ? updatedNote : n
      )
      setNotes(updatedNotes)
      setSelectedNote(updatedNote)
    } catch (error) {
      console.error('优化笔记失败:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 读取图片并转换为base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageData = e.target?.result as string

      try {
        const response: any = await n8nClient.post('/note/convert-handwriting', { imageData })

        const newNote: Note = {
          id: Date.now().toString(),
          title: '手写笔记转换',
          content: response.markdown,
          createdAt: new Date(),
        }

        setNotes([newNote, ...notes])
        setSelectedNote(newNote)
        setNoteContent(response.markdown)
      } catch (error) {
        console.error('转换手写笔记失败:', error)
      }
    }
    reader.readAsDataURL(file)
  }

  const autoComplete = async () => {
    if (!noteContent) return

    try {
      const response: any = await n8nClient.post('/note/auto-complete', { content: noteContent })
      setNoteContent(noteContent + '\n\n' + response.suggestion)
    } catch (error) {
      console.error('自动补全失败:', error)
    }
  }


  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-3xl font-bold">笔记</h1>
        <p className="text-muted-foreground mt-2">
          智能笔记编辑器,支持AI优化和手写笔记识别
        </p>
      </div>

      {/* 笔记展示区 */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-primary/10 p-6 mb-4">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">还没有笔记</h3>
          <p className="text-muted-foreground mb-6">点击右下角的按钮创建你的第一条笔记</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
              onClick={() => openEditNoteDialog(note)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {note.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        {note.createdAt.toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {note.content || '暂无内容'}
                </p>
                {(note.optimizedContent || note.aiSuggestions) && (
                  <div className="mt-3 flex gap-2">
                    {note.optimizedContent && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                        已优化
                      </span>
                    )}
                    {note.aiSuggestions && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        有建议
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 浮动添加按钮 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50"
            size="icon"
            onClick={openNewNoteDialog}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-primary" />
              {isEditMode ? '编辑笔记' : '新建笔记'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? '修改笔记内容并使用AI助手优化' : '创建新笔记，支持AI优化和手写识别'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 笔记编辑区 */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">标题</label>
                <Input
                  placeholder="笔记标题..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">内容</label>
                <Textarea
                  placeholder="在这里编写笔记..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={12}
                  className="font-mono resize-none"
                />
              </div>
            </div>

            {/* AI优化区域 */}
            {isEditMode && selectedNote && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">AI助手</h3>
                </div>

                {selectedNote.optimizedContent && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      优化后的内容
                    </h4>
                    <div className="rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 p-4 text-sm leading-relaxed max-h-60 overflow-y-auto">
                      {selectedNote.optimizedContent}
                    </div>
                  </div>
                )}

                {selectedNote.aiSuggestions && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      AI建议
                    </h4>
                    <div className="rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 p-4 text-sm leading-relaxed max-h-60 overflow-y-auto">
                      {selectedNote.aiSuggestions}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t">
              <label htmlFor="file-upload" className="flex-1">
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" className="w-full h-12" size="lg" type="button">
                  <Upload className="mr-2 h-5 w-5" />
                  上传手写笔记
                </Button>
              </label>
              <Button
                onClick={autoComplete}
                variant="outline"
                className="flex-1 h-12"
                size="lg"
                disabled={!noteContent}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                AI续写
              </Button>
              {isEditMode && (
                <Button
                  onClick={optimizeNote}
                  variant="outline"
                  className="flex-1 h-12"
                  size="lg"
                  disabled={isOptimizing}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {isOptimizing ? '优化中...' : 'AI优化'}
                </Button>
              )}
              <Button onClick={saveNote} className="flex-1 h-12" size="lg">
                <Save className="mr-2 h-5 w-5" />
                {isEditMode ? '保存修改' : '创建笔记'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

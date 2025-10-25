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
import { Video, BookText, Plus, Sparkles, PlayCircle, FileText, X } from 'lucide-react'
import { courseAPI } from '@/services/api'

interface Course {
  id: string
  type: 'video' | 'book'
  title: string
  url?: string
  analysis?: string
  plan?: string
}

export default function CourseLearning() {
  const [courses, setCourses] = useState<Course[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [bookContent, setBookContent] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addType, setAddType] = useState<'video' | 'book'>('video')

  const addVideo = async () => {
    if (!videoUrl.trim()) return

    try {
      const response: any = await courseAPI.addVideoLesson(videoUrl)
      const newCourse: Course = {
        id: Date.now().toString(),
        type: 'video',
        title: response.title || '视频课程',
        url: videoUrl,
      }
      setCourses([...courses, newCourse])
      setVideoUrl('')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('添加视频失败:', error)
    }
  }

  const addBook = async () => {
    if (!bookTitle.trim()) return

    try {
      await courseAPI.addBook({ title: bookTitle, content: bookContent })
      const newCourse: Course = {
        id: Date.now().toString(),
        type: 'book',
        title: bookTitle,
      }
      setCourses([...courses, newCourse])
      setBookTitle('')
      setBookContent('')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('添加书本失败:', error)
    }
  }

  const analyzeCourse = async (course: Course) => {
    setSelectedCourse(course)

    try {
      if (course.type === 'video') {
        const response: any = await courseAPI.analyzeVideo(course.id)
        const updatedCourses = courses.map((c) =>
          c.id === course.id ? { ...c, analysis: response.analysis } : c
        )
        setCourses(updatedCourses)
        setSelectedCourse({ ...course, analysis: response.analysis })
      }
    } catch (error) {
      console.error('分析失败:', error)
    }
  }

  const getCoursePlan = async (course: Course) => {
    try {
      const response: any = await courseAPI.getCoursePlan(course.id)
      const updatedCourses = courses.map((c) =>
        c.id === course.id ? { ...c, plan: response.plan } : c
      )
      setCourses(updatedCourses)
      setSelectedCourse({ ...course, plan: response.plan })
    } catch (error) {
      console.error('获取规划失败:', error)
    }
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-3xl font-bold">课程学习</h1>
        <p className="text-muted-foreground mt-2">
          添加B站视频或书本,AI将帮你分析课程内容并制定学习规划
        </p>
      </div>

      {/* 课程展示区 */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-primary/10 p-6 mb-4">
            <Video className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">还没有添加课程</h3>
          <p className="text-muted-foreground mb-6">点击右下角的按钮添加你的第一个课程</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                {course.type === 'video' ? (
                  <Video className="h-16 w-16 text-primary/60 group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <BookText className="h-16 w-16 text-primary/60 group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {course.type === 'video' ? (
                    <>
                      <Video className="h-4 w-4" />
                      <span>视频课程</span>
                    </>
                  ) : (
                    <>
                      <BookText className="h-4 w-4" />
                      <span>书本教材</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      analyzeCourse(course)
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    分析
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      getCoursePlan(course)
                    }}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    规划
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 浮动添加按钮 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加课程</DialogTitle>
            <DialogDescription>
              选择添加B站视频或书本教材,AI将帮你分析和规划
            </DialogDescription>
          </DialogHeader>

          {/* 类型选择 */}
          <div className="flex gap-4 mb-6">
            <Button
              variant={addType === 'video' ? 'default' : 'outline'}
              className="flex-1 h-20"
              onClick={() => setAddType('video')}
            >
              <div className="flex flex-col items-center gap-2">
                <Video className="h-6 w-6" />
                <span>视频课程</span>
              </div>
            </Button>
            <Button
              variant={addType === 'book' ? 'default' : 'outline'}
              className="flex-1 h-20"
              onClick={() => setAddType('book')}
            >
              <div className="flex flex-col items-center gap-2">
                <BookText className="h-6 w-6" />
                <span>书本教材</span>
              </div>
            </Button>
          </div>

          {/* 添加表单 */}
          {addType === 'video' ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5" />
                    添加视频课程
                  </CardTitle>
                  <CardDescription>
                    粘贴B站视频链接,AI将自动分析视频内容
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="https://www.bilibili.com/video/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="h-12"
                  />
                  <Button onClick={addVideo} className="w-full h-12" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    添加视频
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookText className="h-5 w-5" />
                    添加书本教材
                  </CardTitle>
                  <CardDescription>
                    输入书名和内容,AI将帮你制定学习计划
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="书名"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="h-12"
                  />
                  <Textarea
                    placeholder="书本简介或目录..."
                    value={bookContent}
                    onChange={(e) => setBookContent(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <Button onClick={addBook} className="w-full h-12" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    添加书本
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 课程详情对话框 */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  {selectedCourse.type === 'video' ? (
                    <Video className="h-6 w-6 text-primary" />
                  ) : (
                    <BookText className="h-6 w-6 text-primary" />
                  )}
                  {selectedCourse.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedCourse.type === 'video' ? '视频课程' : '书本教材'} • AI分析与学习规划
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {selectedCourse.analysis && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      课程解析
                    </h4>
                    <div className="rounded-lg bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20 p-5 text-sm leading-relaxed">
                      {selectedCourse.analysis}
                    </div>
                  </div>
                )}

                {selectedCourse.plan && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-primary" />
                      学习规划
                    </h4>
                    <div className="rounded-lg bg-gradient-to-br from-green-500/5 to-blue-500/5 border border-green-500/20 p-5 text-sm leading-relaxed">
                      {selectedCourse.plan}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => analyzeCourse(selectedCourse)}
                    variant="outline"
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    AI分析课程
                  </Button>
                  <Button
                    onClick={() => getCoursePlan(selectedCourse)}
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    生成学习规划
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

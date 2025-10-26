import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Trash2,
  ListOrdered,
  Target,
} from 'lucide-react'
import { n8nClient } from '@/services/api'

interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  dueDate?: string
  createdAt: string
}

interface Plan {
  id: string
  title: string
  description: string
  priority: number
  tasks: Task[]
  progress: number
  dueDate?: string
  createdAt: string
  aiSuggestion?: string
}

type SortOption = 'createdAt' | 'dueDate' | 'priority'

export default function Planning() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('createdAt')
  
  // 创建计划对话框
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [newPlanDesc, setNewPlanDesc] = useState('')
  const [newPlanPriority, setNewPlanPriority] = useState('5')
  const [newPlanDueDate, setNewPlanDueDate] = useState('')
  
  // 创建任务对话框
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('5')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  // 从本地存储加载数据
  useEffect(() => {
    const savedPlans = localStorage.getItem('learning-plans')
    if (savedPlans) {
      const parsed = JSON.parse(savedPlans)
      setPlans(parsed)
      if (parsed.length > 0 && !selectedPlan) {
        setSelectedPlan(parsed[0])
      }
    }
  }, [])

  // 保存到本地存储
  useEffect(() => {
    if (plans.length > 0) {
      localStorage.setItem('learning-plans', JSON.stringify(plans))
    }
  }, [plans])

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'destructive'
    if (priority >= 5) return 'default'
    return 'secondary'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return '高优先级'
    if (priority >= 5) return '中优先级'
    return '低优先级'
  }

  const sortPlans = (plansToSort: Plan[]) => {
    return [...plansToSort].sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'dueDate':
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'priority':
          return b.priority - a.priority
        default:
          return 0
      }
    })
  }

  const createPlan = async () => {
    if (!newPlanTitle.trim()) return

    const newPlan: Plan = {
      id: Date.now().toString(),
      title: newPlanTitle,
      description: newPlanDesc,
      priority: parseInt(newPlanPriority),
      tasks: [],
      progress: 0,
      dueDate: newPlanDueDate || undefined,
      createdAt: new Date().toISOString(),
    }

    try {
      await n8nClient.post('/planning/create', newPlan)
    } catch (error) {
      console.error('创建计划失败:', error)
    }

    setPlans([...plans, newPlan])
    setSelectedPlan(newPlan)
    
    // 重置表单
    setNewPlanTitle('')
    setNewPlanDesc('')
    setNewPlanPriority('5')
    setNewPlanDueDate('')
    setIsCreateDialogOpen(false)
  }

  const deletePlan = (planId: string) => {
    if (!confirm('确定要删除这个计划吗？')) return
    
    const updatedPlans = plans.filter(p => p.id !== planId)
    setPlans(updatedPlans)
    
    if (selectedPlan?.id === planId) {
      setSelectedPlan(updatedPlans.length > 0 ? updatedPlans[0] : null)
    }
  }

  const addTask = () => {
    if (!selectedPlan || !newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: parseInt(newTaskPriority),
      completed: false,
      dueDate: newTaskDueDate || undefined,
      createdAt: new Date().toISOString(),
    }

    const updatedPlan = {
      ...selectedPlan,
      tasks: [...selectedPlan.tasks, newTask],
    }

    updatePlan(updatedPlan)
    
    // 重置表单
    setNewTaskTitle('')
    setNewTaskPriority('5')
    setNewTaskDueDate('')
    setIsTaskDialogOpen(false)
  }

  const toggleTask = async (taskId: string) => {
    if (!selectedPlan) return

    const updatedTasks = selectedPlan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )

    const completedTasks = updatedTasks.filter((t) => t.completed).length
    const progress = updatedTasks.length > 0 ? (completedTasks / updatedTasks.length) * 100 : 0

    const updatedPlan = {
      ...selectedPlan,
      tasks: updatedTasks,
      progress,
    }

    updatePlan(updatedPlan)

    try {
      await n8nClient.post('/planning/update-progress', { planId: selectedPlan.id, progress })
    } catch (error) {
      console.error('更新进度失败:', error)
    }
  }

  const deleteTask = (taskId: string) => {
    if (!selectedPlan || !confirm('确定要删除这个任务吗？')) return

    const updatedTasks = selectedPlan.tasks.filter(t => t.id !== taskId)
    const completedTasks = updatedTasks.filter((t) => t.completed).length
    const progress = updatedTasks.length > 0 ? (completedTasks / updatedTasks.length) * 100 : 0

    const updatedPlan = {
      ...selectedPlan,
      tasks: updatedTasks,
      progress,
    }

    updatePlan(updatedPlan)
  }

  const updatePlan = (updatedPlan: Plan) => {
    const updatedPlans = plans.map((p) =>
      p.id === updatedPlan.id ? updatedPlan : p
    )
    setPlans(updatedPlans)
    setSelectedPlan(updatedPlan)
  }

  const getAISuggestion = async () => {
    if (!selectedPlan) return

    try {
      const response: any = await n8nClient.post('/planning/ai-suggestion', { planId: selectedPlan.id })
      const updatedPlan = {
        ...selectedPlan,
        aiSuggestion: response.suggestion,
      }
      updatePlan(updatedPlan)
    } catch (error) {
      console.error('获取AI建议失败:', error)
      // 模拟AI建议
      const mockSuggestion = '建议将高优先级任务优先完成，合理安排时间，保持学习节奏。可以将大任务分解为小任务，逐步完成。'
      const updatedPlan = {
        ...selectedPlan,
        aiSuggestion: mockSuggestion,
      }
      updatePlan(updatedPlan)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return '已过期'
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '明天'
    if (diffDays <= 7) return `${diffDays}天后`
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const sortedPlans = sortPlans(plans)

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* 左侧：计划详情 */}
      <div className={`flex-1 overflow-auto space-y-6 transition-all duration-300 ${
        isRightPanelCollapsed ? 'pr-6' : 'pr-6'
      }`}>
        <div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              学习规划
            </h1>
            <p className="text-muted-foreground mt-2">
              制定学习计划,AI将帮你优化并监督执行
            </p>
          </div>
        </div>

        {selectedPlan ? (
          <div className="space-y-6">
            {/* 计划信息卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl">{selectedPlan.title}</CardTitle>
                      <Badge variant={getPriorityColor(selectedPlan.priority)}>
                        <Flag className="h-3 w-3 mr-1" />
                        {getPriorityLabel(selectedPlan.priority)} ({selectedPlan.priority})
                      </Badge>
                    </div>
                    <CardDescription>{selectedPlan.description || '暂无描述'}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>截止: {formatDate(selectedPlan.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>进度: {Math.round(selectedPlan.progress)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    <span>任务: {selectedPlan.tasks.length}</span>
                  </div>
                </div>
                {/* 进度条 */}
                <div className="w-full bg-secondary rounded-full h-2 mt-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${selectedPlan.progress}%` }}
                  />
                </div>
              </CardHeader>
            </Card>

            {/* 任务管理卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    任务列表
                  </CardTitle>
                  <Button onClick={() => setIsTaskDialogOpen(true)} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    添加任务
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedPlan.tasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Circle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>还没有添加任务</p>
                    <p className="text-sm mt-1">点击上方按钮创建第一个任务</p>
                  </div>
                ) : (
                  selectedPlan.tasks
                    .sort((a, b) => b.priority - a.priority)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors group"
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              task.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge
                              variant={getPriorityColor(task.priority)}
                              className="text-xs"
                            >
                              P{task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* AI建议卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI优化建议
                  </CardTitle>
                  <Button onClick={getAISuggestion} variant="outline" size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    获取建议
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedPlan.aiSuggestion ? (
                  <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed">
                    {selectedPlan.aiSuggestion}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    点击上方按钮获取AI优化建议
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-[60vh] flex items-center justify-center">
            <CardContent className="text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-lg font-medium mb-2">还没有计划</p>
              <p className="text-muted-foreground mb-6">创建第一个学习计划开始吧</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                创建计划
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 右侧：计划列表（固定在屏幕右侧） */}
      <div className={`fixed right-0 top-[4rem] h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out ${
        isRightPanelCollapsed ? 'translate-x-full' : 'translate-x-0'
      }`}>
        <div className="relative h-full w-80">
          {/* 折叠/展开按钮 - 固定位置 */}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-l-lg shadow-lg transition-all duration-200 hover:pl-3"
          >
            {isRightPanelCollapsed ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          {/* 侧边栏面板 */}
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg whitespace-nowrap">我的计划</CardTitle>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full gap-2 mb-4">
                <Plus className="h-4 w-4" />
                创建计划
              </Button>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">排序方式</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">创建时间</SelectItem>
                    <SelectItem value="dueDate">截止时间</SelectItem>
                    <SelectItem value="priority">优先级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-2">
              {sortedPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无计划
                </div>
              ) : (
                sortedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`rounded-lg border p-3 cursor-pointer transition-all group ${
                      selectedPlan?.id === plan.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-accent hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm line-clamp-2">{plan.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlan(plan.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          selectedPlan?.id === plan.id ? 'outline' : getPriorityColor(plan.priority)
                        }
                        className="text-xs"
                      >
                        P{plan.priority}
                      </Badge>
                      {plan.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${
                          selectedPlan?.id === plan.id ? 'opacity-80' : 'text-muted-foreground'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {formatDate(plan.dueDate)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={selectedPlan?.id === plan.id ? 'opacity-80' : 'text-muted-foreground'}>
                          {plan.tasks.filter(t => t.completed).length}/{plan.tasks.length} 任务
                        </span>
                        <span className={selectedPlan?.id === plan.id ? 'opacity-80' : 'text-muted-foreground'}>
                          {Math.round(plan.progress)}%
                        </span>
                      </div>
                      <div
                        className={`w-full rounded-full h-1.5 ${
                          selectedPlan?.id === plan.id ? 'bg-primary-foreground/20' : 'bg-secondary'
                        }`}
                      >
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            selectedPlan?.id === plan.id ? 'bg-primary-foreground' : 'bg-primary'
                          }`}
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 创建计划对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新计划</DialogTitle>
            <DialogDescription>设定学习目标,制定实施计划</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-title">计划标题 *</Label>
              <Input
                id="plan-title"
                placeholder="例如: 准备期末考试"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-desc">计划描述</Label>
              <Textarea
                id="plan-desc"
                placeholder="详细描述你的学习计划..."
                value={newPlanDesc}
                onChange={(e) => setNewPlanDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-priority">优先级 (0-10)</Label>
                <Select value={newPlanPriority} onValueChange={setNewPlanPriority}>
                  <SelectTrigger id="plan-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(11)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} - {i >= 8 ? '高' : i >= 5 ? '中' : '低'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-duedate">截止日期</Label>
                <Input
                  id="plan-duedate"
                  type="date"
                  value={newPlanDueDate}
                  onChange={(e) => setNewPlanDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={createPlan} disabled={!newPlanTitle.trim()}>
                创建计划
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建任务对话框 */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新任务</DialogTitle>
            <DialogDescription>为 "{selectedPlan?.title}" 添加任务</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">任务名称 *</Label>
              <Input
                id="task-title"
                placeholder="例如: 复习第三章内容"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">优先级 (0-10)</Label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(11)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} - {i >= 8 ? '高' : i >= 5 ? '中' : '低'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-duedate">截止日期</Label>
                <Input
                  id="task-duedate"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={addTask} disabled={!newTaskTitle.trim()}>
                添加任务
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

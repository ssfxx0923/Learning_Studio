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
import { n8nClient, backendAPI, type Plan, type Task } from '@/services/api'
import { AIGreeting } from '@/components/AIGreeting'

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
  const [newPlanPriority, setNewPlanPriority] = useState('3')
  const [newPlanDueDate, setNewPlanDueDate] = useState('')
  
  // 创建任务对话框
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('3')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 从后端加载数据
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setIsLoading(true)
      const loadedPlans = await backendAPI.getAllPlans()
      setPlans(loadedPlans)
      if (loadedPlans.length > 0 && !selectedPlan) {
        setSelectedPlan(loadedPlans[0])
      }
    } catch (error) {
      console.error('加载计划失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'destructive'
    if (priority >= 3) return 'default'
    return 'secondary'
  }

  const getPriorityLabel = (priority: number) => {
    return `优先级 ${priority}`
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

    const planData = {
      title: newPlanTitle,
      description: newPlanDesc,
      priority: parseInt(newPlanPriority),
      tasks: [],
      progress: 0,
      dueDate: newPlanDueDate || undefined,
      createdAt: new Date().toISOString(),
    }

    try {
      setIsLoading(true)
      const newPlan = await backendAPI.createPlan(planData)
      setPlans([...plans, newPlan])
      setSelectedPlan(newPlan)
      
      // 通知 n8n
      try {
        await n8nClient.post('/planning/create', newPlan)
      } catch (error) {
        console.error('n8n 通知失败:', error)
      }
      
    // 重置表单
    setNewPlanTitle('')
    setNewPlanDesc('')
    setNewPlanPriority('3')
    setNewPlanDueDate('')
    setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('创建计划失败:', error)
      alert('创建计划失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('确定要删除这个计划吗？')) return
    
    try {
      setIsLoading(true)
      await backendAPI.deletePlan(planId)
      
      const updatedPlans = plans.filter(p => p.id !== planId)
      setPlans(updatedPlans)
      
      if (selectedPlan?.id === planId) {
        setSelectedPlan(updatedPlans.length > 0 ? updatedPlans[0] : null)
      }
    } catch (error) {
      console.error('删除计划失败:', error)
      alert('删除计划失败，请重试')
    } finally {
      setIsLoading(false)
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
    setNewTaskPriority('3')
    setNewTaskDueDate('')
    setIsTaskDialogOpen(false)
  }

  const toggleTask = async (taskId: string) => {
    if (!selectedPlan) return

    const updatedTasks = selectedPlan.tasks.map((task) => {
      if (task.id === taskId) {
        const newCompleted = !task.completed
        return {
          ...task,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : undefined  // 完成时记录时间，取消完成时清除时间
        }
      }
      return task
    })

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

  const updatePlan = async (updatedPlan: Plan) => {
    try {
      await backendAPI.updatePlan(updatedPlan.id, updatedPlan)
      
      const updatedPlans = plans.map((p) =>
        p.id === updatedPlan.id ? updatedPlan : p
      )
      setPlans(updatedPlans)
      setSelectedPlan(updatedPlan)
    } catch (error) {
      console.error('更新计划失败:', error)
      alert('更新计划失败，请重试')
    }
  }

  const getAISuggestion = async () => {
    if (!selectedPlan) return

    setIsLoading(true)
    try {
      // 准备发送给AI的计划数据（简化版，只包含关键信息）
      const planData = {
        title: selectedPlan.title,
        description: selectedPlan.description,
        priority: selectedPlan.priority,
        progress: selectedPlan.progress,
        dueDate: selectedPlan.dueDate,
        tasks: selectedPlan.tasks.map(task => ({
          title: task.title,
          priority: task.priority,
          completed: task.completed,
          dueDate: task.dueDate
        }))
      }

      // 调用n8n的plan/analyze接口
      const response: any = await n8nClient.post('/plan/analyze', {
        planId: selectedPlan.id,
        plan: JSON.stringify(planData, null, 2)
      })

      // 提取AI返回的建议文本（n8nClient已经返回了data）
      const aiSuggestion = response?.output || response?.text || response || '建议生成成功'
      
      const updatedPlan = {
        ...selectedPlan,
        aiSuggestion: typeof aiSuggestion === 'string' ? aiSuggestion : JSON.stringify(aiSuggestion),
      }
      
      await updatePlan(updatedPlan)
      alert('AI建议已生成！')
    } catch (error) {
      console.error('获取AI建议失败:', error)
      alert('获取AI建议失败，请检查n8n服务是否正常运行')
    } finally {
      setIsLoading(false)
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              学习规划
            </h1>
            <p className="text-muted-foreground mt-2">
              制定学习计划,AI将帮你优化并监督执行
            </p>
          </div>

          {/* AI问候组件 */}
          <AIGreeting />
        </div>

        {isLoading && plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">加载中...</p>
            </CardContent>
          </Card>
        ) : selectedPlan ? (
          <div className="space-y-6">
            {/* 计划信息卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl">{selectedPlan.title}</CardTitle>
                      <Badge variant={getPriorityColor(selectedPlan.priority)} className="opacity-50">
                        <Flag className="h-3 w-3 mr-1" />
                        {getPriorityLabel(selectedPlan.priority)}
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
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <Badge
                              variant={getPriorityColor(task.priority)}
                              className="text-xs opacity-50"
                            >
                              P{task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                截止: {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.completed && task.completedAt && (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                完成于: {new Date(task.completedAt).toLocaleString('zh-CN', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
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
                  <Button 
                    onClick={getAISuggestion} 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? '分析中...' : '获取建议'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedPlan.aiSuggestion ? (
                  <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedPlan.aiSuggestion}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">点击上方按钮获取AI优化建议</p>
                    <p className="text-xs text-muted-foreground mt-2">AI会分析您的计划并提供专业建议</p>
                  </div>
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
                        className="text-xs opacity-50"
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
                <Label htmlFor="plan-priority">优先级 (1-5)</Label>
                <Select value={newPlanPriority} onValueChange={setNewPlanPriority}>
                  <SelectTrigger id="plan-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(5)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
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
                  className="cursor-pointer"
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
                <Label htmlFor="task-priority">优先级 (1-5)</Label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(5)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
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
                  className="cursor-pointer"
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

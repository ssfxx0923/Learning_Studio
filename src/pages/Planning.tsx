import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Plus, CheckCircle2, Circle, Sparkles, TrendingUp } from 'lucide-react'
import { planningAPI } from '@/services/api'

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
}

interface Plan {
  id: string
  title: string
  description: string
  tasks: Task[]
  progress: number
  aiSuggestion?: string
}

export default function Planning() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [newPlanDesc, setNewPlanDesc] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const createPlan = async () => {
    if (!newPlanTitle.trim()) return

    try {
      await planningAPI.createPlan({
        title: newPlanTitle,
        description: newPlanDesc,
      })

      const newPlan: Plan = {
        id: Date.now().toString(),
        title: newPlanTitle,
        description: newPlanDesc,
        tasks: [],
        progress: 0,
      }

      setPlans([...plans, newPlan])
      setNewPlanTitle('')
      setNewPlanDesc('')
    } catch (error) {
      console.error('创建计划失败:', error)
    }
  }

  const addTask = () => {
    if (!selectedPlan || !newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
    }

    const updatedPlan = {
      ...selectedPlan,
      tasks: [...selectedPlan.tasks, newTask],
    }

    updatePlan(updatedPlan)
    setNewTaskTitle('')
  }

  const toggleTask = async (taskId: string) => {
    if (!selectedPlan) return

    const updatedTasks = selectedPlan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )

    const completedTasks = updatedTasks.filter((t) => t.completed).length
    const progress = (completedTasks / updatedTasks.length) * 100

    const updatedPlan = {
      ...selectedPlan,
      tasks: updatedTasks,
      progress,
    }

    updatePlan(updatedPlan)

    try {
      await planningAPI.updateProgress(selectedPlan.id, { progress })
    } catch (error) {
      console.error('更新进度失败:', error)
    }
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
      const response: any = await planningAPI.getAISuggestion(selectedPlan.id)
      const updatedPlan = {
        ...selectedPlan,
        aiSuggestion: response.suggestion,
      }
      updatePlan(updatedPlan)
    } catch (error) {
      console.error('获取AI建议失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">学习规划</h1>
        <p className="text-muted-foreground mt-2">
          制定学习计划,AI将帮你优化并监督执行
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 创建计划 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              创建新计划
            </CardTitle>
            <CardDescription>
              设定学习目标,制定实施计划
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="计划标题"
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
            />
            <Textarea
              placeholder="计划描述..."
              value={newPlanDesc}
              onChange={(e) => setNewPlanDesc(e.target.value)}
              rows={4}
            />
            <Button onClick={createPlan} className="w-full">
              创建计划
            </Button>

            {/* 计划列表 */}
            <div className="pt-4 border-t space-y-2">
              <h3 className="font-medium text-sm">我的计划</h3>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedPlan?.id === plan.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <p className="font-medium text-sm">{plan.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-background/20 rounded-full h-2">
                      <div
                        className="bg-current h-2 rounded-full transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                    <span className="text-xs">{Math.round(plan.progress)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 计划详情 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedPlan?.title || '选择一个计划'}
            </CardTitle>
            <CardDescription>
              {selectedPlan?.description || '在左侧选择或创建一个计划'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPlan && (
              <>
                {/* 添加任务 */}
                <div className="flex gap-2">
                  <Input
                    placeholder="添加新任务..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <Button onClick={addTask} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* 任务列表 */}
                <div className="space-y-2">
                  {selectedPlan.tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      还没有添加任务
                    </p>
                  ) : (
                    selectedPlan.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span
                          className={
                            task.completed
                              ? 'line-through text-muted-foreground'
                              : ''
                          }
                        >
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* AI建议 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      AI优化建议
                    </h3>
                    <Button onClick={getAISuggestion} variant="outline" size="sm">
                      <Sparkles className="mr-2 h-4 w-4" />
                      获取建议
                    </Button>
                  </div>
                  {selectedPlan.aiSuggestion && (
                    <div className="rounded-lg bg-muted p-4 text-sm">
                      {selectedPlan.aiSuggestion}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

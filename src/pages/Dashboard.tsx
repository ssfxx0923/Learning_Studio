import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Video,
  Calendar,
  FileText,
  Heart,
  ArrowRight,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: '英语学习',
    description: '输入单词,AI生成有趣的文章和配图,支持划词翻译和朗读',
    path: '/english',
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Video,
    title: '课程学习',
    description: '添加B站视频或书本,AI提供内容分析和学习规划',
    path: '/course',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Calendar,
    title: '学习规划',
    description: '制定学习计划,AI监督执行并提供优化建议',
    path: '/planning',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: '智能笔记',
    description: '支持笔记编辑、AI优化、自动补全和手写识别',
    path: '/note',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Heart,
    title: '心理健康',
    description: '与AI心理助手交流,缓解压力,促进身心健康',
    path: '/mental-health',
    color: 'text-red-500',
    gradient: 'from-red-500 to-pink-500',
  },
]

const stats = [
  { label: '今日学习时长', value: '2.5h', icon: Clock, trend: '+30min' },
  { label: '本周完成任务', value: '12', icon: Target, trend: '+3' },
  { label: '学习效率', value: '92%', icon: TrendingUp, trend: '+8%' },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          欢迎回来!
        </h1>
        <p className="text-muted-foreground text-lg">继续你的学习旅程,让AI助你一臂之力</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">快速开始</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.path}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5`}>
                      <div className="w-full h-full rounded-xl bg-card flex items-center justify-center group-hover:bg-transparent transition-colors">
                        <Icon className={`h-6 w-6 ${feature.color} group-hover:text-white transition-colors`} />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={feature.path}>
                    <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      开始使用
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}

          {/* More Features Coming Soon */}
          <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/30">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                  <MoreHorizontal className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-muted-foreground">更多功能</CardTitle>
              </div>
              <CardDescription>正在开发中,敬请期待...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full py-2 px-4 text-center text-sm text-muted-foreground rounded-lg bg-muted/50">
                即将上线
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">最近活动</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { action: '完成英语学习', time: '2小时前', icon: BookOpen, color: 'text-pink-500' },
                { action: '添加新的课程', time: '昨天', icon: Video, color: 'text-purple-500' },
                { action: '更新学习计划', time: '3天前', icon: Calendar, color: 'text-blue-500' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 last:pb-0 border-b last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


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
  Sparkles,
  Target,
  TrendingUp,
  Brain,
  Shield,
  Rocket,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const features = [
  {
    icon: BookOpen,
    title: '英语学习',
    description: '输入单词,AI生成有趣的文章和配图,支持划词翻译和朗读',
    path: '/dashboard',
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
    example: '示例:输入 "adventure, mountain, brave" → 生成冒险故事',
  },
  {
    icon: Video,
    title: '课程学习',
    description: '添加B站视频或书本,AI提供内容分析和学习规划',
    path: '/dashboard',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-indigo-500',
    example: '支持:编程课程、设计教程、考研资料等',
  },
  {
    icon: Calendar,
    title: '学习规划',
    description: '制定学习计划,AI监督执行并提供优化建议',
    path: '/dashboard',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    example: '功能:目标管理、进度跟踪、智能提醒',
  },
  {
    icon: FileText,
    title: '智能笔记',
    description: '支持笔记编辑、AI优化、自动补全和手写识别',
    path: '/dashboard',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
    example: '特色:Markdown支持、手写OCR、AI润色',
  },
  {
    icon: Heart,
    title: '心理健康',
    description: '与AI心理助手交流,缓解压力,促进身心健康',
    path: '/dashboard',
    color: 'text-red-500',
    gradient: 'from-red-500 to-pink-500',
    example: '服务:情绪疏导、压力管理、心理咨询',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with Theme Toggle */}
      <header className="fixed top-0 right-0 z-50 p-4">
        <ThemeToggle />
      </header>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 lg:py-20">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 p-6 backdrop-blur-sm border border-primary/20">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-bold">
              <span className="bg-gradient-to-r from-primary via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Learning Studio
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              利用先进的AI技术,提升你的学习效率
              <br />
              <span className="text-primary font-semibold">让学习变得更智能、更高效、更有趣</span>
            </p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/dashboard">
              <Button size="lg" className="shadow-lg shadow-primary/30">
                <Rocket className="mr-2 h-5 w-5" />
                进入平台
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                了解更多
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
            {[
              { label: '学习模块', value: '5+', icon: Target },
              { label: 'AI功能', value: '15+', icon: Brain },
              { label: '活跃用户', value: '1000+', icon: TrendingUp },
              { label: '安全保障', value: '100%', icon: Shield },
            ].map((stat) => (
              <Card key={stat.label} className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl lg:text-4xl font-bold">功能模块</h2>
            <p className="text-muted-foreground text-lg">全方位AI辅助,覆盖学习各个环节</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-gradient-to-br from-card to-primary/5"
                >
                  <CardHeader>
                    <div className="mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5`}>
                        <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center group-hover:bg-transparent transition-colors">
                          <Icon className={`h-7 w-7 ${feature.color} group-hover:text-white transition-colors`} />
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      {feature.example}
                    </div>
                    <Link to={feature.path}>
                      <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        立即体验
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-pink-500/10 to-purple-500/10 border-2 border-primary/20">
          <CardContent className="p-12 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-pink-500 mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold">准备好开始学习了吗?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              加入我们,体验AI驱动的智能学习平台,让每一次学习都充满乐趣和收获
            </p>
            <div className="flex gap-4 justify-center flex-wrap pt-4">
              <Link to="/dashboard">
                <Button size="lg" className="shadow-lg shadow-primary/30">
                  <Rocket className="mr-2 h-5 w-5" />
                  立即进入平台
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import {
  BookOpen,
  Lightbulb,
  Calendar,
  FileText,
  Heart,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { path: '/dashboard', label: '首页', icon: GraduationCap, color: 'text-pink-500' },
  { path: '/english', label: '英语学习', icon: BookOpen, color: 'text-pink-500' },
  { path: '/research', label: '智能研究', icon: Lightbulb, color: 'text-yellow-500' },
  { path: '/planning', label: '学习规划', icon: Calendar, color: 'text-blue-500' },
  { path: '/note', label: '智能笔记', icon: FileText, color: 'text-green-500' },
  { path: '/mental-health', label: '心理健康', icon: Heart, color: 'text-red-500' },
]

export function Sidebar() {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showContent, setShowContent] = useState(true)

  // 使用 CSS 变量来传递侧边栏宽度，添加延迟避免闪烁
  useEffect(() => {
    // 如果是折叠，立即隐藏内容
    if (isCollapsed) {
      setShowContent(false)
    }
    
    // 使用 requestAnimationFrame 优化性能
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        isCollapsed ? '80px' : '288px'
      )
    })

    // 如果是展开，延迟显示内容避免动画卡顿
    if (!isCollapsed) {
      const timer = setTimeout(() => setShowContent(true), 150)
      return () => clearTimeout(timer)
    }
  }, [isCollapsed])

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b bg-gradient-to-r from-primary/10 to-transparent transition-all duration-300",
        collapsed ? "justify-center px-2" : "justify-between px-6"
      )}>
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="rounded-lg bg-primary/20 p-1.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && showContent && (
            <div className="animate-in fade-in duration-200">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                Learning Studio
              </span>
              <p className="text-[10px] text-muted-foreground">智能学习新时代</p>
            </div>
          )}
        </Link>
        {/* Mobile close button */}
        {!collapsed && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-accent rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3.5',
                isActive
                  ? 'bg-gradient-to-r from-primary to-pink-500 text-primary-foreground shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className={cn(
                'p-1.5 rounded-lg',
                isActive ? 'bg-white/20' : 'bg-accent/50 group-hover:bg-accent'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              {!collapsed && showContent && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Stats Section */}
      {!collapsed && showContent && (
        <div className="mx-4 mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 p-4 border border-primary/20 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">学习统计</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background/50 rounded-lg p-2">
              <div className="text-muted-foreground">今日学习</div>
              <div className="text-lg font-bold text-primary">2.5h</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <div className="text-muted-foreground">连续天数</div>
              <div className="text-lg font-bold text-primary">7天</div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <div className="border-t p-4">
        <div className={cn(
          "flex items-center transition-all duration-300",
          collapsed ? "justify-center" : "justify-between px-2"
        )}>
          {!collapsed && showContent && (
            <span className="text-sm font-medium text-muted-foreground">主题设置</span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border shadow-lg hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className={cn(
        "hidden lg:block fixed left-0 top-0 z-40 h-screen border-r bg-card/50 backdrop-blur-sm transition-[width] duration-300 ease-in-out will-change-[width]",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <SidebarContent collapsed={isCollapsed} />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 p-1.5 rounded-full bg-card border shadow-lg hover:bg-accent hover:scale-110 transition-all duration-200 z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 border-r bg-card transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent collapsed={false} />
      </div>
    </>
  )
}

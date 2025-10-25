import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function PlatformLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Sidebar />
      <main 
        className="min-h-screen lg:ml-[var(--sidebar-width,288px)] transition-[margin-left] duration-300 ease-in-out will-change-[margin-left]"
      >
        <div className="container mx-auto p-4 lg:p-8 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

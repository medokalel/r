import { useDirection } from '@/context/DirectionContext'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { dir } = useDirection()

  return (
    <div dir={dir} className="flex min-h-screen bg-[#f9fafc]">
      <DashboardSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-16 max-[922px]:pb-16 min-[923px]:pb-0">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  )
}
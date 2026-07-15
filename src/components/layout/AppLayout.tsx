import { useDirection } from '@/context/DirectionContext'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { dir } = useDirection()

  return (
    <div dir={dir} className="flex min-h-screen bg-[#f9fafc]">
      <DashboardSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

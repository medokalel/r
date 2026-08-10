import { cn } from '@/lib/utils'
import { useDirection } from '@/context/DirectionContext'
import { CabSidebarProvider } from '@/context/CabSidebarContext'
import { CabSidebar } from '@/components/dashboard/cab/CabSidebar'

interface CabLayoutProps {
  children: React.ReactNode
  className?: string
}

export function CabLayout({ children, className }: CabLayoutProps) {
  const { dir } = useDirection()

  return (
    <CabSidebarProvider>
      <div dir={dir} className={cn('flex min-h-screen bg-[#f9fafc]', className)}>
        <CabSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">{children}</div>
      </div>
    </CabSidebarProvider>
  )
}

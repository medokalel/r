import { useDirection } from '@/context/DirectionContext'
import { CabSidebar } from '@/components/dashboard/cab/CabSidebar'

interface CabLayoutProps {
  children: React.ReactNode
}

export function CabLayout({ children }: CabLayoutProps) {
  const { dir } = useDirection()

  return (
    <div dir={dir} className="flex min-h-screen bg-[#f9fafc]">
      <CabSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

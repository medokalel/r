import { BrandingPanelBackground } from './BrandingPanelBackground'
import { CascoBranding } from './CascoBranding'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  contentClassName?: string
}

export function AuthLayout({ children, contentClassName }: AuthLayoutProps) {
  const { dir } = useDirection()

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left: branding background with full-width white form container */}
      <div className="relative flex min-h-screen w-full lg:w-[48%] overflow-hidden">
        <BrandingPanelBackground />

        <div className="relative z-10 flex flex-1 p-4 lg:p-6">
          <div className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl">
            <div className="flex flex-1 items-center justify-center px-5 py-12">
              <div className={cn('w-full max-w-[620px]', contentClassName)}>{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: branding panel */}
      <div className="hidden lg:flex lg:flex-1">
        <CascoBranding />
      </div>
    </div>
  )
}

import { BrandingPanelBackground } from './BrandingPanelBackground'
import { CascoBranding } from './CascoBranding'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  contentClassName?: string
  /** Mirrors which side the branding panel sits on (relative to the form), independent of language direction. */
  reverse?: boolean
}

export function AuthLayout({ children, contentClassName, reverse }: AuthLayoutProps) {
  const { dir } = useDirection()

  return (
    <div dir={dir} className={cn('min-h-screen flex', reverse && 'flex-row-reverse')}>
      {/* Left: branding background with full-width white form container.
          On mobile there's no room for a separate branding panel, so this
          collapses to a plain white page (no dark backdrop, no padded/
          shadowed card) and the branding shows inline at the top instead. */}
      <div className="relative flex min-h-screen w-full flex-col bg-white lg:w-[48%] lg:overflow-hidden">
        <div className="absolute inset-0 hidden lg:block">
          <BrandingPanelBackground />
        </div>

        <div className="relative z-10 flex flex-1 flex-col lg:p-4 xl:p-6">
          <div className="flex flex-1 flex-col overflow-hidden bg-white lg:rounded-[var(--radius-md)] lg:shadow-2xl">
            <div className="flex flex-1 items-center justify-center px-5 py-10 lg:py-12">
              <div className={cn('w-full max-w-[620px]', contentClassName)}>
                {/* Mobile-only branding — on lg+ this lives in the separate
                    right-side panel (CascoBranding) instead. */}
                <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
                  <img src="/casco-logo.svg" alt="CASCO" className="h-auto w-40 object-contain" />
                  <p
                    className="text-[15px] font-medium leading-[1.6] text-primary [font-family:var(--font-arabic)]"
                    dir="rtl"
                    lang="ar"
                  >
                    امتثال ذكي...أثر حقيقي
                  </p>
                </div>

                {children}
              </div>
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
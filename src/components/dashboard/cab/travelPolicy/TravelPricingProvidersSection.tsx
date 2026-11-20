import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type ProviderStatus = 'demo' | 'benchmark' | 'connected'

// TODO: read provider status from the pricing-provider endpoint once it exists.
const PROVIDERS: { key: string; status: ProviderStatus }[] = [
  { key: 'flights', status: 'demo' },
  { key: 'hotels', status: 'demo' },
  { key: 'transfers', status: 'demo' },
  { key: 'trains', status: 'benchmark' },
  { key: 'fx', status: 'benchmark' },
  { key: 'distances', status: 'connected' },
]

const BADGE_TONE: Record<ProviderStatus, string> = {
  demo: 'bg-[#FDECEC] text-[#D92D20]',
  benchmark: 'bg-[#FEF3E2] text-[#B54708]',
  connected: 'bg-[#E8EEFF] text-[#1236A5]',
}

export function TravelPricingProvidersSection() {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t('cab.travelPolicy.providers.title')}
      action={
        <Button type="button" size="sm" variant="secondary">
          {t('cab.travelPolicy.providers.check')}
        </Button>
      }
    >
      <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.providers.intro')}</p>
      <p className="mt-3 rounded-[var(--radius-sm)] bg-[#F5F8FF] px-3 py-2 text-[12px] text-[var(--cab-muted)]">
        {t('cab.travelPolicy.providers.phase2')}
      </p>
      <ul className="mt-2 divide-y divide-[var(--cab-border)]">
        {PROVIDERS.map(({ key, status }) => (
          <li key={key} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-[13px] font-bold text-[var(--cab-ink)]">{t(`cab.travelPolicy.providers.${key}.name`)}</p>
              <p className="text-[12px] text-[var(--cab-muted)]">{t(`cab.travelPolicy.providers.${key}.detail`)}</p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium', BADGE_TONE[status])}>
              {t(`cab.travelPolicy.providers.status.${status}`)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

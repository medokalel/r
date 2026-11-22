import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { Button } from '@/components/ui/Button'
import { getTravelPolicy } from '@/lib/api/cabTravelPolicyApi'
import { fetchUsdRate, type UsdRate } from '@/lib/api/exchangeRatesApi'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type ProviderStatus = 'demo' | 'benchmark' | 'connected' | 'failed'
type CheckResult = 'working' | 'failed' | 'notConnected'

// TODO: read flight, hotel, transfer and train status from the pricing-provider endpoint once it exists.
// Distances need no provider: great-circle distance is computed from city coordinates.
const PROVIDERS: { key: string; status?: ProviderStatus }[] = [
  { key: 'flights', status: 'demo' },
  { key: 'hotels', status: 'demo' },
  { key: 'transfers', status: 'demo' },
  { key: 'trains', status: 'benchmark' },
  { key: 'fx', status: 'benchmark' },
  { key: 'distances', status: 'connected' },
  { key: 'service' },
]

const BADGE_TONE: Record<ProviderStatus, string> = {
  demo: 'bg-[#FDECEC] text-[#D92D20]',
  benchmark: 'bg-[#FEF3E2] text-[#B54708]',
  connected: 'bg-[#E8EEFF] text-[#1236A5]',
  failed: 'bg-[#FDECEC] text-[#D92D20]',
}

const RESULT_TONE: Record<CheckResult, string> = {
  working: 'text-[#16A34A]',
  failed: 'text-[#D92D20]',
  notConnected: 'text-[#B54708]',
}

/** Rows with no live API, so a health check can only report that they are not connected. */
const NOT_CONNECTED = new Set(['flights', 'hotels', 'transfers', 'trains'])

export function TravelPricingProvidersSection({ currency }: { currency: string }) {
  const { t } = useTranslation()
  const [fx, setFx] = useState<UsdRate | null>(null)
  const [results, setResults] = useState<Record<string, CheckResult> | null>(null)
  const [checking, setChecking] = useState(false)

  const loadRate = useCallback(() => {
    const code = currency.trim().toUpperCase()
    return code === 'USD' ? Promise.resolve({ rate: 1, date: new Date().toISOString().slice(0, 10) }) : fetchUsdRate(code)
  }, [currency])

  useEffect(() => {
    loadRate().then(setFx, () => setFx(null))
  }, [loadRate])

  /** Health-checks every live API (exchange rates and our own travel policy service) and reports each result under its row. */
  const checkConnection = async () => {
    setChecking(true)
    const [rate, service] = await Promise.allSettled([loadRate(), getTravelPolicy()])
    setFx(rate.status === 'fulfilled' ? rate.value : null)
    const next: Record<string, CheckResult> = {
      fx: rate.status === 'fulfilled' ? 'working' : 'failed',
      service: service.status === 'fulfilled' ? 'working' : 'failed',
      distances: 'working',
    }
    for (const key of NOT_CONNECTED) next[key] = 'notConnected'
    setResults(next)
    setChecking(false)

    const failed = (['fx', 'service'] as const).filter((key) => next[key] === 'failed')
    if (failed.length === 0) toast.success(t('cab.travelPolicy.providers.allWorking'))
    else toast.error(t('cab.travelPolicy.providers.someFailed', { names: failed.map((key) => t(`cab.travelPolicy.providers.${key}.name`)).join(', ') }))
  }

  return (
    <SectionCard
      title={t('cab.travelPolicy.providers.title')}
      action={
        <Button type="button" size="sm" variant="secondary" onClick={() => void checkConnection()} disabled={checking}>
          {t('cab.travelPolicy.providers.check')}
        </Button>
      }
    >
      <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.providers.intro')}</p>
      <p className="mt-3 rounded-[var(--radius-sm)] bg-[#F5F8FF] px-3 py-2 text-[12px] text-[var(--cab-muted)]">
        {t('cab.travelPolicy.providers.phase2')}
      </p>
      <ul className="mt-2 divide-y divide-[var(--cab-border)]">
        {PROVIDERS.map(({ key, status: staticStatus }) => {
          const result = results?.[key]
          const live = key === 'fx' && fx
          const status: ProviderStatus | undefined = result === 'failed' && key === 'service' ? 'failed' : live ? 'connected' : staticStatus
          return (
            <li key={key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-[var(--cab-ink)]">{t(`cab.travelPolicy.providers.${key}.name`)}</p>
                <p className="text-[12px] text-[var(--cab-muted)]">
                  {live
                    ? t('cab.travelPolicy.providers.fx.liveDetail', { rate: fx.rate.toFixed(4), currency: currency.toUpperCase(), date: fx.date })
                    : t(`cab.travelPolicy.providers.${key}.detail`)}
                </p>
                {result && (
                  <p role="status" className={cn('mt-1 text-[12px] font-semibold', RESULT_TONE[result])}>
                    {t(`cab.travelPolicy.providers.result.${result}`, { defaultValue: '' })}
                    {result === 'working' && key === 'distances' ? ` · ${t('cab.travelPolicy.providers.result.local')}` : ''}
                  </p>
                )}
              </div>
              {status && (
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium', BADGE_TONE[status])}>
                  {t(`cab.travelPolicy.providers.status.${status}`)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getCabProfile } from '@/lib/api/cabApi'
import { getTravelPolicy } from '@/lib/api/cabTravelPolicyApi'
import { fetchUsdRate } from '@/lib/api/exchangeRatesApi'
import { getCountryOptions } from '@/lib/countries'
import { ROUTES } from '@/lib/routes'
import { estimateTravelCost, type TravelEstimate, type TravelPlace } from '@/lib/travelCostEstimate'
import { findTravelCityByName, resolveTravelCity } from '@/lib/travelCities'
import type { TravelPolicyInput } from '@/lib/travelPolicyTypes'
import { useTravelCityOptions } from '@/lib/useTravelCityOptions'

interface TravelEstimatePanelProps {
  /** People travelling. */
  auditors: number
  /** Audit days on site (the starting value when `daysEditable`). */
  auditDays: number
  daysEditable?: boolean
  /** Names to try, in order, when guessing the audit site's city (a city, or an address split into parts). */
  siteHints?: string[]
  /** Country of the site: ISO code or English name. */
  siteCountry?: string
  /** When set, the estimate can be applied, converted to this currency at today's rate. */
  applyCurrency?: string
  onApply?: (amount: number) => void
}

const toIsoCountry = (country?: string) => {
  const value = country?.trim()
  if (!value) return undefined
  if (value.length === 2) return value.toUpperCase()
  return getCountryOptions('en').find((option) => option.name.toLowerCase() === value.toLowerCase())?.code
}

/**
 * The travel cost of this audit, worked out from the travel policy the CAB saved (GET /cab/travel-policy):
 * rates per country and city, transport rules, per diem, visa, contingency and insurance.
 */
export function TravelEstimatePanel({
  auditors,
  auditDays,
  daysEditable,
  siteHints = [],
  siteCountry,
  applyCurrency,
  onApply,
}: TravelEstimatePanelProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')
  const cityOptions = useTravelCityOptions(isArabic)

  const [policy, setPolicy] = useState<TravelPolicyInput | null | undefined>(undefined) // undefined = loading
  const [failed, setFailed] = useState(false)
  const [fromKey, setFromKey] = useState('')
  const [toKey, setToKey] = useState('')
  const [days, setDays] = useState(String(auditDays))
  const [estimate, setEstimate] = useState<TravelEstimate | null>(null)
  const [converted, setConverted] = useState<{ amount: number; rate: number } | null>(null)

  useEffect(() => {
    let active = true
    getTravelPolicy()
      .then((saved) => active && setPolicy(saved))
      .catch(() => active && (setPolicy(null), setFailed(true)))
    return () => {
      active = false
    }
  }, [])

  // Start from the CAB's office city and the client's city when we can find them.
  const hintsKey = siteHints.join('|')
  useEffect(() => {
    let active = true
    getCabProfile()
      .then(({ cab }) => (cab.city ? findTravelCityByName(cab.city, cab.country ?? undefined) : null))
      .then((place) => active && place && setFromKey((current) => current || place.key))
      .catch(() => undefined)
    const country = toIsoCountry(siteCountry)
    siteHints
      .reduce<Promise<TravelPlace | null>>(async (found, hint) => (await found) ?? findTravelCityByName(hint, country), Promise.resolve(null))
      .then((place) => active && place && setToKey((current) => current || place.key))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hints are compared through hintsKey
  }, [hintsKey, siteCountry])

  const daysValue = Math.max(Number(days) || 0, 0)
  useEffect(() => {
    let active = true
    if (!policy || !fromKey || !toKey || !auditors) return
    Promise.all([resolveTravelCity(fromKey), resolveTravelCity(toKey)]).then(([from, to]) => {
      if (active) setEstimate(from && to ? estimateTravelCost({ policy, from, to, auditors, auditDays: daysValue }) : null)
    })
    return () => {
      active = false
    }
  }, [policy, fromKey, toKey, auditors, daysValue])

  const shown = policy && fromKey && toKey && auditors ? estimate : null
  const mustConvert = Boolean(shown && applyCurrency && applyCurrency !== shown.currency)
  useEffect(() => {
    let active = true
    if (!shown || !applyCurrency || applyCurrency === shown.currency) return
    Promise.all([fetchUsdRate(shown.currency), fetchUsdRate(applyCurrency)])
      .then(([from, to]) => active && setConverted({ rate: to.rate / from.rate, amount: Math.round((shown.total / from.rate) * to.rate * 100) / 100 }))
      .catch(() => active && setConverted(null))
    return () => {
      active = false
    }
  }, [shown, applyCurrency])

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat(isArabic ? 'ar-SA-u-nu-latn' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  const usable = useMemo(
    () => (shown ? (mustConvert ? converted?.amount : shown.total) : undefined),
    [shown, mustConvert, converted]
  )

  if (policy === undefined) return <p className="text-[13px] text-neutral-500">{t('common.loading')}</p>
  if (!policy) {
    return (
      <div className="rounded-[10px] border border-[#ececec] bg-[#f8faff] p-4 text-[13px] text-neutral-700">
        <p>{failed ? t('cab.travelEstimate.loadError') : t('cab.travelEstimate.noPolicy')}</p>
        <Link to={ROUTES.cabTravelPolicy} className="mt-1 inline-block font-semibold text-primary underline">
          {t('cab.travelEstimate.openPolicy')}
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-4 rounded-[12px] border border-[#dbe6ff] bg-[#f8faff] p-4">
      <div>
        <h3 className="text-[15px] font-bold text-neutral-900">{t('cab.travelEstimate.title')}</h3>
        <p className="mt-0.5 text-[12px] text-neutral-500">{t('cab.travelEstimate.hint')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SearchableSelect id="travel-estimate-from" label={t('cab.travelEstimate.from')} value={fromKey} onChange={setFromKey} options={cityOptions} placeholder={t('cab.travelEstimate.selectCity')} searchPlaceholder={t('common.search')} />
        <SearchableSelect id="travel-estimate-to" label={t('cab.travelEstimate.to')} value={toKey} onChange={setToKey} options={cityOptions} placeholder={t('cab.travelEstimate.selectCity')} searchPlaceholder={t('common.search')} />
        <label className="flex flex-col gap-2 text-[14px] font-medium text-neutral-800">
          {t('cab.travelEstimate.days')}
          <input
            type="number"
            min="0"
            step="0.5"
            value={days}
            disabled={!daysEditable}
            onChange={(event) => setDays(event.target.value)}
            className="h-11 rounded-[10px] border border-neutral-200 bg-white px-3 text-[14px] disabled:bg-neutral-50"
          />
        </label>
      </div>

      {!auditors && <p className="text-[13px] text-warning-700">{t('cab.travelEstimate.noTeam')}</p>}
      {auditors > 0 && (!fromKey || !toKey) && <p className="text-[13px] text-neutral-600">{t('cab.travelEstimate.pickCities')}</p>}

      {shown && (
        <div className="space-y-3">
          <p className="text-[12px] text-neutral-600">
            {t('cab.travelEstimate.summary', {
              mode: t(`cab.travelEstimate.mode.${shown.mode}`),
              km: shown.distanceKm,
              hours: shown.travelHours,
              nights: shown.nights,
              count: auditors,
            })}
          </p>
          <ul className="divide-y divide-[#e5ecfb] rounded-[10px] border border-[#e5ecfb] bg-white text-[13px]">
            {shown.lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-3 px-3 py-2">
                <span className="text-neutral-700">{t(`cab.travelEstimate.lines.${line.key}`)}</span>
                <span className="font-semibold text-neutral-900">{money(line.amount, shown.currency)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 bg-[#f4f7ff] px-3 py-2 font-bold text-primary">
              <span>{t('cab.travelEstimate.total')}</span>
              <span>{money(shown.total, shown.currency)}</span>
            </li>
          </ul>
          {mustConvert && converted && applyCurrency && (
            <p className="text-[12px] text-neutral-600">
              {t('cab.travelEstimate.converted', { amount: money(converted.amount, applyCurrency), rate: converted.rate.toFixed(4) })}
            </p>
          )}
          {mustConvert && !converted && <p className="text-[12px] text-warning-700">{t('cab.travelEstimate.noRate', { from: shown.currency, to: applyCurrency })}</p>}
          {onApply && (
            <Button type="button" variant="secondary" size="sm" disabled={usable === undefined} onClick={() => usable !== undefined && onApply(usable)}>
              {t('cab.travelEstimate.use')}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

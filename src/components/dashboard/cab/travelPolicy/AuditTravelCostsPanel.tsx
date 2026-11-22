import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { FormField } from '@/components/ui/FormField'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { TextField } from '@/components/ui/TextField'
import { toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { getCabProfile } from '@/lib/api/cabApi'
import { getTravelPolicy } from '@/lib/api/cabTravelPolicyApi'
import type { AuditTravelEstimate } from '@/lib/api/cabAuditPlanningApi'
import { getCountryOptions } from '@/lib/countries'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { estimateAuditTravel, type AuditTravelMode, type AuditTravelResult, type TravelPlace } from '@/lib/travelCostEstimate'
import { findTravelCityByName, resolveTravelCity } from '@/lib/travelCities'
import type { TravelPolicyInput } from '@/lib/travelPolicyTypes'
import { useTravelCityOptions } from '@/lib/useTravelCityOptions'

interface SiteRow {
  key: string
  name: string
  address: string
  cityKey: string
  onsite: boolean
}

interface TeamRow {
  key: string
  name: string
  baseKey: string
}

interface AuditTravelCostsPanelProps {
  siteName: string
  siteAddress: string
  /** Country of the audit: ISO code or English name. */
  country?: string
  teamNames: string[]
  firstDay: string
  lastDay: string
  remoteEnabled: boolean
  /** The estimate already saved with the plan, if any. */
  saved?: AuditTravelEstimate
  onSave: (estimate: AuditTravelEstimate) => Promise<void>
}

const MODES: AuditTravelMode[] = ['ON_SITE', 'HYBRID', 'REMOTE']
const asDate = (iso: string) => (iso ? new Date(`${iso}T00:00:00`) : undefined)
const daysBetween = (first: string, last: string) => Math.round((Date.parse(last) - Date.parse(first)) / 86_400_000) + 1
const rowKey = () => `row-${Math.random().toString(36).slice(2, 9)}`

const toIsoCountry = (country?: string) => {
  const value = country?.trim()
  if (!value) return undefined
  return value.length === 2 ? value.toUpperCase() : getCountryOptions('en').find((o) => o.name.toLowerCase() === value.toLowerCase())?.code
}

/** The first part of an address (split on commas and line breaks) that is a known city. */
async function cityFromAddress(name: string, address: string, country?: string): Promise<TravelPlace | null> {
  const iso = toIsoCountry(country)
  for (const part of [name, ...address.split(/[,;\n]/)].map((p) => p.trim()).filter(Boolean)) {
    const place = await findTravelCityByName(part, iso)
    if (place) return place
  }
  return null
}

/**
 * Travel costs of an audit worked out from the saved travel policy: audit mode and dates, the sites
 * to visit and where each auditor travels from. The estimate is saved with the audit plan.
 */
export function AuditTravelCostsPanel({
  siteName,
  siteAddress,
  country,
  teamNames,
  firstDay: planFirstDay,
  lastDay: planLastDay,
  remoteEnabled,
  saved,
  onSave,
}: AuditTravelCostsPanelProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')
  const cityOptions = useTravelCityOptions(isArabic)

  const [policy, setPolicy] = useState<TravelPolicyInput | null | undefined>(undefined)
  const [officePlace, setOfficePlace] = useState<TravelPlace | null>(null)
  const [mode, setMode] = useState<AuditTravelMode>(saved?.mode ?? (remoteEnabled ? 'HYBRID' : 'ON_SITE'))
  const [firstDay, setFirstDay] = useState(saved?.firstDay ?? planFirstDay)
  const [lastDay, setLastDay] = useState(saved?.lastDay ?? planLastDay)
  const [sites, setSites] = useState<SiteRow[]>(
    saved?.sites.map((site) => ({ ...site, key: rowKey() })) ?? [{ key: rowKey(), name: siteName, address: siteAddress, cityKey: '', onsite: true }],
  )
  const [team, setTeam] = useState<TeamRow[]>(
    saved?.team.map((member) => ({ ...member, key: rowKey() })) ?? teamNames.map((name) => ({ key: rowKey(), name, baseKey: '' })),
  )
  const [places, setPlaces] = useState<Record<string, string>>({}) // city key -> "City (country)" label for the "Located in" line
  const [result, setResult] = useState<AuditTravelResult | null>(
    saved ? { currency: saved.currency, lines: saved.lines as AuditTravelResult['lines'], total: saved.total, bySite: saved.bySite } : null,
  )
  const [busy, setBusy] = useState<'calculating' | 'saving' | null>(null)

  useEffect(() => {
    let active = true
    getTravelPolicy().then((p) => active && setPolicy(p), () => active && setPolicy(null))
    getCabProfile()
      .then(({ cab }) => (cab.city ? findTravelCityByName(cab.city, cab.country ?? undefined) : null))
      .then((place) => active && setOfficePlace(place))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  // Find each site's city in its address, unless it already has one.
  useEffect(() => {
    let active = true
    sites.forEach((site) => {
      if (site.cityKey) return
      cityFromAddress(site.name, site.address, country).then((place) => {
        if (active && place) setSites((rows) => rows.map((row) => (row.key === site.key && !row.cityKey ? { ...row, cityKey: place.key } : row)))
      })
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs for the rows present at mount and for added sites
  }, [sites.length, country])

  // "Located in <city>" for every site that has one.
  const cityKeys = sites.map((site) => site.cityKey).join('|')
  useEffect(() => {
    let active = true
    sites.forEach((site) => {
      if (site.cityKey) resolveTravelCity(site.cityKey).then((place) => active && place && setPlaces((prev) => ({ ...prev, [site.cityKey]: `${place.name} (${place.country})` })))
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the chosen cities
  }, [cityKeys])

  const sampleCount = useMemo(
    () => (policy ? [...policy.countries, ...policy.cities, ...policy.railRoutes].filter((row) => row.sample).length : 0),
    [policy]
  )
  const days = firstDay && lastDay ? daysBetween(firstDay, lastDay) : 0
  const datesValid = days >= 1
  const onsiteNames = sites.filter((site) => mode === 'ON_SITE' || (mode === 'HYBRID' && site.onsite)).map((site) => site.name).filter(Boolean)

  const updateSite = (key: string, patch: Partial<SiteRow>) => {
    setSites((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
    setResult(null)
  }
  const updateMember = (key: string, patch: Partial<TeamRow>) => {
    setTeam((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
    setResult(null)
  }

  const calculate = useCallback(async () => {
    if (!policy) return
    if (!datesValid) return toast.error(t('cab.travelCosts.endBeforeStart'))
    setBusy('calculating')
    try {
      const visited = sites.filter((site) => mode === 'ON_SITE' || (mode === 'HYBRID' && site.onsite))
      if (mode !== 'REMOTE' && visited.length === 0) return toast.error(t('cab.travelCosts.needSite'))
      if (mode !== 'REMOTE' && team.length === 0) return toast.error(t('cab.travelCosts.needTeam'))
      const sitePlaces: { name: string; place: TravelPlace; onsite: boolean }[] = []
      for (const site of sites) {
        const place = site.cityKey ? await resolveTravelCity(site.cityKey) : null
        if (!place && visited.includes(site)) return toast.error(t('cab.travelCosts.needCity', { site: site.name || t('cab.travelCosts.site') }))
        if (place) sitePlaces.push({ name: site.name, place, onsite: site.onsite })
      }
      const members: { base: TravelPlace }[] = []
      for (const member of team) {
        const base = member.baseKey ? await resolveTravelCity(member.baseKey) : officePlace
        if (!base && mode !== 'REMOTE') return toast.error(t('cab.travelCosts.needBase', { name: member.name || t('cab.travelCosts.auditor') }))
        if (base) members.push({ base })
      }
      setResult(estimateAuditTravel({ policy, mode, auditDays: days, sites: sitePlaces, team: members }))
    } finally {
      setBusy(null)
    }
  }, [policy, datesValid, sites, team, mode, days, officePlace, t])

  const save = async () => {
    if (!result) return
    setBusy('saving')
    try {
      await onSave({
        mode,
        firstDay,
        lastDay,
        sites: sites.map(({ name, address, cityKey, onsite }) => ({ name, address, cityKey, onsite })),
        team: team.map(({ name, baseKey }) => ({ name, baseKey })),
        currency: result.currency,
        total: result.total,
        lines: result.lines,
        bySite: result.bySite,
        savedAt: new Date().toISOString(),
      })
      toast.success(t('cab.travelCosts.saved'))
    } finally {
      setBusy(null)
    }
  }

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat(isArabic ? 'ar-SA-u-nu-latn' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  const cityLabel = (key: string) => places[key] ?? ''

  const trash = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={label} className="mx-auto flex size-9 items-center justify-center rounded-[8px] text-primary hover:bg-primary-subtle">
      <AppIcon icon={TrashIcon} size={18} />
    </button>
  )

  return (
    <details open className="group space-y-4 border-t border-[#ececec] pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[14px] font-bold text-primary [&::-webkit-details-marker]:hidden">
        <span className="inline-block -rotate-90 text-[10px] transition-transform group-open:rotate-0">▼</span>
        {t('cab.travelCosts.title')}
      </summary>
      <p className="text-[12px] text-neutral-500">
        {mode === 'REMOTE' ? t('cab.travelCosts.remoteOnly') : t('cab.travelCosts.shownBecause', { sites: onsiteNames.join(', ') || '—' })}
      </p>

      <div>
        <h4 className="text-[16px] font-bold text-primary">{t('cab.travelCosts.heading')}</h4>
        <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">{t('cab.travelCosts.intro')}</p>
      </div>

      {policy === undefined && <p className="text-[13px] text-neutral-500">{t('common.loading')}</p>}
      {policy === null && (
        <div className="text-[13px] text-neutral-700">
          <p>{t('cab.travelEstimate.noPolicy')}</p>
          <Link to={ROUTES.cabTravelPolicy} className="mt-1 inline-block font-semibold text-primary underline">{t('cab.travelEstimate.openPolicy')}</Link>
        </div>
      )}

      {policy && (
        <>
          {sampleCount > 0 && (
            <p className="text-[12px] text-neutral-600">
              {t('cab.travelCosts.sampleRates', { count: sampleCount })}{' '}
              <Link to={ROUTES.cabTravelPolicy} className="font-semibold text-neutral-900 underline">{t('cab.travelEstimate.openPolicy')}</Link>
            </p>
          )}

          <FormField label={t('cab.travelCosts.auditMode')}>
            <div role="radiogroup" className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              {MODES.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-[16px] text-neutral-700">
                  <input type="radio" name="audit-travel-mode" className="size-5 accent-[var(--color-primary)]" checked={mode === value} onChange={() => { setMode(value); setResult(null) }} />
                  {t(`cab.travelCosts.mode.${value}`)}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label={t('cab.travelCosts.firstDay')} required>
            <DatePicker value={asDate(firstDay)} onChange={(date) => { setFirstDay(toIsoDate(date)); setResult(null) }} />
          </FormField>
          <FormField label={t('cab.travelCosts.lastDay')} required>
            <DatePicker value={asDate(lastDay)} onChange={(date) => { setLastDay(toIsoDate(date)); setResult(null) }} />
          </FormField>
          {firstDay && lastDay && !datesValid && <p role="alert" className="text-[13px] text-error-600">{t('cab.travelCosts.endBeforeStart')}</p>}

          <div className="space-y-3">
            <h4 className="text-[14px] font-bold text-neutral-900">{t('cab.travelCosts.sitesToVisit')}</h4>
            {sites.map((site) => (
              <div key={site.key} className="space-y-4 rounded-[10px] border border-[#ececec] p-3">
                <TextField id={`audit-travel-site-${site.key}`} label={t('cab.travelCosts.site')} value={site.name} maxLength={300} onChange={(e) => updateSite(site.key, { name: e.target.value })} />
                <SearchableSelect
                  label={t('cab.travelCosts.city')}
                  value={site.cityKey}
                  onChange={(cityKey) => updateSite(site.key, { cityKey })}
                  options={cityOptions}
                  placeholder={t('cab.travelCosts.findInAddress')}
                  searchPlaceholder={t('common.search')}
                />
                {mode === 'HYBRID' && (
                  <label className="flex items-center gap-2 text-[14px]">
                    <Checkbox checked={site.onsite} onChange={() => updateSite(site.key, { onsite: !site.onsite })} />
                    {t('cab.travelCosts.onsite')}
                  </label>
                )}
                {sites.length > 1 && trash(t('cab.travelCosts.remove'), () => { setSites((rows) => rows.filter((row) => row.key !== site.key)); setResult(null) })}
                <p className="text-[12px] text-neutral-500">
                  {site.address ? `${site.address.replace(/\n/g, ', ')} · ` : ''}
                  {site.cityKey ? t('cab.travelCosts.locatedIn', { city: cityLabel(site.cityKey) || '…' }) : t('cab.travelCosts.notLocated')}
                </p>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => { setSites((rows) => [...rows, { key: rowKey(), name: '', address: '', cityKey: '', onsite: true }]); setResult(null) }}>
              + {t('cab.travelCosts.addSite')}
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-[14px] font-bold text-neutral-900">{t('cab.travelCosts.team')}</h4>
            {team.map((member) => (
              <div key={member.key} className="space-y-4 rounded-[10px] border border-[#ececec] p-3">
                <TextField id={`audit-travel-member-${member.key}`} label={t('cab.travelCosts.auditor')} value={member.name} maxLength={200} onChange={(e) => updateMember(member.key, { name: e.target.value })} />
                <SearchableSelect
                  label={t('cab.travelCosts.travelsFrom')}
                  value={member.baseKey}
                  onChange={(baseKey) => updateMember(member.key, { baseKey })}
                  options={cityOptions}
                  placeholder={t('cab.travelCosts.baseFromProfile')}
                  searchPlaceholder={t('common.search')}
                />
                {trash(t('cab.travelCosts.remove'), () => { setTeam((rows) => rows.filter((row) => row.key !== member.key)); setResult(null) })}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => { setTeam((rows) => [...rows, { key: rowKey(), name: '', baseKey: '' }]); setResult(null) }}>
              + {t('cab.travelCosts.addAuditor')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => void calculate()} disabled={busy !== null}>
              {t('cab.travelCosts.calculate')}
            </Button>
            <Button type="button" variant="primary" onClick={() => void save()} disabled={!result || busy !== null}>
              {t('cab.travelCosts.saveEstimate')}
            </Button>
          </div>
          {saved && result && result.total === saved.total && (
            <p className="text-[12px] text-neutral-500">{t('cab.travelCosts.savedAt', { date: new Date(saved.savedAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-GB') })}</p>
          )}

          {result && (
            <div className="space-y-3">
              <p className="text-[12px] text-neutral-600">{t('cab.travelCosts.daysSummary', { count: days })}</p>
              {result.total === 0 ? (
                <p className="text-[13px] text-neutral-700">{t('cab.travelCosts.noCost')}</p>
              ) : (
                <ul className="divide-y divide-[#e5ecfb] rounded-[10px] border border-[#e5ecfb] text-[13px]">
                  {result.bySite.length > 1 &&
                    result.bySite.map((row) => (
                      <li key={row.name} className="flex justify-between gap-3 bg-[#fafcff] px-3 py-2">
                        <span className="text-neutral-600">{t('cab.travelCosts.bySite', { site: row.name })}</span>
                        <span className="font-semibold">{money(row.total, result.currency)}</span>
                      </li>
                    ))}
                  {result.lines.map((line) => (
                    <li key={line.key} className="flex justify-between gap-3 px-3 py-2">
                      <span className="text-neutral-700">{t(`cab.travelEstimate.lines.${line.key}`)}</span>
                      <span className="font-semibold text-neutral-900">{money(line.amount, result.currency)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-3 bg-[#f4f7ff] px-3 py-2 font-bold text-primary">
                    <span>{t('cab.travelEstimate.total')}</span>
                    <span>{money(result.total, result.currency)}</span>
                  </li>
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </details>
  )
}

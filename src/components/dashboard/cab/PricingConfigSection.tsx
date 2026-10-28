import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui'
import { SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { ApiError } from '@/lib/api/client'
import {
  QUOTATION_CURRENCIES,
  deactivatePricingConfig,
  listPricingConfigs,
  upsertPricingConfig,
  type CabPricingConfig,
} from '@/lib/api/cabQuotationApi'

/** CAB-wide default daily rate, tax rate and currency (GET/POST/DELETE /cab/pricing-config). */
export function PricingConfigSection() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<CabPricingConfig | null>(null)
  const [taxPercent, setTaxPercent] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const apply = (next: CabPricingConfig | null) => {
    setConfig(next)
    // The price per day is entered per quotation; the API still needs a rate, so keep the saved one.
    // taxRate is stored as a decimal (0.15); the form shows a percentage
    setTaxPercent(next ? String(Math.round(Number(next.taxRate) * 10000) / 100) : '')
    setCurrency(next?.currency ?? 'USD')
  }

  useEffect(() => {
    let cancelled = false
    listPricingConfigs()
      .then((configs) => {
        if (!cancelled) apply(configs.find((item) => item.isActive && item.standardId === null) ?? null)
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage({ type: 'error', text: error instanceof ApiError ? error.message : t('errors.generic') })
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const tax = Number(taxPercent || 0)
  const valid = Number.isFinite(tax) && tax >= 0 && tax <= 100

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof ApiError ? error.message : t('errors.generic') })
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    run(async () => {
      apply(await upsertPricingConfig({ dailyRate: Number(config?.dailyRate ?? 0), currency, taxRate: tax / 100 }))
      setMessage({ type: 'success', text: t('cab.quotationEditor.pricingSaved') })
    })

  const remove = () =>
    run(async () => {
      if (!config) return
      await deactivatePricingConfig(config.id)
      apply(null)
      setMessage({ type: 'success', text: t('cab.quotationEditor.pricingRemoved') })
    })

  return (
    <SetupSection title={t('cab.quotationEditor.pricingTitle')}>
      <p className="mb-5 text-[14px] text-[var(--cab-muted)]">{t('cab.quotationEditor.pricingHint')}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          id="cab-pricing-tax"
          label={t('cab.quotationEditor.taxRate')}
          type="number"
          min="0"
          max="100"
          step="any"
          value={taxPercent}
          onChange={(event) => setTaxPercent(event.target.value)}
        />
        <SelectField
          id="cab-pricing-currency"
          label={t('cab.quotationEditor.currency')}
          value={currency}
          options={QUOTATION_CURRENCIES.map((code) => ({ value: code, label: code }))}
          onChange={setCurrency}
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy || !valid} onClick={() => void save()}>
          {t('cab.quotationEditor.savePricing')}
        </Button>
        {config && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => void remove()}>
            {t('cab.quotationEditor.removePricing')}
          </Button>
        )}
        {message && (
          <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'error' ? 'text-error-500' : 'text-success-600'}>
            {message.text}
          </p>
        )}
      </div>
    </SetupSection>
  )
}

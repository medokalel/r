import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, SearchIcon } from '@/components/icons'
import { TextField } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import {
  NATIONAL_ADDRESS_SHORT_CODE_PATTERN,
  NationalAddressLookupError,
  lookupNationalAddress,
  type NationalAddress,
} from '@/lib/api/nationalAddressApi'
import { cn } from '@/lib/utils'

interface NationalAddressLookupProps {
  onFound: (address: NationalAddress) => void
  className?: string
}

interface LookupMessage {
  tone: 'error' | 'success'
  text: string
}

/**
 * Fills an address from Saudi Post, given its short address (4 letters + 4 digits).
 * The caller decides which of its own fields the result goes into.
 */
export function NationalAddressLookup({ onFound, className }: NationalAddressLookupProps) {
  const { t, i18n } = useTranslation()
  const [shortCode, setShortCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<LookupMessage | null>(null)

  const lookup = async () => {
    if (!NATIONAL_ADDRESS_SHORT_CODE_PATTERN.test(shortCode.trim())) {
      setMessage({ tone: 'error', text: t('companyProfile.nationalAddress.lookup.invalid') })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      onFound(await lookupNationalAddress(shortCode, i18n.language.startsWith('ar') ? 'ar' : 'en'))
      setMessage({ tone: 'success', text: t('companyProfile.nationalAddress.lookup.filled') })
    } catch (error) {
      const code = error instanceof NationalAddressLookupError ? error.code : null
      setMessage({
        tone: 'error',
        text:
          code === 'NATIONAL_ADDRESS_NOT_FOUND'
            ? t('companyProfile.nationalAddress.lookup.notFound')
            : code === 'NATIONAL_ADDRESS_UNAVAILABLE'
              ? t('companyProfile.nationalAddress.lookup.unavailable')
              : t('companyProfile.nationalAddress.lookup.failed'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-blue-100 bg-primary-subtle p-4 sm:p-5',
        className
      )}
    >
      <p className="mb-3 text-[12px] text-neutral-600">{t('companyProfile.nationalAddress.lookup.hint')}</p>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="xl:w-[260px]">
          <TextField
            id="national-address-short-code"
            label={t('companyProfile.nationalAddress.shortAddress')}
            dir="ltr"
            lang="en"
            autoComplete="off"
            maxLength={8}
            placeholder="RRRD2929"
            value={shortCode}
            className="uppercase tracking-wider"
            onChange={(event) => {
              setShortCode(event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())
              setMessage(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void lookup()
              }
            }}
            aria-invalid={message?.tone === 'error'}
            aria-describedby="national-address-lookup-message"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={loading}
          onClick={() => void lookup()}
          className="xl:min-w-[220px]"
          icon={<AppIcon icon={SearchIcon} size={20} />}
        >
          {loading ? t('common.loading') : t('companyProfile.nationalAddress.lookup.button')}
        </Button>
      </div>
      <p
        id="national-address-lookup-message"
        role={message?.tone === 'error' ? 'alert' : 'status'}
        className={cn(
          'mt-2 min-h-[18px] text-[12px]',
          message?.tone === 'error' ? 'text-error-700' : 'text-success-700'
        )}
      >
        {message?.text ?? ''}
      </p>
    </div>
  )
}

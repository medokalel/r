import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { fieldCompactLabelClassName } from '@/components/ui'
import { AppIcon, CheckIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface SsoCopyFieldProps {
  label: string
  value: string
  /** Monospace text — for URLs, identifiers and DNS values. */
  mono?: boolean
}

const COPIED_MS = 1600

/** A read-only value with a Copy button, for the values the person gives to their identity provider. */
export function SsoCopyField({ label, value, mono = true }: SsoCopyFieldProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), COPIED_MS)
    } catch {
      // Clipboard access can be refused (insecure context, permissions). The value stays selectable.
      setCopied(false)
    }
  }

  return (
    <div className="min-w-0">
      <p className={fieldCompactLabelClassName}>{label}</p>
      <div className="mt-1 flex min-w-0 items-stretch overflow-hidden rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-50">
        <code
          dir="ltr"
          className={cn(
            'min-w-0 flex-1 select-all break-all px-3 py-2.5 text-start text-[13px] leading-[1.6] text-neutral-900',
            mono && 'font-mono',
          )}
        >
          {value}
        </code>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          onClick={() => void handleCopy()}
          icon={copied ? <AppIcon icon={CheckIcon} size={16} /> : undefined}
          aria-label={`${t('cab.sso.common.copy')}: ${label}`}
          className="h-auto shrink-0 rounded-none border-s border-neutral-200 bg-white px-3"
        >
          {copied ? t('cab.sso.common.copied') : t('cab.sso.common.copy')}
        </Button>
      </div>
    </div>
  )
}

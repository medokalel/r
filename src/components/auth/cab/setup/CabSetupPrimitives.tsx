import { type ReactNode, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, TrashIcon, UploadOutlineIcon } from '@/components/icons'
import { uploadOnboardingAsset } from '@/lib/api/uploadsApi'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

/** Tinted info panel from the deck (#F5F8FF on a #D9E2F0 hairline). */
export function SetupSection({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-[8px] border border-[var(--cab-border)] bg-[var(--cab-panel)] p-5',
        className
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <p className="text-[15px] font-bold text-[var(--cab-ink)]">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Single/multi-select card — deck spec: 8px radius, #E8EEFF + primary border when picked. */
export function SetupOptionCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-[105px] w-full flex-col items-start justify-center gap-2 rounded-[8px] border px-6 text-start transition-colors',
        selected
          ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)]'
          : 'border-[var(--cab-border)] bg-white hover:border-[#b9c8e4]'
      )}
    >
      <span
        className={cn(
          'text-[17px] font-bold leading-[1.3]',
          selected ? 'text-[var(--cab-primary)]' : 'text-[var(--cab-ink)]'
        )}
      >
        {title}
      </span>
      <span className="text-[12px] leading-[1.5] text-[var(--cab-muted)]">{description}</span>
    </button>
  )
}

/** Rounded grey pill used for secondary row actions ("Edit"). */
export function SetupPill({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--cab-border)] bg-[var(--cab-chip)] px-5 py-1.5 text-[11px] font-bold text-[var(--cab-muted)] hover:bg-white"
    >
      {label}
    </button>
  )
}

/** Text-only primary action ("+ Add location", "+ Add another"). */
export function SetupAddLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] font-bold text-[var(--cab-primary)] hover:underline"
    >
      {label}
    </button>
  )
}

/** The pill switch used for every "rule" toggle in the deck. */
export function SetupSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-neutral-200'
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
        )}
      />
    </button>
  )
}

/** Label + switch row, e.g. "Block mark use after expiry". */
export function SetupToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--cab-ink)]">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-[var(--cab-muted)]">{description}</p>}
      </div>
      <SetupSwitch checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  )
}

/**
 * Inline note. The deck sets these as plain coloured text (primary for hints,
 * amber for cautions) rather than a filled callout.
 */
export function SetupNote({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <p
      className={cn(
        'text-[12px] font-bold',
        tone === 'warning' ? 'text-[#8a5a00]' : 'text-[var(--cab-primary)]'
      )}
    >
      {children}
    </p>
  )
}

/** A repeatable record (location, accreditation, scope) with a remove control. */
export function SetupRecordCard({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string
  onRemove?: () => void
  removeLabel?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[8px] border border-[var(--cab-border)] bg-[var(--cab-panel)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold text-[var(--cab-primary)]">{title}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[12px] font-bold text-error-500 hover:bg-[#fef2f2]"
          >
            <AppIcon icon={TrashIcon} size={14} />
            {removeLabel}
          </button>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function SetupFileInput({
  id,
  fileName,
  onFileNameChange,
  accept = '.pdf',
  selectLabel,
  changeLabel,
  removeLabel,
}: {
  id: string
  fileName: string
  onFileNameChange: (fileName: string) => void
  accept?: string
  selectLabel: string
  changeLabel: string
  removeLabel: string
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError(t('validation.fileTooLarge', { size: 10 }))
      return
    }

    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadOnboardingAsset(file)
      setDisplayName(uploaded.fileName)
      onFileNameChange(uploaded.fileUrl)
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : t('errors.generic'))
    } finally {
      setUploading(false)
    }
  }

  const persistedName = fileName.split('/').pop() || fileName

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {fileName ? (
          <>
            <a
              href={resolvePublicAssetUrl(fileName)}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[220px] truncate rounded-[var(--radius-sm)] bg-primary-subtle px-3 py-2 text-body-3 text-primary"
            >
              {displayName || persistedName}
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-[var(--radius-sm)] border border-neutral-200 px-3 py-2 text-body-3-medium text-primary hover:bg-neutral-50 disabled:opacity-50"
            >
              {uploading ? t('common.loading') : changeLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setDisplayName('')
                onFileNameChange('')
              }}
              disabled={uploading}
              className="rounded-[var(--radius-sm)] px-3 py-2 text-body-3-medium text-error-500 hover:bg-[#fef2f2] disabled:opacity-50"
            >
              {removeLabel}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[#7594f0] px-4 py-2 text-body-3-medium text-primary hover:bg-primary-subtle disabled:opacity-50"
          >
            <AppIcon icon={UploadOutlineIcon} size={18} />
            {uploading ? t('common.loading') : selectLabel}
          </button>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => void handleSelect(event)}
        />
      </div>
      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}

export function SetupMarkUpload({
  id,
  label,
  caption,
  imageUrl,
  onImageUrlChange,
  uploadLabel,
  removeLabel,
}: {
  id: string
  label: string
  caption: string
  imageUrl: string | null
  onImageUrlChange: (url: string | null) => void
  uploadLabel: string
  removeLabel: string
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError(t('validation.fileTooLarge', { size: 10 }))
      return
    }

    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadOnboardingAsset(file)
      onImageUrlChange(uploaded.fileUrl)
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : t('errors.generic'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[#7594f0] bg-[#f3f6fd] p-4 text-center">
      <p className="text-[13px] font-bold text-[var(--cab-ink)]">{label}</p>

      {imageUrl ? (
        <img src={resolvePublicAssetUrl(imageUrl)} alt={label} className="h-12 max-w-[140px] object-contain" />
      ) : (
        <AppIcon icon={UploadOutlineIcon} size={28} className="text-primary" />
      )}

      <p className="text-[12px] text-[var(--cab-muted)]">{caption}</p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3 py-1.5 text-body-3-medium text-primary hover:bg-neutral-50 disabled:opacity-50"
        >
          {uploading
            ? t('common.loading')
            : imageUrl
              ? t('companyProfile.profileHeader.changeFile')
              : uploadLabel}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onImageUrlChange(null)}
            className="rounded-[var(--radius-sm)] px-3 py-1.5 text-body-3-medium text-error-500 hover:bg-[#fef2f2]"
          >
            {removeLabel}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/svg+xml,image/png,image/webp,image/jpeg"
        className="sr-only"
        onChange={(event) => void handleSelect(event)}
      />
      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}

/** Multi-select rendered as a wrapping row of toggleable chips (services, document use). */
export function SetupChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value)}
            className={cn(
              'rounded-full border px-5 py-2 text-[12px] font-bold transition-colors',
              isSelected
                ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)] hover:border-[#b9c8e4]'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

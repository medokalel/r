import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, InfoIcon, UploadOutlineIcon } from '@/components/icons'
import { MAX_IMPORT_FILE_BYTES } from '@/lib/importFileReader'
import { cn } from '@/lib/utils'

interface UploadStepProps {
  /** The name of the file being read, or null when nothing is being read. */
  reading: string | null
  error: string
  onFile: (file: File) => void
}

export function UploadStep({ reading, error, onFile }: UploadStepProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const busy = reading !== null

  const openPicker = () => {
    if (!busy) inputRef.current?.click()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.dataMigration.wizard.upload.title')}</h3>

      <div
        role="button"
        tabIndex={0}
        aria-describedby="import-upload-hint"
        aria-busy={busy}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!dragActive) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          const file = event.dataTransfer.files?.[0]
          if (file && !busy) onFile(file)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border-[1.5px] border-dashed px-5 py-12 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          dragActive ? 'border-primary bg-[#f3f6fd]' : 'border-[#d5d9e3] bg-[#f9fafc] hover:border-primary hover:bg-[#f3f6fd]',
          busy && 'pointer-events-none'
        )}
      >
        <span className={cn('flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-sm', busy && 'animate-pulse')}>
          <AppIcon icon={UploadOutlineIcon} size={26} />
        </span>
        {busy ? (
          <>
            <p className="text-[14px] font-semibold text-neutral-900" dir="auto">
              {t('cab.dataMigration.wizard.upload.reading', { file: reading })}
            </p>
            <p className="text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.upload.readingHint')}</p>
          </>
        ) : (
          <>
            <p className="text-[14px] text-neutral-900">
              {t('cab.dataMigration.wizard.upload.drop')}{' '}
              <span className="font-semibold text-primary underline">{t('cab.dataMigration.wizard.upload.browse')}</span>
            </p>
            <p id="import-upload-hint" className="text-[12px] text-neutral-600">
              {t('cab.dataMigration.wizard.upload.formats', { size: MAX_IMPORT_FILE_BYTES / (1024 * 1024) })}
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset so choosing the same file again still fires `change`.
          event.target.value = ''
          if (file) onFile(file)
        }}
      />

      {error && (
        <div role="alert">
          <CalloutCard tone="red" icon={<AppIcon icon={InfoIcon} size={20} />} title={error}>
            {t('cab.dataMigration.wizard.upload.errorHint')}
          </CalloutCard>
        </div>
      )}
    </div>
  )
}
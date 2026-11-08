import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AppIcon, ExcelFileIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { commitImport, previewImport } from '@/lib/api/dataMigrationMockData'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import type {
  DuplicateMode,
  ImportCommitResult,
  ImportEntityKey,
  ImportMode,
  ImportPreview,
} from '@/lib/dataMigrationTypes'
import { commitErrorCode, countRecordsToImport, uploadErrorCode, type WizardStep } from '@/lib/dataMigrationWizard'
import { MAX_IMPORT_FILE_BYTES } from '@/lib/importFileReader'
import { ImportOptionsStep } from './ImportOptionsStep'
import { ImportResultStep } from './ImportResultStep'
import { ImportWizardStepper } from './ImportWizardStepper'
import { ReviewStep } from './ReviewStep'
import { TemplateStep } from './TemplateStep'
import { UploadStep } from './UploadStep'

interface ImportWizardDialogProps {
  entityKey: ImportEntityKey
  isArabic: boolean
  onClose: () => void
  /** Called as soon as an import was carried out, so the hub can refresh behind the dialog. */
  onImported: () => void
}

/**
 * The five steps of an import: template, upload, review, choose what to import,
 * result. It is mounted while it is open (`key` it by area so every area starts fresh).
 */
export function ImportWizardDialog({ entityKey, isArabic, onClose, onImported }: ImportWizardDialogProps) {
  const { t } = useTranslation()
  const entity = getImportEntity(entityKey)
  const entityLabel = isArabic ? entity.labelAr : entity.labelEn

  const [step, setStep] = useState<WizardStep>('template')
  const [reading, setReading] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mode, setMode] = useState<ImportMode>('ready_only')
  const [duplicates, setDuplicates] = useState<DuplicateMode>('skip')
  const [committing, setCommitting] = useState(false)
  const [commitError, setCommitError] = useState('')
  const [result, setResult] = useState<ImportCommitResult | null>(null)

  const busy = reading !== null || committing
  const recordCount = preview ? countRecordsToImport(entity, preview.rows, mode, duplicates === 'update') : 0

  // TODO: replace the mock calls (lib/api/dataMigrationMockData.ts) with the API once the endpoints exist.
  const handleFile = async (file: File) => {
    setUploadError('')
    setReading(file.name)
    try {
      const next = await previewImport(entityKey, file)
      setPreview(next)
      setMode('ready_only')
      setDuplicates('skip')
      setCommitError('')
      setStep('review')
    } catch (error) {
      setPreview(null)
      setUploadError(
        t(`cab.dataMigration.wizard.upload.errors.${uploadErrorCode(error)}`, {
          size: MAX_IMPORT_FILE_BYTES / (1024 * 1024),
        })
      )
    } finally {
      setReading(null)
    }
  }

  const handleCommit = async () => {
    if (!preview) return
    setCommitting(true)
    setCommitError('')
    try {
      setResult(await commitImport(preview.importId, { mode, duplicates }))
      setStep('result')
      onImported()
    } catch (error) {
      setCommitError(t(`cab.dataMigration.wizard.options.errors.${commitErrorCode(error)}`))
    } finally {
      setCommitting(false)
    }
  }

  const importAnother = () => {
    setPreview(null)
    setResult(null)
    setUploadError('')
    setStep('upload')
  }

  // Earlier steps can be revisited; the review and import steps need a file that was read.
  const isReachable = (target: WizardStep) => {
    if (busy || step === 'result') return false
    if (target === 'template' || target === 'upload') return true
    return target === 'review' || target === 'import' ? preview !== null : false
  }

  const footer = (() => {
    switch (step) {
      case 'template':
        return <Button onClick={() => setStep('upload')}>{t('cab.dataMigration.wizard.template.haveFile')}</Button>
      case 'upload':
        return (
          <Button variant="outline" onClick={() => setStep('template')} disabled={busy}>
            {t('common.back')}
          </Button>
        )
      case 'review':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('upload')}>
              {t('cab.dataMigration.wizard.review.otherFile')}
            </Button>
            <Button onClick={() => setStep('import')}>{t('common.next')}</Button>
          </>
        )
      case 'import':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('review')} disabled={committing}>
              {t('common.back')}
            </Button>
            <Button onClick={() => void handleCommit()} disabled={committing || recordCount === 0}>
              {committing
                ? t('cab.dataMigration.wizard.options.importing')
                : t('cab.dataMigration.wizard.options.confirm', { count: recordCount })}
            </Button>
          </>
        )
      default:
        return (
          <>
            <Button variant="outline" onClick={importAnother}>
              {t('cab.dataMigration.wizard.result.importAnother')}
            </Button>
            <Button onClick={onClose}>{t('cab.dataMigration.wizard.result.finish')}</Button>
          </>
        )
    }
  })()

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next && !busy) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(1040px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-white shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          <div className="shrink-0 border-b border-[#ececec] px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="hidden size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#dcfce7] sm:flex">
                  <AppIcon icon={ExcelFileIcon} size={26} />
                </span>
                <div className="min-w-0">
                  <Dialog.Title className="text-[20px] font-bold leading-tight text-neutral-900">
                    {t('cab.dataMigration.wizard.title', { entity: entityLabel })}
                  </Dialog.Title>
                  <p className="mt-1 hidden text-[14px] text-neutral-600 sm:block">
                    {t('cab.dataMigration.wizard.subtitle')}
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t('common.close')}
                  disabled={busy}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 text-neutral-900 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4">
              <ImportWizardStepper step={step} isReachable={isReachable} onSelect={setStep} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-7 sm:py-6">
            {step === 'template' && <TemplateStep entityKey={entityKey} isArabic={isArabic} />}
            {step === 'upload' && <UploadStep reading={reading} error={uploadError} onFile={(file) => void handleFile(file)} />}
            {step === 'review' && preview && <ReviewStep preview={preview} isArabic={isArabic} />}
            {step === 'import' && preview && (
              <ImportOptionsStep
                preview={preview}
                mode={mode}
                duplicates={duplicates}
                onModeChange={setMode}
                onDuplicatesChange={setDuplicates}
                recordCount={recordCount}
                error={commitError}
              />
            )}
            {step === 'result' && result && preview && (
              <ImportResultStep result={result} fileName={preview.fileName} isArabic={isArabic} />
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#ececec] px-5 py-4 sm:px-7">
            {footer}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
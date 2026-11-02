import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { RequiredMark } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import {
  AppIcon,
  DownloadIcon,
  EyeIcon,
  DocumentFileIcon,
  TrashIcon,
} from '@/components/icons'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { cn } from '@/lib/utils'

export interface UploadedDocumentFile {
  id: string
  name: string
  sizeLabel?: string
  dateLabel?: string
  url?: string | null
}

interface DocumentUploadFieldProps {
  title: string
  required?: boolean
  note?: string
  files: UploadedDocumentFile[]
  busy?: boolean
  accept?: string
  readOnly?: boolean
  /** Custom badge icon; receives the uploaded state for coloring */
  renderIcon?: (uploaded: boolean) => ReactNode
  onSelectFile?: (file: File) => void
  onDeleteFile?: (id: string) => void
  /** When provided, files get download/preview actions */
  onOpenFile?: (file: UploadedDocumentFile) => void
}

async function triggerFileDownload(file: UploadedDocumentFile) {
  const rawUrl = file.url ? resolvePublicAssetUrl(file.url) : ''
  if (!rawUrl) return

  const fileName = file.name || 'document'

  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    const a = document.createElement('a')
    a.href = rawUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    return
  }

  try {
    const response = await fetch(rawUrl)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
  } catch {
    const a = document.createElement('a')
    a.href = rawUrl
    a.download = fileName
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

function triggerFilePreview(file: UploadedDocumentFile, onOpen?: (file: UploadedDocumentFile) => void) {
  const rawUrl = file.url ? resolvePublicAssetUrl(file.url) : ''
  if (rawUrl) {
    window.open(rawUrl, '_blank')
    return
  }
  onOpen?.(file)
}

function FileRow({
  file,
  disabled,
  onDelete,
  onOpen,
}: {
  file: UploadedDocumentFile
  disabled?: boolean
  onDelete?: (id: string) => void
  onOpen?: (file: UploadedDocumentFile) => void
}) {
  const meta = [file.sizeLabel, file.dateLabel].filter(Boolean).join(' | ')
  const canOpen = Boolean(onOpen || file.url)

  return (
    <div className="flex items-center justify-between gap-4 rounded-[8px] bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef0fb] text-primary">
          <AppIcon icon={DocumentFileIcon} size={16} />
        </span>
        <div className="flex min-w-0 flex-col">
          <p dir="ltr" className="truncate text-[14px] font-medium text-neutral-900">
            {file.name}
          </p>
          {meta && (
            <span dir="ltr" className="text-[12px] font-light text-[#666]">
              {meta}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {[
          ...(onDelete
            ? [
                {
                  icon: TrashIcon,
                  label: 'delete',
                  hover: 'hover:text-error-500',
                  onClick: () => onDelete(file.id),
                },
              ]
            : []),
          ...(canOpen
            ? [
                {
                  icon: DownloadIcon,
                  label: 'download',
                  hover: 'hover:text-primary',
                  onClick: () => void triggerFileDownload(file),
                },
                {
                  icon: EyeIcon,
                  label: 'preview',
                  hover: 'hover:text-primary',
                  onClick: () => triggerFilePreview(file, onOpen),
                },
              ]
            : []),
        ].map(({ icon, label, hover, onClick }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'flex size-9 items-center justify-center rounded-[8px] border border-[#ececec] bg-white text-neutral-600 transition-colors disabled:opacity-50',
              hover
            )}
          >
            <AppIcon icon={icon} size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Shared document-upload accordion: one titled field that accepts multiple
 * files, shows an uploaded count, and expands to the file history.
 */
export function DocumentUploadField({
  title,
  required,
  note,
  files,
  busy = false,
  accept = '.pdf,.png,.jpg,.jpeg',
  readOnly = false,
  renderIcon,
  onSelectFile,
  onDeleteFile,
  onOpenFile,
}: DocumentUploadFieldProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(true)

  const uploaded = files.length > 0

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || readOnly || !onSelectFile) return
    onSelectFile(file)
    setExpanded(true)
  }

  return (
    <div className={cn(uploaded && 'rounded-[8px] border border-[#2ecc70] bg-[#f4fcf7]')}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-[10px]',
              uploaded ? 'bg-[#e3f7ec] text-[#26a65b]' : 'bg-[#eef0fb] text-primary'
            )}
          >
            {renderIcon ? renderIcon(uploaded) : <AppIcon icon={DocumentFileIcon} size={20} />}
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="text-[18px] font-medium leading-[1.6] text-neutral-900">
              {title}
              {required && <RequiredMark />}
            </p>
            {note && <p className="text-[14px] font-light leading-[1.6] text-[#666]">{note}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span
            className={cn(
              'text-[14px]',
              uploaded ? 'font-medium text-[#26a65b]' : 'font-light text-neutral-400'
            )}
          >
            {uploaded
              ? files.length > 1
                ? t('documentUpload.uploadedCount', { count: files.length })
                : t('documentUpload.uploaded')
              : busy
                ? t('common.loading')
                : t('documentUpload.waiting')}
          </span>
          {!readOnly && onSelectFile && (
            <Button
              type="button"
              variant="tertiary"
              className="h-12 min-w-[140px] shrink-0 rounded-[8px] bg-[#F3F6FD]"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {t('documentUpload.selectFile')}
            </Button>
          )}
          {uploaded && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-label={expanded ? t('documentUpload.hideFiles') : t('documentUpload.showFiles')}
              className="flex size-9 shrink-0 items-center justify-center text-[#26a65b] transition-opacity hover:opacity-70"
            >
              <SelectDropdownIcon className={cn('transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
        </div>

        {!readOnly && onSelectFile && (
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={onFileSelected}
          />
        )}
      </div>

      {/* Expanded file history */}
      {uploaded && expanded && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              disabled={busy}
              onDelete={readOnly ? undefined : onDeleteFile}
              onOpen={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

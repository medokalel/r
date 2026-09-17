import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, MoreIcon, TrashIcon } from '@/components/icons'
import { FormLabel } from '@/components/ui/FormField'
import type { EvidenceFile } from '@/lib/api/cabNonconformityResponseApi'
import { cn } from '@/lib/utils'

/**
 * Drag-and-drop evidence uploader with a versioned file list.
 *
 * Deliberately separate from `DocumentUploadField`: that component models a
 * single named requirement (one titled slot, "waiting / uploaded" state, a
 * select-file button). This one models an open-ended evidence bucket where the
 * drop target is the primary affordance and each row carries its own version
 * and row menu. Neither shape can be expressed by the other without breaking
 * its existing call sites.
 */

const EXTENSION_STYLES: Record<string, { label: string; className: string }> = {
  pdf: { label: 'PDF', className: 'bg-[#fdeaea] text-[#dc2626]' },
  doc: { label: 'DOC', className: 'bg-[#e8edfc] text-primary' },
  docx: { label: 'DOC', className: 'bg-[#e8edfc] text-primary' },
  xls: { label: 'XLS', className: 'bg-[#eafaf1] text-[#16a34a]' },
  xlsx: { label: 'XLS', className: 'bg-[#eafaf1] text-[#16a34a]' },
  jpg: { label: 'JPG', className: 'bg-[#eef2ff] text-[#4f46e5]' },
  jpeg: { label: 'JPG', className: 'bg-[#eef2ff] text-[#4f46e5]' },
  png: { label: 'PNG', className: 'bg-[#eef2ff] text-[#4f46e5]' },
}

const FALLBACK_STYLE = { label: 'FILE', className: 'bg-[#f3f4f6] text-neutral-600' }

function fileBadge(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_STYLES[extension] ?? FALLBACK_STYLE
}

interface EvidenceUploadFieldProps {
  label: string
  required?: boolean
  files: EvidenceFile[]
  accept: string
  maxSizeBytes: number
  hint: string
  disabled?: boolean
  error?: string
  onSelectFiles: (files: File[]) => void
  onDeleteFile: (id: string) => void
  onOpenFile?: (file: EvidenceFile) => void
  className?: string
}

function EvidenceRow({
  file,
  disabled,
  onDelete,
  onOpen,
}: {
  file: EvidenceFile
  disabled?: boolean
  onDelete: (id: string) => void
  onOpen?: (file: EvidenceFile) => void
}) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = fileBadge(file.name)

  return (
    <li className="relative flex items-center gap-3 rounded-[10px] bg-[#f9fafc] px-3 py-2.5">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold',
          badge.className,
        )}
        aria-hidden
      >
        {badge.label}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-neutral-900">{file.name}</p>
        <p className="mt-0.5 text-[12px] text-neutral-500">
          {t('cab.nonconformityResponse.evidence.version', { version: file.version })}
          <span className="mx-2 text-neutral-300">|</span>
          {file.uploadedAt}
          <span className="mx-2 text-neutral-300">|</span>
          {file.sizeLabel}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setMenuOpen((open) => !open)}
        onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
        aria-expanded={menuOpen}
        aria-label={t('cab.nonconformityResponse.evidence.rowActions', { name: file.name })}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <AppIcon icon={MoreIcon} size={18} />
      </button>

      {menuOpen && (
        <div className="absolute end-3 top-[calc(100%-6px)] z-10 min-w-[160px] overflow-hidden rounded-[10px] border border-[#ececec] bg-white py-1 shadow-lg">
          {onOpen && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onOpen(file)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-neutral-700 transition-colors hover:bg-[#f9fafc]"
            >
              <AppIcon icon={DownloadIcon} size={16} className="text-neutral-400" />
              {t('cab.nonconformityResponse.evidence.download')}
            </button>
          )}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onDelete(file.id)
              setMenuOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
          >
            <AppIcon icon={TrashIcon} size={16} />
            {t('common.delete')}
          </button>
        </div>
      )}
    </li>
  )
}

export function EvidenceUploadField({
  label,
  required,
  files,
  accept,
  maxSizeBytes,
  hint,
  disabled,
  error,
  onSelectFiles,
  onDeleteFile,
  onOpenFile,
  className,
}: EvidenceUploadFieldProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const accept_ = accept.split(',').map((item) => item.trim().toLowerCase())

  const acceptFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter((file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
      return accept_.includes(extension) && file.size <= maxSizeBytes
    })
    if (valid.length > 0) onSelectFiles(valid)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <FormLabel htmlFor={inputId} required={required}>
        {label}
      </FormLabel>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (disabled) return
          acceptFiles(event.dataTransfer.files)
        }}
        className={cn(
          'rounded-[10px] border border-dashed bg-white px-4 py-6 transition-colors',
          dragging ? 'border-primary bg-[#f5f8ff]' : 'border-[#d4d4d4]',
          disabled && 'opacity-60',
        )}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M4 14v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="text-center sm:text-start">
            <p className="text-[14px] text-neutral-600">
              {t('cab.nonconformityResponse.evidence.dropHint')}{' '}
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
              >
                {t('cab.nonconformityResponse.evidence.browse')}
              </button>
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-400">{hint}</p>
          </div>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            acceptFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <EvidenceRow
              key={file.id}
              file={file}
              disabled={disabled}
              onDelete={onDeleteFile}
              onOpen={onOpenFile}
            />
          ))}
        </ul>
      )}

      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}
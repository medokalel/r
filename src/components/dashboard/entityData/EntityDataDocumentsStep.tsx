import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, EyeIcon, RefreshIcon, TrashIcon } from '@/components/icons'
import { DocumentIcon, type DocumentIconKey } from '@/components/icons/documentIcons'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import { DocumentsSectionHeader } from '@/components/dashboard/entityData/DocumentsSectionHeader'
import { fieldBodyTextClassName, fieldTitleClassName } from '@/components/dashboard/FormField'
import { formatFileSize } from '@/lib/files'
import { cn } from '@/lib/utils'

interface DocumentItem {
  id: string
  titleKey: string
  noteKey?: string
  icon: DocumentIconKey
}

const requiredDocuments: DocumentItem[] = [
  { id: 'documentarySystem', titleKey: 'documentarySystem', icon: 'documentarySystem' },
  { id: 'organizationalStructure', titleKey: 'organizationalStructure', icon: 'organizationalStructure' },
  { id: 'commercialRegistry', titleKey: 'commercialRegistry', icon: 'commercialRegistry' },
  { id: 'vatCertificate', titleKey: 'vatCertificate', icon: 'vatCertificate' },
  { id: 'brandImage', titleKey: 'brandImage', noteKey: 'brandImageNote', icon: 'brandImage' },
  { id: 'nationalAddress', titleKey: 'nationalAddress', icon: 'nationalAddress' },
  { id: 'qualityPolicy', titleKey: 'qualityPolicy', icon: 'qualityPolicy' },
]

const otherUploadedFile = {
  name: 'organizational_chart_v2.pdf',
  size: '1.4 MB',
  date: '10/24/2024',
}

function DocumentActionButtons({
  viewLabel,
  downloadLabel,
  deleteLabel,
  replaceLabel,
}: {
  viewLabel: string
  downloadLabel: string
  deleteLabel: string
  replaceLabel: string
}) {
  const actionButtonClassName =
    'flex size-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50'

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" className={actionButtonClassName} aria-label={viewLabel}>
        <AppIcon icon={EyeIcon} size={20} />
      </button>
      <button type="button" className={actionButtonClassName} aria-label={downloadLabel}>
        <AppIcon icon={DownloadIcon} size={20} />
      </button>
      <button type="button" className={actionButtonClassName} aria-label={deleteLabel}>
        <AppIcon icon={TrashIcon} size={20} />
      </button>
      <button type="button" className={actionButtonClassName} aria-label={replaceLabel}>
        <AppIcon icon={RefreshIcon} size={20} />
      </button>
    </div>
  )
}

export function EntityDataDocumentsStep() {
  const { t, i18n } = useTranslation()
  const otherInputRef = useRef<HTMLInputElement>(null)
  // Local state until this form is wired to an API — multiple files per document
  const [filesByDoc, setFilesByDoc] = useState<Record<string, UploadedDocumentFile[]>>({})

  const docKey = (key: string) => t(`accreditation.entityData.documents.items.${key}`)

  const addFile = (docId: string, file: File) => {
    const entry: UploadedDocumentFile = {
      id: crypto.randomUUID(),
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      dateLabel: new Date().toLocaleDateString(i18n.language),
    }
    setFilesByDoc((current) => ({
      ...current,
      [docId]: [entry, ...(current[docId] ?? [])],
    }))
  }

  const deleteFile = (docId: string, fileId: string) => {
    setFilesByDoc((current) => ({
      ...current,
      [docId]: (current[docId] ?? []).filter((file) => file.id !== fileId),
    }))
  }

  return (
    <div className="flex-1 space-y-5">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[#ececec] bg-white py-5">
        <div className="px-5">
          <DocumentsSectionHeader
            title={t('accreditation.entityData.documents.requiredTitle')}
            subtitle={t('accreditation.entityData.documents.requiredSubtitle')}
          />
        </div>

        <div className="mx-5 flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-[#a3b8f5] p-3">
          {requiredDocuments.map((doc) => (
            <DocumentUploadField
              key={doc.id}
              title={docKey(doc.titleKey)}
              note={doc.noteKey ? docKey(doc.noteKey) : undefined}
              files={filesByDoc[doc.id] ?? []}
              renderIcon={(uploaded) => (
                <DocumentIcon icon={doc.icon} uploaded={uploaded} className="size-6" />
              )}
              onSelectFile={(file) => addFile(doc.id, file)}
              onDeleteFile={(fileId) => deleteFile(doc.id, fileId)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-5 rounded-[var(--radius-md)] border border-[#ececec] bg-white py-5">
        <div className="px-5">
          <DocumentsSectionHeader
            title={t('accreditation.entityData.documents.otherTitle')}
            subtitle={t('accreditation.entityData.documents.otherSubtitle')}
          />
        </div>

        <div className="mx-5 flex flex-col items-center gap-4 rounded-[var(--radius-md)] border border-dashed border-[#7594f0] px-8 py-4">
          <DocumentIcon icon="other" className="size-10" />
          <p className={cn(fieldTitleClassName, 'text-center text-neutral-900')}>
            {t('accreditation.entityData.documents.attachAdditional')}
          </p>
          <button
            type="button"
            onClick={() => otherInputRef.current?.click()}
            className="flex h-12 w-[170px] items-center justify-center rounded-[var(--radius-sm)] border border-[#e6e6e6] bg-white px-6 text-[16px] font-semibold text-primary hover:bg-neutral-50"
          >
            {t('accreditation.entityData.documents.selectFile')}
          </button>
          <input ref={otherInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        <div className="mx-5 flex min-h-[102px] flex-wrap items-center gap-4 rounded-[12px] border-b border-[#82e3aa] bg-[#f4fcf7] px-8 py-2">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#eafaf1]">
            <DocumentIcon icon="other" uploaded className="size-6" />
          </span>

          <div className="min-w-0 flex-1">
            <p className={cn(fieldTitleClassName, 'text-neutral-900')}>{otherUploadedFile.name}</p>
            <p className="text-[14px] leading-[1.6] text-neutral-600">
              {otherUploadedFile.size} | {otherUploadedFile.date}
            </p>
          </div>

          <span className="shrink-0 px-6 py-2.5 text-[16px] font-medium text-[#2ecc70]">
            {t('accreditation.entityData.documents.uploaded')}
          </span>
          <DocumentActionButtons
            viewLabel={t('accreditation.form.view')}
            downloadLabel={t('accreditation.form.download')}
            deleteLabel={t('accreditation.entityData.documents.delete')}
            replaceLabel={t('accreditation.entityData.documents.replace')}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-6">
        <div className={cn(fieldBodyTextClassName, 'rounded-[var(--radius-sm)] bg-[rgba(254,249,231,0.25)] p-3')}>
          <ul className="list-disc space-y-1 ps-5 text-[#917508]">
            <li>{t('accreditation.entityData.documents.guideline1')}</li>
            <li>{t('accreditation.entityData.documents.guideline2')}</li>
            <li>{t('accreditation.entityData.documents.guideline3')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

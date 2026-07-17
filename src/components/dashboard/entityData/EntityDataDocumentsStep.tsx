import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, EyeIcon, TrashIcon } from '@/components/icons'
import { DocumentIcon, type DocumentIconKey } from '@/components/icons/documentIcons'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import { DocumentsSectionHeader } from '@/components/dashboard/entityData/DocumentsSectionHeader'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import type { ApplicationDocumentEntry } from '@/components/dashboard/entityData/applicationTypes'
import { fieldBodyTextClassName, fieldTitleClassName } from '@/components/ui'
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

export function EntityDataDocumentsStep() {
  const { t, i18n } = useTranslation()
  const { form, uploadDocument, removeDocument, uploading } = useApplicationForm()
  const otherInputRef = useRef<HTMLInputElement>(null)

  const docKey = (key: string) => t(`accreditation.entityData.documents.items.${key}`)

  const toUploadedFile = (doc: ApplicationDocumentEntry): UploadedDocumentFile => ({
    id: doc.localId,
    name: doc.originalName || doc.fileName,
    sizeLabel: formatFileSize(doc.fileSize),
    dateLabel: new Date().toLocaleDateString(i18n.language),
  })

  const filesForSlot = (slotId: string) =>
    form.documents.filter((doc) => doc.slotId === slotId).map(toUploadedFile)

  const otherDocuments = form.documents.filter((doc) => doc.slotId === 'other')

  const onSelectOtherFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void uploadDocument('other', file)
    event.target.value = ''
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
              files={filesForSlot(doc.id)}
              renderIcon={(uploaded) => (
                <DocumentIcon icon={doc.icon} uploaded={uploaded} className="size-6" />
              )}
              onSelectFile={(file) => void uploadDocument(doc.id, file)}
              onDeleteFile={(fileId) => void removeDocument(fileId)}
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
            disabled={uploading}
            className="flex h-12 w-[170px] items-center justify-center rounded-[var(--radius-sm)] border border-[#e6e6e6] bg-white px-6 text-[16px] font-semibold text-primary hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('accreditation.entityData.documents.selectFile')}
          </button>
          <input
            ref={otherInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onSelectOtherFile}
          />
        </div>

        {otherDocuments.map((doc) => (
          <div
            key={doc.localId}
            className="mx-5 flex min-h-[102px] flex-wrap items-center gap-4 rounded-[12px] border-b border-[#82e3aa] bg-[#f4fcf7] px-8 py-2"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#eafaf1]">
              <DocumentIcon icon="other" uploaded className="size-6" />
            </span>

            <div className="min-w-0 flex-1">
              <p className={cn(fieldTitleClassName, 'text-neutral-900')}>
                {doc.originalName || doc.fileName}
              </p>
              <p className="text-[14px] leading-[1.6] text-neutral-600">
                {formatFileSize(doc.fileSize)}
              </p>
            </div>

            <span className="shrink-0 px-6 py-2.5 text-[16px] font-medium text-[#2ecc70]">
              {t('accreditation.entityData.documents.uploaded')}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank', 'noopener')}
                className="flex size-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                aria-label={t('accreditation.form.view')}
              >
                <AppIcon icon={EyeIcon} size={20} />
              </button>
              <a
                href={doc.fileUrl || undefined}
                download={doc.originalName || doc.fileName}
                target="_blank"
                rel="noopener"
                className="flex size-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                aria-label={t('accreditation.form.download')}
              >
                <AppIcon icon={DownloadIcon} size={20} />
              </a>
              <button
                type="button"
                onClick={() => void removeDocument(doc.localId)}
                className="flex size-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                aria-label={t('accreditation.entityData.documents.delete')}
              >
                <AppIcon icon={TrashIcon} size={20} />
              </button>
            </div>
          </div>
        ))}
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

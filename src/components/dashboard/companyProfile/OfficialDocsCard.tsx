import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import {
  AppIcon,
  EyeIcon,
  DocumentFileIcon,
  DocumentTextOutlineIcon,
  TrashIcon,
} from '@/components/icons'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import { SectionTitle } from '@/components/dashboard/SectionTitle'
import { formatFileSize } from '@/lib/files'
import {
  uploadOrganizationDocument,
  deleteOrganizationDocument,
  type OrgDocument,
  type OrgDocumentType,
} from '@/lib/api/organizationProfileApi'
import { DOC_ACCEPT, DOC_MAX_BYTES, DOC_TYPE_BY_KEY } from './constants'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'

export function useDocumentActions(onBusyChange?: (busy: boolean) => void) {
  const { t } = useTranslation()
  const { refreshDocuments, notify, handleApiError } = useProfileForm()

  const upload = async (documentType: OrgDocumentType, file: File) => {
    if (file.size > DOC_MAX_BYTES) {
      notify({ type: 'error', message: t('validation.fileTooLarge', { size: 10 }) })
      return
    }
    onBusyChange?.(true)
    try {
      await uploadOrganizationDocument(documentType, file)
      await refreshDocuments()
      notify({ type: 'success', message: t('companyProfile.messages.documentUploaded') })
    } catch (error) {
      handleApiError(error)
    } finally {
      onBusyChange?.(false)
    }
  }

  const remove = async (id: string) => {
    onBusyChange?.(true)
    try {
      await deleteOrganizationDocument(id)
      await refreshDocuments()
      notify({ type: 'success', message: t('companyProfile.messages.documentDeleted') })
    } catch (error) {
      handleApiError(error)
    } finally {
      onBusyChange?.(false)
    }
  }

  return { upload, remove }
}

function toUploadedFile(doc: OrgDocument, locale: string): UploadedDocumentFile {
  return {
    id: doc.id,
    name: doc.originalName ?? doc.fileName ?? '',
    sizeLabel: formatFileSize(doc.fileSize),
    dateLabel: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString(locale) : undefined,
    url: doc.fileUrl,
  }
}

function openDocumentUrl(file: UploadedDocumentFile) {
  if (file.url) window.open(file.url, '_blank')
}

function DocumentTypeField({ docKey, documents }: { docKey: string; documents: OrgDocument[] }) {
  const { t, i18n } = useTranslation()
  const [busy, setBusy] = useState(false)
  const { upload, remove } = useDocumentActions(setBusy)

  // Newest first — the API appends new uploads while keeping history
  const files = [...documents].reverse().map((doc) => toUploadedFile(doc, i18n.language))

  return (
    <DocumentUploadField
      title={t(`companyProfile.officialDocs.docs.${docKey}`)}
      required
      files={files}
      busy={busy}
      accept={DOC_ACCEPT}
      onSelectFile={(file) => upload(DOC_TYPE_BY_KEY[docKey], file)}
      onDeleteFile={remove}
      onOpenFile={openDocumentUrl}
    />
  )
}

function OtherDocumentsList({ documents }: { documents: OrgDocument[] }) {
  const { remove } = useDocumentActions()

  if (documents.length === 0) return null

  return (
    <div className="flex flex-col divide-y divide-[#f0f0f0] rounded-[12px] border border-[#ececec] p-3">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#eef0fb] text-primary">
              <AppIcon icon={DocumentFileIcon} size={20} />
            </span>
            <div className="flex flex-col gap-0.5">
              <p dir="ltr" className="text-[18px] font-medium leading-[1.6] text-neutral-900">
                {doc.originalName ?? doc.fileName}
              </p>
              <span dir="ltr" className="text-[12px] font-light text-[#666]">
                {formatFileSize(doc.fileSize)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="preview"
              onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
              className="flex size-9 items-center justify-center rounded-[8px] border border-[#ececec] bg-white text-neutral-600 transition-colors hover:text-primary"
            >
              <AppIcon icon={EyeIcon} size={16} />
            </button>
            <button
              type="button"
              aria-label="delete"
              onClick={() => remove(doc.id)}
              className="flex size-9 items-center justify-center rounded-[8px] border border-[#ececec] bg-white text-neutral-600 transition-colors hover:text-error-500"
            >
              <AppIcon icon={TrashIcon} size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function OfficialDocsCard() {
  const { t } = useTranslation()
  const addDocRef = useRef<HTMLInputElement>(null)
  const { documents } = useProfileForm()
  const [uploadingOther, setUploadingOther] = useState(false)
  const { upload } = useDocumentActions(setUploadingOther)

  const documentsOfType = (type: OrgDocumentType) =>
    documents.filter((doc) => doc.documentType === type)

  const onOtherFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await upload('OTHER', file)
  }

  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      {/* Required documents — one accordion per type, multiple files supported */}
      <CardHeader title={t('companyProfile.officialDocs.title')} />
      <div className="flex flex-col gap-3 rounded-[12px] border border-dashed border-primary/30 p-3">
        {Object.keys(DOC_TYPE_BY_KEY).map((docKey) => (
          <DocumentTypeField
            key={docKey}
            docKey={docKey}
            documents={documentsOfType(DOC_TYPE_BY_KEY[docKey])}
          />
        ))}
      </div>

      {/* Other documents */}
      <SectionTitle
        title={t('companyProfile.officialDocs.otherDocsTitle')}
        subtitle={t('companyProfile.officialDocs.otherDocsSubtitle')}
      />
      <OtherDocumentsList documents={documentsOfType('OTHER')} />
      <div className="flex flex-col items-center justify-center gap-4 rounded-[12px] border border-dashed border-primary/30 py-10">
        <AppIcon icon={DocumentTextOutlineIcon} size={40} className="text-primary" />
        <p className="text-[18px] font-medium text-neutral-900">
          {t('companyProfile.officialDocs.addDocLabel')}
        </p>
        <Button
          variant="secondary"
          className="h-12 min-w-[160px] rounded-[8px] border-neutral-200"
          onClick={() => addDocRef.current?.click()}
          disabled={uploadingOther}
        >
          {uploadingOther ? t('common.loading') : t('companyProfile.officialDocs.selectFile')}
        </Button>
        <input
          ref={addDocRef}
          type="file"
          className="hidden"
          accept={DOC_ACCEPT}
          onChange={onOtherFileSelected}
        />
      </div>
    </div>
  )
}

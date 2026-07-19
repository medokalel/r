import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/Button'
import { FormField, TextField } from '@/components/ui'
import {
  AppIcon,
  DocumentFileIcon,
  ExternalLinkOutlineIcon,
  FileTextIcon,
  TrashIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/files'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { DOC_ACCEPT } from './constants'
import { countryDisplayName } from './mappers'
import { useDocumentActions } from './OfficialDocsCard'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'
import type { NationalAddressFormValues } from './types'

export function NationalAddressToggleCard({
  value,
  onChange,
}: {
  value: 'yes' | 'no'
  onChange: (v: 'yes' | 'no') => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.hasAddressTitle')} />
      <div className="flex items-center gap-4">
        {(['yes', 'no'] as const).map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'flex h-[58px] items-center gap-3 rounded-[50px] px-6 py-4 transition-colors',
                active
                  ? 'border border-primary bg-[#f3f6fd]'
                  : 'border border-[#f4f4f4] bg-[#fcfcfc] hover:border-primary/40'
              )}
            >
              <span className={cn('text-[18px] font-light leading-[1.6]', active ? 'text-primary' : 'text-[#666]')}>
                {t(`companyProfile.nationalAddress.${option}`)}
              </span>
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  active ? 'border-primary bg-primary' : 'border-[#dcdcdc] bg-white'
                )}
              >
                {active && <span className="size-2 rounded-full bg-white" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const readonlyInputCls = 'cursor-default bg-[#f9fafc] border-[#f2f2f2] text-[#666]'

function CertificateUploadPreview() {
  const { t } = useTranslation()
  const { documents } = useProfileForm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const { upload, remove } = useDocumentActions(setBusy)

  // The API appends new uploads while keeping history — the last one is current
  const certificateDoc = [...documents]
    .reverse()
    .find((doc) => doc.documentType === 'NATIONAL_ADDRESS_CERTIFICATE')
  const isPdf = certificateDoc?.mimeType === 'application/pdf'
  const isImage = certificateDoc?.mimeType?.startsWith('image/')

  // The API host refuses to be framed (X-Frame-Options), so PDFs preview
  // through a local blob: URL instead of the remote URL directly
  const pdfPreview = useBlobUrl(isPdf ? certificateDoc?.fileUrl : null)

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await upload('NATIONAL_ADDRESS_CERTIFICATE', file)
  }

  return (
    <div className="hidden w-[260px] shrink-0 flex-col gap-3 lg:flex">
      <span className="text-[14px] font-medium leading-[1.6] text-[#666]">
        {t('companyProfile.nationalAddress.previewLabel')}
      </span>
      <div
        className={cn(
          'flex h-[372px] items-center justify-center overflow-hidden rounded-[8px] border border-[#ececec] bg-[#f9fafc]',
          certificateDoc && isPdf ? '' : 'flex-col gap-3 p-4'
        )}
      >
        {certificateDoc ? (
          isPdf ? (
            pdfPreview.blobUrl ? (
              // White matte + FitH zoom hide the PDF viewer's gray backdrop so
              // the preview reads like a document card, not an embedded browser
              <div className="h-full w-full rounded-[8px] bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <iframe
                  src={`${pdfPreview.blobUrl}#navpanes=0&view=FitH`}
                  title={certificateDoc.originalName ?? certificateDoc.fileName ?? undefined}
                  className="h-full w-full rounded-[6px] border border-[#f2f2f2]"
                />
              </div>
            ) : pdfPreview.loading ? (
              <div className="skeleton h-full w-full" aria-hidden />
            ) : (
              <div className="flex flex-col items-center gap-3 p-4">
                <AppIcon icon={DocumentFileIcon} size={40} className="text-primary" />
                <p dir="ltr" className="max-w-full truncate text-center text-[13px] text-neutral-600">
                  {certificateDoc.originalName ?? certificateDoc.fileName}
                </p>
                <span dir="ltr" className="text-[12px] font-light text-[#666]">
                  {formatFileSize(certificateDoc.fileSize)}
                </span>
              </div>
            )
          ) : isImage ? (
            <img
              src={certificateDoc.fileUrl ?? undefined}
              alt={certificateDoc.originalName ?? ''}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <>
              <AppIcon icon={DocumentFileIcon} size={40} className="text-primary" />
              <p dir="ltr" className="max-w-full truncate text-center text-[13px] text-neutral-600">
                {certificateDoc.originalName ?? certificateDoc.fileName}
              </p>
              <span dir="ltr" className="text-[12px] font-light text-[#666]">
                {formatFileSize(certificateDoc.fileSize)}
              </span>
            </>
          )
        ) : (
          <AppIcon icon={FileTextIcon} size={40} className="text-neutral-300" />
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {certificateDoc ? (
          <>
            <button
              type="button"
              disabled={!certificateDoc.fileUrl}
              onClick={() => certificateDoc.fileUrl && window.open(certificateDoc.fileUrl, '_blank')}
              className="flex items-center justify-center gap-1.5 text-[14px] font-medium text-primary underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
            >
              <AppIcon icon={ExternalLinkOutlineIcon} size={14} />
              {t('companyProfile.nationalAddress.viewLarger')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(certificateDoc.id)}
              className="flex items-center justify-center gap-1.5 text-[14px] font-medium text-error-500 underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIcon icon={TrashIcon} size={14} />
              {t('common.delete')}
            </button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="min-w-[140px] border-[#E6E6E6]"
          >
            {busy ? t('common.loading') : t('companyProfile.officialDocs.selectFile')}
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={DOC_ACCEPT}
        onChange={onFileSelected}
      />
    </div>
  )
}

export function NationalAddressFormCard() {
  const { t, i18n } = useTranslation()
  const { form, update } = useProfileForm()
  const countryName = form.country ? countryDisplayName(form.country, i18n.language) : ''

  const setField = <K extends keyof NationalAddressFormValues>(
    key: K,
    value: NationalAddressFormValues[K]
  ) => update('nationalAddress', { ...form.nationalAddress, [key]: value })

  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.formTitle')} />
      <div className="flex gap-6">
        {/* Document preview sidebar — start side */}
        <CertificateUploadPreview />

        {/* Form grid */}
        <div className="flex flex-1 flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.issueDate')}>
              <DatePicker
                value={form.nationalAddress.issueDate}
                onChange={(date) => setField('issueDate', date)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.expiryDate')}>
              <DatePicker
                value={form.nationalAddress.expiryDate}
                onChange={(date) => setField('expiryDate', date)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.addressId')}>
              <TextField
                type="text"
                dir="ltr"
                value={form.nationalAddress.certificateNumber}
                onChange={(e) => setField('certificateNumber', e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.street')}>
              <TextField
                type="text"
                value={form.nationalAddress.street}
                onChange={(e) => setField('street', e.target.value)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.buildingNo')}>
              <TextField
                type="text"
                value={form.nationalAddress.buildingNumber}
                onChange={(e) => setField('buildingNumber', e.target.value)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.postalCode')}>
              <TextField
                type="text"
                dir="ltr"
                value={form.nationalAddress.postalCode}
                onChange={(e) => setField('postalCode', e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.subNumber')}>
              <TextField
                type="text"
                dir="ltr"
                value={form.nationalAddress.additionalNumber}
                onChange={(e) => setField('additionalNumber', e.target.value)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.neighborhood')}>
              <TextField
                type="text"
                value={form.nationalAddress.district}
                onChange={(e) => setField('district', e.target.value)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.city')}>
              <TextField
                type="text"
                value={form.nationalAddress.city}
                onChange={(e) => setField('city', e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label={t('companyProfile.nationalAddress.country')}>
              <TextField readOnly value={countryName} className={readonlyInputCls} />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConnectionNotesCard() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.notesTitle')} />
      <div className="rounded-[8px] bg-[#f3f6fd] p-4">
        <ul className="list-disc ps-6 text-[16px] font-light leading-[1.8] text-[#666]">
          <li>{t('companyProfile.nationalAddress.note1')}</li>
          <li>{t('companyProfile.nationalAddress.note2')}</li>
        </ul>
      </div>
    </div>
  )
}

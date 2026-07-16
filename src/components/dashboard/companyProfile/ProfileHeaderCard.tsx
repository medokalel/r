import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { FormField, MultiSelect, Textarea } from '@/components/ui'
import { AppIcon, BuildingIcon, UploadOutlineIcon } from '@/components/icons'
import {
  uploadOrganizationLogo,
  deleteOrganizationLogo,
} from '@/lib/api/organizationProfileApi'
import { LOGO_ACCEPT, LOGO_MAX_BYTES, SECTOR_OPTIONS } from './constants'
import { useProfileForm } from './ProfileFormContext'

export function ProfileHeaderCard() {
  const { t } = useTranslation()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const { form, update, refreshProfile, notify, handleApiError } = useProfileForm()
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const onLogoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > LOGO_MAX_BYTES) {
      notify({ type: 'error', message: t('validation.fileTooLarge', { size: 5 }) })
      return
    }
    setUploadingLogo(true)
    try {
      await uploadOrganizationLogo(file)
      await refreshProfile()
      notify({ type: 'success', message: t('companyProfile.messages.logoUploaded') })
    } catch (error) {
      handleApiError(error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const onDeleteLogo = async () => {
    try {
      await deleteOrganizationLogo()
      update('logoUrl', null)
      notify({ type: 'success', message: t('companyProfile.messages.logoDeleted') })
    } catch (error) {
      handleApiError(error)
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-[12px] border border-[#ececec] bg-white p-5 lg:flex-row">
      {/* Logo upload */}
      <div className="flex w-full gap-3 lg:w-[500px] lg:shrink-0">
        {/* Col 1: icon */}
        <div
          className="flex size-14 shrink-0 items-center justify-center self-start rounded-[14px] bg-[#f3f6fd]"
          aria-hidden
        >
          <AppIcon icon={BuildingIcon} size={24} className="text-primary" />
        </div>

        {/* Col 2: label + upload box */}
        <div className="flex flex-1 flex-col gap-3">
          <span className="text-[18px] font-normal text-neutral-900 rtl:font-light">
            {t('companyProfile.profileHeader.companyLogoLabel')}
            <span className="ms-1 text-red-500">*</span>
          </span>
          <div className="relative flex flex-col items-center gap-4 rounded-[16px] bg-[#f3f6fd] px-8 py-6">
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="15.5" fill="none" stroke="#1236a3" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="14 8" />
            </svg>
            {form.logoUrl ? (
              <>
                <img
                  src={form.logoUrl}
                  alt={t('companyProfile.profileHeader.companyLogoLabel')}
                  className="h-[96px] max-w-[220px] object-contain"
                />
                <div className="z-10 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="min-w-[140px] border-[#E6E6E6]"
                  >
                    {t('companyProfile.profileHeader.changeFile')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={onDeleteLogo}
                    className="min-w-[140px] border-[#E6E6E6] text-error-500"
                  >
                    {t('companyProfile.profileHeader.deleteLogo')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <AppIcon icon={UploadOutlineIcon} size={40} className="text-primary" />
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-[16px] font-medium leading-[1.6] text-neutral-900">
                    {t('companyProfile.profileHeader.uploadTitle')}
                  </p>
                  <p className="text-[14px] font-light leading-[1.6] text-[#666]">
                    {t('companyProfile.profileHeader.uploadSubtitle')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="z-10 w-[170px] border-[#E6E6E6]"
                >
                  {uploadingLogo ? t('common.loading') : t('companyProfile.profileHeader.selectFile')}
                </Button>
              </>
            )}
            <input
              ref={logoInputRef}
              type="file"
              className="hidden"
              accept={LOGO_ACCEPT}
              onChange={onLogoSelected}
            />
          </div>
        </div>
      </div>

      {/* Summary + sector */}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <FormField label={t('companyProfile.profileHeader.companySummaryLabel')} required>
          <Textarea
            placeholder={t('companyProfile.profileHeader.companySummaryPlaceholder')}
            rows={4}
            value={form.companySummary}
            onChange={(e) => update('companySummary', e.target.value)}
          />
        </FormField>

        <FormField label={t('companyProfile.profileHeader.industrySectorLabel')} required>
          <MultiSelect
            tags={form.industries}
            options={SECTOR_OPTIONS}
            onChange={(tags) => update('industries', tags)}
          />
        </FormField>
      </div>
    </div>
  )
}

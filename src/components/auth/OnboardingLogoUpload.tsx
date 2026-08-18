import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { AppIcon, UploadOutlineIcon } from '@/components/icons'
import {
  deleteOrganizationLogo,
  getOrganizationProfile,
  uploadOrganizationLogo,
} from '@/lib/api/organizationProfileApi'
import { LOGO_ACCEPT, LOGO_MAX_BYTES } from '@/components/dashboard/companyProfile/constants'
import { ApiError } from '@/lib/api/client'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'

interface OnboardingLogoUploadProps {
  logoUrl: string | null
  onLogoUrlChange: (logoUrl: string | null) => void
}

export function OnboardingLogoUpload({ logoUrl, onLogoUrlChange }: OnboardingLogoUploadProps) {
  const { t } = useTranslation()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getOrganizationProfile()
      .then((data) => {
        if (!cancelled && data.profile?.logoUrl && !logoUrl) {
          onLogoUrlChange(data.profile.logoUrl)
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  const onLogoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > LOGO_MAX_BYTES) {
      setError(t('validation.fileTooLarge', { size: 5 }))
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      const result = await uploadOrganizationLogo(file)
      onLogoUrlChange(result.logoUrl ?? null)
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : t('errors.generic'))
    } finally {
      setUploadingLogo(false)
    }
  }

  const onDeleteLogo = async () => {
    setError(null)
    try {
      await deleteOrganizationLogo()
      onLogoUrlChange(null)
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : t('errors.generic'))
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative flex flex-col items-center gap-4 rounded-[16px] bg-[#f3f6fd] px-6 py-5">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0.5"
            y="0.5"
            width="calc(100% - 1px)"
            height="calc(100% - 1px)"
            rx="15.5"
            fill="none"
            stroke="#1236a3"
            strokeOpacity="0.6"
            strokeWidth="1"
            strokeDasharray="14 8"
          />
        </svg>

        {logoUrl ? (
          <>
            <img
              src={resolvePublicAssetUrl(logoUrl)}
              alt={t('companyProfile.profileHeader.companyLogoLabel')}
              className="h-[72px] max-w-[200px] object-contain"
            />
            <div className="z-10 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="min-w-[120px] border-[#E6E6E6]"
              >
                {t('companyProfile.profileHeader.changeFile')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => void onDeleteLogo()}
                className="min-w-[120px] border-[#E6E6E6] text-error-500"
              >
                {t('companyProfile.profileHeader.deleteLogo')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <AppIcon icon={UploadOutlineIcon} size={36} className="text-primary" />
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[15px] font-medium leading-[1.6] text-neutral-900">
                {t('companyProfile.profileHeader.uploadTitle')}
              </p>
              <p className="text-[13px] font-light leading-[1.6] text-[#666]">
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
          onChange={(event) => void onLogoSelected(event)}
        />
      </div>

      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}

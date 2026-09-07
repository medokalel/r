import { useTranslation } from 'react-i18next'
import { AppIcon, TourGuideIcon } from '@/components/icons'
import { Tooltip } from '@/components/ui/Tooltip'
import { useOptionalTour } from '@/context/TourContext'

export function StartTourButton() {
  const { t } = useTranslation()
  const tour = useOptionalTour()

  if (!tour) return null

  return (
    <Tooltip label={t('cab.header.takeTour')}>
      <button
        type="button"
        onClick={tour.startTour}
        className="flex size-9 items-center justify-center rounded-full border border-[#ececec] text-[#1236a3] transition hover:bg-[#e8edfc] hover:border-[#1236a3]"
        aria-label={t('cab.header.takeTour')}
      >
        <AppIcon icon={TourGuideIcon} size={20} />
      </button>
    </Tooltip>
  )
}

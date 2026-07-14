import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AddCircle } from 'iconsax-reactjs'
import { cn } from '@/lib/utils'

type RequestStatus = 'underConstruction' | 'underReview' | 'closedByDirector' | 'issued'

interface CertificationRequest {
  id: string
  orderNumber: string
  status: RequestStatus
}

const mockRequestStatuses: { id: string; orderNumber: string; status: RequestStatus }[] = [
  { id: '1', orderNumber: 'PE-QMS-00011-01', status: 'underConstruction' },
  { id: '2', orderNumber: 'PE-QMS-00011-01', status: 'underReview' },
  { id: '3', orderNumber: 'PE-QMS-00011-01', status: 'closedByDirector' },
  { id: '4', orderNumber: 'PE-QMS-00011-01', status: 'issued' },
  { id: '5', orderNumber: 'PE-QMS-00011-01', status: 'underReview' },
  { id: '6', orderNumber: 'PE-QMS-00011-01', status: 'underConstruction' },
]

const statusConfig: Record<
  RequestStatus,
  { bgColor: string; borderColor: string; textColor: string }
> = {
  underConstruction: {
    bgColor: 'bg-[#fef3c6]',
    borderColor: 'border-[#fee685]',
    textColor: 'text-[#a58401]',
  },
  underReview: {
    bgColor: 'bg-[#e0e7ff]',
    borderColor: 'border-[#c395ff]',
    textColor: 'text-[#8137e2]',
  },
  closedByDirector: {
    bgColor: 'bg-[#dbeafe]',
    borderColor: 'border-[#bedbff]',
    textColor: 'text-[#1447e6]',
  },
  issued: {
    bgColor: 'bg-[#d0fae5]',
    borderColor: 'border-[#a4f4cf]',
    textColor: 'text-[#007a55]',
  },
}

function StatusIcon({ status }: { status: RequestStatus }) {
  if (status === 'underConstruction') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12.709 17.2789L17.1929 12.719C17.5825 12.3229 18.2202 12.3202 18.6131 12.7131L19.7929 13.8929C20.1834 14.2834 20.1834 14.9166 19.7929 15.3071L15.2934 19.8066C14.9082 20.1917 14.2857 20.1978 13.8931 19.8203L12.7289 18.7009C12.3277 18.315 12.3187 17.6758 12.709 17.2789Z" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11.2988 9.55078C12.2653 9.55078 13.0488 10.3343 13.0488 11.3008C13.0488 12.2673 12.2653 13.0508 11.2988 13.0508C10.3323 13.0508 9.54883 12.2673 9.54883 11.3008C9.54883 10.3343 10.3323 9.55078 11.2988 9.55078Z" stroke="#989898" strokeWidth="1.5"/>
        <path d="M16.8992 12.5004L16.0992 8.20039L15.9395 7.45499C15.8546 7.05888 15.5391 6.75311 15.1406 6.68064L14.6992 6.6004L5.09922 4.00039L4.89854 3.9335C4.83276 3.91157 4.76388 3.90039 4.69454 3.90039C4.56718 3.90039 4.44268 3.93809 4.33671 4.00874L4.19922 4.1004" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12.4491 16.9513L8.14913 16.1513L7.40372 15.9916C7.00761 15.9067 6.70185 15.5913 6.62938 15.1927L6.54913 14.7514L3.94913 5.05135C3.86983 4.78147 3.91211 4.49044 4.06493 4.25429L4.09931 4.20117" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9.89844 9.90039L4.39844 4.40039" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  if (status === 'underReview') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11.0996" cy="11.1992" r="6.75" stroke="#989898" strokeWidth="1.5"/>
        <path d="M15.9004 16.0996L19.6004 19.6996" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  if (status === 'closedByDirector') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5.55078" y="11.3496" width="13" height="8" rx="1.45" stroke="#989898" strokeWidth="1.5"/>
        <path d="M8.40039 10.4992V8.34922C8.40039 6.33338 10.0346 4.69922 12.0504 4.69922C14.0662 4.69922 15.7004 6.33338 15.7004 8.34922V10.4992" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  // issued
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8.40039 20.2L10.8004 18.4L11.5204 17.86C11.8048 17.6467 12.1959 17.6467 12.4804 17.86L13.2004 18.4L15.6004 20.2" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="8.69922" r="4.75" stroke="#989898" strokeWidth="1.5"/>
      <path d="M9.19591 12.8984L7.99069 19.5966C7.94054 19.8753 8.12269 20.1429 8.40039 20.1984" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14.8945 13L16.0696 19.8547C16.131 20.213 15.6167 20.344 15.4992 20" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

interface RequestCardProps {
  request: CertificationRequest
}

function RequestCard({ request }: RequestCardProps) {
  const { t } = useTranslation()
  const { bgColor, borderColor, textColor } = statusConfig[request.status]

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-[16px] border border-[#a3b8f5] bg-[rgba(243,246,253,0.5)] px-5 py-6">
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-[12px] bg-white shadow-[0_6px_20px_rgba(153,155,168,0.1)]">
          <StatusIcon status={request.status} />
        </div>
        <div
          className={cn(
            'flex h-10 items-center justify-center rounded-[8px] border px-[13px] py-[5px] text-[12px] font-medium leading-[1.6]',
            bgColor,
            borderColor,
            textColor
          )}
        >
          {t(`certificationRequests.status.${request.status}`)}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-[14px] leading-[1.6] text-[#666]">
          {t('certificationRequests.card.orderNumber')}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-[20px] font-medium leading-[1.6] text-[#1a1a1a]">
          {request.orderNumber}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#d1dbfa] pt-[17px] pb-2">
        <div className="flex flex-col items-center">
          <p className="text-[14px] leading-[1.6] text-[#666]">
            {t('certificationRequests.card.authorizedPerson')}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[20px] font-medium leading-[1.6] tracking-[-0.6px] text-[#1a1a1a]">
            {t('certificationRequests.card.authorizedPersonName')}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center rounded-[8px] bg-[#1236a3] text-[16px] leading-[1.6] text-white transition-colors hover:bg-[#0f2d8a]"
      >
        {t('certificationRequests.card.followUp')}
      </button>
      <button
        type="button"
        className="flex h-12 w-full items-center justify-center rounded-[8px] bg-[#e8edfc] text-[16px] leading-[1.6] text-[#1236a3] transition-colors hover:bg-[#d1dbfa]"
      >
        {t('certificationRequests.card.orderStatus')}
      </button>
    </div>
  )
}

export function CertificationRequestsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <AppLayout>
      <AccreditationHeader titleKey="certificationRequests.title" />
      <div className="flex flex-1 flex-col overflow-auto">

        {/* Action buttons */}
        <div className="flex items-center gap-5 px-5 py-5">
          <button
            type="button"
            onClick={() => navigate('/certification-request')}
            className="flex h-12 items-center gap-3 rounded-[8px] bg-[#1236a3] pl-4 pr-6 text-[16px] leading-[1.6] text-white transition-colors hover:bg-[#0f2d8a]"
          >
            <AddCircle size={24} color="white" variant="Linear" />
            {t('certificationRequests.newRequest')}
          </button>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-[8px] border border-[#1236a3] bg-white px-6 text-[16px] leading-[1.6] text-[#1236a3] transition-colors hover:bg-[#f3f6fd]"
          >
            {t('certificationRequests.interactiveInvoice')}
          </button>
        </div>

        {/* Cards grid */}
        <div className="px-5 pb-8">
          <div className="grid grid-cols-4 gap-5 xl:grid-cols-3 lg:grid-cols-2">
            {mockRequestStatuses.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

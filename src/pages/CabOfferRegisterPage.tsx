import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useOffersTourSteps } from '@/config/offersTourSteps'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddCircleIcon, AppIcon, EyeIcon, FilterFunnelIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import { ROUTES } from '@/lib/routes'
import {
  getOffers,
  updateOfferStatus,
  type OfferItem,
  type OfferFilterParams,
} from '@/lib/api/cabOffersApi'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

export function CabOfferRegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useOffersTourSteps()

  const [offers, setOffers] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [country, setCountry] = useState('all')
  const [status, setStatus] = useState('all')

  // Pagination state
  const [page, setPage] = useState(1)

  const loadOffers = async (overrideFilters?: OfferFilterParams) => {
    setLoading(true)
    const filters: OfferFilterParams = overrideFilters || {
      searchQuery,
      country: country === 'all' ? undefined : country,
      status: status === 'all' ? undefined : status,
    }
    const data = await getOffers(filters)
    setOffers(data)
    setLoading(false)
  }

  useEffect(() => {
    loadOffers()
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPage(1)
    loadOffers()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedIds(offers.map((o) => o.id))
    } else {
      setCheckedIds([])
    }
  }

  const handleToggleCheck = (id: string, checked: boolean) => {
    if (checked) {
      setCheckedIds([...checkedIds, id])
    } else {
      setCheckedIds(checkedIds.filter((item) => item !== id))
    }
  }

  const handleStatusChange = async (id: string, newStatus: any) => {
    await updateOfferStatus(id, newStatus)
    setActiveMenuId(null)
    loadOffers()
  }

  const getStatusBadge = (offerStatus: string, label: string) => {
    const s = offerStatus.toLowerCase()
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors',
          s === 'issued' && 'bg-[#e8edfc] text-primary',
          s === 'approved' && 'bg-[#dcfce7] text-[#15803d]',
          s === 'pending_approval' && 'bg-[#fef9c3] text-[#a16207]',
          s === 'void' && 'bg-[#fee2e2] text-[#dc2626]',
          s === 'draft' && 'bg-[#f1f5f9] text-[#475569]'
        )}
      >
        {t(`cab.offersPage.status.${s}`, label || offerStatus)}
      </span>
    )
  }

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE))
  const paginated = offers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <CabLayout
      sidebarVariant="offers"
      tourId="cab-offers-register"
      tourSteps={tourSteps}
    >
      <CabTourStep steps={tourSteps} stepId="offers-header">
        <div>
          <CabHeader title={t('cab.offersPage.title', 'Offer Register')} notificationCount={3} />
        </div>
      </CabTourStep>

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        {/* Main Card Container */}
        <div className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          {/* Top Bar: Search, Filters & Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <CabTourStep steps={tourSteps} stepId="offers-search-filters">
              <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
                {/* Search Input */}
                <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={t('cab.offersPage.searchPlaceholder', 'Search offer or client...')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="h-11 flex-1 shrink-0 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white hover:opacity-90 sm:flex-none"
                  >
                    {t('cab.offersPage.search', 'Search')}
                  </button>
                  <TableFilterSelect
                    label={t('cab.offersPage.filters.country', 'Country')}
                    value={country}
                    onChange={(val) => {
                      setPage(1)
                      setCountry(val)
                    }}
                    options={[
                      { value: 'all', label: t('cab.offersPage.filters.allCountries', 'All countries') },
                      { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                      { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                      { value: 'Egypt', label: 'Egypt' },
                    ]}
                  />
                  <TableFilterSelect
                    label={t('cab.offersPage.filters.status', 'Status')}
                    value={status}
                    onChange={(val) => {
                      setPage(1)
                      setStatus(val)
                    }}
                    options={[
                      { value: 'all', label: t('cab.offersPage.filters.allStatuses', 'All statuses') },
                      { value: 'issued', label: t('cab.offersPage.status.issued', 'Issued') },
                      { value: 'pending_approval', label: t('cab.offersPage.status.pending_approval', 'Pending approval') },
                      { value: 'approved', label: t('cab.offersPage.status.approved', 'Approved') },
                      { value: 'draft', label: t('cab.offersPage.status.draft', 'Draft') },
                      { value: 'void', label: t('cab.offersPage.status.void', 'Void') },
                    ]}
                  />
                  <button
                    type="button"
                    aria-label={t('common.filter', 'Filter')}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f6fd] text-primary hover:bg-[#e8edfc]"
                    onClick={handleSearch}
                  >
                    <AppIcon icon={FilterFunnelIcon} size={20} />
                  </button>
                </div>
              </div>
            </CabTourStep>

            {/* Action Buttons */}
            <CabTourStep steps={tourSteps} stepId="offers-new-btn">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => alert('Exporting offers list...')}
                  className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  <span>{t('cab.offersPage.export', 'Export')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.cabOfferNew)}
                  className="flex h-11 items-center gap-2 rounded-[8px] bg-primary px-5 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <AppIcon icon={AddCircleIcon} size={18} />
                  <span>{t('cab.offersPage.newOffer', 'New offer')}</span>
                </button>
              </div>
            </CabTourStep>
          </div>

          {/* Desktop Table View */}
          <CabTourStep steps={tourSteps} stepId="offers-table">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-center">
                <thead className="border-b border-[#ececec]">
                  <tr className="rounded-[10px] bg-[#1236a3] text-white">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={offers.length > 0 && checkedIds.length === offers.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="size-4 rounded border-white/30 bg-white/10 text-primary focus:ring-0"
                      />
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.offer', 'Offer')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.client', 'Client')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.amount', 'Amount')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.currency', 'Currency')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.validUntil', 'Valid until')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.status', 'Status')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.offersPage.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                        —
                      </td>
                    </tr>
                  ) : (
                    paginated.map((offer, index) => {
                      const isChecked = checkedIds.includes(offer.id)
                      const totalAmount = offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)

                      return (
                        <tr
                          key={offer.id}
                          className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}
                        >
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleCheck(offer.id, e.target.checked)}
                              className="size-4 rounded border-[#d8dce5] text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[15px] font-semibold text-primary hover:underline">
                              {offer.offerNumber}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[15px] font-medium text-neutral-900">{offer.clientName}</p>
                            <p className="text-[13px] text-neutral-500">{offer.clientCode} · {offer.country}</p>
                          </td>
                          <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
                            {totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">{offer.currency}</td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700">{offer.validUntil}</td>
                          <td className="px-4 py-4">
                            {index === 0 ? (
                              <CabTourStep steps={tourSteps} stepId="offers-status-actions">
                                {getStatusBadge(offer.status, offer.statusLabel)}
                              </CabTourStep>
                            ) : (
                              getStatusBadge(offer.status, offer.statusLabel)
                            )}
                          </td>
                          <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === offer.id ? null : offer.id)}
                              className="inline-flex size-8 items-center justify-center rounded-[6px] text-primary hover:bg-[#e8edfc] transition-colors"
                              aria-label={t('common.actions', 'Actions')}
                            >
                              <AppIcon icon={EyeIcon} size={20} />
                            </button>

                            {/* Popover Menu */}
                            {activeMenuId === offer.id && (
                              <div className="absolute end-6 top-10 w-52 rounded-[12px] border border-[#ececec] bg-white p-1.5 shadow-lg z-30 text-start text-[13px] font-medium text-neutral-700">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    navigate(ROUTES.cabOfferNew)
                                  }}
                                  className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                                >
                                  <span>{t('common.view', 'View offer')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    navigate(ROUTES.cabOfferNew)
                                  }}
                                  className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                                >
                                  <span>{t('cab.offersPage.actions.revise', 'Revise (new version)')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    alert(`Downloading PDF for ${offer.offerNumber}...`)
                                  }}
                                  className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                                >
                                  <span>{t('cab.offersPage.actions.downloadPdf', 'Download PDF')}</span>
                                </button>
                                <div className="my-1 border-t border-[#ececec]" />
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(offer.id, 'void')}
                                  className="w-full px-3 py-2 rounded-[8px] hover:bg-red-50 flex items-center gap-2 text-red-600"
                                >
                                  <span>{t('cab.offersPage.actions.voidOffer', 'Void offer')}</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CabTourStep>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {!loading && paginated.map((offer) => (
              <div
                key={offer.id}
                className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[15px] font-bold text-primary">{offer.offerNumber}</span>
                  {getStatusBadge(offer.status, offer.statusLabel)}
                </div>
                <p className="text-[15px] font-semibold text-neutral-900">{offer.clientName}</p>
                <p className="text-[13px] text-neutral-500">{offer.clientCode} · {offer.country}</p>
                <div className="mt-2 flex items-center justify-between text-[13px] border-t border-[#ececec] pt-2">
                  <span className="text-neutral-500">Valid: {offer.validUntil}</span>
                  <span className="font-bold text-neutral-900">
                    {(offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)).toLocaleString()} {offer.currency}
                  </span>
                </div>
              </div>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
            {!loading && !offers.length && <p className="py-6 text-center text-neutral-500">—</p>}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      </div>
    </CabLayout>
  )
}

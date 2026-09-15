import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddCircleIcon, AppIcon, EyeIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import { ROUTES } from '@/lib/routes'
import {
  getOffers,
  updateOfferStatus,
  type OfferItem,
  type OfferFilterParams,
} from '@/lib/api/cabOffersApi'

export function CabOfferRegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOfferId, setSelectedOfferId] = useState<string>('of-0024')
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('Al Noor Food Industries')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [country, setCountry] = useState('Saudi Arabia')
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
    if (data.length > 0) {
      if (!data.some((o) => o.id === selectedOfferId)) {
        setSelectedOfferId(data[0].id)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOffers()
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    loadOffers()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
    setCountry('all')
    setStatus('all')
    loadOffers({ searchQuery: '', country: 'all', status: 'all' })
  }

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0]

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
    switch (offerStatus) {
      case 'issued':
        return (
          <span className="inline-flex rounded-full bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary">
            {t(`cab.offersPage.status.issued`, label || 'Issued')}
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex rounded-full bg-[#ecfdf5] px-3 py-1 text-[12px] font-medium text-[#16a34a]">
            {t(`cab.offersPage.status.approved`, label || 'Approved')}
          </span>
        )
      case 'pending_approval':
        return (
          <span className="inline-flex rounded-full bg-[#fff7ed] px-3 py-1 text-[12px] font-medium text-[#ea580c]">
            {t(`cab.offersPage.status.pending_approval`, label || 'Pending approval')}
          </span>
        )
      case 'void':
        return (
          <span className="inline-flex rounded-full bg-[#fef2f2] px-3 py-1 text-[12px] font-medium text-[#dc2626]">
            {t(`cab.offersPage.status.void`, label || 'Void')}
          </span>
        )
      default:
        return (
          <span className="inline-flex rounded-full bg-[#f3f4f6] px-3 py-1 text-[12px] font-medium text-neutral-700">
            {t(`cab.offersPage.status.draft`, label || 'Draft')}
          </span>
        )
    }
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.offersPage.title', 'Offer Register')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Filter Card */}
        <div className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-none">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Search offer or client */}
            <div className="lg:col-span-4 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.offersPage.filters.searchLabel', 'Search offer or client')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('cab.offersPage.searchPlaceholder', 'Search offer or client...')}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 ps-10 pe-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </div>
              </div>
            </div>

            {/* Issue period */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.offersPage.filters.issuePeriod', 'Issue period')}
              </label>
              <div className="flex items-center gap-1.5 rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-800 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <input
                  type="text"
                  placeholder={t('cab.offersPage.filters.startDate', 'Start date')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-[13px] text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                />
                <span className="text-neutral-400 text-[12px]">—</span>
                <input
                  type="text"
                  placeholder={t('cab.offersPage.filters.endDate', 'End date')}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-[13px] text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Country */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.offersPage.filters.country', 'Country')}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('cab.offersPage.filters.allCountries', 'All countries')}</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Egypt">Egypt</option>
              </select>
            </div>

            {/* Status */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.offersPage.filters.status', 'Status')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('cab.offersPage.filters.allStatuses', 'All statuses')}</option>
                <option value="issued">{t('cab.offersPage.status.issued', 'Issued')}</option>
                <option value="pending_approval">{t('cab.offersPage.status.pending_approval', 'Pending approval')}</option>
                <option value="approved">{t('cab.offersPage.status.approved', 'Approved')}</option>
                <option value="draft">{t('cab.offersPage.status.draft', 'Draft')}</option>
                <option value="void">{t('cab.offersPage.status.void', 'Void')}</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="lg:col-span-12 flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <AppIcon icon={SearchIcon} size={16} />
                <span>{t('cab.offersPage.search', 'Search')}</span>
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-[var(--radius-sm)] border border-[#d8dce5] px-4 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                {t('cab.offersPage.clearFilters', 'Clear filters')}
              </button>
            </div>
          </form>
        </div>

        {/* Section Card with Table */}
        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.offersPage.title', 'Offer Register')}</h2>
              <p className="text-[13px] text-neutral-500">{t('cab.offersPage.total', { count: offers.length })}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('Exporting offers list...')}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <AppIcon icon={DownloadTrayIcon} size={18} />
                <span>{t('cab.offersPage.export', 'Export')}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.cabOfferNew)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <AppIcon icon={AddCircleIcon} size={18} />
                <span>{t('cab.offersPage.newOffer', 'New offer')}</span>
              </button>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-center">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="w-10 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={offers.length > 0 && checkedIds.length === offers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="size-4 rounded border-white/30 bg-white/10 text-primary focus:ring-0"
                    />
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.offer', 'Offer')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.client', 'Client')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.amount', 'Amount')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.currency', 'Currency')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.validUntil', 'Valid until')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.status', 'Status')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.offersPage.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-neutral-500">
                      {t('common.loading', 'Loading...')}
                    </td>
                  </tr>
                ) : offers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-neutral-500">
                      {t('cab.offersPage.empty', 'No offers found matching your filters.')}
                    </td>
                  </tr>
                ) : (
                  offers.map((offer, index) => {
                    const isSelected = selectedOfferId === offer.id
                    const isChecked = checkedIds.includes(offer.id)
                    const totalAmount = offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)

                    return (
                      <tr
                        key={offer.id}
                        onClick={() => setSelectedOfferId(offer.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#e8edfc]/50' : index % 2 ? 'bg-[#f9fafc]' : ''
                        }`}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleCheck(offer.id, e.target.checked)}
                            className="size-4 rounded border-[#d8dce5] text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-4 font-semibold text-primary hover:underline">
                          {offer.offerNumber}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-neutral-900">{offer.clientName}</div>
                          <div className="text-[12px] text-neutral-500 font-mono">{offer.clientCode} · {offer.country}</div>
                        </td>
                        <td className="px-4 py-4 font-medium text-neutral-900">
                          {totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-neutral-700">{offer.currency}</td>
                        <td className="px-4 py-4 text-neutral-700 text-[13px]">{offer.validUntil}</td>
                        <td className="px-4 py-4">
                          {getStatusBadge(offer.status, offer.statusLabel)}
                        </td>
                        <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === offer.id ? null : offer.id)}
                            className="p-1.5 rounded-lg text-primary hover:bg-[#e8edfc] transition-colors"
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
                                <span>Revise (new version)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null)
                                  alert(`Downloading PDF for ${offer.offerNumber}...`)
                                }}
                                className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                              >
                                <span>Download PDF</span>
                              </button>
                              <div className="my-1 border-t border-[#ececec]" />
                              <button
                                type="button"
                                onClick={() => handleStatusChange(offer.id, 'void')}
                                className="w-full px-3 py-2 rounded-[8px] hover:bg-red-50 flex items-center gap-2 text-red-600"
                              >
                                <span>Void offer</span>
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

          {/* Mobile Card List */}
          <div className="space-y-3 px-5 md:hidden">
            {!loading && offers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => setSelectedOfferId(offer.id)}
                className={`w-full rounded-[12px] border p-4 text-start transition-colors cursor-pointer ${
                  selectedOfferId === offer.id ? 'border-primary bg-[#e8edfc]/40' : 'border-[#ececec] bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-primary">{offer.offerNumber}</span>
                  {getStatusBadge(offer.status, offer.statusLabel)}
                </div>
                <p className="font-semibold text-neutral-900">{offer.clientName}</p>
                <p className="text-[12px] text-neutral-500 font-mono">{offer.clientCode} · {offer.country}</p>
                <div className="mt-2 flex items-center justify-between text-[13px] border-t border-[#ececec] pt-2">
                  <span className="text-neutral-500">Valid: {offer.validUntil}</span>
                  <span className="font-bold text-neutral-900">
                    {(offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)).toLocaleString()} {offer.currency}
                  </span>
                </div>
              </div>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
            {!loading && !offers.length && <p className="py-6 text-center text-neutral-500">{t('cab.offersPage.empty')}</p>}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={1}
            onPageChange={(nextPage) => setPage(nextPage)}
            className="mt-5 px-5"
          />
        </section>

        {/* Selected Offer Detail Card */}
        {selectedOffer && (
          <div className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-center">
              {/* Offer Badge + Number */}
              <div className="flex items-center gap-3 md:border-e border-[#ececec] pe-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                  <AppIcon icon={EyeIcon} size={20} />
                </div>
                <div>
                  <div className="text-[12px] text-neutral-500 font-medium">{t('cab.offersPage.selectedOffer.title', 'Selected offer')}</div>
                  <div className="text-[16px] font-bold text-neutral-900">{selectedOffer.offerNumber}</div>
                  <div className="mt-1">
                    {getStatusBadge(selectedOffer.status, selectedOffer.statusLabel)}
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="space-y-0.5 md:border-e border-[#ececec] pe-4">
                <div className="text-[12px] text-neutral-500 font-medium">{t('cab.offersPage.selectedOffer.client', 'Client')}</div>
                <div className="text-[13px] font-bold text-primary">{selectedOffer.clientName}</div>
                <div className="text-[12px] text-neutral-500 font-mono">{selectedOffer.clientCode} · {selectedOffer.country}</div>
              </div>

              {/* Related Application */}
              <div className="space-y-0.5 md:border-e border-[#ececec] pe-4">
                <div className="text-[12px] text-neutral-500 font-medium">{t('cab.offersPage.selectedOffer.relatedApplication', 'Related application')}</div>
                <div className="text-[13px] font-bold text-primary hover:underline cursor-pointer">
                  {selectedOffer.relatedApplication}
                </div>
              </div>

              {/* Primary contact */}
              <div className="space-y-0.5 md:border-e border-[#ececec] pe-4">
                <div className="text-[12px] text-neutral-500 font-medium">{t('cab.offersPage.selectedOffer.primaryContact', 'Primary contact')}</div>
                <div className="text-[13px] font-semibold text-neutral-800">{selectedOffer.primaryContact}</div>
                <div className="text-[12px] text-primary hover:underline cursor-pointer">
                  {selectedOffer.contactEmail}
                </div>
              </div>

              {/* Valid until */}
              <div className="space-y-0.5 md:border-e border-[#ececec] pe-4">
                <div className="text-[12px] text-neutral-500 font-medium">{t('cab.offersPage.selectedOffer.validUntil', 'Valid until')}</div>
                <div className="text-[13px] font-semibold text-neutral-800">{selectedOffer.validUntil}</div>
              </div>

              {/* Amount */}
              <div className="space-y-0.5">
                <div className="text-[12px] text-neutral-500 font-medium">{t('cab.offersPage.selectedOffer.amount', 'Amount')}</div>
                <div className="text-[15px] font-bold text-neutral-900">
                  {(
                    selectedOffer.fees.reduce((acc, f) => acc + f.amount, 0) -
                    (selectedOffer.optionalDiscount || 0)
                  ).toLocaleString()}{' '}
                  {selectedOffer.currency}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </CabLayout>
  )
}

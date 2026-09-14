import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  getReviewQueueItems,
  type ReviewQueueItem,
} from '@/lib/api/cabApplicationQueueApi'
import { cn } from '@/lib/utils'

export function CabApplicationReviewQueuePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [items, setItems] = useState<ReviewQueueItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('APP-0024')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getReviewQueueItems({
        searchQuery,
        startDate,
        endDate,
        country: selectedCountry,
        status: selectedStatus,
        sortBy,
      })
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    fetchData()
  }

  const handleClearAll = () => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
    setSelectedCountry('all')
    setSelectedStatus('all')
    getReviewQueueItems({}).then(setItems)
  }

  const statusStyles: Record<ReviewQueueItem['status'], { bg: string; text: string }> = {
    ready_for_review: { bg: 'bg-[#e0f2fe]', text: 'text-[#0284c7]' },
    in_progress: { bg: 'bg-[#e8edfc]', text: 'text-[#1236a3]' },
    clarification_requested: { bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]' },
    approved: { bg: 'bg-[#ecfdf5]', text: 'text-[#16a34a]' },
    rejected: { bg: 'bg-[#fef2f2]', text: 'text-[#dc2626]' },
  }

  return (
    <CabLayout sidebarVariant="applicationReview">
      <CabHeader
        title={t('cab.applications.reviewQueue.headerTitle', 'Review queue')}
        subtitle={t('cab.applications.reviewQueue.headerSubtitle', 'Application Review')}
        notificationCount={2}
      />

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:p-8">
        {/* Top Header with Breadcrumbs & Action Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
              <span
                onClick={() => navigate('/cab/workspace')}
                className="cursor-pointer hover:text-[#1236a3] hover:underline"
              >
                {t('cab.sidebar.workspace', 'Workspace')}
              </span>
              <span>/</span>
              <span className="text-neutral-600">{t('cab.sidebar.applicationReview', 'Application Review')}</span>
            </div>
            <h1 className="mt-1 text-[24px] font-bold text-neutral-900">
              {t('cab.applications.reviewQueue.title', 'Review queue')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/cab/clients/new')}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#1236a3] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#0f2d88]"
            >
              <span>+ {t('cab.applications.reviewQueue.newApplication', 'New application')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-neutral-700">
                  {t('cab.applications.reviewQueue.filters.searchLabel', 'Search application or client')}
                </label>
                <div className="relative">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="APP-0024"
                    className="w-full rounded-[10px] border border-[#e2e8f0] bg-white py-2 pe-8 ps-9 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Received period */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-neutral-700">
                  {t('cab.applications.reviewQueue.filters.receivedPeriod', 'Received period')}
                </label>
                <div className="flex items-center gap-1.5 rounded-[10px] border border-[#e2e8f0] bg-white px-2.5 py-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                    className="w-full border-none bg-transparent p-0 text-[12px] text-neutral-700 focus:outline-none"
                  />
                  <span className="text-neutral-400">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                    className="w-full border-none bg-transparent p-0 text-[12px] text-neutral-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-neutral-700">
                  {t('cab.applications.reviewQueue.filters.country', 'Country')}
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] text-neutral-800 focus:border-[#1236a3] focus:outline-none"
                >
                  <option value="all">{t('cab.applications.reviewQueue.filters.allCountries', 'All countries')}</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Egypt">Egypt</option>
                  <option value="India">India</option>
                </select>
              </div>

              {/* Review status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-neutral-700">
                  {t('cab.applications.reviewQueue.filters.reviewStatus', 'Review status')}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] text-neutral-800 focus:border-[#1236a3] focus:outline-none"
                >
                  <option value="all">{t('cab.applications.reviewQueue.filters.allStatuses', 'All statuses')}</option>
                  <option value="ready_for_review">Ready for review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="clarification_requested">Clarification requested</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <button
                type="button"
                className="flex items-center gap-1 text-[13px] font-medium text-[#1236a3] hover:underline"
              >
                <span>{t('cab.applications.reviewQueue.filters.moreFilters', 'More filters')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900"
                >
                  {t('cab.applications.reviewQueue.filters.clearAll', 'Clear all')}
                </button>
                <button
                  type="submit"
                  className="rounded-[10px] bg-[#1236a3] px-6 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#0f2d88]"
                >
                  {t('common.search', 'Search')}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-bold text-neutral-900">
            {items.length} {items.length === 1 ? t('cab.applications.reviewQueue.singleResult', 'result') : t('cab.applications.reviewQueue.multipleResults', 'results')}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-neutral-500">{t('common.sortBy', 'Sort by')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-800 focus:outline-none"
            >
              <option value="newest">{t('cab.applications.reviewQueue.sort.newest', 'Received date (newest first)')}</option>
              <option value="oldest">{t('cab.applications.reviewQueue.sort.oldest', 'Received date (oldest first)')}</option>
              <option value="dueSoonest">{t('cab.applications.reviewQueue.sort.dueSoonest', 'Due date (soonest first)')}</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-[16px] border border-[#ececec] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-start">
              <thead>
                <tr className="border-b border-[#ececec] bg-[#f9fafc] text-[12px] font-semibold text-neutral-600">
                  <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.application', 'Application')}</th>
                  <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.client', 'Client')}</th>
                  <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.standard', 'Standard')}</th>
                  <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.reviewer', 'Reviewer')}</th>
                  <th className="px-5 py-3.5 text-start">
                    <div className="flex items-center gap-1">
                      <span>{t('cab.applications.reviewQueue.columns.due', 'Due')}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.status', 'Status')}</th>
                  <th className="px-5 py-3.5 text-end">{t('cab.applications.reviewQueue.columns.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f8] text-[13px]">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-[#fafcff]">
                    {/* Application */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1236a3]">{item.applicationNumber}</p>
                      <p className="text-[11px] text-neutral-400">
                        {t('cab.applications.reviewQueue.received', 'Received')} {item.receivedDate}
                      </p>
                    </td>

                    {/* Client */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-neutral-900">{item.clientName}</p>
                      <p className="text-[11px] text-neutral-500">{item.clientCode}</p>
                      <p className="text-[11px] text-neutral-400">{item.country}</p>
                    </td>

                    {/* Standard */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-neutral-800">{item.standard}</p>
                      <p className="max-w-[220px] truncate text-[11px] text-neutral-500">
                        {item.standardDescription}
                      </p>
                    </td>

                    {/* Reviewer */}
                    <td className="px-5 py-4 font-medium text-neutral-800">
                      {item.reviewer}
                    </td>

                    {/* Due */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-800">{item.dueDate}</p>
                      <p className="text-[11px] text-neutral-400">
                        {item.dueDaysLeft} {t('cab.applications.reviewQueue.daysLeft', 'days left')}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold leading-tight',
                          statusStyles[item.status]?.bg || 'bg-neutral-100',
                          statusStyles[item.status]?.text || 'text-neutral-700'
                        )}
                      >
                        {item.statusLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/cab/applications/${item.applicationNumber}/review`)}
                          className="rounded-[8px] bg-[#1236a3] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0f2d88]"
                        >
                          {t('cab.applications.reviewQueue.actions.openReview', 'Open review')}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/cab/applications/${item.applicationNumber}/information-required`)}
                          className="rounded-[8px] border border-[#d6e2fb] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1236a3] transition-all hover:bg-[#f2f6fe]"
                        >
                          {t('cab.applications.reviewQueue.actions.requestClarification', 'Request clarification')}
                        </button>
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      {t('cab.applications.reviewQueue.noItemsFound', 'No review items match the current filters')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex flex-col gap-3 border-t border-[#ececec] bg-[#fcfdfe] px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-[12px] text-neutral-600">
            <div>
              {t('cab.applications.reviewQueue.showing', 'Showing')} 1 {t('common.to', 'to')} {items.length} {t('common.of', 'of')} {items.length} {t('cab.applications.reviewQueue.results', 'results')}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>{t('cab.applications.reviewQueue.rowsPerPage', 'Rows per page')}</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="rounded-[6px] border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] font-medium text-neutral-800 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="flex size-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-neutral-400 disabled:opacity-50"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md bg-[#1236a3] font-semibold text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="flex size-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-neutral-400 disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CabLayout>
  )
}

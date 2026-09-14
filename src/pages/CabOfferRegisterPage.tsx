import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { ROUTES } from '@/lib/routes'
import {
  getOffers,
  updateOfferStatus,
  type OfferItem,
  type OfferFilterParams,
} from '@/lib/api/cabOffersApi'

export function CabOfferRegisterPage() {
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
  const [perPage, setPerPage] = useState(10)

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

  const handleSearch = () => {
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
            {label || 'Issued'}
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            {label || 'Approved'}
          </span>
        )
      case 'pending_approval':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            {label || 'Pending approval'}
          </span>
        )
      case 'void':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            {label || 'Void'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {label || 'Draft'}
          </span>
        )
    }
  }

  return (
    <CabLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
              <span>Offers</span>
              <span className="text-gray-400">›</span>
              <span className="text-gray-800 font-semibold">Offer register</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Offer register</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create, view and manage offers issued to clients.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.cabOfferNew)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>New offer</span>
            </button>

            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-all"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search offer or client */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Search offer or client</label>
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search offer or client..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Issue period */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Issue period</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="text"
                  placeholder="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-20 bg-transparent text-xs text-gray-700 focus:outline-none"
                />
                <span className="text-gray-400 text-xs">—</span>
                <input
                  type="text"
                  placeholder="End date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-20 bg-transparent text-xs text-gray-700 focus:outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Country */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Country</label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All countries</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Egypt">Egypt</option>
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All statuses</option>
                  <option value="issued">Issued</option>
                  <option value="pending_approval">Pending approval</option>
                  <option value="approved">Approved</option>
                  <option value="draft">Draft</option>
                  <option value="void">Void</option>
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing 1–{offers.length} of {offers.length} result
            </span>
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-800 rounded px-2 py-0.5 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={offers.length > 0 && checkedIds.length === offers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Offer ⇅</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Client ⇅</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Amount ⇅</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Currency ⇅</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Valid until ⇅</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status ⇅</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Loading offers...
                    </td>
                  </tr>
                ) : offers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                      No offers found matching your filters.
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => {
                    const isSelected = selectedOfferId === offer.id
                    const isChecked = checkedIds.includes(offer.id)
                    const totalAmount = offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)

                    return (
                      <tr
                        key={offer.id}
                        onClick={() => setSelectedOfferId(offer.id)}
                        className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleCheck(offer.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-medium text-blue-600 hover:underline">
                          {offer.offerNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-blue-600">{offer.clientName}</div>
                          <div className="text-xs text-gray-500 font-mono">{offer.clientCode}</div>
                          <div className="text-xs text-gray-500">{offer.country}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-gray-900">
                          {totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{offer.currency}</td>
                        <td className="px-4 py-3.5 text-gray-700 text-xs">{offer.validUntil}</td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(offer.status, offer.statusLabel)}
                        </td>
                        <td className="px-4 py-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === offer.id ? null : offer.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {/* Ellipsis Menu Popover */}
                          {activeMenuId === offer.id && (
                            <div className="absolute right-6 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 text-left text-xs font-medium text-gray-700 animate-in fade-in-50 zoom-in-95">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  navigate(ROUTES.cabOfferNew)
                                }}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View offer</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  navigate(ROUTES.cabOfferNew)
                                }}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Revise (creates new version)</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  alert(`Downloading PDF for ${offer.offerNumber}...`)
                                }}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Download PDF</span>
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              <button
                                onClick={() => handleStatusChange(offer.id, 'void')}
                                className="w-full px-3.5 py-2 hover:bg-red-50 flex items-center gap-2.5 text-red-600"
                              >
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
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

          {/* Table Footer Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing 1–{offers.length} of {offers.length} result
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-300 cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded bg-blue-700 text-white font-semibold">
                1
              </button>
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-300 cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Offer Detail Card (Bottom Bar - Screenshot 1 Exact) */}
        {selectedOffer && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 relative overflow-hidden border-t-4 border-t-cyan-500">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* Offer Badge + Number */}
              <div className="flex items-center gap-3 md:border-r border-gray-100 pr-4">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-medium">Selected offer</div>
                  <div className="text-base font-bold text-gray-900">{selectedOffer.offerNumber}</div>
                  <div className="mt-0.5">
                    {getStatusBadge(selectedOffer.status, selectedOffer.statusLabel)}
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="space-y-0.5 md:border-r border-gray-100 pr-4">
                <div className="text-[11px] text-gray-500 font-medium">Client</div>
                <div className="text-xs font-bold text-blue-600">{selectedOffer.clientName}</div>
                <div className="text-[11px] text-gray-500 font-mono">{selectedOffer.clientCode}</div>
                <div className="text-[11px] text-gray-500">{selectedOffer.country}</div>
              </div>

              {/* Related Application */}
              <div className="space-y-0.5 md:border-r border-gray-100 pr-4">
                <div className="text-[11px] text-gray-500 font-medium">Related application</div>
                <div className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                  {selectedOffer.relatedApplication}
                </div>
              </div>

              {/* Primary contact */}
              <div className="space-y-0.5 md:border-r border-gray-100 pr-4">
                <div className="text-[11px] text-gray-500 font-medium">Primary contact</div>
                <div className="text-xs font-semibold text-gray-800">{selectedOffer.primaryContact}</div>
                <div className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  {selectedOffer.contactEmail}
                </div>
              </div>

              {/* Valid until */}
              <div className="space-y-0.5 md:border-r border-gray-100 pr-4">
                <div className="text-[11px] text-gray-500 font-medium">Valid until</div>
                <div className="text-xs font-semibold text-gray-800">{selectedOffer.validUntil}</div>
              </div>

              {/* Amount */}
              <div className="space-y-0.5">
                <div className="text-[11px] text-gray-500 font-medium">Amount</div>
                <div className="text-sm font-bold text-gray-900">
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
      </div>
    </CabLayout>
  )
}

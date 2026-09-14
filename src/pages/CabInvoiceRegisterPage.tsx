import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  getCabInvoices,
  recordPayment,
  type CabInvoiceItem,
  type CabInvoiceFilterParams,
} from '@/lib/api/cabInvoiceRegisterApi'

export function CabInvoiceRegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<CabInvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [issuePeriod, setIssuePeriod] = useState('01 Jan 2024 – 31 Dec 2024')
  const [country, setCountry] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<CabInvoiceItem | null>(null)

  // Record payment form state
  const [paymentAmount, setPaymentAmount] = useState('500.00')
  const [paymentDate, setPaymentDate] = useState('2024-03-20')
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer')
  const [paymentReference, setPaymentReference] = useState('TRX-12345')

  // Pagination state
  const [perPage, setPerPage] = useState(10)

  const loadInvoices = async (overrideFilters?: CabInvoiceFilterParams) => {
    setLoading(true)
    const filters: CabInvoiceFilterParams = overrideFilters || {
      searchQuery,
      country: country === 'all' ? undefined : country,
      paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
    }
    const data = await getCabInvoices(filters)
    setInvoices(data)
    setLoading(false)
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleSearch = () => {
    loadInvoices()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setCountry('all')
    setPaymentStatus('all')
    loadInvoices({ searchQuery: '', country: 'all', paymentStatus: 'all' })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedIds(invoices.map((inv) => inv.id))
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

  const handleOpenPayment = (inv: CabInvoiceItem) => {
    setSelectedInvoice(inv)
    setPaymentAmount(inv.balance > 0 ? (inv.balance >= 500 ? '500.00' : inv.balance.toFixed(2)) : '0.00')
    setActiveMenuId(null)
    setShowPaymentModal(true)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return
    const amt = parseFloat(paymentAmount) || 0
    if (amt <= 0) return

    await recordPayment(selectedInvoice.id, {
      amount: amt,
      date: paymentDate,
      method: paymentMethod,
      reference: paymentReference,
    })

    setShowPaymentModal(false)
    loadInvoices()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            {t('invoices.register.paid')}
          </span>
        )
      case 'Partially paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            {t('invoices.register.partiallyPaid')}
          </span>
        )
      case 'Unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            {t('invoices.register.unpaid')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {t('invoices.register.draft')}
          </span>
        )
    }
  }

  return (
    <CabLayout>
      <CabHeader
        title={t('invoices.register.title')}
        subtitle={t('invoices.register.subtitle')}
      />
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                {t('invoices.register.breadcrumb')}
              </span>
              <span className="text-gray-400">‹</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('invoices.register.title')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('invoices.register.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('invoices.register.createInvoice')}</span>
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search invoice or client */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                {t('invoices.register.searchLabel')}
              </label>
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('invoices.register.searchPlaceholder')}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Issue period */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                {t('invoices.register.issuePeriodLabel')}
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="text"
                  value={issuePeriod}
                  onChange={(e) => setIssuePeriod(e.target.value)}
                  className="bg-transparent text-xs text-gray-800 w-full focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Country */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                {t('invoices.register.countryLabel')}
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="all">{t('invoices.register.allCountries')}</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Egypt">Egypt</option>
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Payment status */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                {t('invoices.register.paymentStatusLabel')}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full appearance-none px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">{t('invoices.register.allStatuses')}</option>
                    <option value="Unpaid">{t('invoices.register.unpaid')}</option>
                    <option value="Paid">{t('invoices.register.paid')}</option>
                    <option value="Partially paid">{t('invoices.register.partiallyPaid')}</option>
                    <option value="Draft">{t('invoices.register.draft')}</option>
                  </select>
                  <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {t('invoices.register.search')}
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('invoices.register.clear')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Heading & Export Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            {t('invoices.register.invoicesCount', { count: invoices.length })}
          </h2>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{t('invoices.register.export')}</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 text-xs font-medium text-gray-700 animate-in fade-in-50 zoom-in-95">
                <button
                  onClick={() => { setShowExportMenu(false); alert('Exporting invoices to Excel (.xlsx)...') }}
                  className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-emerald-700"
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t('invoices.register.exportExcel')}</span>
                </button>
                <button
                  onClick={() => { setShowExportMenu(false); alert('Exporting invoices to PDF (.pdf)...') }}
                  className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>{t('invoices.register.exportPdf')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invoices Table Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={invoices.length > 0 && checkedIds.length === invoices.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700">{t('invoices.register.colInvoice')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700">{t('invoices.register.colClient')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700">{t('invoices.register.colIssued')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700">{t('invoices.register.colDue')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700 text-right">{t('invoices.register.colAmount')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700 text-right">{t('invoices.register.colPaid')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700 text-right">{t('invoices.register.colBalance')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700 text-center">{t('invoices.register.colStatus')} ⇅</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-700 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500 text-sm">
                      {t('invoices.register.loading')}
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isChecked = checkedIds.includes(inv.id)
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                        onClick={() => navigate(`/cab/invoices/${inv.id}`)}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleCheck(inv.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-blue-600 hover:underline">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-blue-600">{inv.clientCode}</div>
                          <div className="text-xs text-gray-700">{inv.clientName}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{inv.issuedDate}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{inv.dueDate}</td>
                        <td className="px-4 py-3.5 text-right font-medium text-gray-900 text-xs">
                          {inv.currency}{' '}
                          {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-gray-700 text-xs">
                          {inv.currency}{' '}
                          {inv.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900 text-xs">
                          {inv.currency}{' '}
                          {inv.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-4 py-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>

                          {/* Row Actions Menu */}
                          {activeMenuId === inv.id && (
                            <div className="absolute right-6 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 text-left text-xs font-medium text-gray-700 animate-in fade-in-50 zoom-in-95">
                              <button
                                onClick={() => { setActiveMenuId(null); navigate(`/cab/invoices/${inv.id}`) }}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{t('invoices.register.viewInvoice')}</span>
                              </button>
                              <button
                                onClick={() => handleOpenPayment(inv)}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span>{t('invoices.register.recordPayment')}</span>
                              </button>
                              <button
                                onClick={() => { setActiveMenuId(null); setSelectedInvoice(inv); setShowCreditNoteModal(true) }}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{t('invoices.register.createCreditNote')}</span>
                              </button>
                              <button
                                onClick={() => { setActiveMenuId(null); alert(`Downloading PDF for ${inv.invoiceNumber}...`) }}
                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>{t('invoices.register.downloadPdf')}</span>
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              <button disabled className="w-full px-3.5 py-1.5 text-left text-gray-400 cursor-not-allowed text-[11px]">
                                {t('invoices.register.editDraftOnly')}
                              </button>
                              <button disabled className="w-full px-3.5 py-1.5 text-left text-gray-400 cursor-not-allowed text-[11px]">
                                {t('invoices.register.deleteNotAvailable')}
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
              {t('invoices.register.showing', { shown: invoices.length, total: invoices.length })}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-200 text-gray-800 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={10}>{t('invoices.register.perPage', { count: 10 })}</option>
                  <option value={25}>{t('invoices.register.perPage', { count: 25 })}</option>
                  <option value={50}>{t('invoices.register.perPage', { count: 50 })}</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button disabled className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-300 cursor-not-allowed">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded bg-blue-700 text-white font-semibold">1</button>
                <button disabled className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-300 cursor-not-allowed">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Record Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  {t('invoices.register.recordPaymentTitle', { invoiceNumber: selectedInvoice.invoiceNumber })}
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">
                    {t('invoices.register.amountLabel', { currency: selectedInvoice.currency })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">
                    {t('invoices.register.paymentDateLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date" required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">
                    {t('invoices.register.paymentMethodLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Bank transfer">{t('invoices.register.bankTransfer')}</option>
                      <option value="Credit Card">{t('invoices.register.creditCard')}</option>
                      <option value="Cheque">{t('invoices.register.cheque')}</option>
                      <option value="Cash">{t('invoices.register.cash')}</option>
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">{t('invoices.register.referenceLabel')}</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={t('invoices.register.referencePlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg flex items-start gap-2 text-[11px] text-sky-900 leading-relaxed">
                  <svg className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('invoices.register.paymentInfoNote')}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowPaymentModal(false)}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg">
                    {t('invoices.register.cancel')}
                  </button>
                  <button type="submit"
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm">
                    {t('invoices.register.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">{t('invoices.register.createInvoiceTitle')}</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('invoices.register.createInvoiceDesc')}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">
                  {t('invoices.register.cancel')}
                </button>
                <button type="button"
                  onClick={() => { setShowCreateModal(false); navigate('/cab/invoices/inv-0024') }}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm">
                  {t('invoices.register.saveAsDraft')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Note Modal */}
        {showCreditNoteModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">{t('invoices.register.creditNoteTitle')}</h3>
                <button onClick={() => setShowCreditNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('invoices.register.creditNoteDesc', { invoiceNumber: selectedInvoice.invoiceNumber })}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreditNoteModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">
                  {t('invoices.register.cancel')}
                </button>
                <button type="button"
                  onClick={() => { setShowCreditNoteModal(false); alert(`Credit note created for ${selectedInvoice.invoiceNumber}`) }}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm">
                  {t('invoices.register.creditNoteTitle')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}

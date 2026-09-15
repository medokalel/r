import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddCircleIcon, AppIcon, EyeIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import {
  createCreditNote,
  getCabInvoices,
  recordPayment,
  type CabInvoiceItem,
  type CabInvoiceFilterParams,
} from '@/lib/api/cabInvoiceRegisterApi'
import { downloadExcelCsv, downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'

export function CabInvoiceRegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<CabInvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listNotice, setListNotice] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
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
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Credit note form state
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [creditError, setCreditError] = useState<string | null>(null)
  const [savingCredit, setSavingCredit] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)

  const loadInvoices = async (overrideFilters?: CabInvoiceFilterParams) => {
    setLoading(true)
    setLoadError(null)
    try {
      const filters: CabInvoiceFilterParams = overrideFilters || {
        searchQuery,
        country: country === 'all' ? undefined : country,
        paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
      }
      const data = await getCabInvoices(filters)
      setInvoices(data)
    } catch {
      setLoadError(t('common.loadFailed', 'Failed to load. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
    setPaymentError(null)
    setPaymentAmount(inv.balance > 0 ? (inv.balance >= 500 ? '500.00' : inv.balance.toFixed(2)) : '0.00')
    setActiveMenuId(null)
    setShowPaymentModal(true)
  }

  const handleOpenCreditNote = (inv: CabInvoiceItem) => {
    setSelectedInvoice(inv)
    setCreditError(null)
    setCreditAmount(inv.balance > 0 ? (inv.balance >= 500 ? '500.00' : inv.balance.toFixed(2)) : '')
    setCreditReason('')
    setActiveMenuId(null)
    setShowCreditNoteModal(true)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return
    const amt = parseFloat(paymentAmount) || 0
    if (amt <= 0) {
      setPaymentError(t('invoices.register.amountPositiveError', 'Amount must be greater than zero.'))
      return
    }
    if (amt - selectedInvoice.balance > 0.009) {
      setPaymentError(
        t('invoices.register.amountExceedsError', 'Amount cannot exceed the balance.', {
          balance: selectedInvoice.balance.toFixed(2),
          currency: selectedInvoice.currency,
        })
      )
      return
    }

    setPaymentError(null)
    try {
      const updated = await recordPayment(selectedInvoice.id, {
        amount: amt,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference,
      })
      setShowPaymentModal(false)
      if (updated) {
        const remaining = Math.max(0, updated.balance)
        setListNotice(
          t('invoices.register.paymentAllocated', 'Recorded {{amount}}; remaining {{remaining}}.', {
            amount: amt.toFixed(2),
            currency: updated.currency,
            remaining: remaining.toFixed(2),
          })
        )
        setTimeout(() => setListNotice(null), 4000)
      }
      loadInvoices()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setPaymentError(
        code === 'INVOICE_SETTLED'
          ? t('invoices.register.settledError', 'This invoice is already settled.')
          : t('common.saveFailed', 'Save failed. Your values were preserved — please try again.')
      )
    }
  }

  const handleSaveCreditNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return
    const amt = parseFloat(creditAmount) || 0
    if (amt <= 0) {
      setCreditError(t('invoices.register.amountPositiveError', 'Amount must be greater than zero.'))
      return
    }
    if (!creditReason.trim()) {
      setCreditError(t('invoices.register.creditReasonRequired', 'A reason is required.'))
      return
    }
    setCreditError(null)
    setSavingCredit(true)
    try {
      const note = await createCreditNote(selectedInvoice.id, { amount: amt, reason: creditReason })
      setShowCreditNoteModal(false)
      setListNotice(
        t('invoices.register.creditCreated', 'Credit note {{creditNumber}} linked.', {
          creditNumber: note.creditNoteNumber,
          invoiceNumber: note.linkedInvoiceNumber,
        })
      )
      setTimeout(() => setListNotice(null), 4000)
      loadInvoices()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setCreditError(
        code === 'CREDIT_NOTE_REQUIRES_ISSUED'
          ? t('invoices.register.creditDraftError', 'Credit notes need an issued invoice.')
          : t('common.saveFailed', 'Save failed. Your values were preserved — please try again.')
      )
    } finally {
      setSavingCredit(false)
    }
  }

  const getExportColumns = (): TableColumn<CabInvoiceItem>[] => [
    { header: t('invoices.register.colInvoice'), value: (row) => row.invoiceNumber },
    { header: t('invoices.register.colClient'), value: (row) => `${row.clientCode} - ${row.clientName}` },
    { header: t('invoices.register.colIssued'), value: (row) => row.issuedDate },
    { header: t('invoices.register.colDue'), value: (row) => row.dueDate },
    { header: t('invoices.register.colAmount'), value: (row) => `${row.currency} ${row.amount.toFixed(2)}` },
    { header: t('invoices.register.colPaid'), value: (row) => `${row.currency} ${row.paidAmount.toFixed(2)}` },
    { header: t('invoices.register.colBalance'), value: (row) => `${row.currency} ${row.balance.toFixed(2)}` },
    { header: t('invoices.register.colStatus'), value: (row) => row.status },
  ]

  const getFilteredForExport = async (): Promise<CabInvoiceItem[]> => {
    const data = await getCabInvoices({
      searchQuery,
      country: country === 'all' ? undefined : country,
      paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
    })
    return data
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const rows = await getFilteredForExport()
      downloadExcelCsv('invoices-register', getExportColumns(), rows)
    } finally {
      setExporting(false)
      setShowExportMenu(false)
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const rows = await getFilteredForExport()
      downloadPdfFromTable('invoices-register.pdf', t('invoices.register.title'), getExportColumns(), rows)
    } finally {
      setExporting(false)
      setShowExportMenu(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex rounded-full bg-[#ecfdf5] px-3 py-1 text-[12px] font-medium text-[#16a34a]">
            {t('invoices.register.paid', 'Paid')}
          </span>
        )
      case 'Partially paid':
        return (
          <span className="inline-flex rounded-full bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary">
            {t('invoices.register.partiallyPaid', 'Partially paid')}
          </span>
        )
      case 'Unpaid':
        return (
          <span className="inline-flex rounded-full bg-[#fef2f2] px-3 py-1 text-[12px] font-medium text-[#dc2626]">
            {t('invoices.register.unpaid', 'Unpaid')}
          </span>
        )
      default:
        return (
          <span className="inline-flex rounded-full bg-[#f3f4f6] px-3 py-1 text-[12px] font-medium text-neutral-700">
            {t('invoices.register.draft', 'Draft')}
          </span>
        )
    }
  }

  return (
    <CabLayout sidebarVariant="invoices">
      <CabHeader
        title={t('invoices.register.title', 'Invoices Register')}
        subtitle={t('invoices.register.subtitle', 'Create, view and manage invoices issued to clients.')}
        notificationCount={3}
      />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {loadError && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-[12px] text-[13px] font-semibold text-red-700 flex items-center justify-between">
            <span>{loadError}</span>
            <button type="button" onClick={() => loadInvoices()} className="px-3 py-1 bg-white border border-red-200 rounded-[8px] hover:bg-red-100">
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}
        {listNotice && (
          <div role="status" className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[12px] text-[13px] font-semibold text-emerald-800">
            {listNotice}
          </div>
        )}

        {/* Filter Card */}
        <div className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-none">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Search invoice or client */}
            <div className="lg:col-span-4 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('invoices.register.searchLabel', 'Search invoice or client')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('invoices.register.searchPlaceholder', 'Search invoice or client...')}
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
                {t('invoices.register.issuePeriodLabel', 'Issue period')}
              </label>
              <div className="flex items-center gap-1.5 rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2.5 text-[14px] text-neutral-800 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <input
                  type="text"
                  value={issuePeriod}
                  onChange={(e) => setIssuePeriod(e.target.value)}
                  className="w-full bg-transparent text-[13px] text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Country */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('invoices.register.countryLabel', 'Country')}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('invoices.register.allCountries', 'All countries')}</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Egypt">Egypt</option>
              </select>
            </div>

            {/* Payment status */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('invoices.register.paymentStatusLabel', 'Payment status')}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('invoices.register.allStatuses', 'All statuses')}</option>
                <option value="Unpaid">{t('invoices.register.unpaid', 'Unpaid')}</option>
                <option value="Paid">{t('invoices.register.paid', 'Paid')}</option>
                <option value="Partially paid">{t('invoices.register.partiallyPaid', 'Partially paid')}</option>
                <option value="Draft">{t('invoices.register.draft', 'Draft')}</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="lg:col-span-12 flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <AppIcon icon={SearchIcon} size={16} />
                <span>{t('invoices.register.search', 'Search')}</span>
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-[var(--radius-sm)] border border-[#d8dce5] px-4 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                {t('invoices.register.clear', 'Clear filters')}
              </button>
            </div>
          </form>
        </div>

        {/* Section Card with Table */}
        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">
                {t('invoices.register.title', 'Invoices Register')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                {t('invoices.register.invoicesCount', { count: invoices.length })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Export Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  <span>{t('invoices.register.export', 'Export')}</span>
                </button>

                {showExportMenu && (
                  <div className="absolute end-0 mt-1.5 w-48 rounded-[12px] border border-[#ececec] bg-white p-1.5 shadow-lg z-30 text-start text-[13px] font-medium text-neutral-700 animate-in fade-in-50">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={exporting}
                      className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-emerald-700 disabled:opacity-50"
                    >
                      <span>{exporting ? t('common.loading') : t('invoices.register.exportExcel', 'Export to Excel')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={exporting}
                      className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-red-600 disabled:opacity-50"
                    >
                      <span>{t('invoices.register.exportPdf', 'Export to PDF')}</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <AppIcon icon={AddCircleIcon} size={18} />
                <span>{t('invoices.register.createInvoice', 'Create Invoice')}</span>
              </button>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[950px] border-collapse text-center">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="w-10 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={invoices.length > 0 && checkedIds.length === invoices.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="size-4 rounded border-white/30 bg-white/10 text-primary focus:ring-0"
                    />
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colInvoice', 'Invoice')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colClient', 'Client')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colIssued', 'Issued')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colDue', 'Due')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colAmount', 'Amount')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colPaid', 'Paid')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colBalance', 'Balance')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('invoices.register.colStatus', 'Status')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-neutral-500">
                      {t('common.loading', 'Loading...')}
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-neutral-500">
                      {t('invoices.register.noInvoices', 'No invoices found.')}
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, index) => {
                    const isChecked = checkedIds.includes(inv.id)
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/cab/invoices/${inv.id}`)}
                        className={`cursor-pointer transition-colors ${
                          index % 2 ? 'bg-[#f9fafc]' : ''
                        } hover:bg-[#e8edfc]/50`}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleCheck(inv.id, e.target.checked)}
                            className="size-4 rounded border-[#d8dce5] text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-4 font-semibold text-primary hover:underline">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-neutral-900">{inv.clientName}</div>
                          <div className="text-[12px] text-neutral-500 font-mono">{inv.clientCode}</div>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-neutral-700">{inv.issuedDate}</td>
                        <td className="px-4 py-4 text-[13px] text-neutral-700">{inv.dueDate}</td>
                        <td className="px-4 py-4 font-medium text-neutral-900 text-[13px]">
                          {inv.currency}{' '}
                          {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 font-medium text-neutral-700 text-[13px]">
                          {inv.currency}{' '}
                          {inv.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 font-semibold text-neutral-900 text-[13px]">
                          {inv.currency}{' '}
                          {inv.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)}
                            className="p-1.5 rounded-lg text-primary hover:bg-[#e8edfc] transition-colors"
                            aria-label={t('common.actions', 'Actions')}
                          >
                            <AppIcon icon={EyeIcon} size={20} />
                          </button>

                          {/* Row Actions Popover */}
                          {activeMenuId === inv.id && (
                            <div className="absolute end-6 top-10 w-52 rounded-[12px] border border-[#ececec] bg-white p-1.5 shadow-lg z-30 text-start text-[13px] font-medium text-neutral-700">
                              <button
                                type="button"
                                onClick={() => { setActiveMenuId(null); navigate(`/cab/invoices/${inv.id}`) }}
                                className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                              >
                                <span>{t('invoices.register.viewInvoice', 'View invoice')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(inv)}
                                className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                              >
                                <span>{t('invoices.register.recordPayment', 'Record payment')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenCreditNote(inv)}
                                className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                              >
                                <span>{t('invoices.register.createCreditNote', 'Create credit note')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setActiveMenuId(null); alert(`Downloading PDF for ${inv.invoiceNumber}...`) }}
                                className="w-full px-3 py-2 rounded-[8px] hover:bg-[#f8fafd] flex items-center gap-2 text-neutral-800"
                              >
                                <span>{t('invoices.register.downloadPdf', 'Download PDF')}</span>
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
            {!loading && invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/cab/invoices/${inv.id}`)}
                className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-primary">{inv.invoiceNumber}</span>
                  {getStatusBadge(inv.status)}
                </div>
                <p className="font-semibold text-neutral-900">{inv.clientName}</p>
                <p className="text-[12px] text-neutral-500 font-mono">{inv.clientCode}</p>
                <div className="flex items-center justify-between text-[13px] border-t border-[#ececec] pt-2">
                  <span className="text-neutral-500">Balance: {inv.currency} {inv.balance.toFixed(2)}</span>
                  <span className="font-bold text-neutral-900">{inv.currency} {inv.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
            {!loading && !invoices.length && <p className="py-6 text-center text-neutral-500">{t('invoices.register.noInvoices', 'No invoices found.')}</p>}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={1}
            onPageChange={(nextPage) => setPage(nextPage)}
            className="mt-5 px-5"
          />
        </section>

        {/* Record Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-[16px] shadow-xl border border-[#ececec] w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-neutral-900">
                  {t('invoices.register.recordPaymentTitle', { invoiceNumber: selectedInvoice.invoiceNumber })}
                </h3>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-neutral-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-[13px]">
                {paymentError && (
                  <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-[10px] font-semibold text-red-700">
                    {paymentError}
                  </div>
                )}
                <div className="p-3 bg-[#e8edfc] border border-[#c9d8ff] rounded-[10px] font-medium text-primary">
                  {t('invoices.register.allocationPreview', {
                    amount: (parseFloat(paymentAmount) || 0).toFixed(2),
                    currency: selectedInvoice.currency,
                    remaining: Math.max(0, selectedInvoice.balance - (parseFloat(paymentAmount) || 0)).toFixed(2),
                  })}
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700">
                    {t('invoices.register.amountLabel', { currency: selectedInvoice.currency })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#d8dce5] rounded-[10px] text-neutral-900 font-semibold focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700">
                    {t('invoices.register.paymentDateLabel', 'Payment Date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date" required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#d8dce5] rounded-[10px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700">
                    {t('invoices.register.paymentMethodLabel', 'Payment Method')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#d8dce5] rounded-[10px] text-neutral-900 focus:border-primary focus:outline-none"
                  >
                    <option value="Bank transfer">{t('invoices.register.bankTransfer', 'Bank transfer')}</option>
                    <option value="Credit Card">{t('invoices.register.creditCard', 'Credit Card')}</option>
                    <option value="Cheque">{t('invoices.register.cheque', 'Cheque')}</option>
                    <option value="Cash">{t('invoices.register.cash', 'Cash')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700">{t('invoices.register.referenceLabel', 'Reference')}</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={t('invoices.register.referencePlaceholder', 'Reference number...')}
                    className="w-full px-3 py-2.5 bg-white border border-[#d8dce5] rounded-[10px] text-neutral-900 font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-white border border-[#d8dce5] hover:bg-neutral-50 text-neutral-700 font-medium rounded-[var(--radius-sm)]"
                  >
                    {t('invoices.register.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-[var(--radius-sm)] shadow-sm"
                  >
                    {t('invoices.register.save', 'Save Payment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-[16px] shadow-xl border border-[#ececec] w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                <h3 className="text-[15px] font-bold text-neutral-900">{t('invoices.register.createInvoiceTitle', 'Create Invoice')}</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600">
                  ✕
                </button>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                {t('invoices.register.createInvoiceDesc', 'Create a new invoice draft for client services.')}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-[#d8dce5] hover:bg-neutral-50 text-neutral-700 text-[13px] font-medium rounded-[var(--radius-sm)]"
                >
                  {t('invoices.register.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); navigate('/cab/invoices/inv-0024') }}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-[var(--radius-sm)] shadow-sm"
                >
                  {t('invoices.register.saveAsDraft', 'Save Draft')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Note Modal */}
        {showCreditNoteModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-[16px] shadow-xl border border-[#ececec] w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                <h3 className="text-[15px] font-bold text-neutral-900">{t('invoices.register.creditNoteTitle', 'Create Credit Note')}</h3>
                <button type="button" onClick={() => setShowCreditNoteModal(false)} className="text-neutral-400 hover:text-neutral-600">
                  ✕
                </button>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                {t('invoices.register.creditNoteDesc', { invoiceNumber: selectedInvoice.invoiceNumber })}
              </p>
              <form onSubmit={handleSaveCreditNote} className="space-y-3 text-[13px]">
                {creditError && (
                  <div role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-[10px] font-semibold text-red-700">
                    {creditError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700">
                    {t('invoices.register.amountLabel', { currency: selectedInvoice.currency })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#d8dce5] rounded-[10px] text-neutral-900 font-semibold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700">
                    {t('invoices.register.creditReasonLabel', 'Reason')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder={t('invoices.register.creditReasonPlaceholder', 'e.g. Overbilled inspection fee')}
                    className="w-full px-3 py-2 bg-white border border-[#d8dce5] rounded-[10px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreditNoteModal(false)}
                    className="px-4 py-2 bg-white border border-[#d8dce5] hover:bg-neutral-50 text-neutral-700 text-[13px] font-medium rounded-[var(--radius-sm)]"
                  >
                    {t('invoices.register.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingCredit}
                    className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-[13px] font-medium rounded-[var(--radius-sm)] shadow-sm"
                  >
                    {savingCredit ? t('common.loading', 'Saving...') : t('invoices.register.creditNoteTitle', 'Create Credit Note')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </CabLayout>
  )
}

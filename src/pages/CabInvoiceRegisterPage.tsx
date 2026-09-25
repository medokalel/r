import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useInvoicesTourSteps } from '@/config/invoicesTourSteps'
import { AddCircleIcon, AppIcon, EyeIcon, FilterFunnelIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import {
  createCreditNote,
  getCabInvoices,
  recordPayment,
  type CabInvoiceItem,
  type CabInvoiceFilterParams,
} from '@/lib/api/cabInvoiceRegisterApi'
import { downloadExcelCsv, downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

export function CabInvoiceRegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = useInvoicesTourSteps()
  const [invoices, setInvoices] = useState<CabInvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listNotice, setListNotice] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
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
    setPage(1)
    loadInvoices()
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
    try {
      await recordPayment(selectedInvoice.id, {
        amount: amt,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference,
      })
      setShowPaymentModal(false)
      setListNotice(t('invoices.register.paymentSuccessNotice', 'Payment recorded successfully.'))
      setTimeout(() => setListNotice(null), 3000)
      loadInvoices()
    } catch {
      setPaymentError(t('invoices.register.paymentFailedError', 'Could not record payment. Please try again.'))
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
    if (amt - selectedInvoice.balance > 0.009) {
      setCreditError(
        t('invoices.register.creditExceedsBalance', 'Credit amount cannot exceed the remaining balance of {{balance}} {{currency}}.', {
          balance: selectedInvoice.balance.toFixed(2),
          currency: selectedInvoice.currency,
        })
      )
      return
    }
    setSavingCredit(true)
    try {
      await createCreditNote(selectedInvoice.id, {
        amount: amt,
        reason: creditReason,
      })
      setShowCreditNoteModal(false)
      setListNotice(t('invoices.register.creditSuccessNotice', 'Credit note created successfully.'))
      setTimeout(() => setListNotice(null), 3000)
      loadInvoices()
    } catch {
      setCreditError(t('invoices.register.creditFailedError', 'Could not create credit note. Please try again.'))
    } finally {
      setSavingCredit(false)
    }
  }

  const invoiceExportColumns: TableColumn<CabInvoiceItem>[] = [
    { header: t('invoices.register.colInvoice', 'Invoice'), value: (row) => row.invoiceNumber },
    { header: t('invoices.register.colClient', 'Client'), value: (row) => row.clientName },
    { header: t('invoices.register.colIssued', 'Issued'), value: (row) => row.issuedDate },
    { header: t('invoices.register.colDue', 'Due'), value: (row) => row.dueDate },
    {
      header: t('invoices.register.colAmount', 'Amount'),
      value: (row) => `${row.currency} ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: t('invoices.register.colPaid', 'Paid'),
      value: (row) => `${row.currency} ${row.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: t('invoices.register.colBalance', 'Balance'),
      value: (row) => `${row.currency} ${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { header: t('invoices.register.colStatus', 'Status'), value: (row) => row.status },
  ]

  const handleExportExcel = async () => {
    setExporting(true)
    setShowExportMenu(false)
    try {
      downloadExcelCsv('cab-invoices.csv', invoiceExportColumns, invoices)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    setShowExportMenu(false)
    try {
      downloadPdfFromTable(
        'cab-invoices.pdf',
        t('invoices.register.title', 'Invoices Register'),
        invoiceExportColumns,
        invoices
      )
    } finally {
      setExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors',
          s === 'paid' && 'bg-[#dcfce7] text-[#15803d]',
          s === 'partially paid' && 'bg-[#e8edfc] text-primary',
          s === 'unpaid' && 'bg-[#fee2e2] text-[#dc2626]',
          s === 'draft' && 'bg-[#f1f5f9] text-[#475569]',
          s === 'issued' && 'bg-[#e8edfc] text-primary'
        )}
      >
        {t(`invoices.register.${s.replace(/\s+/g, '')}`, status)}
      </span>
    )
  }

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE))
  const paginated = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <CabLayout sidebarVariant="invoices" tourId="invoices-register-tour" tourSteps={tourSteps}>
      <CabTourStep steps={tourSteps} stepId="invoices-header">
        <CabHeader
          title={t('invoices.register.title', 'Invoices Register')}
          subtitle={t('invoices.register.subtitle', 'Create, view and manage invoices issued to clients.')}
          notificationCount={3}
        />
      </CabTourStep>
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
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

        {/* Main Card Container */}
        <div className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          {/* Top Bar: Search, Filters & Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <CabTourStep steps={tourSteps} stepId="invoices-search-filters">
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
                    placeholder={t('invoices.register.searchPlaceholder', 'Search invoice or client...')}
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
                    {t('invoices.register.search', 'Search')}
                  </button>
                  <TableFilterSelect
                    label={t('invoices.register.countryLabel', 'Country')}
                    value={country}
                    onChange={(val) => {
                      setPage(1)
                      setCountry(val)
                    }}
                    options={[
                      { value: 'all', label: t('invoices.register.allCountries', 'All countries') },
                      { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                      { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                      { value: 'Egypt', label: 'Egypt' },
                    ]}
                  />
                  <TableFilterSelect
                    label={t('invoices.register.paymentStatusLabel', 'Payment status')}
                    value={paymentStatus}
                    onChange={(val) => {
                      setPage(1)
                      setPaymentStatus(val)
                    }}
                    options={[
                      { value: 'all', label: t('invoices.register.allStatuses', 'All statuses') },
                      { value: 'Unpaid', label: t('invoices.register.unpaid', 'Unpaid') },
                      { value: 'Paid', label: t('invoices.register.paid', 'Paid') },
                      { value: 'Partially paid', label: t('invoices.register.partiallyPaid', 'Partially paid') },
                      { value: 'Draft', label: t('invoices.register.draft', 'Draft') },
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

            {/* Actions */}
            <CabTourStep steps={tourSteps} stepId="invoices-actions-btn">
              <div className="flex items-center gap-3">
                {/* Export Menu Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
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
                  className="flex h-11 items-center gap-2 rounded-[8px] bg-primary px-5 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <AppIcon icon={AddCircleIcon} size={18} />
                  <span>{t('invoices.register.createInvoice', 'Create Invoice')}</span>
                </button>
              </div>
            </CabTourStep>
          </div>

          {/* Desktop Table View */}
          <CabTourStep steps={tourSteps} stepId="invoices-table">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] border-collapse text-center">
                <thead className="border-b border-[#ececec]">
                  <tr className="rounded-[10px] bg-[#1236a3] text-white">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={invoices.length > 0 && checkedIds.length === invoices.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="size-4 rounded border-white/30 bg-white/10 text-primary focus:ring-0"
                      />
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colInvoice', 'Invoice')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colClient', 'Client')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colIssued', 'Issued')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colDue', 'Due')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colAmount', 'Amount')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colPaid', 'Paid')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colBalance', 'Balance')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.register.colStatus', 'Status')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-neutral-500">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-neutral-500">
                        —
                      </td>
                    </tr>
                  ) : (
                    paginated.map((inv, index) => {
                      const isChecked = checkedIds.includes(inv.id)
                      return (
                        <tr
                          key={inv.id}
                          className={cn('cursor-pointer transition-colors', index % 2 === 1 && 'bg-[#f9fafc]')}
                        >
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleCheck(inv.id, e.target.checked)}
                              className="size-4 rounded border-[#d8dce5] text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-4 py-4" onClick={() => navigate(`/cab/invoices/${inv.id}`)}>
                            <p className="text-[15px] font-semibold text-primary hover:underline">
                              {inv.invoiceNumber}
                            </p>
                          </td>
                          <td className="px-4 py-4" onClick={() => navigate(`/cab/invoices/${inv.id}`)}>
                            <p className="text-[15px] font-medium text-neutral-900">{inv.clientName}</p>
                            <p className="text-[13px] text-neutral-500">{inv.clientCode}</p>
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">{inv.issuedDate}</td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">{inv.dueDate}</td>
                          <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
                            {inv.currency}{' '}
                            {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">
                            {inv.currency}{' '}
                            {inv.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
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
                              className="inline-flex size-8 items-center justify-center rounded-[6px] text-primary hover:bg-[#e8edfc] transition-colors"
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
          </CabTourStep>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {!loading && paginated.map((inv) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/cab/invoices/${inv.id}`)}
                className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-primary">{inv.invoiceNumber}</span>
                  {getStatusBadge(inv.status)}
                </div>
                <p className="text-[15px] font-semibold text-neutral-900">{inv.clientName}</p>
                <p className="text-[13px] text-neutral-500">{inv.clientCode}</p>
                <div className="flex items-center justify-between text-[13px] border-t border-[#ececec] pt-2">
                  <span className="text-neutral-500">Balance: {inv.currency} {inv.balance.toFixed(2)}</span>
                  <span className="font-bold text-neutral-900">{inv.currency} {inv.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
            {!loading && !invoices.length && <p className="py-6 text-center text-neutral-500">—</p>}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>

        {/* Record Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-2xl border border-[#ececec] w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-neutral-900">
                  {t('invoices.register.recordPaymentTitle', { invoiceNumber: selectedInvoice.invoiceNumber })}
                </h3>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold">
                  ×
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-[14px]">
                {paymentError && (
                  <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-[8px] font-semibold text-red-700 text-[13px]">
                    {paymentError}
                  </div>
                )}
                <div className="p-3.5 bg-[#e8edfc] border border-[#c9d8ff] rounded-[8px] font-medium text-primary text-[13px]">
                  {t('invoices.register.allocationPreview', {
                    amount: (parseFloat(paymentAmount) || 0).toFixed(2),
                    currency: selectedInvoice.currency,
                    remaining: Math.max(0, selectedInvoice.balance - (parseFloat(paymentAmount) || 0)).toFixed(2),
                  })}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('invoices.register.amountLabel', { currency: selectedInvoice.currency })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-11 w-full px-4 bg-white border border-[#e2e2e2] rounded-[8px] text-neutral-900 font-medium focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('invoices.register.paymentDateLabel', 'Payment Date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date" required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-11 w-full px-4 bg-white border border-[#e2e2e2] rounded-[8px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('invoices.register.paymentMethodLabel', 'Payment Method')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-11 w-full px-4 bg-white border border-[#e2e2e2] rounded-[8px] text-neutral-900 focus:border-primary focus:outline-none"
                  >
                    <option value="Bank transfer">{t('invoices.register.bankTransfer', 'Bank transfer')}</option>
                    <option value="Credit Card">{t('invoices.register.creditCard', 'Credit Card')}</option>
                    <option value="Cheque">{t('invoices.register.cheque', 'Cheque')}</option>
                    <option value="Cash">{t('invoices.register.cash', 'Cash')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">{t('invoices.register.referenceLabel', 'Reference')}</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={t('invoices.register.referencePlaceholder', 'Reference number...')}
                    className="h-11 w-full px-4 bg-white border border-[#e2e2e2] rounded-[8px] text-neutral-900 font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="h-10 px-4 bg-white border border-[#e2e2e2] hover:bg-neutral-50 text-neutral-700 font-medium rounded-[8px] text-[13px]"
                  >
                    {t('invoices.register.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 bg-primary hover:opacity-90 text-white font-medium rounded-[8px] text-[13px] shadow-sm"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-2xl border border-[#ececec] w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                <h3 className="text-[16px] font-bold text-neutral-900">{t('invoices.register.createInvoiceTitle', 'Create Invoice')}</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold">
                  ×
                </button>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                {t('invoices.register.createInvoiceDesc', 'Create a new invoice draft for client services.')}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 px-4 bg-white border border-[#e2e2e2] hover:bg-neutral-50 text-neutral-700 text-[13px] font-medium rounded-[8px]"
                >
                  {t('invoices.register.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); navigate('/cab/invoices/inv-0024') }}
                  className="h-10 px-5 bg-primary hover:opacity-90 text-white text-[13px] font-medium rounded-[8px] shadow-sm"
                >
                  {t('invoices.register.saveAsDraft', 'Save Draft')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Note Modal */}
        {showCreditNoteModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-2xl border border-[#ececec] w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                <h3 className="text-[16px] font-bold text-neutral-900">{t('invoices.register.creditNoteTitle', 'Create Credit Note')}</h3>
                <button type="button" onClick={() => setShowCreditNoteModal(false)} className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold">
                  ×
                </button>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                {t('invoices.register.creditNoteDesc', { invoiceNumber: selectedInvoice.invoiceNumber })}
              </p>
              <form onSubmit={handleSaveCreditNote} className="space-y-3 text-[13px]">
                {creditError && (
                  <div role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-[8px] font-semibold text-red-700">
                    {creditError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('invoices.register.amountLabel', { currency: selectedInvoice.currency })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" step="0.01" required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="h-11 w-full px-4 bg-white border border-[#e2e2e2] rounded-[8px] text-neutral-900 font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('invoices.register.creditReasonLabel', 'Reason')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder={t('invoices.register.creditReasonPlaceholder', 'e.g. Overbilled inspection fee')}
                    className="h-11 w-full px-4 bg-white border border-[#e2e2e2] rounded-[8px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreditNoteModal(false)}
                    className="h-10 px-4 bg-white border border-[#e2e2e2] hover:bg-neutral-50 text-neutral-700 text-[13px] font-medium rounded-[8px]"
                  >
                    {t('invoices.register.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingCredit}
                    className="h-10 px-5 bg-primary hover:opacity-90 disabled:opacity-50 text-white text-[13px] font-medium rounded-[8px] shadow-sm"
                  >
                    {savingCredit ? t('common.loading', 'Saving...') : t('invoices.register.creditNoteTitle', 'Create Credit Note')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}

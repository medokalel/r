import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, PdfFileIcon, RiyalSymbolIcon, SearchIcon } from '@/components/icons'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  currencySymbol,
  formatInvoiceAmount,
  formatInvoiceDate,
  type Invoice,
  type InvoiceCurrency,
} from '@/lib/api/invoicesApi'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  previewFieldsDocument,
  printFieldsDocument,
  type TableColumn,
} from '@/lib/tableTools'
import { cn } from '@/lib/utils'

interface InvoicesTableProps {
  invoices: Invoice[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  currencyFilter: string
  onCurrencyFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onExportAll: () => Promise<Invoice[]>
}

const thClass =
  'overflow-hidden px-1.5 py-2 text-center text-[9px] font-normal leading-[1.3] break-words text-white'
const tdClass = 'overflow-hidden px-1 py-1.5 text-[9px] font-semibold leading-tight align-middle'
const tdMutedClass = cn(tdClass, 'text-neutral-600')
const tdTextClass = cn(tdClass, 'text-neutral-700')
const previewBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] border border-[#F59E0B] bg-[#FFF7ED] px-2 py-1 text-[9px] font-medium leading-none text-[#F59E0B] transition-colors hover:bg-[#FFEDD5]'
const printBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] border border-[#2563EB] bg-[#EFF6FF] px-2 py-1 text-[9px] font-medium leading-none text-[#2563EB] transition-colors hover:bg-[#DBEAFE]'
const tdActionsClass = 'overflow-hidden px-1 py-1.5 align-middle'

function InvoiceCurrencyCell({ currency }: { currency: InvoiceCurrency }) {
  if (currency === 'SAR') {
    return (
      <span className="inline-flex items-center justify-center">
        <AppIcon icon={RiyalSymbolIcon} size={13} className="text-primary" />
      </span>
    )
  }

  const labels: Record<Exclude<InvoiceCurrency, 'SAR'>, string> = {
    USD: '$',
    EGP: 'EGP',
    EUR: '€',
    GBP: '£',
  }

  return <span className="font-semibold text-primary">{labels[currency]}</span>
}

export function InvoicesTable({
  invoices,
  loading,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onSearch,
  currencyFilter,
  onCurrencyFilterChange,
  statusFilter,
  onStatusFilterChange,
  onExportAll,
}: InvoicesTableProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(invoices.map((invoice) => invoice.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exportColumns: TableColumn<Invoice>[] = useMemo(
    () => [
      { header: '#', value: (_row: Invoice, index: number) => index + 1 },
      {
        header: t('invoices.columns.commercialRegister'),
        value: (row: Invoice) => row.commercialRegisterNumber,
      },
      { header: t('invoices.columns.username'), value: (row: Invoice) => row.username },
      { header: t('invoices.columns.email'), value: (row: Invoice) => row.email },
      { header: t('invoices.columns.orderNumber'), value: (row: Invoice) => row.orderNumber },
      { header: t('invoices.columns.orderStatus'), value: (row: Invoice) => row.orderStatus },
      { header: t('invoices.columns.invoiceType'), value: (row: Invoice) => row.invoiceType },
      { header: t('invoices.columns.paymentNumber'), value: (row: Invoice) => row.paymentNumber },
      {
        header: t('invoices.columns.paymentDate'),
        value: (row: Invoice) => formatInvoiceDate(row.paymentDate),
      },
      {
        header: t('invoices.columns.totalAmount'),
        value: (row: Invoice) => formatInvoiceAmount(row.totalAmount),
      },
      { header: t('invoices.columns.currency'), value: (row: Invoice) => currencySymbol(row.currency) },
      { header: t('invoices.columns.invoiceStatus'), value: () => t('invoices.paymentMade') },
    ],
    [t]
  )

  const buildInvoiceFields = (invoice: Invoice) => [
    { label: t('invoices.columns.orderNumber'), value: invoice.orderNumber },
    { label: t('invoices.columns.username'), value: invoice.username },
    { label: t('invoices.columns.email'), value: invoice.email },
    { label: t('invoices.columns.invoiceType'), value: invoice.invoiceType },
    { label: t('invoices.columns.paymentNumber'), value: invoice.paymentNumber },
    { label: t('invoices.columns.paymentDate'), value: formatInvoiceDate(invoice.paymentDate) },
    {
      label: t('invoices.columns.totalAmount'),
      value: `${formatInvoiceAmount(invoice.totalAmount)} ${currencySymbol(invoice.currency)}`,
    },
    { label: t('invoices.columns.invoiceStatus'), value: t('invoices.paymentMade') },
  ]

  const getExportRows = async () => {
    const selectedRows = invoices.filter((invoice) => selected.has(invoice.id))
    if (selectedRows.length > 0) return selectedRows
    return onExportAll()
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadPdfFromTable('invoices.pdf', t('invoices.pageTitle'), exportColumns, rows)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadExcelCsv('invoices.csv', exportColumns, rows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
              <AppIcon icon={SearchIcon} size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('invoices.searchPlaceholder')}
              className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSearch}
              className="h-11 flex-1 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover sm:flex-none"
            >
              {t('common.search')}
            </button>
            <button
              type="button"
              aria-label={t('common.filter')}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-[8px] text-primary transition-colors',
                filtersOpen ? 'bg-[#e8edfc]' : 'bg-[#f3f6fd] hover:bg-[#e8edfc]'
              )}
            >
              <AppIcon icon={FilterFunnelIcon} size={20} />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            <AppIcon icon={PdfFileIcon} size={20} />
            {t('invoices.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            <AppIcon icon={ExcelFileIcon} size={20} />
            {t('invoices.exportExcel')}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#ececec] pt-4">
          <TableFilterSelect
            label={t('invoices.filters.currency')}
            value={currencyFilter}
            onChange={onCurrencyFilterChange}
            options={[
              { value: 'all', label: t('invoices.filters.allCurrencies') },
              { value: 'SAR', label: 'SAR' },
              { value: 'USD', label: 'USD' },
              { value: 'EGP', label: 'EGP' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
            ]}
          />
          <TableFilterSelect
            label={t('invoices.filters.status')}
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: 'all', label: t('invoices.filters.allStatuses') },
              { value: 'PAYMENT_MADE', label: t('invoices.paymentMade') },
              { value: 'PENDING', label: t('invoices.filters.pending') },
              { value: 'OVERDUE', label: t('invoices.filters.overdue') },
            ]}
          />
        </div>
      )}

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed border-collapse text-center">
          <colgroup>
            <col style={{ width: '3%' }} />
            <col style={{ width: '2.5%' }} />
            <col style={{ width: '6.5%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '11.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#1236a3] text-white">
              <th className={thClass}>
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selected.size === invoices.length}
                  onChange={toggleAll}
                  className="size-3 accent-white"
                  aria-label="Select all"
                />
              </th>
              <th className={thClass}>{t('invoices.columns.index')}</th>
              <th className={thClass}>{t('invoices.columns.commercialRegister')}</th>
              <th className={thClass}>{t('invoices.columns.username')}</th>
              <th className={cn(thClass, 'whitespace-nowrap')}>{t('invoices.columns.email')}</th>
              <th className={cn(thClass, 'whitespace-nowrap')}>{t('invoices.columns.orderNumber')}</th>
              <th className={thClass}>{t('invoices.columns.orderStatus')}</th>
              <th className={thClass}>{t('invoices.columns.invoiceType')}</th>
              <th className={thClass}>{t('invoices.columns.paymentNumber')}</th>
              <th className={thClass}>{t('invoices.columns.paymentDate')}</th>
              <th className={thClass}>{t('invoices.columns.totalAmount')}</th>
              <th className={thClass}>{t('invoices.columns.currency')}</th>
              <th className={thClass}>{t('invoices.columns.invoiceStatus')}</th>
              <th className={thClass}>{t('invoices.columns.details')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-[9px] font-semibold text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-[9px] font-semibold text-neutral-500">
                  —
                </td>
              </tr>
            ) : (
              invoices.map((invoice, index) => (
                <tr key={invoice.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                  <td className={tdClass}>
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={() => toggleOne(invoice.id)}
                      className="size-3 accent-[#1236A3]"
                    />
                  </td>
                  <td className={tdTextClass}>{(page - 1) * 10 + index + 1}</td>
                  <td className={cn(tdTextClass, 'break-words')} dir="ltr">
                    {invoice.commercialRegisterNumber}
                  </td>
                  <td className={cn(tdClass, 'break-words text-neutral-900')}>
                    {invoice.username}
                  </td>
                  <td className={cn(tdTextClass, 'break-all whitespace-normal')} dir="ltr">
                    {invoice.email}
                  </td>
                  <td className={cn(tdTextClass, 'break-all whitespace-normal')} dir="ltr">
                    {invoice.orderNumber}
                  </td>
                  <td className={tdMutedClass}>
                    <span className="block text-pretty">{invoice.orderStatus}</span>
                  </td>
                  <td className={tdMutedClass}>
                    <span className="block text-pretty">{invoice.invoiceType}</span>
                  </td>
                  <td className={cn(tdTextClass, 'break-all')} dir="ltr">
                    {invoice.paymentNumber}
                  </td>
                  <td className={tdTextClass} dir="ltr">
                    {formatInvoiceDate(invoice.paymentDate)}
                  </td>
                  <td className={cn(tdClass, 'text-neutral-900')} dir="ltr">
                    {formatInvoiceAmount(invoice.totalAmount)}
                  </td>
                  <td className={tdClass}>
                    <InvoiceCurrencyCell currency={invoice.currency} />
                  </td>
                  <td className={tdClass}>
                    <span className="whitespace-nowrap text-[9px] font-semibold text-[#2ecc70]">
                      {t('invoices.paymentMade')}
                    </span>
                  </td>
                  <td className={tdActionsClass}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          previewFieldsDocument(t('invoices.preview'), buildInvoiceFields(invoice))
                        }
                        className={previewBtnClass}
                      >
                        {t('invoices.preview')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printFieldsDocument(t('invoices.printInvoice'), buildInvoiceFields(invoice))
                        }
                        className={printBtnClass}
                      >
                        {t('invoices.printInvoice')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && invoices.length > 0 && (
        <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </section>
  )
}

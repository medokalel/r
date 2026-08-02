import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ExcelFileIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  currencySymbol,
  formatInvoiceAmount,
  formatInvoiceDate,
  type Invoice,
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
    <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <AppIcon
              icon={SearchIcon}
              size={18}
              className="pointer-events-none absolute inset-y-0 start-3 my-auto text-neutral-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('invoices.searchPlaceholder')}
              className="w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white py-2.5 ps-10 pe-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {t('common.search')}
          </button>
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 disabled:opacity-50"
          >
            <AppIcon icon={PdfFileIcon} size={22} />
            {t('invoices.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 disabled:opacity-50"
          >
            <AppIcon icon={ExcelFileIcon} size={22} />
            {t('invoices.exportExcel')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] border-collapse text-center">
          <thead>
            <tr className="bg-[#1236a3] text-white">
              <th className="px-3 py-4">
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selected.size === invoices.length}
                  onChange={toggleAll}
                  className="size-4 accent-white"
                />
              </th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.index')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.commercialRegister')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.username')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.email')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.orderNumber')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.orderStatus')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.invoiceType')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.paymentNumber')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.paymentDate')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.totalAmount')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.currency')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.invoiceStatus')}</th>
              <th className="px-3 py-4 text-[13px] font-medium">{t('invoices.columns.details')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-neutral-500">
                  —
                </td>
              </tr>
            ) : (
              invoices.map((invoice, index) => (
                <tr key={invoice.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={() => toggleOne(invoice.id)}
                      className="size-4 accent-primary"
                    />
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700" dir="ltr">
                    {invoice.commercialRegisterNumber}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-900">{invoice.username}</td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700" dir="ltr">
                    {invoice.email}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700" dir="ltr">
                    {invoice.orderNumber}
                  </td>
                  <td className="max-w-[180px] px-3 py-4 text-[12px] leading-[1.5] text-neutral-600">
                    {invoice.orderStatus}
                  </td>
                  <td className="max-w-[180px] px-3 py-4 text-[12px] leading-[1.5] text-neutral-600">
                    {invoice.invoiceType}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700" dir="ltr">
                    {invoice.paymentNumber}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700" dir="ltr">
                    {formatInvoiceDate(invoice.paymentDate)}
                  </td>
                  <td className="px-3 py-4 text-[13px] font-medium text-neutral-900" dir="ltr">
                    {formatInvoiceAmount(invoice.totalAmount)}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-neutral-700">
                    {currencySymbol(invoice.currency)}
                  </td>
                  <td className="px-3 py-4">
                    <span className="text-[13px] font-medium text-[#2ecc70]">
                      {t('invoices.paymentMade')}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          previewFieldsDocument(t('invoices.preview'), buildInvoiceFields(invoice))
                        }
                        className="rounded-[var(--radius-sm)] border border-[#f39c12] px-2.5 py-1 text-[12px] font-medium text-[#f39c12]"
                      >
                        {t('invoices.preview')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printFieldsDocument(t('invoices.printInvoice'), buildInvoiceFields(invoice))
                        }
                        className="text-[12px] font-medium text-primary hover:underline"
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

      <div className="mt-4 px-5">
        <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </section>
  )
}

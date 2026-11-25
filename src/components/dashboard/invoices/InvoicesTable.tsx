import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, PdfFileIcon, RiyalSymbolIcon, SearchIcon } from '@/components/icons'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
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
import { INVOICE_STATUS_STYLES, invoiceStatusLabelKey } from '@/lib/invoiceStatus'
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

const thClass = 'px-3 py-4 text-center text-[13px] font-medium leading-[1.3] text-white'
const tdClass = 'px-3 py-4 text-[13px] align-middle'
const tdMutedClass = cn(tdClass, 'text-neutral-600')
const tdTextClass = cn(tdClass, 'text-neutral-800')
const previewBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] border border-[#F59E0B] bg-[#FFF7ED] px-3 py-1.5 text-[12px] font-medium leading-none text-[#F59E0B] transition-colors hover:bg-[#FFEDD5]'
const printBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] border border-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 text-[12px] font-medium leading-none text-[#2563EB] transition-colors hover:bg-[#DBEAFE]'
const tdActionsClass = 'px-3 py-4 align-middle'

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[4px] px-3 py-1 text-[12px] font-medium',
        INVOICE_STATUS_STYLES[status] ?? INVOICE_STATUS_STYLES.PAYMENT_MADE
      )}
    >
      {t(invoiceStatusLabelKey(status))}
    </span>
  )
}

function InvoiceCurrencyCell({ currency }: { currency: InvoiceCurrency }) {
  if (currency === 'SAR') {
    return (
      <span className="inline-flex items-center justify-center">
        <AppIcon icon={RiyalSymbolIcon} size={16} className="text-primary" />
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
        header: t('invoicesLegacy.columns.commercialRegister'),
        value: (row: Invoice) => row.commercialRegisterNumber,
      },
      { header: t('invoicesLegacy.columns.username'), value: (row: Invoice) => row.username },
      { header: t('invoicesLegacy.columns.email'), value: (row: Invoice) => row.email },
      { header: t('invoicesLegacy.columns.orderNumber'), value: (row: Invoice) => row.orderNumber },
      { header: t('invoicesLegacy.columns.orderStatus'), value: (row: Invoice) => row.orderStatus },
      { header: t('invoicesLegacy.columns.invoiceType'), value: (row: Invoice) => row.invoiceType },
      { header: t('invoicesLegacy.columns.paymentNumber'), value: (row: Invoice) => row.paymentNumber },
      {
        header: t('invoicesLegacy.columns.paymentDate'),
        value: (row: Invoice) => formatInvoiceDate(row.paymentDate),
      },
      {
        header: t('invoicesLegacy.columns.totalAmount'),
        value: (row: Invoice) => formatInvoiceAmount(row.totalAmount),
      },
      { header: t('invoicesLegacy.columns.currency'), value: (row: Invoice) => currencySymbol(row.currency) },
      { header: t('invoicesLegacy.columns.invoiceStatus'), value: (row: Invoice) => t(invoiceStatusLabelKey(row.status)) },
    ],
    [t]
  )

  const buildInvoiceFields = (invoice: Invoice) => [
    { label: t('invoicesLegacy.columns.orderNumber'), value: invoice.orderNumber },
    { label: t('invoicesLegacy.columns.username'), value: invoice.username },
    { label: t('invoicesLegacy.columns.email'), value: invoice.email },
    { label: t('invoicesLegacy.columns.invoiceType'), value: invoice.invoiceType },
    { label: t('invoicesLegacy.columns.paymentNumber'), value: invoice.paymentNumber },
    { label: t('invoicesLegacy.columns.paymentDate'), value: formatInvoiceDate(invoice.paymentDate) },
    {
      label: t('invoicesLegacy.columns.totalAmount'),
      value: `${formatInvoiceAmount(invoice.totalAmount)} ${currencySymbol(invoice.currency)}`,
    },
    { label: t('invoicesLegacy.columns.invoiceStatus'), value: t(invoiceStatusLabelKey(invoice.status)) },
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
      downloadPdfFromTable('invoices.pdf', t('invoicesLegacy.pageTitle'), exportColumns, rows)
    } catch {
      // The page already showed the error; no partial file is produced.
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadExcelCsv('invoices.csv', exportColumns, rows)
    } catch {
      // The page already showed the error; no partial file is produced.
    } finally {
      setExporting(false)
    }
  }

  const exportDisabled = exporting || loading
  const emptyText = t('clientInvoices.empty')

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
      <DashboardTourStep stepId="invoices-toolbar">
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
                placeholder={t('invoicesLegacy.searchPlaceholder')}
                aria-label={t('invoicesLegacy.searchPlaceholder')}
                className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSearch}
                className="h-11 flex-1 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover sm:flex-none"
              >
                {t('common.search')}
              </button>
              <TableFilterSelect
                label={t('invoicesLegacy.filters.currency')}
                value={currencyFilter}
                onChange={onCurrencyFilterChange}
                className="min-w-[150px] flex-1 sm:flex-none"
                options={[
                  { value: 'all', label: t('invoicesLegacy.filters.allCurrencies') },
                  { value: 'SAR', label: 'SAR' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EGP', label: 'EGP' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                ]}
              />
              <TableFilterSelect
                label={t('invoicesLegacy.filters.status')}
                value={statusFilter}
                onChange={onStatusFilterChange}
                className="min-w-[150px] flex-1 sm:flex-none"
                options={[
                  { value: 'all', label: t('invoicesLegacy.filters.allStatuses') },
                  { value: 'PAYMENT_MADE', label: t('invoicesLegacy.paymentMade') },
                  { value: 'PENDING', label: t('invoicesLegacy.filters.pending') },
                  { value: 'OVERDUE', label: t('invoicesLegacy.filters.overdue') },
                ]}
              />
              <button
                type="button"
                aria-label={t('common.filter')}
                onClick={onSearch}
                className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f6fd] text-primary transition-colors hover:bg-[#e8edfc]"
              >
                <AppIcon icon={FilterFunnelIcon} size={20} />
              </button>
            </div>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                disabled={exportDisabled}
                aria-label={t('clientInvoices.export')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-primary bg-white px-5 text-[14px] font-medium text-primary transition-colors hover:bg-[#f3f6fd] disabled:opacity-50 sm:w-auto"
              >
                {t('clientInvoices.export')}
                <SelectDropdownIcon />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[190px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
              >
                <DropdownMenu.Item
                  onSelect={handleExportPdf}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                >
                  <AppIcon icon={PdfFileIcon} size={18} />
                  {t('invoicesLegacy.downloadPdf')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={handleExportExcel}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                >
                  <AppIcon icon={ExcelFileIcon} size={18} />
                  {t('invoicesLegacy.exportExcel')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </DashboardTourStep>

      {/* Desktop: table */}
      <DashboardTourStep stepId="invoices-table">
        <div className="hidden min-w-0 overflow-x-auto md:block">
          <table className="w-full min-w-[1280px] border-collapse text-center">
            <thead>
              <tr className="bg-[#1236a3] text-white">
                <th className={cn(thClass, 'w-10')}>
                  <input
                    type="checkbox"
                    checked={invoices.length > 0 && selected.size === invoices.length}
                    onChange={toggleAll}
                    className="size-4 accent-white"
                    aria-label={t('common.selectAll')}
                  />
                </th>
                <th className={thClass}>{t('invoicesLegacy.columns.index')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.commercialRegister')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.username')}</th>
                <th className={cn(thClass, 'whitespace-nowrap')}>{t('invoicesLegacy.columns.email')}</th>
                <th className={cn(thClass, 'whitespace-nowrap')}>{t('invoicesLegacy.columns.orderNumber')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.orderStatus')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.invoiceType')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.paymentNumber')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.paymentDate')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.totalAmount')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.currency')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.invoiceStatus')}</th>
                <th className={thClass}>{t('invoicesLegacy.columns.details')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-[13px] text-neutral-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-[13px] text-neutral-500">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, index) => (
                  <tr key={invoice.id} className={cn(index % 2 === 1 && 'bg-[#eef1f6]')}>
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        checked={selected.has(invoice.id)}
                        onChange={() => toggleOne(invoice.id)}
                        className="size-4 accent-[#1236A3]"
                      />
                    </td>
                    <td className={tdTextClass}>{(page - 1) * 10 + index + 1}</td>
                    <td className={cn(tdTextClass, 'whitespace-nowrap')} dir="ltr">
                      {invoice.commercialRegisterNumber}
                    </td>
                    <td className={cn(tdClass, 'min-w-[120px] break-words font-semibold text-neutral-900')}>
                      {invoice.username}
                    </td>
                    <td className={cn(tdTextClass, 'min-w-[160px] break-all')} dir="ltr">
                      {invoice.email}
                    </td>
                    <td className={cn(tdClass, 'whitespace-nowrap font-semibold text-primary')} dir="ltr">
                      {invoice.orderNumber}
                    </td>
                    <td className={tdMutedClass}>
                      <span className="block text-pretty">{invoice.orderStatus}</span>
                    </td>
                    <td className={tdMutedClass}>
                      <span className="block text-pretty">{invoice.invoiceType}</span>
                    </td>
                    <td className={cn(tdTextClass, 'whitespace-nowrap')} dir="ltr">
                      {invoice.paymentNumber}
                    </td>
                    <td className={cn(tdTextClass, 'whitespace-nowrap')} dir="ltr">
                      {formatInvoiceDate(invoice.paymentDate)}
                    </td>
                    <td className={cn(tdClass, 'whitespace-nowrap font-semibold text-neutral-900')} dir="ltr">
                      {formatInvoiceAmount(invoice.totalAmount)}
                    </td>
                    <td className={tdClass}>
                      <InvoiceCurrencyCell currency={invoice.currency} />
                    </td>
                    <td className={tdClass}>
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className={tdActionsClass}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            previewFieldsDocument(t('invoicesLegacy.preview'), buildInvoiceFields(invoice))
                          }
                          className={previewBtnClass}
                        >
                          {t('invoicesLegacy.preview')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            printFieldsDocument(t('invoicesLegacy.printInvoice'), buildInvoiceFields(invoice))
                          }
                          className={printBtnClass}
                        >
                          {t('invoicesLegacy.printInvoice')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {loading ? (
            <p className="py-6 text-center text-[13px] text-neutral-500">{t('common.loading')}</p>
          ) : invoices.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-neutral-500">{emptyText}</p>
          ) : (
            <>
              <label className="flex items-center gap-2 px-1 text-[13px] font-medium text-neutral-600">
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selected.size === invoices.length}
                  onChange={toggleAll}
                  className="size-4 accent-[#1236A3]"
                />
                {t('common.selectAll')}
              </label>

              {invoices.map((invoice, index) => (
                <div key={invoice.id} className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(invoice.id)}
                        onChange={() => toggleOne(invoice.id)}
                        className="size-4 accent-[#1236A3]"
                      />
                      <span className="text-[14px] font-bold text-primary" dir="ltr">
                        {invoice.orderNumber}
                      </span>
                    </label>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>

                  <p className="mt-2 text-[14px] font-semibold text-neutral-900">{invoice.username}</p>
                  <p className="text-[13px] text-neutral-500" dir="ltr">
                    {invoice.commercialRegisterNumber}
                  </p>

                  <div className="mt-2 space-y-1 text-[13px] text-neutral-600">
                    <p className="break-all" dir="ltr">
                      {invoice.email}
                    </p>
                    <p>
                      {t('invoicesLegacy.columns.orderStatus')}: <bdi>{invoice.orderStatus}</bdi>
                    </p>
                    <p>
                      {t('invoicesLegacy.columns.invoiceType')}: <bdi>{invoice.invoiceType}</bdi>
                    </p>
                    <p dir="ltr">
                      {t('invoicesLegacy.columns.paymentNumber')}: {invoice.paymentNumber}
                    </p>
                    <p>
                      {t('invoicesLegacy.columns.paymentDate')}: <bdi>{formatInvoiceDate(invoice.paymentDate)}</bdi>
                    </p>
                    <p>
                      #{(page - 1) * 10 + index + 1}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-[#ececec] pt-2 text-[14px] font-semibold text-neutral-900">
                    <span className="inline-flex items-center gap-1.5">
                      <span dir="ltr">{formatInvoiceAmount(invoice.totalAmount)}</span>
                      <InvoiceCurrencyCell currency={invoice.currency} />
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        previewFieldsDocument(t('invoicesLegacy.preview'), buildInvoiceFields(invoice))
                      }
                      className={previewBtnClass}
                    >
                      {t('invoicesLegacy.preview')}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        printFieldsDocument(t('invoicesLegacy.printInvoice'), buildInvoiceFields(invoice))
                      }
                      className={printBtnClass}
                    >
                      {t('invoicesLegacy.printInvoice')}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DashboardTourStep>

      {!loading && invoices.length > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          previousLabel={t('clientInvoices.previous')}
          nextLabel={t('clientInvoices.next')}
        />
      )}
    </section>
  )
}

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ExcelFileIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  matchesSearch,
  previewFieldsDocument,
  printFieldsDocument,
  type TableColumn,
} from '@/lib/tableTools'
import {
  formatWalletAmount,
  type WalletPaymentMethod,
  type WalletTransaction,
} from '@/lib/api/walletMockData'
import { cn } from '@/lib/utils'

interface WalletTransactionsTableProps {
  transactions: WalletTransaction[]
}

function PaymentMethodBadge({ method }: { method: WalletPaymentMethod }) {
  const { t } = useTranslation()

  const config = {
    mada: {
      label: t('wallet.paymentMethods.mada'),
      icon: (
        <span className="flex size-6 items-center justify-center rounded bg-[#00a651] text-[9px] font-bold text-white">
          mada
        </span>
      ),
    },
    bank_transfer: {
      label: t('wallet.paymentMethods.bankTransfer'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
          <path d="M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3l9 5H3l9-5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    visa: {
      label: t('wallet.paymentMethods.visa'),
      icon: (
        <span className="text-[13px] font-bold italic text-[#1a1f71]">VISA</span>
      ),
    },
  }[method]

  return (
    <div className="flex items-center justify-center gap-2">
      {config.icon}
      <span className="text-[14px] text-neutral-700">{config.label}</span>
    </div>
  )
}

export function WalletTransactionsTable({ transactions }: WalletTransactionsTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesQuery = matchesSearch(
        [tx.transactionNumber, tx.statementTitle, tx.statementSubtitle, tx.date],
        appliedQuery
      )
      const matchesType = typeFilter === 'all' || tx.paymentMethod === typeFilter
      const matchesDate = dateFilter === 'all' || tx.date.includes(dateFilter)
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
      return matchesQuery && matchesType && matchesDate && matchesStatus
    })
  }, [transactions, appliedQuery, typeFilter, dateFilter, statusFilter])

  const paymentMethodLabel = (method: WalletPaymentMethod) => {
    const map = {
      mada: t('wallet.paymentMethods.mada'),
      bank_transfer: t('wallet.paymentMethods.bankTransfer'),
      visa: t('wallet.paymentMethods.visa'),
    }
    return map[method]
  }

  const exportColumns: TableColumn<WalletTransaction>[] = [
    { header: '#', value: (_, index) => index + 1 },
    { header: t('wallet.transactions.columns.transactionNumber'), value: (row) => row.transactionNumber },
    { header: t('wallet.transactions.columns.date'), value: (row) => row.date },
    {
      header: t('wallet.transactions.columns.statement'),
      value: (row) => `${row.statementTitle}${row.statementSubtitle ? ` - ${row.statementSubtitle}` : ''}`,
    },
    { header: t('wallet.transactions.columns.paymentMethod'), value: (row) => paymentMethodLabel(row.paymentMethod) },
    { header: t('wallet.transactions.columns.amount'), value: (row) => formatWalletAmount(row.amount) },
    { header: t('wallet.transactions.columns.status'), value: () => t('wallet.transactions.statusSuccessful') },
  ]

  const buildInvoiceFields = (tx: WalletTransaction) => [
    { label: t('wallet.transactions.columns.transactionNumber'), value: tx.transactionNumber },
    { label: t('wallet.transactions.columns.date'), value: tx.date },
    { label: t('wallet.transactions.columns.statement'), value: tx.statementTitle },
    { label: t('wallet.transactions.columns.paymentMethod'), value: paymentMethodLabel(tx.paymentMethod) },
    { label: t('wallet.transactions.columns.amount'), value: formatWalletAmount(tx.amount) },
    { label: t('wallet.transactions.columns.status'), value: t('wallet.transactions.statusSuccessful') },
  ]

  const handleSearch = () => setAppliedQuery(query)

  const uniqueYears = [...new Set(transactions.map((tx) => tx.date.slice(-4)))]

  return (
    <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 px-5">
        <div>
          <h2 className="text-[18px] font-semibold text-neutral-900">
            {t('wallet.transactions.title')}
          </h2>
          <p className="mt-1 text-[14px] text-neutral-500">{t('wallet.transactions.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              downloadPdfFromTable(
                'wallet-transactions.pdf',
                t('wallet.transactions.title'),
                exportColumns,
                filtered
              )
            }
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <AppIcon icon={PdfFileIcon} size={22} />
            {t('wallet.transactions.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={() => downloadExcelCsv('wallet-transactions.csv', exportColumns, filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <AppIcon icon={ExcelFileIcon} size={22} />
            {t('wallet.transactions.exportExcel')}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 px-5">
        <div className="relative min-w-[240px] flex-1">
          <AppIcon
            icon={SearchIcon}
            size={18}
            className="pointer-events-none absolute inset-y-0 start-3 my-auto text-neutral-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('wallet.transactions.searchPlaceholder')}
            className="w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white py-2.5 ps-10 pe-3 text-[14px] outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {t('common.search')}
        </button>
        <TableFilterSelect
          label={t('wallet.transactions.allTypes')}
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: t('wallet.transactions.allTypes') },
            { value: 'mada', label: t('wallet.paymentMethods.mada') },
            { value: 'bank_transfer', label: t('wallet.paymentMethods.bankTransfer') },
            { value: 'visa', label: t('wallet.paymentMethods.visa') },
          ]}
        />
        <TableFilterSelect
          label={t('wallet.transactions.allDates')}
          value={dateFilter}
          onChange={setDateFilter}
          options={[
            { value: 'all', label: t('wallet.transactions.allDates') },
            ...uniqueYears.map((year) => ({ value: year, label: year })),
          ]}
        />
        <TableFilterSelect
          label={t('wallet.transactions.allCases')}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: t('wallet.transactions.allCases') },
            { value: 'successful', label: t('wallet.transactions.statusSuccessful') },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-center">
          <thead>
            <tr className="bg-[#1236a3] text-white">
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.index')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.transactionNumber')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.date')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.statement')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.paymentMethod')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.amount')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.status')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('wallet.transactions.columns.procedure')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-neutral-500">
                  —
                </td>
              </tr>
            ) : (
              filtered.map((tx, index) => (
                <tr key={tx.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                  <td className="px-4 py-4 text-[14px] text-neutral-700">{index + 1}</td>
                  <td className="px-4 py-4 text-[14px] text-neutral-700" dir="ltr">
                    {tx.transactionNumber}
                  </td>
                  <td className="px-4 py-4 text-[14px] text-neutral-700" dir="ltr">
                    {tx.date}
                  </td>
                  <td className="px-4 py-4 text-start">
                    <p className="text-[14px] font-medium text-neutral-900">{tx.statementTitle}</p>
                    {tx.statementSubtitle && (
                      <p className="text-[12px] text-neutral-500">{tx.statementSubtitle}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <PaymentMethodBadge method={tx.paymentMethod} />
                  </td>
                  <td className="px-4 py-4 text-[14px] font-medium text-primary" dir="ltr">
                    {formatWalletAmount(tx.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[14px] font-medium text-[#2ecc70]">
                      {t('wallet.transactions.statusSuccessful')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          previewFieldsDocument(
                            t('wallet.transactions.preview'),
                            buildInvoiceFields(tx)
                          )
                        }
                        className="rounded-[var(--radius-sm)] border border-[#f39c12] px-3 py-1.5 text-[13px] font-medium text-[#f39c12] transition-colors hover:bg-[#fef5e7]"
                      >
                        {t('wallet.transactions.preview')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printFieldsDocument(
                            t('wallet.transactions.printInvoice'),
                            buildInvoiceFields(tx)
                          )
                        }
                        className="text-[13px] font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t('wallet.transactions.printInvoice')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

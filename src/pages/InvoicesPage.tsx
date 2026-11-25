import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { fetchAllInvoices, INVOICE_EXPORT_INCOMPLETE } from '@/lib/invoiceExport'
import { InvoicesTable } from '@/components/dashboard/invoices/InvoicesTable'
import { AppLayout } from '@/components/layout/AppLayout'
import { useInvoicesTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/TourContext'
import {
  listInvoices,
  type Invoice,
  type InvoiceCurrency,
  type InvoiceStatus,
} from '@/lib/api/invoicesApi'

const PAGE_SIZE = 10

export function InvoicesPage() {
  const { t } = useTranslation()
  const tourSteps = useInvoicesTourSteps()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listInvoices({
        page,
        limit: PAGE_SIZE,
        search: appliedSearch || undefined,
        currency: currencyFilter !== 'all' ? (currencyFilter as InvoiceCurrency) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
      })
      setInvoices(result.items)
      setTotalPages(result.totalPages)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch, currencyFilter, statusFilter, t])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search)
  }

  const handleCurrencyFilterChange = (value: string) => {
    setPage(1)
    setCurrencyFilter(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setPage(1)
    setStatusFilter(value)
  }

  const handleExportAll = async () => {
    try {
      return await fetchAllInvoices((exportPage) =>
        listInvoices({
          page: exportPage,
          limit: 1000,
          search: appliedSearch || undefined,
          currency: currencyFilter !== 'all' ? (currencyFilter as InvoiceCurrency) : undefined,
          status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
        }),
      )
    } catch (error) {
      if (error instanceof Error && error.message === INVOICE_EXPORT_INCOMPLETE) {
        toast.error(t('clientInvoices.exportIncomplete'))
      } else {
        toast.error(getUserErrorMessage(error, t))
      }
      throw error
    }
  }

  return (
    <TourProvider tourId="auditee-invoices" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="invoices-header">
          <AccreditationHeader titleKey="invoicesLegacy.pageTitle" />
        </DashboardTourStep>
        <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
          <p className="text-[14px] text-neutral-500">{t('clientInvoices.subtitle')}</p>
          <InvoicesTable
            invoices={invoices}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
            onSearch={handleSearch}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={handleCurrencyFilterChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onExportAll={handleExportAll}
          />
        </div>
      </AppLayout>
    </TourProvider>
  )
}
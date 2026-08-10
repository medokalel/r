import { useCallback, useEffect, useState } from 'react'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { InvoicesTable } from '@/components/dashboard/invoices/InvoicesTable'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  listInvoices,
  type Invoice,
  type InvoiceCurrency,
  type InvoiceStatus,
} from '@/lib/api/invoicesApi'

const PAGE_SIZE = 10

export function InvoicesPage() {
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
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch, currencyFilter, statusFilter])

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
    const result = await listInvoices({
      page: 1,
      limit: 1000,
      search: appliedSearch || undefined,
      currency: currencyFilter !== 'all' ? (currencyFilter as InvoiceCurrency) : undefined,
      status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
    })
    return result.items
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="invoices.pageTitle" />
      <div className="flex min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
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
  )
}

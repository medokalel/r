import { useCallback, useEffect, useState } from 'react'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { PeriodicVisitsTable } from '@/components/dashboard/periodicVisits/PeriodicVisitsTable'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  listPeriodicVisits,
  type PeriodicVisit,
  type PeriodicVisitProcedure,
} from '@/lib/api/periodicVisitsApi'

const PAGE_SIZE = 10

export function PeriodicVisitsPage() {
  const [visits, setVisits] = useState<PeriodicVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [procedureFilter, setProcedureFilter] = useState('all')
  const [specificationFilter, setSpecificationFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listPeriodicVisits({
        page,
        limit: PAGE_SIZE,
        search: appliedSearch || undefined,
        procedure:
          procedureFilter !== 'all' ? (procedureFilter as PeriodicVisitProcedure) : undefined,
        specification: specificationFilter !== 'all' ? specificationFilter : undefined,
      })
      setVisits(result.items)
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch, procedureFilter, specificationFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search)
  }

  const handleExportAll = async () => {
    const result = await listPeriodicVisits({
      page: 1,
      limit: 1000,
      search: appliedSearch || undefined,
      procedure:
        procedureFilter !== 'all' ? (procedureFilter as PeriodicVisitProcedure) : undefined,
      specification: specificationFilter !== 'all' ? specificationFilter : undefined,
    })
    return result.items
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="periodicVisits.pageTitle" />
      <div className="flex min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        <PeriodicVisitsTable
          visits={visits}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          search={search}
          onSearchChange={setSearch}
          onSearch={handleSearch}
          procedureFilter={procedureFilter}
          onProcedureFilterChange={(value) => {
            setPage(1)
            setProcedureFilter(value)
          }}
          specificationFilter={specificationFilter}
          onSpecificationFilterChange={(value) => {
            setPage(1)
            setSpecificationFilter(value)
          }}
          onExportAll={handleExportAll}
        />
      </div>
    </AppLayout>
  )
}

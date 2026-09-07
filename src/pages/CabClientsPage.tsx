import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddCircleIcon, AppIcon, EyeIcon, SearchIcon } from '@/components/icons'
import { listCabClients, type CabClient, type CabClientList } from '@/lib/api/clientRegistrationApi'

const EMPTY_RESULT: CabClientList = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
}

export function CabClientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [result, setResult] = useState<CabClientList>(EMPTY_RESULT)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listCabClients({ page, limit: 10, search })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t('cab.clientsPage.loadError'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, search, t])

  const applySearch = () => {
    const nextSearch = query.trim()
    if (page === 1 && search === nextSearch) return
    setLoading(true)
    setError('')
    setPage(1)
    setSearch(nextSearch)
  }

  const openClient = (client: CabClient) => navigate(`/cab/clients/${client.id}`)

  return (
    <CabLayout>
      <CabHeader title={t('cab.clientsPage.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="rounded-[16px] border border-[#ececec] bg-white p-3">
          <div className="relative flex items-center">
            <AppIcon icon={SearchIcon} size={18} className="pointer-events-none absolute start-3 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applySearch()}
              placeholder={t('cab.clientsPage.searchPlaceholder')}
              className="w-full rounded-[var(--radius-sm)] border-0 bg-transparent py-2.5 ps-10 pe-14 text-[14px] outline-none"
            />
            <button
              type="button"
              onClick={applySearch}
              aria-label={t('cab.clientsPage.search')}
              className="absolute end-0 flex size-13 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-white hover:bg-primary/90"
            >
              <AppIcon icon={SearchIcon} size={18} />
            </button>
          </div>
        </div>

        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-5">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.clientsPage.title')}</h2>
              <p className="text-[13px] text-neutral-500">{t('cab.clientsPage.total', { count: result.total })}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/cab/clients/new')}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90"
            >
              <AppIcon icon={AddCircleIcon} size={18} />
              {t('cab.clientsPage.addClient')}
            </button>
          </div>

          {error && <p role="alert" className="px-5 py-4 text-error-500">{error}</p>}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px] border-collapse text-center">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.clientsPage.table.client')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.clientsPage.table.registration')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.clientsPage.table.contact')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.clientsPage.table.location')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.clientsPage.table.status')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.clientsPage.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-neutral-500">{t('common.loading')}</td></tr>
                ) : result.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-neutral-500">{t('cab.clientsPage.empty')}</td></tr>
                ) : (
                  result.items.map((client, index) => (
                    <tr key={client.id} className={index % 2 ? 'bg-[#f9fafc]' : ''}>
                      <td className="px-4 py-4 font-medium text-neutral-900">{client.legalEntityName || '—'}</td>
                      <td className="px-4 py-4 text-neutral-700">{client.registrationNumber || '—'}</td>
                      <td className="px-4 py-4 text-neutral-700">
                        <div>{client.contactFullName || '—'}</div>
                        <div className="text-[13px] text-neutral-500">{client.contactEmail || '—'}</div>
                      </td>
                      <td className="px-4 py-4 text-neutral-700">{[client.city, client.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary">
                          {t(`cab.clientsPage.status.${client.status.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => openClient(client)} aria-label={t('cab.clientsPage.view')} className="text-primary">
                          <AppIcon icon={EyeIcon} size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 px-5 md:hidden">
            {!loading && result.items.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => openClient(client)}
                className="w-full rounded-[12px] border border-[#ececec] p-4 text-start"
              >
                <p className="font-semibold text-neutral-900">{client.legalEntityName || '—'}</p>
                <p className="text-[13px] text-neutral-500">{client.registrationNumber || '—'}</p>
                <p className="mt-2 text-[14px] text-neutral-700">{client.contactEmail || '—'}</p>
              </button>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading')}</p>}
            {!loading && !result.items.length && <p className="py-6 text-center text-neutral-500">{t('cab.clientsPage.empty')}</p>}
          </div>

          {result.totalPages > 1 && (
            <TablePagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={(nextPage) => {
                setLoading(true)
                setError('')
                setPage(nextPage)
              }}
              className="mt-5 px-5"
            />
          )}
        </section>
      </main>
    </CabLayout>
  )
}

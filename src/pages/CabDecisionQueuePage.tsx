import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, EyeIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import { decisionsToCsv, downloadCsv, getDecisionQueue } from '@/lib/api/cabDecisionsApi'
import type { DecisionQueueItem } from '@/lib/api/cabDecisionsApi'
import { cn } from '@/lib/utils'

export function CabDecisionQueuePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<DecisionQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('Saudi Arabia')
  const [status, setStatus] = useState('all')
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2024-12-31')
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)

  const selected = useMemo(() => items.find((i) => i.id === sel) ?? null, [items, sel])

  const load = async (f = { search, country, status, startDate, endDate }) => {
    setLoading(true)
    try {
      const d = await getDecisionQueue({
        searchQuery: f.search.trim() || undefined,
        country: f.country,
        status: f.status,
        startDate: f.startDate || undefined,
        endDate: f.endDate || undefined,
      })
      setItems(d)
      setSel((p) => (d.some((x) => x.id === p) ? p : (d[0]?.id ?? null)))
    } catch (e) {
      console.error('Failed to load decisions:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const doExport = async () => {
    setBusy(true)
    try {
      const all = await getDecisionQueue({
        searchQuery: search.trim() || undefined,
        country,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      downloadCsv('decision-queue.csv', decisionsToCsv(all))
    } finally {
      setBusy(false)
    }
  }

  const doClear = () => {
    setSearch('')
    setCountry('all')
    setStatus('all')
    setStartDate('')
    setEndDate('')
    load({ search: '', country: 'all', status: 'all', startDate: '', endDate: '' })
  }

  const getStatusBadge = (reviewStatus: string, label: string) => {
    switch (reviewStatus) {
      case 'decided_granted':
        return (
          <span className="inline-flex rounded-full bg-[#ecfdf5] px-3 py-1 text-[12px] font-medium text-[#16a34a]">
            {label}
          </span>
        )
      case 'ready_for_decision':
        return (
          <span className="inline-flex rounded-full bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary">
            {label}
          </span>
        )
      case 'decided_refused':
        return (
          <span className="inline-flex rounded-full bg-[#fef2f2] px-3 py-1 text-[12px] font-medium text-[#dc2626]">
            {label}
          </span>
        )
      default:
        return (
          <span className="inline-flex rounded-full bg-[#fff7ed] px-3 py-1 text-[12px] font-medium text-[#ea580c]">
            {label}
          </span>
        )
    }
  }

  return (
    <CabLayout sidebarVariant="decisions">
      <CabHeader
        title={t('cab.decisions.title', 'Decision queue')}
        subtitle={t('cab.decisions.subtitle', 'Manage and track applications awaiting certification decisions.')}
        notificationCount={3}
      />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            {/* Filter Card */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                load()
              }}
              className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-none space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">
                    {t('common.search', 'Search')}
                  </label>
                  <div className="relative">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('cab.decisions.searchPlaceholder', 'Search ID, client name...')}
                      className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 ps-10 pe-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                    />
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                      <AppIcon icon={SearchIcon} size={18} />
                    </div>
                  </div>
                </div>

                {/* Received Period */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">
                    {t('cab.decisions.receivedPeriod', 'Received period')}
                  </label>
                  <div className="flex items-center gap-1.5 rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-800">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-transparent text-[12px] text-neutral-900 focus:outline-none"
                    />
                    <span className="text-neutral-400 text-[12px]">–</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-transparent text-[12px] text-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">
                    {t('cab.decisions.country', 'Country')}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none"
                  >
                    <option value="all">{t('common.all', 'All')}</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Egypt">Egypt</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">
                    {t('cab.decisions.status', 'Status')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none"
                  >
                    <option value="all">{t('common.all', 'All')}</option>
                    <option value="awaiting_technical_review">Awaiting technical review</option>
                    <option value="ready_for_decision">Ready for decision</option>
                    <option value="decided_granted">Granted</option>
                    <option value="decided_refused">Refused</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
                >
                  <AppIcon icon={SearchIcon} size={16} />
                  <span>{t('common.search', 'Search')}</span>
                </button>
                <button
                  type="button"
                  onClick={doClear}
                  className="rounded-[var(--radius-sm)] border border-[#d8dce5] px-4 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  {t('common.clear', 'Clear')}
                </button>
              </div>
            </form>

            {/* Decision Queue Section */}
            <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
                <div>
                  <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.decisions.title', 'Decision queue')}</h2>
                  <p className="text-[13px] text-neutral-500">
                    {loading ? t('common.loading', 'Loading…') : `${items.length} ${t('cab.decisions.results', 'results')}`}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={doExport}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                >
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  <span>{busy ? t('common.exporting', 'Exporting…') : t('common.export', 'Export')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.decisions.table.file', 'File')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.decisions.table.client', 'Client')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.decisions.table.scheme', 'Scheme')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.decisions.table.status', 'Review status')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.decisions.table.decisionMaker', 'Decision maker')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.decisions.table.due', 'Due')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-neutral-500">
                          {t('common.loading', 'Loading...')}
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-neutral-500">
                          {t('cab.decisions.empty', 'No decisions match the current filters.')}
                        </td>
                      </tr>
                    ) : (
                      items.map((row, index) => (
                        <tr
                          key={row.id}
                          onClick={() => setSel(row.id)}
                          className={cn(
                            'cursor-pointer transition-colors',
                            selected?.id === row.id ? 'bg-[#e8edfc]/50' : index % 2 ? 'bg-[#f9fafc]' : '',
                            'hover:bg-[#e8edfc]/50'
                          )}
                        >
                          <td className="px-4 py-4 font-semibold text-primary hover:underline">
                            {row.decisionId}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-neutral-900">{row.clientName}</div>
                            <div className="text-[12px] text-neutral-500 font-mono">{row.clientId}</div>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700">{row.scheme}</td>
                          <td className="px-4 py-4">
                            {getStatusBadge(row.reviewStatus, row.reviewStatusLabel)}
                          </td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700">{row.decisionMakerName}</td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700">{row.dueDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <TablePagination
                page={page}
                totalPages={1}
                onPageChange={(nextPage) => setPage(nextPage)}
                className="mt-5 px-5"
              />
            </section>
          </div>

          {/* Right — selected decision summary */}
          <aside className="flex min-w-0 flex-col gap-5">
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-sm space-y-4">
              <div className="border-b border-[#ececec] pb-3 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                  <AppIcon icon={EyeIcon} size={20} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.decisions.selectedTitle', 'Selected decision')}</h2>
                  {selected && <p className="text-[13px] font-semibold text-primary">{selected.decisionId}</p>}
                </div>
              </div>

              {selected ? (
                <div className="space-y-3.5 text-[13px]">
                  <div>
                    <p className="text-[12px] text-neutral-500 font-medium">{t('cab.decisions.client', 'Client')}</p>
                    <p className="font-semibold text-neutral-900">{selected.clientName}</p>
                    <p className="text-[12px] text-neutral-500 font-mono">{selected.clientId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] text-neutral-500 font-medium">{t('cab.decisions.scheme', 'Scheme')}</p>
                      <p className="font-semibold text-neutral-900">{selected.scheme}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-neutral-500 font-medium">{t('cab.decisions.country', 'Country')}</p>
                      <p className="font-semibold text-neutral-900">{selected.country}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] text-neutral-500 font-medium mb-1">{t('cab.decisions.status', 'Review status')}</p>
                    {getStatusBadge(selected.reviewStatus, selected.reviewStatusLabel)}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] text-neutral-500 font-medium">{t('cab.decisions.received', 'Received')}</p>
                      <p className="font-semibold text-neutral-900">{selected.receivedDate}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-neutral-500 font-medium">{t('cab.decisions.due', 'Due')}</p>
                      <p className="font-semibold text-neutral-900">{selected.dueDate}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] text-neutral-500 font-medium">{t('cab.decisions.decisionMaker', 'Decision maker')}</p>
                    <p className="font-semibold text-neutral-900">{selected.decisionMakerName}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/cab/decisions/${selected.id}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors mt-2"
                  >
                    <AppIcon icon={EyeIcon} size={18} />
                    <span>{t('cab.decisions.openDecision', 'Open decision')}</span>
                  </button>
                </div>
              ) : (
                <p className="py-6 text-center text-[13px] text-neutral-400">
                  {t('cab.decisions.selectPrompt', 'Select a decision from the queue to review its summary.')}
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </CabLayout>
  )
}

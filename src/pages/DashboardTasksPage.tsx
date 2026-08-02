import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { certificationRequestFormPath } from '@/lib/routes'
import { getDashboardTasks } from '@/lib/api/dashboardApi'
import type { DashboardTask, DashboardTaskStatus } from '@/lib/api/dashboardApi'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  matchesSearch,
  type TableColumn,
} from '@/lib/tableTools'
import { cn } from '@/lib/utils'

const statusStyles: Record<DashboardTaskStatus, string> = {
  urgent: 'bg-[#fef3c6] text-[#a58401]',
  underReview: 'bg-[#f3f4f6] text-[#4b5563]',
  pending: 'bg-[#e0e7ff] text-[#1236a3]',
}

const procedureLabelKeys: Record<DashboardTask['taskType'], string> = {
  documentReview: 'dashboard.tasks.openDocument',
  contractProcessing: 'dashboard.tasks.sendContract',
  feeCollection: 'dashboard.tasks.sendMessage',
}

const PAGE_SIZE = 10

export function DashboardTasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDashboardTasks()
      .then((result) => {
        if (!cancelled) setTasks(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchesQuery = matchesSearch(
        [task.applicantName, task.companyCode, t(`dashboard.tasks.type.${task.taskType}`)],
        appliedQuery
      )
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesType = taskTypeFilter === 'all' || task.taskType === taskTypeFilter
      return matchesQuery && matchesStatus && matchesType
    })
  }, [tasks, appliedQuery, statusFilter, taskTypeFilter, t])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportColumns: TableColumn<DashboardTask>[] = [
    { header: t('dashboard.tasks.applicantName'), value: (row) => row.applicantName },
    { header: t('dashboard.tasks.companyCode'), value: (row) => row.companyCode },
    { header: t('dashboard.tasks.taskType'), value: (row) => t(`dashboard.tasks.type.${row.taskType}`) },
    { header: t('dashboard.tasks.statusHeader'), value: (row) => t(`dashboard.tasks.status.${row.status}`) },
    {
      header: t('dashboard.tasks.procedures'),
      value: (row) => t(procedureLabelKeys[row.taskType]),
    },
  ]

  const handleProcedureClick = (task: DashboardTask) => {
    if (task.taskType === 'documentReview') {
      navigate(certificationRequestFormPath(task.id, 'feedback'))
    }
  }

  const handleSearch = () => {
    setPage(1)
    setAppliedQuery(query)
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="dashboard.tasks.title" />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
        <div className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1 sm:max-w-[360px]">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('dashboard.tasks.searchPlaceholder')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="h-11 shrink-0 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white hover:opacity-90"
              >
                {t('dashboard.tasks.search')}
              </button>
              <TableFilterSelect
                label={t('dashboard.tasks.filters.status')}
                value={statusFilter}
                onChange={(value) => {
                  setPage(1)
                  setStatusFilter(value)
                }}
                options={[
                  { value: 'all', label: t('dashboard.tasks.filters.allStatuses') },
                  { value: 'urgent', label: t('dashboard.tasks.status.urgent') },
                  { value: 'underReview', label: t('dashboard.tasks.status.underReview') },
                  { value: 'pending', label: t('dashboard.tasks.status.pending') },
                ]}
              />
              <TableFilterSelect
                label={t('dashboard.tasks.filters.taskType')}
                value={taskTypeFilter}
                onChange={(value) => {
                  setPage(1)
                  setTaskTypeFilter(value)
                }}
                options={[
                  { value: 'all', label: t('dashboard.tasks.filters.allTypes') },
                  { value: 'documentReview', label: t('dashboard.tasks.type.documentReview') },
                  { value: 'contractProcessing', label: t('dashboard.tasks.type.contractProcessing') },
                  { value: 'feeCollection', label: t('dashboard.tasks.type.feeCollection') },
                ]}
              />
              <button
                type="button"
                aria-label={t('common.filter')}
                className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f6fd] text-primary hover:bg-[#e8edfc]"
                onClick={handleSearch}
              >
                <AppIcon icon={FilterFunnelIcon} size={20} />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                disabled={filtered.length === 0}
                onClick={() =>
                  downloadPdfFromTable(
                    'dashboard-tasks.pdf',
                    t('dashboard.tasks.title'),
                    exportColumns,
                    filtered
                  )
                }
                className="flex h-13 items-center gap-2 rounded-[8px] border-2 border-[#1236A3] px-4 text-[14px] font-medium disabled:opacity-50"
              >
                <AppIcon icon={PdfFileIcon} size={26} />
                {t('dashboard.tasks.downloadPdf')}
              </button>
              <button
                type="button"
                disabled={filtered.length === 0}
                onClick={() => downloadExcelCsv('dashboard-tasks.csv', exportColumns, filtered)}
                className="flex h-13 items-center gap-2 rounded-[8px] border-2 border-[#1236A3] px-4 text-[14px] font-medium disabled:opacity-50"
              >
                <AppIcon icon={ExcelFileIcon} size={26} />
                {t('dashboard.tasks.exportExcel')}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-center">
              <thead className="border-b border-[#ececec]">
                <tr className="rounded-[10px] bg-[#1236a3] text-white">
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('dashboard.tasks.applicantName')}
                  </th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('dashboard.tasks.taskType')}
                  </th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('dashboard.tasks.statusHeader')}
                  </th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('dashboard.tasks.procedures')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                      —
                    </td>
                  </tr>
                ) : (
                  paginated.map((task, index) => (
                    <tr key={task.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                      <td className="px-4 py-4">
                        <p className="text-[15px] font-medium text-neutral-900">
                          {task.applicantName}
                        </p>
                        <p className="text-[13px] text-neutral-500">
                          {t('dashboard.tasks.companyCode')} {task.companyCode}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[15px] text-neutral-700">
                        {t(`dashboard.tasks.type.${task.taskType}`)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex w-[126px] items-center justify-center rounded-[6px] px-3 py-1.5 text-[13px] font-medium',
                            statusStyles[task.status]
                          )}
                        >
                          {t(`dashboard.tasks.status.${task.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleProcedureClick(task)}
                          className="text-[14px] font-medium text-primary hover:underline"
                        >
                          {t(procedureLabelKeys[task.taskType])}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}

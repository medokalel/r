import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { getDashboardTasks } from '@/lib/api/dashboardApi'
import type { DashboardTask, DashboardTaskStatus } from '@/lib/api/dashboardApi'
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

export function DashboardTasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleProcedureClick = (task: DashboardTask) => {
    // Document-review tasks map to the application feedback view;
    // other task types don't have a dedicated page yet.
    if (task.taskType === 'documentReview') {
      navigate(`/certification-request/new?id=${task.id}&view=feedback`)
    }
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="dashboard.tasks.title" />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
        <div className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5">
          {/* Toolbar: search + filter on one side, export actions on the other.
              TODO: not wired to real data/backend yet — search/filter/pagination
              are visual only for now, and PDF/Excel export have no handler until
              the backend endpoints and an export library are decided. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative min-w-[240px] flex-1 sm:flex-none sm:w-[360px]">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  type="text"
                  placeholder={t('dashboard.tasks.searchPlaceholder')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="button"
                className="h-11 shrink-0 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white hover:opacity-90"
              >
                {t('dashboard.tasks.search')}
              </button>
              <button
                type="button"
                aria-label={t('common.filter')}
                className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f6fd] text-primary hover:bg-[#e8edfc]"
              >
                <AppIcon icon={FilterFunnelIcon} size={20} />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                className="flex h-13 items-center gap-2 rounded-[8px] border-2 border-[#1236A3] px-4 text-[14px] font-medium"
              >
                <AppIcon icon={PdfFileIcon} size={26} />
                {t('dashboard.tasks.downloadPdf')}
              </button>
              <button
                type="button"
                className="flex h-13 items-center gap-2 rounded-[8px] border-2 border-[#1236A3] px-4 text-[14px] font-medium"
              >
                <AppIcon icon={ExcelFileIcon} size={26} />
                {t('dashboard.tasks.exportExcel')}
              </button>
            </div>
          </div>

          {/* Table */}
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
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                      —
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, index) => (
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

          {/* Pagination — static display for now (see TODO above) */}
          {!loading && tasks.length > 0 && (
            <div className="flex items-center justify-end gap-4 pt-2">
              <button type="button" className="text-[14px] font-medium text-primary">
                {t('dashboard.tasks.next')}
              </button>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full border text-[14px] font-medium',
                      page === 1
                        ? 'border-primary bg-primary text-white'
                        : 'border-[#c7d2fe] text-primary hover:bg-[#f3f6fd]'
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button type="button" className="text-[14px] font-medium text-neutral-500">
                {t('dashboard.tasks.previous')}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
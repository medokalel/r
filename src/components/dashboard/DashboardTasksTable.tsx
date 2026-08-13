import { useTranslation } from 'react-i18next'
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

interface DashboardTasksTableProps {
  tasks: DashboardTask[]
  loading: boolean
  onViewAll?: () => void
  onProcedureClick?: (task: DashboardTask) => void
}

export function DashboardTasksTable({
  tasks,
  loading,
  onViewAll,
  onProcedureClick,
}: DashboardTasksTableProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
      <div className="mb-5 mt-1 mx-5 flex items-center justify-between">
        <h2 className="text-[24px] font-semibold text-neutral-900">
          {t('dashboard.tasks.title')}
        </h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[16px] font-medium text-primary hover:underline"
          >
            {t('dashboard.tasks.viewAll')}
          </button>
        )}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-center">
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
                <tr
                  key={task.id}
                  className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}
                >
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
                      onClick={() => onProcedureClick?.(task)}
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

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 px-5 md:hidden">
        {loading ? (
          <p className="py-6 text-center text-neutral-500">{t('common.loading')}</p>
        ) : tasks.length === 0 ? (
          <p className="py-6 text-center text-neutral-500">—</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="rounded-[12px] border border-[#ececec] p-4">
              <p className="text-[15px] font-medium text-neutral-900">{task.applicantName}</p>
              <p className="text-[13px] text-neutral-500">
                {t('dashboard.tasks.companyCode')} {task.companyCode}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[14px] text-neutral-700">
                  {t(`dashboard.tasks.type.${task.taskType}`)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-[6px] px-3 py-1.5 text-[13px] font-medium',
                    statusStyles[task.status]
                  )}
                >
                  {t(`dashboard.tasks.status.${task.status}`)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onProcedureClick?.(task)}
                className="mt-3 text-[14px] font-medium text-primary hover:underline"
              >
                {t(procedureLabelKeys[task.taskType])} →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
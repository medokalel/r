import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  EyeIcon,
  PendingBurstIcon,
  ShieldIcon,
  UserIcon,
  WalletIcon,
} from '@/components/icons'
import { CardFooterLink } from '@/components/ui/CardFooterLink'
import { cn } from '@/lib/utils'

export interface SalesHubMetrics {
  openCount: number
  unassignedOpenCount: number
  pipelineValueSar: number
  weightedForecastSar: number
  weightedPct: number
  winRatePct: number
  wonCount: number
  lostCount: number
  needsActionCount: number
}

interface SalesHubKpiCardsProps {
  metrics: SalesHubMetrics
  onViewPipeline: () => void
  onViewList: () => void
}

const cardClassName =
  'flex flex-col gap-3 rounded-[16px] border border-[#ececec] bg-white p-4'

export function SalesHubKpiCards({
  metrics,
  onViewPipeline,
  onViewList,
}: SalesHubKpiCardsProps) {
  const { t } = useTranslation()
  const sar = t('cab.salesHub.currencySar', 'SAR')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Open leads */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-neutral-700">
            {t('cab.salesHub.kpi.openLeads', 'Open leads')}
          </p>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe]">
            <AppIcon icon={UserIcon} size={20} className="text-[#1447e6]" />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none text-neutral-900">
            {metrics.openCount.toLocaleString()}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-[12px] text-neutral-500">
            {metrics.unassignedOpenCount > 0
              ? t('cab.salesHub.kpi.unassignedLeads', {
                  count: metrics.unassignedOpenCount,
                  defaultValue: `${metrics.unassignedOpenCount} unassigned`,
                })
              : t('cab.salesHub.kpi.everyLeadHasOwner', 'Every lead has an owner')}
          </span>
          <CardFooterLink
            label={t('cab.salesHub.kpi.viewPipeline', 'View pipeline')}
            onClick={onViewPipeline}
          />
        </div>
      </div>

      {/* 2. Pipeline value */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-neutral-700">
            {t('cab.salesHub.kpi.pipelineValue', 'Pipeline value')}
          </p>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe]">
            <AppIcon icon={WalletIcon} size={20} className="text-[#1447e6]" />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none text-neutral-900">
            {metrics.pipelineValueSar.toLocaleString()}
          </span>
          <span className="text-[13px] text-neutral-500">{sar}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-[12px] text-neutral-500">
            {metrics.pipelineValueSar > 0
              ? t('cab.salesHub.kpi.activePipelineLeads', {
                  count: metrics.openCount,
                  defaultValue: `Across ${metrics.openCount} open leads`,
                })
              : t('cab.salesHub.kpi.noValuesYet', 'No values yet')}
          </span>
          <CardFooterLink
            label={t('cab.salesHub.kpi.viewList', 'View list')}
            onClick={onViewList}
          />
        </div>
      </div>

      {/* 3. Weighted forecast */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-neutral-700">
            {t('cab.salesHub.kpi.weightedForecast', 'Weighted forecast')}
          </p>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#d7f4f0]">
            <AppIcon
              icon={PendingBurstIcon}
              size={20}
              className="text-[#0f9488]"
            />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none text-neutral-900">
            {metrics.weightedForecastSar.toLocaleString()}
          </span>
          <span className="text-[13px] text-neutral-500">{sar}</span>
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.weightedPct)}%` }}
            />
          </div>
          <p className="text-[12px] leading-snug text-neutral-500">
            {t('cab.salesHub.kpi.weightedSubtitle', {
              pct: metrics.weightedPct,
              defaultValue: `${metrics.weightedPct}% of pipeline value, weighted by stage`,
            })}
          </p>
        </div>
      </div>

      {/* 4. Win rate */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-neutral-700">
            {t('cab.salesHub.kpi.winRate', 'Win rate')}
          </p>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#d7f4f0]">
            <AppIcon icon={ShieldIcon} size={20} className="text-[#0f9488]" />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none text-neutral-900">
            {metrics.winRatePct}%
          </span>
        </div>
        <p className="mt-auto text-[12px] font-medium text-primary">
          {t('cab.salesHub.kpi.wonLostSummary', {
            won: metrics.wonCount,
            lost: metrics.lostCount,
            defaultValue: `Won ${metrics.wonCount} · Lost ${metrics.lostCount}`,
          })}
        </p>
      </div>

      {/* 5. Needs action */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-neutral-700">
            {t('cab.salesHub.kpi.needsAction', 'Needs action')}
          </p>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fef3c6]">
            <AppIcon icon={EyeIcon} size={20} className="text-[#a58401]" />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none text-neutral-900">
            {metrics.needsActionCount}
          </span>
        </div>
        <p
          className={cn(
            'mt-auto text-[12px] font-medium',
            metrics.needsActionCount > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]',
          )}
        >
          {metrics.needsActionCount > 0
            ? t('cab.salesHub.kpi.overdueCount', {
                count: metrics.needsActionCount,
                defaultValue: `${metrics.needsActionCount} overdue`,
              })
            : t('cab.salesHub.kpi.nothingOverdue', 'Nothing overdue')}
        </p>
      </div>
    </div>
  )
}

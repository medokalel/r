import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddSiteModal } from '@/components/dashboard/cab/AddSiteModal'
import {
  AppIcon,
  AddCircleIcon,
  BuildingsIcon,
  DashboardGridIcon,
  EditIcon,
  GlobeIcon,
  TrashIcon,
  UsersIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { Site, SitesFacilitiesForm } from '@/lib/sitesFacilitiesForm'
import { cn } from '@/lib/utils'

interface SitesFacilitiesStepProps {
  form: SitesFacilitiesForm
  onPatch: (f: Partial<SitesFacilitiesForm>) => void
}

const PAGE_SIZE = 3

export function SitesFacilitiesStep({ form, onPatch }: SitesFacilitiesStepProps) {
  const { t } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [page, setPage] = useState(1)

  const addSite = (site: Site) => onPatch({ sites: [...form.sites, site] })
  const removeSite = (id: string) => onPatch({ sites: form.sites.filter((s) => s.id !== id) })

  const totalEmployees = useMemo(
    () => form.sites.reduce((sum, s) => sum + s.employees, 0),
    [form.sites]
  )
  const countries = useMemo(
    () => new Set(form.sites.map((s) => s.country).filter(Boolean)),
    [form.sites]
  )
  const allActivities = useMemo(
    () => Array.from(new Set(form.sites.flatMap((s) => s.activities))),
    [form.sites]
  )

  const statCards = [
    {
      key: 'totalSites',
      value: form.sites.length,
      icon: BuildingsIcon,
      bgColor: 'bg-[#e8edfc]',
      iconColor: 'text-primary',
    },
    {
      key: 'totalEmployees',
      value: totalEmployees,
      icon: UsersIcon,
      bgColor: 'bg-[#d7f4f0]',
      iconColor: 'text-[#0f9488]',
    },
    {
      key: 'countries',
      value: countries.size,
      icon: GlobeIcon,
      bgColor: 'bg-[#ede9fe]',
      iconColor: 'text-[#6d28d9]',
    },
    {
      key: 'activitiesScope',
      value: allActivities.length,
      icon: DashboardGridIcon,
      bgColor: 'bg-[#dbeafe]',
      iconColor: 'text-[#1447e6]',
    },
  ] as const

  const totalPages = Math.max(1, Math.ceil(form.sites.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageSites = form.sites.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="space-y-5">
      <SectionHeading
        title={t('cab.applicationDraft.sitesFacilities.title')}
        accordion
        headerActions={
          <Button
            type="button"
            variant="secondary"
            className="h-9 gap-2 rounded-[var(--radius-sm)] px-4"
            onClick={() => setIsAddOpen(true)}
          >
            <AppIcon icon={AddCircleIcon} size={18} />
            {t('cab.applicationDraft.sitesFacilities.addNewSite')}
          </Button>
        }
      >
        <p className="mb-4 text-[14px] text-neutral-500">
          {t('cab.applicationDraft.sitesFacilities.subtitle')}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map(({ key, value, icon, bgColor, iconColor }) => (
            <div key={key} className="flex flex-col gap-3 rounded-[16px] border border-[#ececec] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[28px] font-bold leading-none text-neutral-900">{value}</span>
                <span className={cn('flex size-10 items-center justify-center rounded-[10px]', bgColor)}>
                  <AppIcon icon={icon} size={20} className={iconColor} />
                </span>
              </div>
              <p className="text-[14px] font-medium text-neutral-700">
                {t(`cab.applicationDraft.sitesFacilities.stats.${key}`)}
              </p>
            </div>
          ))}
        </div>

        {form.sites.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.empty')}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[#ececec]">
              <table className="w-full min-w-[900px] border-collapse text-start">
                <thead>
                  <tr className="bg-[#f9fafc] text-[13px] text-neutral-500">
                    <th className="w-12 px-4 py-3 text-start font-medium">#</th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.siteNameLocation')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.address')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.siteActivitiesScope')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.employees')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.primaryContact')}
                    </th>
                    <th className="w-20 px-4 py-3 text-start font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageSites.map((site, index) => (
                    <tr key={site.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]', 'border-t border-[#ececec]')}>
                      <td className="px-4 py-4 align-top text-[14px] text-neutral-500">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-[14px] font-semibold text-neutral-900">{site.name}</p>
                        <span className="mt-1 inline-block rounded-[6px] bg-[#e8edfc] px-2 py-0.5 text-[12px] font-medium text-primary">
                          {site.siteType}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-[14px] text-neutral-700">{site.address}</td>
                      <td className="px-4 py-4 align-top">
                        <ul className="space-y-0.5">
                          {site.activities.map((activity) => (
                            <li key={activity} className="text-[13px] text-neutral-700">
                              • {activity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-4 align-top text-[14px] text-neutral-700">{site.employees}</td>
                      <td className="px-4 py-4 align-top text-[13px] text-neutral-700">
                        <p className="font-medium text-neutral-900">{site.contact.name}</p>
                        <p>{site.contact.phone}</p>
                        <p className="text-primary">{site.contact.email}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-neutral-400 hover:text-primary"
                            aria-label={t('common.edit')}
                          >
                            <AppIcon icon={EditIcon} size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSite(site.id)}
                            className="text-error-400 hover:text-error-600"
                            aria-label={t('common.delete')}
                          >
                            <AppIcon icon={TrashIcon} size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.showing', {
                  from: pageStart + 1,
                  to: pageStart + pageSites.length,
                  total: form.sites.length,
                })}
              </p>
              <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </SectionHeading>

      {allActivities.length > 0 && (
        <SectionHeading
          title={t('cab.applicationDraft.sitesFacilities.activitiesCovered.title')}
          accordion
        >
          <p className="mb-4 text-[14px] text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.activitiesCovered.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            {allActivities.map((activity) => (
              <span
                key={activity}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-[#f3f6fd] px-4 py-2 text-[14px] font-medium text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.5 2.5 5-5" />
                </svg>
                {activity}
              </span>
            ))}
          </div>
        </SectionHeading>
      )}

      <AddSiteModal open={isAddOpen} onOpenChange={setIsAddOpen} onAdd={addSite} />
    </div>
  )
}
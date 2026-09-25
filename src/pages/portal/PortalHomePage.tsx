import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePortalHomeTourSteps } from '@/config/portalHomeTourSteps'
import { PageHeaderWithAction } from '@/components/dashboard/PageHeaderWithAction'
import {
  AppIcon,
  CalendarIcon,
  FileTextIcon,
  EditIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  UsersIcon,
  CorrectiveActionIcon,
  BuildingsIcon,
  ArrowRightIcon,
} from '@/components/icons'
import { getStoredPortalProfile, type ClientProfile } from '@/lib/api/portalApi'
import { cn } from '@/lib/utils'

export function PortalHomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = usePortalHomeTourSteps()
  const [profile] = useState<ClientProfile>(getStoredPortalProfile())

  return (
    <PortalLayout
      tourId="portal-home-tour"
      tourSteps={tourSteps}
      title={t('portal.title', 'Client Portal')}
      subtitle={t('portal.home.subtitle', 'Overview of your certification applications, audits, and documents')}
    >
      <div className="flex flex-col gap-5">
        {/* Page Title & Breadcrumb header */}
        <PageHeaderWithAction
          title={t('portal.home.title', 'Client Portal')}
          subtitle={t('portal.home.subtitle', 'Overview of your certification applications, audits, and documents')}
        />

        {/* Hero Client Summary Card */}
        <CabTourStep steps={tourSteps} stepId="portal-home-header">
          <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Logo + Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                {/* Logo Box */}
                <div className="flex flex-col items-center justify-center size-20 sm:size-24 rounded-[12px] border border-[#d8e2f8] bg-[#f4f7fd] p-2 text-center shrink-0">
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="text-[#16a34a]">
                    <path d="M24 4C24 4 12 16 12 28C12 34.6274 17.3726 40 24 40C30.6274 40 36 34.6274 36 28C36 16 24 4 24 4Z" fill="currentColor" fillOpacity="0.8"/>
                    <path d="M24 14V34M24 24L18 20M24 28L30 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[9px] font-extrabold uppercase tracking-tight text-neutral-800 mt-1 leading-none">
                    AL NOOR
                  </span>
                  <span className="text-[7px] text-neutral-500 font-medium tracking-tighter">
                    FOOD INDUSTRIES
                  </span>
                </div>

                {/* Info Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-[20px] sm:text-[22px] font-bold text-neutral-900 leading-tight">
                      {profile.name}
                    </h1>
                    <span className="inline-flex items-center rounded-full bg-[#e8edfc] px-3 py-0.5 text-[12px] font-medium text-primary">
                      {t('portal.home.clientId', 'Client ID')}: {profile.clientCode}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-0.5 text-[12px] font-medium text-[#16a34a]">
                      {t(`portal.home.status.${profile.status.toLowerCase()}`, profile.status)}
                    </span>
                  </div>

                  {/* Metadata items */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-neutral-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={MapPinIcon} size={15} className="text-neutral-400" />
                      <span>{profile.country}</span>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={UserIcon} size={15} className="text-neutral-400" />
                      <span className="text-neutral-500">{t('portal.home.primaryContact', 'Primary:')}</span>
                      <span className="font-semibold text-neutral-800">{profile.primaryContact.name}</span>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={MailIcon} size={15} className="text-neutral-400" />
                      <a href={`mailto:${profile.primaryContact.email}`} className="text-primary hover:underline">
                        {profile.primaryContact.email}
                      </a>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={BuildingsIcon} size={15} className="text-neutral-400" />
                      <span>{profile.industrySector}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Edit profile button */}
              <div className="shrink-0 self-start lg:self-center">
                <button
                  type="button"
                  onClick={() => navigate('/portal/company-profile')}
                  className="flex items-center gap-2 rounded-[8px] border border-primary bg-white px-4 py-2.5 text-[14px] font-medium text-primary hover:bg-primary-subtle transition-colors shadow-sm"
                >
                  <AppIcon icon={EditIcon} size={16} />
                  <span>{t('portal.home.editProfile', 'Edit profile')}</span>
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        {/* 4-Card Action Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Card 1: Application APP-0024 */}
          <CabTourStep steps={tourSteps} stepId="portal-home-application-card">
            <div className="flex flex-col justify-between h-full rounded-[16px] border border-[#ececec] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#dbeafe] text-[#1447e6]">
                      <AppIcon icon={FileTextIcon} size={20} />
                    </span>
                    <h3 className="text-[15px] font-bold text-neutral-900">
                      {t('portal.home.applicationCard.title', 'Application APP-0024')}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-[11px] font-bold text-[#ea580c] border border-[#ffedd5]">
                    {t('portal.home.applicationCard.draft', 'Draft')}
                  </span>
                </div>

                <div className="space-y-2 text-[13px] pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">{t('portal.home.applicationCard.scheme', 'Scheme')}</span>
                    <span className="font-semibold text-neutral-800 text-end">
                      {t('portal.home.applicationCard.foodSafety', 'Food Safety Management')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">{t('portal.home.applicationCard.submitted', 'Submitted')}</span>
                    <span className="text-neutral-400 font-medium">—</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">{t('portal.home.applicationCard.lastUpdated', 'Last updated')}</span>
                    <span className="font-semibold text-neutral-700">
                      {t('portal.home.applicationCard.date', '12 Mar 2025')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/certification-requests')}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-[14px] font-medium text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span>{t('portal.home.applicationCard.continue', 'Continue application')}</span>
                  <AppIcon icon={ArrowRightIcon} size={15} className="rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/certification-requests')}
                  className="w-full text-center text-[13px] font-medium text-primary hover:underline py-1 transition-colors"
                >
                  {t('portal.home.applicationCard.view', 'View application')}
                </button>
              </div>
            </div>
          </CabTourStep>

          {/* Card 2: Clarification action required */}
          <CabTourStep steps={tourSteps} stepId="portal-home-clarification-card">
            <div className="flex flex-col justify-between h-full rounded-[16px] border border-[#fecaca] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#fee2e2] text-[#dc2626]">
                    <AppIcon icon={CorrectiveActionIcon} size={20} />
                  </span>
                  <h3 className="text-[15px] font-bold text-neutral-900">
                    {t('portal.home.clarificationCard.title', 'Clarification required')}
                  </h3>
                </div>

                <p className="text-[13px] text-neutral-600 leading-relaxed">
                  {t('portal.home.clarificationCard.desc', 'We need additional information to proceed with your application APP-0024.')}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/certification-requests')}
                  className="flex h-10 w-full items-center justify-center rounded-[8px] border border-primary bg-white text-[14px] font-medium text-primary hover:bg-primary-subtle transition-colors shadow-sm"
                >
                  {t('portal.home.clarificationCard.viewBtn', 'View requested info')}
                </button>
                <div className="flex items-center justify-between text-[13px] px-1">
                  <span className="text-neutral-500 font-medium">{t('portal.home.clarificationCard.dueDate', 'Due date')}</span>
                  <span className="font-bold text-[#dc2626]">
                    {t('portal.home.clarificationCard.dueDateVal', '20 Mar 2025')}
                  </span>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Card 3: Upcoming audit */}
          <CabTourStep steps={tourSteps} stepId="portal-home-audit-card">
            <div className="flex flex-col justify-between h-full rounded-[16px] border border-[#ececec] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#d7f4f0] text-[#0f9488]">
                    <AppIcon icon={CalendarIcon} size={20} />
                  </span>
                  <h3 className="text-[15px] font-bold text-neutral-900">
                    {t('portal.home.auditCard.title', 'Upcoming audit')}
                  </h3>
                </div>

                <div className="space-y-1.5 text-[13px]">
                  <p className="font-bold text-neutral-900">
                    {t('portal.home.auditCard.stage', 'Stage 1 Audit')}
                  </p>
                  <p className="flex items-center gap-1.5 text-neutral-600 font-medium">
                    <AppIcon icon={CalendarIcon} size={14} className="text-neutral-400" />
                    <span>{t('portal.home.auditCard.date', '28 Apr 2025')}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-neutral-600 font-medium">
                    <AppIcon icon={MapPinIcon} size={14} className="text-neutral-400" />
                    <span>{t('portal.home.auditCard.location', 'Riyadh, Saudi Arabia')}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/portal/audits')}
                  className="flex h-10 w-full items-center justify-center rounded-[8px] border border-primary bg-white text-[14px] font-medium text-primary hover:bg-primary-subtle transition-colors shadow-sm"
                >
                  {t('portal.home.auditCard.viewBtn', 'View audit details')}
                </button>
              </div>
            </div>
          </CabTourStep>

          {/* Card 4: Documents */}
          <div className="flex flex-col justify-between h-full rounded-[16px] border border-[#ececec] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#ede9fe] text-[#6d28d9]">
                  <AppIcon icon={FileTextIcon} size={20} />
                </span>
                <h3 className="text-[15px] font-bold text-neutral-900">
                  {t('portal.home.docsCard.title', 'Documents')}
                </h3>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <AppIcon icon={FileTextIcon} size={14} className="text-neutral-400" />
                    {t('portal.home.docsCard.uploadedByYou', 'Uploaded by you')}
                  </span>
                  <span className="font-bold text-primary bg-[#e8edfc] px-2 py-0.5 rounded-full text-[12px]">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <AppIcon icon={FileTextIcon} size={14} className="text-[#dc2626]" />
                    {t('portal.home.docsCard.requestedByUs', 'Requested by us')}
                  </span>
                  <span className="font-bold text-[#dc2626] bg-[#fee2e2] px-2 py-0.5 rounded-full text-[12px]">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <AppIcon icon={UsersIcon} size={14} className="text-neutral-400" />
                    {t('portal.home.docsCard.sharedWithYou', 'Shared with you')}
                  </span>
                  <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full text-[12px]">5</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/portal/company-profile')}
                className="flex h-10 w-full items-center justify-center rounded-[8px] border border-primary bg-white text-[14px] font-medium text-primary hover:bg-primary-subtle transition-colors shadow-sm"
              >
                {t('portal.home.docsCard.viewBtn', 'View all documents')}
              </button>
            </div>
          </div>
        </section>

        {/* Bottom 2-Column Section */}
        <CabTourStep steps={tourSteps} stepId="portal-home-activity-contacts">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 7 cols: Recent activity */}
            <div className="lg:col-span-7 flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-neutral-900">
                    {t('portal.home.recentActivity.title', 'Recent activity')}
                  </h2>
                </div>
                <button type="button" className="text-[13px] font-semibold text-primary hover:underline">
                  {t('portal.home.recentActivity.viewAll', 'View all')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="py-3 px-5 font-medium text-start text-[13px]">
                        {t('portal.home.recentActivity.colDate', 'Date')}
                      </th>
                      <th className="py-3 px-5 font-medium text-start text-[13px]">
                        {t('portal.home.recentActivity.colDetails', 'Details')}
                      </th>
                      <th className="py-3 px-5 font-medium text-end text-[13px]">
                        {t('portal.home.recentActivity.colRelatedTo', 'Related to')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {profile.recentActivity.map((act, idx) => (
                      <tr key={act.id} className={cn('transition-colors hover:bg-[#f4f7fd]', idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}>
                        <td className="py-3.5 px-5 text-neutral-500 font-medium whitespace-nowrap">
                          {act.date}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px]',
                              act.type === 'alert' ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#e8edfc] text-primary'
                            )}>
                              {act.type === 'edit' && '✏️'}
                              {act.type === 'alert' && '⚠️'}
                              {act.type === 'upload' && '📄'}
                              {act.type === 'create' && '➕'}
                            </span>
                            <span className="font-medium text-neutral-800">{act.details}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-end font-semibold text-primary whitespace-nowrap">
                          <button type="button" onClick={() => navigate('/certification-requests')} className="hover:underline font-bold text-primary">
                            {act.relatedTo}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 cols: Your contacts at CAB */}
            <div className="lg:col-span-5 flex flex-col rounded-[16px] border border-[#ececec] bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-[18px] font-bold text-neutral-900">
                  {t('portal.home.contacts.title', 'Your contacts at CAB')}
                </h2>
              </div>

              <div className="space-y-3">
                {profile.cabContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start gap-3.5 rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-3.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm">
                      {contact.initials}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-neutral-900 leading-tight">
                        {contact.name}
                      </p>
                      <p className="text-[12px] text-neutral-500 font-medium">
                        {contact.role}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 pt-1 text-[12px]">
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1.5 text-primary font-medium hover:underline truncate"
                        >
                          <AppIcon icon={MailIcon} size={13} className="shrink-0 text-neutral-400" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 whitespace-nowrap"
                        >
                          <AppIcon icon={PhoneIcon} size={13} className="text-neutral-400 shrink-0" />
                          <span>{contact.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </CabTourStep>
      </div>
    </PortalLayout>
  )
}

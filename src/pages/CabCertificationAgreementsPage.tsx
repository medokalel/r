import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  AddCircleIcon,
  AppIcon,
  CheckIcon,
  DashboardIcon,
  EyeIcon,
  FileTextIcon,
  HistoryIcon,
  MenuRowsIcon,
  SearchIcon,
  SettingsIcon,
  SuccessCircleIcon,
} from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { CardFooterLink } from '@/components/ui/CardFooterLink'
import { SelectField } from '@/components/ui/Select'
import {
  ELIGIBLE_CLIENT_OFFERS,
  generateCertificationAgreement,
  listCertificationAgreements,
  type CertificationAgreement,
  type CertificationAgreementStatus,
} from '@/lib/api/cabCertificationAgreementsApi'
import { ROUTES, cabCertificationAgreementDetailsPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const STATUS_BADGE_STYLES: Record<CertificationAgreementStatus, string> = {
  draft: 'bg-[#f1f5f9] text-[#475569]',
  sent: 'bg-[#fef9c3] text-[#a16207]',
  signed_by_client: 'bg-[#e8edfc] text-primary',
  active: 'bg-[#dcfce7] text-[#15803d]',
}

export function CabCertificationAgreementsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = Boolean(i18n.language?.startsWith('ar'))

  const [agreements, setAgreements] = useState<CertificationAgreement[]>(() => listCertificationAgreements())
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showGenerator, setShowGenerator] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(ELIGIBLE_CLIENT_OFFERS[0]?.clientId ?? '')

  const counts = useMemo(
    () => ({
      draft: agreements.filter((a) => a.status === 'draft').length,
      sent: agreements.filter((a) => a.status === 'sent').length,
      signed_by_client: agreements.filter((a) => a.status === 'signed_by_client').length,
      active: agreements.filter((a) => a.status === 'active').length,
    }),
    [agreements],
  )

  const filteredAgreements = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agreements.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true
      return (
        item.reference.toLowerCase().includes(q) ||
        item.values.clientLegalNameEn.toLowerCase().includes(q) ||
        item.values.clientLegalNameAr.toLowerCase().includes(q) ||
        item.values.offerRef.toLowerCase().includes(q) ||
        item.values.standards.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [agreements, search, statusFilter])

  const getStatusLabel = (status: CertificationAgreementStatus) =>
    status === 'draft' ? (isAr ? 'مسودة' : 'Draft') : status === 'sent' ? (isAr ? 'مُرسلة للعميل' : 'Sent') : status === 'signed_by_client' ? (isAr ? 'موقعة من العميل' : 'Signed by client') : (isAr ? 'سارية ونشطة' : 'Active')

  const getNextStepLabel = (status: CertificationAgreementStatus) =>
    status === 'draft' ? (isAr ? 'مراجعة وإرسال للعميل' : 'Review and send') : status === 'sent' ? (isAr ? 'بانتظار توقيع العميل' : 'Await client signature') : status === 'signed_by_client' ? (isAr ? 'التوقيع المشترك والتفعيل' : 'Countersign agreement') : (isAr ? 'سارية المفعول' : 'In force')

  const handleGenerate = () => {
    if (!selectedClientId) return
    const created = generateCertificationAgreement(selectedClientId)
    setAgreements(listCertificationAgreements())
    setShowGenerator(false)
    navigate(cabCertificationAgreementDetailsPath(created.id))
  }

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const selectedOfferPreview = useMemo(() => ELIGIBLE_CLIENT_OFFERS.find((c) => c.clientId === selectedClientId), [selectedClientId])

  const kpiCards = [
    { key: 'draft' as const, label: isAr ? 'مسودات للإرسال' : 'Drafts to send', sub: isAr ? 'جاهزة للمراجعة والإرسال' : 'Ready to review and send', count: counts.draft, icon: FileTextIcon, iconBg: 'bg-[#dbeafe]', iconColor: 'text-[#1447e6]' },
    { key: 'sent' as const, label: isAr ? 'بانتظار توقيع العميل' : 'Waiting for client', sub: isAr ? 'أُرسلت لبوابة العميل' : 'Sent to client portal', count: counts.sent, icon: HistoryIcon, iconBg: 'bg-[#fef3c6]', iconColor: 'text-[#b45309]' },
    { key: 'signed_by_client' as const, label: isAr ? 'بانتظار التوقيع المشترك' : 'To countersign', sub: isAr ? 'وقّعها العميل إلكترونياً' : 'Signed by client signatory', count: counts.signed_by_client, icon: CheckIcon, iconBg: 'bg-[#d7f4f0]', iconColor: 'text-[#0f9488]' },
    { key: 'active' as const, label: isAr ? 'سارية ونشطة' : 'Active', sub: isAr ? 'معتمدة وسارية المفعول' : 'Countersigned & in force', count: counts.active, icon: SuccessCircleIcon, iconBg: 'bg-[#dcfce7]', iconColor: 'text-[#15803d]' },
  ]

  return (
    <CabLayout>
      <CabHeader title={t('cab.certificationAgreements.title', 'Certification agreements')} notificationCount={3} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">{isAr ? 'مركز التطبيقات' : 'Application Hub'}</Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">{isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'}</h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {isAr ? 'الاتفاقيات القانونية الملزمة مع كل عميل (ISO/IEC 17021-1 البند 5.1.2): تُنشأ تلقائياً عند قبول العرض وتُوقع إلكترونياً من الطرفين.' : 'The legally enforceable agreement with each client (ISO/IEC 17021-1 clause 5.1.2): drafted when the client accepts the offer, signed electronically by both parties.'}
            </p>
          </div>
          <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.cabAgreementTerms)} icon={<AppIcon icon={SettingsIcon} size={18} />} className="whitespace-nowrap">
              {isAr ? 'شروط الاتفاقية' : 'Agreement terms'}
            </Button>
            <Button type="button" variant="primary" onClick={() => setShowGenerator((p) => !p)} icon={<AppIcon icon={AddCircleIcon} size={20} />} className="whitespace-nowrap">
              {isAr ? 'إنشاء اتفاقية' : 'Generate agreement'}
            </Button>
          </div>
        </div>

        {showGenerator && (
          <section className="rounded-[16px] border-2 border-primary bg-[#f8faff] p-5 shadow-sm">
            <div className="border-b border-[#dbe6ff] pb-3.5">
              <h2 className="text-[16px] font-bold text-neutral-900">{isAr ? 'إنشاء مسودة اتفاقية منح شهادة' : 'Generate certification agreement'}</h2>
              <p className="mt-1 text-[13px] text-neutral-500">{isAr ? 'تُبنى المسودة تلقائياً باستخدام قالب شروط الاتفاقية المعتمد وآخر عرض سعر مقبول للعميل، ويمكنك تعديلها قبل الإرسال.' : "The draft uses your agreement terms and the client's latest accepted offer. You can edit it before sending."}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
              <div className="space-y-1.5 lg:col-span-5">
                <label className="block text-[13px] font-semibold text-neutral-800">{isAr ? 'العميل' : 'Client'}</label>
                <SelectField value={selectedClientId} onChange={setSelectedClientId} className="h-11 bg-white" options={ELIGIBLE_CLIENT_OFFERS.map((c) => ({ value: c.clientId, label: `${isAr ? c.clientLegalNameAr : c.clientLegalNameEn} (${c.offerRef})` }))} />
              </div>
              {selectedOfferPreview && (
                <div className="flex flex-wrap items-center gap-4 rounded-[12px] border border-[#dbe6ff] bg-white px-4 py-2.5 lg:col-span-5">
                  <div>
                    <p className="text-[11px] text-neutral-400">{isAr ? 'العرض المقبول' : 'Accepted offer'}</p>
                    <p className="text-[13px] font-bold text-neutral-900">{selectedOfferPreview.offerRef}</p>
                  </div>
                  <div className="h-7 w-px bg-[#ececec]" />
                  <div>
                    <p className="text-[11px] text-neutral-400">{isAr ? 'إجمالي الرسوم' : 'Total fee'}</p>
                    <p className="text-[13px] font-bold text-primary">{isAr ? selectedOfferPreview.totalFeeAr : selectedOfferPreview.totalFeeEn}</p>
                  </div>
                  <div className="h-7 w-px bg-[#ececec]" />
                  <div>
                    <p className="text-[11px] text-neutral-400">{isAr ? 'المواصفات' : 'Standards'}</p>
                    <p className="text-[12px] font-semibold text-neutral-800">{selectedOfferPreview.standards.join(', ')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-2.5 lg:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowGenerator(false)} className="h-11 rounded-[10px] px-4 text-[13px]">{isAr ? 'إلغاء' : 'Cancel'}</Button>
                <Button type="button" variant="primary" onClick={handleGenerate} icon={<AppIcon icon={CheckIcon} size={17} />} className="h-11 rounded-[10px] px-5 text-[13px]">{isAr ? 'إنشاء' : 'Generate'}</Button>
              </div>
            </div>
          </section>
        )}

        {/* iCASCO 4 KPI Cards (Matches SalesHubKpiCards standard) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => {
            const isSelected = statusFilter === card.key
            return (
              <div key={card.key} className={cn('flex flex-col gap-3 rounded-[16px] border bg-white p-4 transition-all', isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-[#ececec]')}>
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-medium text-neutral-700">{card.label}</p>
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-[10px]', card.iconBg)}>
                    <AppIcon icon={card.icon} size={20} className={card.iconColor} />
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-bold leading-none text-neutral-900">{card.count}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-[12px] text-neutral-500">{card.sub}</span>
                  <CardFooterLink
                    label={isSelected ? (isAr ? 'عرض الكل' : 'Show all') : (isAr ? 'تصفية' : 'Filter')}
                    onClick={() => setStatusFilter(isSelected ? 'all' : card.key)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Separate iCASCO Filters Card */}
        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <label htmlFor="agreements-search" className="text-[13px] font-semibold text-neutral-700">
                {isAr ? 'البحث في الاتفاقيات' : 'Search agreements'}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  id="agreements-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث برقم المرجع أو اسم العميل أو المواصفة...' : 'Search reference, client or standard...'}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">{isAr ? 'الحالة' : 'Status'}</span>
              <SelectField
                value={statusFilter}
                onChange={setStatusFilter}
                className="h-11"
                options={[
                  { value: 'all', label: isAr ? 'جميع الحالات' : 'All statuses' },
                  { value: 'draft', label: isAr ? 'مسودة' : 'Draft' },
                  { value: 'sent', label: isAr ? 'مُرسلة للعميل' : 'Sent' },
                  { value: 'signed_by_client', label: isAr ? 'موقعة من العميل' : 'Signed by client' },
                  { value: 'active', label: isAr ? 'سارية ونشطة' : 'Active' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">{isAr ? 'طريقة العرض' : 'View'}</span>
              <div className="inline-flex h-11 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
                {(['list', 'pipeline'] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)} className={cn('inline-flex h-full items-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors', viewMode === mode ? 'bg-[#1236a3] text-white shadow-xs' : 'text-neutral-600 hover:bg-white hover:text-neutral-900')}>
                    <AppIcon icon={mode === 'list' ? MenuRowsIcon : DashboardIcon} size={15} />
                    <span>{mode === 'list' ? (isAr ? 'قائمة' : 'List') : (isAr ? 'مراحل' : 'Pipeline')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-start lg:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-11 whitespace-nowrap text-[14px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
              >
                {isAr ? 'مسح الفلاتر' : 'Clear filters'}
              </button>
            </div>
          </div>
        </section>

        {/* Separate iCASCO Register Table / Pipeline Card */}
        {viewMode === 'list' ? (
          <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
            <p className="mb-4 px-5 text-[13px] text-neutral-500">
              {isAr ? `إجمالي النتائج: ${filteredAgreements.length} اتفاقية` : `Showing ${filteredAgreements.length} agreement(s)`}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] table-fixed border-collapse text-start">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="w-[14%] px-5 py-4 text-start text-[14px] font-medium whitespace-nowrap">{isAr ? 'المرجع' : 'Reference'}</th>
                    <th className="w-[21%] px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">{isAr ? 'العميل' : 'Client'}</th>
                    <th className="w-[22%] px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">{isAr ? 'المواصفات القياسية' : 'Standards'}</th>
                    <th className="w-[11%] px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="w-[13%] px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">{isAr ? 'الخطوة التالية' : 'Next step'}</th>
                    <th className="w-[11%] px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">{isAr ? 'آخر تحديث' : 'Last change'}</th>
                    <th className="w-[8%] px-5 py-4 text-center text-[14px] font-medium whitespace-nowrap">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] text-[14px]">
                  {filteredAgreements.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(cabCertificationAgreementDetailsPath(item.id))}
                      className={cn('cursor-pointer transition-colors hover:bg-[#e8edfc]/40', index % 2 ? 'bg-[#f9fafc]' : 'bg-white')}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-[15px] text-primary" dir="ltr">{item.reference}</div>
                        <div className="mt-0.5 text-[12px] text-neutral-500">{isAr ? 'اتفاقية منح شهادة' : 'Certification agreement'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="truncate font-medium text-[15px] text-neutral-900">{isAr ? item.values.clientLegalNameAr : item.values.clientLegalNameEn}</div>
                        <div className="mt-0.5 text-[12px] text-neutral-500" dir="ltr">{item.values.offerRef} · {isAr ? item.values.clientCityAr : item.values.clientCityEn}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.values.standards.map((std) => (
                            <span key={std} dir="ltr" className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-medium text-primary whitespace-nowrap">
                              {std}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-start whitespace-nowrap">
                        <span className={cn('inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap', STATUS_BADGE_STYLES[item.status])}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-neutral-700 whitespace-nowrap">{getNextStepLabel(item.status)}</td>
                      <td className="px-4 py-4 text-start text-[13px] text-neutral-600 whitespace-nowrap" dir="ltr">{item.lastChange}</td>
                      <td className="px-5 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(cabCertificationAgreementDetailsPath(item.id))}
                          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                        >
                          <AppIcon icon={EyeIcon} size={15} />
                          <span>{isAr ? 'عرض' : 'View'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAgreements.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-[14px] text-neutral-400">{isAr ? 'لا توجد اتفاقيات مطابقة للبحث' : 'No agreements match your filter'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(['draft', 'sent', 'signed_by_client', 'active'] as CertificationAgreementStatus[]).map((stage) => {
              const stageItems = filteredAgreements.filter((a) => a.status === stage)
              return (
                <div key={stage} className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                    <span className="text-[14px] font-bold text-neutral-900">{getStatusLabel(stage)}</span>
                    <span className={cn('rounded-[4px] px-2.5 py-0.5 text-[12px] font-bold', STATUS_BADGE_STYLES[stage])}>{stageItems.length}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {stageItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => navigate(cabCertificationAgreementDetailsPath(item.id))} className="flex flex-col items-start rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-3.5 text-start transition-all hover:border-primary hover:bg-white">
                        <div className="flex w-full items-center justify-between">
                          <span className="text-[13px] font-bold text-primary" dir="ltr">{item.reference}</span>
                          <span className="text-[11px] text-neutral-500" dir="ltr">{item.values.offerRef}</span>
                        </div>
                        <p className="mt-1.5 text-[14px] font-semibold text-neutral-900">{isAr ? item.values.clientLegalNameAr : item.values.clientLegalNameEn}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.values.standards.map((std) => (
                            <span key={std} dir="ltr" className="rounded-[4px] bg-[#e8edfc] px-2 py-0.5 text-[10px] font-medium text-primary">{std}</span>
                          ))}
                        </div>
                        <div className="mt-3 flex w-full items-center justify-between border-t border-[#ececec] pt-2 text-[11px] text-neutral-500">
                          <span>{getNextStepLabel(item.status)}</span>
                          <span dir="ltr">{item.lastChange}</span>
                        </div>
                      </button>
                    ))}
                    {stageItems.length === 0 && <div className="rounded-[10px] border border-dashed border-[#e2e2e2] py-8 text-center text-[12px] text-neutral-400">{isAr ? 'لا توجد اتفاقيات' : 'No agreements'}</div>}
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </main>
    </CabLayout>
  )
}

export default CabCertificationAgreementsPage

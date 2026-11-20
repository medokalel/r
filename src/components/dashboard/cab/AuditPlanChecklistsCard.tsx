import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { pickLocalized } from '@/lib/auditChecklistForm'
import type { AuditChecklist } from '@/lib/auditChecklistTypes'
import { ROUTES } from '@/lib/routes'

interface AuditPlanChecklistsCardProps {
  allChecklists: AuditChecklist[]
  selectedIds: string[]
  standardName: string
  stage: string
  onChangeSelectedIds: (nextIds: string[]) => void
  onAutoMatch: () => void
}

export function AuditPlanChecklistsCard({
  allChecklists,
  selectedIds,
  standardName,
  stage,
  onChangeSelectedIds,
  onAutoMatch,
}: AuditPlanChecklistsCardProps) {
  const { i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const attached = useMemo(
    () =>
      selectedIds
        .map((id) => allChecklists.find((c) => c.id === id))
        .filter((c): c is AuditChecklist => Boolean(c)),
    [selectedIds, allChecklists]
  )

  const available = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allChecklists.filter((c) => {
      if (c.status === 'ARCHIVED') return false
      if (!q) return true
      return `${c.name} ${c.nameAr} ${c.standardCode} ${c.standardLabel}`
        .toLowerCase()
        .includes(q)
    })
  }, [allChecklists, search])

  const attach = (id: string) => {
    if (!selectedIds.includes(id)) {
      onChangeSelectedIds([...selectedIds, id])
    }
  }

  const detach = (id: string) => {
    onChangeSelectedIds(selectedIds.filter((item) => item !== id))
  }

  const totalItems = attached.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div
      id="audit-plan-checklists"
      className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] pb-3">
        <div>
          <h3 className="text-[16px] font-bold text-neutral-900">
            {isArabic ? 'قوائم التحقق للتدقيق' : 'Audit checklists'}
            <span className="ms-2 inline-flex items-center rounded-full bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-semibold text-[#1236a3]">
              {attached.length} · {totalItems} {isArabic ? 'بند' : 'items'}
            </span>
          </h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {isArabic
              ? `مرتبطة بالمعيار (${standardName}) والمرحلة (${stage}).`
              : `Linked to standard (${standardName}) and stage (${stage}).`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAutoMatch}
            className="inline-flex h-8 items-center rounded-[6px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {isArabic ? 'مطابقة تلقائية' : 'Auto-match'}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex h-8 items-center rounded-[6px] bg-[#1236a3] px-3 text-[12px] font-medium text-white hover:bg-[#0e2a80]"
          >
            {pickerOpen
              ? isArabic
                ? 'إغلاق القائمة'
                : 'Close picker'
              : isArabic
                ? '+ ربط قائمة تحقق'
                : '+ Attach checklist'}
          </button>
          <Link
            to={ROUTES.cabAuditChecklists}
            className="inline-flex h-8 items-center rounded-[6px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-[#1236a3] hover:bg-[#e8edfc]/40"
          >
            {isArabic ? 'إدارة المكتبة' : 'Manage library'}
          </Link>
        </div>
      </div>

      {attached.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#dcdcdc] bg-[#fafafa] p-4 text-center text-[13px] text-neutral-500">
          {isArabic
            ? 'لا توجد قوائم تحقق مربوطة بهذه الخطة بعد. اضغط «ربط قائمة تحقق» أو «مطابقة تلقائية».'
            : 'No checklists attached to this audit plan yet. Click "Attach checklist" or "Auto-match".'}
        </div>
      ) : (
        <ul className="divide-y divide-[#ececec] rounded-[8px] border border-[#ececec]">
          {attached.map((c) => {
            const title = pickLocalized(isArabic, c.name, c.nameAr)
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-neutral-900">
                      {title}
                    </span>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                      {c.standardLabel || c.standardCode}
                    </span>
                    <span
                      className={
                        c.source === 'cab'
                          ? 'rounded bg-[#e8edfc] px-2 py-0.5 text-[11px] font-medium text-[#1236a3]'
                          : 'rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800'
                      }
                    >
                      {c.source === 'cab'
                        ? isArabic
                          ? 'قوائمنا'
                          : 'Our checklist'
                        : isArabic
                          ? 'مكتبة iCASCO'
                          : 'iCASCO library'}
                    </span>
                    {c.isDefault && (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {isArabic ? 'افتراضي' : 'Default'}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {c.items.length} {isArabic ? 'بند' : 'items'} · v{c.version}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`${ROUTES.cabAuditChecklists}?checklist=${encodeURIComponent(c.id)}`}
                    className="text-[12px] font-medium text-[#1236a3] hover:underline"
                  >
                    {isArabic ? 'عرض' : 'View'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => detach(c.id)}
                    className="text-[12px] font-medium text-red-600 hover:underline"
                  >
                    {isArabic ? 'إزالة' : 'Remove'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {pickerOpen && (
        <div className="rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-4 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isArabic
                ? 'ابحث بالاسم أو رمز المواصفة (مثل ISO 9001، ISO 27001)...'
                : 'Search by name or standard (e.g. ISO 9001, ISO 27001)...'
            }
            className="h-9 w-full rounded-[6px] border border-[#dcdcdc] bg-white px-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
          />
          <div className="max-h-64 overflow-y-auto divide-y divide-[#ececec] rounded-[6px] border border-[#e2e2e2] bg-white">
            {available.map((c) => {
              const isAttached = selectedIds.includes(c.id)
              const title = pickLocalized(isArabic, c.name, c.nameAr)
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900 truncate">
                      {title}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {c.standardLabel || c.standardCode} · {c.items.length}{' '}
                      {isArabic ? 'بند' : 'items'} ·{' '}
                      {c.source === 'cab'
                        ? isArabic
                          ? 'قوائمنا'
                          : 'Our checklists'
                        : isArabic
                          ? 'مكتبة iCASCO'
                          : 'iCASCO library'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isAttached}
                    onClick={() => attach(c.id)}
                    className={
                      isAttached
                        ? 'rounded-[6px] bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-400 cursor-default'
                        : 'rounded-[6px] bg-[#1236a3] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[#0e2a80]'
                    }
                  >
                    {isAttached
                      ? isArabic
                        ? 'مربوطة'
                        : 'Attached'
                      : isArabic
                        ? 'ربط'
                        : 'Attach'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CalloutCard, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { ChecklistCard } from '@/components/dashboard/cab/auditChecklists/ChecklistCard'
import { ChecklistDetailPanel } from '@/components/dashboard/cab/auditChecklists/ChecklistDetailPanel'
import { ChecklistTabs } from '@/components/dashboard/cab/auditChecklists/ChecklistTabs'
import { NewChecklistSection } from '@/components/dashboard/cab/auditChecklists/NewChecklistSection'
import { AppIcon, CorrectiveActionIcon, SearchIcon } from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Checkbox } from '@/components/ui/Checkbox'
import { ErrorState } from '@/components/ui/ErrorState'
import { TextField } from '@/components/ui/TextField'
import { loadAuditChecklistsMock, type AuditChecklistsData } from '@/lib/api/auditChecklistMockData'
import {
  applyDraft,
  copyChecklist,
  createCustomChecklist,
  filterChecklists,
  removeChecklist,
  replaceChecklist,
  setDefaultChecklist,
  sortChecklists,
  toggleArchived,
} from '@/lib/auditChecklistForm'
import type { AuditChecklist, AuditChecklistDraft, ChecklistSource } from '@/lib/auditChecklistTypes'
import { toast } from '@/lib/toast'

const CHECKLIST_PARAM = 'checklist'

export function CabAuditChecklistsPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')
  const [searchParams, setSearchParams] = useSearchParams()

  const [data, setData] = useState<AuditChecklistsData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [tab, setTab] = useState<ChecklistSource>('library')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [includeArchived, setIncludeArchived] = useState(false)
  // Bumped after a save so the detail panel starts again from the saved checklist.
  const [panelRevision, setPanelRevision] = useState(0)

  const selectedId = searchParams.get(CHECKLIST_PARAM)

  useEffect(() => {
    let active = true
    loadAuditChecklistsMock()
      .then((result) => {
        if (!active) return
        setData(result)
        setLoadFailed(false)
      })
      .catch(() => {
        if (active) setLoadFailed(true)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const library = data?.library
  const mine = data?.mine
  const selected = useMemo<AuditChecklist | undefined>(
    () => (selectedId ? [...(library ?? []), ...(mine ?? [])].find((checklist) => checklist.id === selectedId) : undefined),
    [selectedId, library, mine]
  )

  const visibleChecklists = useMemo(() => {
    const source = tab === 'library' ? library : mine
    return sortChecklists(filterChecklists(source ?? [], { search: deferredSearch, includeArchived }))
  }, [tab, library, mine, deferredSearch, includeArchived])

  const hasDraftLibrary = Boolean(library?.some((checklist) => checklist.reviewStatus === 'draft'))
  const loading = !data && !loadFailed

  const setSelectedId = (id: string | null) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (id) next.set(CHECKLIST_PARAM, id)
        else next.delete(CHECKLIST_PARAM)
        return next
      },
      { replace: true }
    )

  const updateMine = (update: (list: AuditChecklist[]) => AuditChecklist[]) =>
    setData((current) => (current ? { ...current, mine: update(current.mine) } : current))

  const openChecklist = (checklist: AuditChecklist) => {
    setSelectedId(checklist.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // TODO: replace the local updates below with the API calls once the checklist endpoints exist.
  const handleCopy = (checklist: AuditChecklist) => {
    const copy = copyChecklist(checklist, {
      en: t('cab.auditChecklists.copySuffix', { lng: 'en' }),
      ar: t('cab.auditChecklists.copySuffix', { lng: 'ar' }),
    })
    updateMine((list) => [...list, copy])
    setTab('cab')
    openChecklist(copy)
    toast.success(t('cab.auditChecklists.copied'))
  }

  const handleMakeDefault = (checklist: AuditChecklist) => {
    updateMine((list) => setDefaultChecklist(list, checklist.id))
    toast.success(t('cab.auditChecklists.defaultSet'))
  }

  const handleToggleArchive = (checklist: AuditChecklist) => {
    updateMine((list) => toggleArchived(list, checklist.id))
    toast.success(
      checklist.status === 'ACTIVE' ? t('cab.auditChecklists.archivedDone') : t('cab.auditChecklists.restoredDone')
    )
  }

  const handleDelete = (checklist: AuditChecklist) => {
    if (!window.confirm(t('cab.auditChecklists.deleteConfirm', { name: checklist.name }))) return
    updateMine((list) => removeChecklist(list, checklist.id))
    if (selectedId === checklist.id) setSelectedId(null)
    toast.success(t('cab.auditChecklists.deleted'))
  }

  const handleCreate = (input: { name: string; standardCode: string }) => {
    const checklist = createCustomChecklist(input)
    updateMine((list) => [...list, checklist])
    setTab('cab')
    openChecklist(checklist)
    toast.success(t('cab.auditChecklists.created'))
  }

  const handleSave = (draft: AuditChecklistDraft) => {
    if (!selected) return
    updateMine((list) => replaceChecklist(list, applyDraft(selected, draft)))
    setPanelRevision((revision) => revision + 1)
    toast.success(t('cab.auditChecklists.saved'))
  }

  const handleTabChange = (next: ChecklistSource) => {
    setTab(next)
    setSearch('')
  }

  const emptyMessage =
    tab === 'cab' && !search.trim() ? t('cab.auditChecklists.emptyCab') : t('cab.auditChecklists.emptySearch')

  return (
    <CabLayout>
      <CabHeader title={t('cab.auditChecklists.title')} />
      <main className="cab-setup flex flex-1 flex-col gap-6 overflow-auto bg-[var(--cab-canvas)] p-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--cab-ink)]">{t('cab.auditChecklists.title')}</h1>
          <p className="mt-1 text-[16px] text-[var(--cab-muted)]">{t('cab.auditChecklists.subtitle')}</p>
        </div>

        {loadFailed && !data ? (
          <ErrorState
            onRetry={() => {
              setLoadFailed(false)
              setReloadKey((key) => key + 1)
            }}
          />
        ) : (
          <>
            {hasDraftLibrary && (
              <CalloutCard
                tone="amber"
                icon={<AppIcon icon={CorrectiveActionIcon} size={20} className="text-[#d97706]" />}
                title={t('cab.auditChecklists.draftTitle')}
              >
                {t('cab.auditChecklists.draftBody')}
              </CalloutCard>
            )}

            {selected && (
              <ChecklistDetailPanel
                key={`${selected.id}:${panelRevision}`}
                checklist={selected}
                isArabic={isArabic}
                onSave={handleSave}
                onCopy={() => handleCopy(selected)}
                onClose={() => setSelectedId(null)}
              />
            )}

            <SectionCard title={t('cab.auditChecklists.listTitle')}>
              <div className="flex flex-col gap-4">
                <ChecklistTabs
                  ariaLabel={t('cab.auditChecklists.tabsLabel')}
                  value={tab}
                  onChange={handleTabChange}
                  tabs={[
                    { id: 'library', label: t('cab.auditChecklists.tabs.library') },
                    { id: 'cab', label: t('cab.auditChecklists.tabs.cab') },
                  ]}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="sm:w-full sm:max-w-sm">
                    <TextField
                      icon={SearchIcon}
                      type="search"
                      aria-label={t('cab.auditChecklists.search')}
                      placeholder={t('cab.auditChecklists.search')}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  {tab === 'cab' && (
                    <label className="flex min-h-11 items-center gap-2 text-[14px] text-neutral-900">
                      <Checkbox checked={includeArchived} onChange={() => setIncludeArchived((value) => !value)} />
                      {t('cab.auditChecklists.showArchived')}
                    </label>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-busy="true">
                    <div className="h-28 animate-pulse rounded-[var(--radius-md)] border border-[#ececec] bg-white" />
                    <div className="h-28 animate-pulse rounded-[var(--radius-md)] border border-[#ececec] bg-white" />
                  </div>
                ) : visibleChecklists.length === 0 ? (
                  <p className="text-[13px] text-[var(--cab-muted)]">{emptyMessage}</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {visibleChecklists.map((checklist) => (
                      <li key={checklist.id}>
                        <ChecklistCard
                          checklist={checklist}
                          isArabic={isArabic}
                          onOpen={() => openChecklist(checklist)}
                          onCopy={() => handleCopy(checklist)}
                          onMakeDefault={() => handleMakeDefault(checklist)}
                          onToggleArchive={() => handleToggleArchive(checklist)}
                          onDelete={() => handleDelete(checklist)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>

            <NewChecklistSection onCreate={handleCreate} />
          </>
        )}
      </main>
    </CabLayout>
  )
}

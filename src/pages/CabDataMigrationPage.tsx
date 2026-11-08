import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { MigrationEntityCard } from '@/components/dashboard/cab/dataMigration/MigrationEntityCard'
import { MigrationProgressRing } from '@/components/dashboard/cab/dataMigration/MigrationProgressRing'
import {
  RECORDS_TO_COMPLETE_ID,
  RecordsToCompleteSection,
} from '@/components/dashboard/cab/dataMigration/RecordsToCompleteSection'
import { RecentImportsSection } from '@/components/dashboard/cab/dataMigration/RecentImportsSection'
import { Card, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { CabLayout } from '@/components/layout/CabLayout'
import { ErrorState } from '@/components/ui/ErrorState'
import { getImportLists, loadMigrationHub, resolveIncompleteRecord, type MigrationHubData } from '@/lib/api/dataMigrationMockData'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import { buildTemplateSheets, templateFileName, type Translate } from '@/lib/dataMigrationForm'
import { IMPORT_ENTITY_KEYS, type ImportEntityKey, type IncompleteRecord } from '@/lib/dataMigrationTypes'
import { toast } from '@/lib/toast'
import { downloadXlsxWorkbook } from '@/lib/xlsxDownload'

const HOW_IT_WORKS_STEPS = ['step1', 'step2', 'step3', 'step4'] as const

export function CabDataMigrationPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')

  const [hub, setHub] = useState<MigrationHubData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<'all' | ImportEntityKey>('all')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadMigrationHub()
      .then((result) => {
        if (!active) return
        setHub(result)
        setLoadFailed(false)
      })
      .catch(() => {
        if (active) setLoadFailed(true)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const loading = !hub && !loadFailed
  const overall = hub?.overview.overall
  const statusByEntity = useMemo(
    () => new Map(hub?.overview.entities.map((status) => [status.entity, status])),
    [hub]
  )

  // TODO: replace the mock calls (lib/api/dataMigrationMockData.ts) with the API once the endpoints exist.
  const handleDownloadTemplate = (key: ImportEntityKey) => {
    const translate: Translate = (translationKey, options) => t(translationKey, options)
    const fileName = templateFileName(key)
    downloadXlsxWorkbook(
      fileName,
      buildTemplateSheets(getImportEntity(key), isArabic ? 'ar' : 'en', getImportLists(), translate)
    )
    toast.success(t('cab.dataMigration.template.downloaded', { file: fileName }))
  }

  const handleShowIncomplete = (key: ImportEntityKey) => {
    setFilter(key)
    document.getElementById(RECORDS_TO_COMPLETE_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleMarkDone = async (record: IncompleteRecord) => {
    setResolvingId(record.id)
    try {
      await resolveIncompleteRecord(record.id)
      const next = await loadMigrationHub()
      setHub(next)
      // The record's area may have no records left, so the filter would show an empty list.
      if (!next.incomplete.some((item) => item.entity === filter)) setFilter('all')
      toast.success(t('cab.dataMigration.toComplete.done'))
    } catch {
      toast.error(t('cab.dataMigration.toComplete.doneFailed'))
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.dataMigration.title')} />
      <main className="cab-setup flex flex-1 flex-col gap-6 overflow-auto bg-[var(--cab-canvas)] p-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--cab-ink)]">{t('cab.dataMigration.title')}</h1>
          <p className="mt-1 max-w-3xl text-[16px] text-[var(--cab-muted)]">{t('cab.dataMigration.subtitle')}</p>
        </div>

        {loadFailed && !hub ? (
          <ErrorState
            onRetry={() => {
              setLoadFailed(false)
              setReloadKey((key) => key + 1)
            }}
          />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <SectionCard title={t('cab.dataMigration.how.title')}>
                <ol className="grid gap-3 sm:grid-cols-2">
                  {HOW_IT_WORKS_STEPS.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-[var(--radius-md)] bg-[#fafbfd] p-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f3f6fd] text-[13px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-[13px] leading-relaxed text-neutral-600">
                        {t(`cab.dataMigration.how.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </SectionCard>

              <Card title={t('cab.dataMigration.progress')} highlight>
                <div className="flex items-center gap-4">
                  <MigrationProgressRing value={overall?.progress ?? 0} label={t('cab.dataMigration.progress')} />
                  <p className="min-w-0 text-[13px] leading-relaxed text-neutral-600">
                    {t('cab.dataMigration.progressHint', {
                      done: overall?.started ?? 0,
                      total: IMPORT_ENTITY_KEYS.length,
                      open: overall?.incomplete ?? 0,
                    })}
                  </p>
                </div>
              </Card>
            </div>

            <section aria-labelledby="migration-order" className="flex flex-col gap-3">
              <div>
                <h2 id="migration-order" className="text-[16px] font-bold text-neutral-900">
                  {t('cab.dataMigration.order')}
                </h2>
                <p className="mt-1 text-[13px] text-neutral-600">{t('cab.dataMigration.orderHint')}</p>
              </div>
              <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {IMPORT_ENTITY_KEYS.map((key, index) => (
                  <li key={key}>
                    <MigrationEntityCard
                      index={index + 1}
                      entity={getImportEntity(key)}
                      status={statusByEntity.get(key)}
                      loading={loading}
                      isArabic={isArabic}
                      onShowIncomplete={() => handleShowIncomplete(key)}
                      onDownloadTemplate={() => handleDownloadTemplate(key)}
                    />
                  </li>
                ))}
              </ol>
            </section>

            <RecordsToCompleteSection
              records={hub?.incomplete ?? []}
              loading={loading}
              isArabic={isArabic}
              filter={filter}
              onFilterChange={setFilter}
              resolvingId={resolvingId}
              onMarkDone={(record) => void handleMarkDone(record)}
            />

            <RecentImportsSection batches={hub?.batches ?? []} loading={loading} isArabic={isArabic} />
          </>
        )}
      </main>
    </CabLayout>
  )
}
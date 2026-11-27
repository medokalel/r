import { useTranslation } from 'react-i18next'
import { STAGE_REPORT_SECTION_IDS, type StageReportSnapshot } from '@/lib/api/stageReport'

function formatReportDate(iso?: string) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

/** Print rules shared by every page that prints the report document. */
export const STAGE_REPORT_PRINT_CSS = `
  @media print {
    body > *:not(#stage-report-print-root) { display: none !important; }
    #stage-report-print-root { display: block !important; }
    @page { margin: 14mm; }
  }
`

interface StageReportDocumentProps {
  /** The frozen snapshot of an issued report, or the live values of a draft. */
  data: StageReportSnapshot
  version: number
  statusLabel: string
  reviewer: string
  issuedAt?: string
}

/** The report as a document. Used by the CAB report page and the audit client's report page. */
export function StageReportDocument({ data: d, version, statusLabel, reviewer, issuedAt }: StageReportDocumentProps) {
  const { t } = useTranslation()
  const docSections: Array<{ id: string; title: string; text: string }> = [
    { id: 'summary', title: t('stageReport.sections.executiveSummary') as string, text: d.executiveSummary },
    ...STAGE_REPORT_SECTION_IDS.map((id) => ({
      id,
      title: t(`stageReport.sections.${id}`) as string,
      text: d.sections[id],
    })),
    { id: 'recommendation', title: t('stageReport.sections.recommendation') as string, text: d.recommendation },
  ]

  return (
    <div className="rounded-[16px] border border-[#ececec] bg-white p-8 print:border-0 print:p-0" data-testid="report-document">
      <h1 className="text-[22px] font-bold text-neutral-900">{t('stageReport.document.title', { stage: d.stage })}</h1>
      <p className="mt-1 text-[13px] text-neutral-500">
        {d.clientName} · {d.siteName} · <bdi dir="ltr">{d.planNumber}</bdi> · <bdi dir="ltr">v{version}</bdi> · {statusLabel}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-[#e5e7eb] py-3 text-[12px]">
        <div><dt className="text-neutral-400">{t('execution.plan.leadAuditor')}</dt><dd className="font-semibold">{d.leadAuditor}</dd></div>
        <div><dt className="text-neutral-400">{t('execution.plan.auditTeam')}</dt><dd className="font-semibold">{d.auditTeam.join(', ')}</dd></div>
        <div><dt className="text-neutral-400">{t('execution.plan.dates')}</dt><dd className="font-semibold"><bdi dir="ltr">{formatReportDate(d.proposedStartDate)} · {formatReportDate(d.proposedEndDate)}</bdi></dd></div>
        <div><dt className="text-neutral-400">{t('stageReport.overview.standards')}</dt><dd className="font-semibold"><bdi dir="ltr">{d.standards.join(', ')}</bdi></dd></div>
        <div><dt className="text-neutral-400">{t('stageReport.document.reviewer')}</dt><dd className="font-semibold">{reviewer || '-'}</dd></div>
        <div><dt className="text-neutral-400">{t('stageReport.document.issuedOn')}</dt><dd className="font-semibold"><bdi dir="ltr">{issuedAt ? formatReportDate(issuedAt) : '-'}</bdi></dd></div>
      </dl>
      {docSections.map((section) => (
        <section key={section.id} className="mt-5 print:mt-3">
          <h2 className="break-after-avoid text-[14px] font-bold text-[#0e2a80]">{section.title}</h2>
          <p dir="auto" className="mt-1 whitespace-pre-line text-[13px] leading-6 text-neutral-800">{section.text || '-'}</p>
        </section>
      ))}
      <p className="mt-5 break-inside-avoid rounded-[8px] bg-[#f9fafc] p-3 text-[12px] text-neutral-600 print:mt-3">{t('stageReport.recommendationNote')}</p>
    </div>
  )
}

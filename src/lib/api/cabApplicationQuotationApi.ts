import { getCabProfile } from '@/lib/api/cabApi'
import { getCabCertificationApplication } from '@/lib/api/cabCertificationApplicationApi'
import { listCabApplications } from '@/lib/api/cabApplicationRegisterApi'
import { listSectionReviews, REVIEW_SECTIONS, type ReviewSectionKey, type SectionStatus } from '@/lib/api/cabApplicationReviewApi'
import { listPricingConfigs, listQuotations } from '@/lib/api/cabQuotationApi'

export function isQuotationReviewComplete(
  status: string,
  sections: Partial<Record<ReviewSectionKey, SectionStatus>>,
): boolean {
  return (status === 'UNDER_REVIEW' || status === 'APPROVED' || status === 'SUBMITTED' || status.startsWith('QUOTATION_'))
    && REVIEW_SECTIONS.every((key) => sections[key] === 'complete' || sections[key] === 'notApplicable')
}

export async function listQuotationApplications() {
  const applications = (await listCabApplications()).filter(
    (application) => application.status !== 'DRAFT' && application.status !== 'REJECTED',
  )
  // ponytail: one review read per candidate; use a server-side filter if the register grows large.
  const reviews = await Promise.all(applications.map((application) => listSectionReviews(application.id)))
  return applications.filter((application, index) => isQuotationReviewComplete(application.status, reviews[index]))
}

export async function getCabApplicationQuotation(applicationId: string) {
  const [application, sections, { cab }, configs, quotations] = await Promise.all([
    getCabCertificationApplication(applicationId),
    listSectionReviews(applicationId),
    getCabProfile(),
    listPricingConfigs(),
    listQuotations({ applicationId, limit: 100 }),
  ])
  // The newest quotation that is not cancelled is the live one; a cancelled one allows creating a new quotation.
  const quotation = [...quotations.items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((item) => item.status !== 'CANCELLED') ?? null
  return {
    application,
    cab,
    reviewComplete: isQuotationReviewComplete(application.status, sections),
    pricing: configs.find((config) => config.isActive && config.standardId === null) ?? null,
    quotation,
  }
}

export type CabApplicationQuotation = Awaited<ReturnType<typeof getCabApplicationQuotation>>

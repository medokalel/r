import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import {
  QUALIFICATION_ACCEPT,
  mapBackendQualificationToFile,
} from '@/components/dashboard/cab/personnelFormHelpers'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import type {
  CabEmployeeQualification,
  CabQualificationCategory,
} from '@/lib/api/cabEmployeesApi'

export interface EvaluationQualificationsSectionProps {
  categories: CabQualificationCategory[]
  uncategorizedQualifications: CabEmployeeQualification[]
}

export function EvaluationQualificationsSection({
  categories,
  uncategorizedQualifications,
}: EvaluationQualificationsSectionProps) {
  const { t, i18n } = useTranslation()

  const mapDocToUploadedFile = (q: CabEmployeeQualification): UploadedDocumentFile =>
    mapBackendQualificationToFile(q, i18n.language)

  const handleOpenQualFile = (file: UploadedDocumentFile) => {
    if (file.url) {
      window.open(resolvePublicAssetUrl(file.url), '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div>
      <SectionHeading
        title={t('cab.competence.qualificationsDocuments', 'Qualification Documents')}
        accordion
      >
        <div className="flex flex-col divide-y divide-[#f0f0f0] rounded-[12px] border border-dashed border-primary/30 bg-white p-3">
          {categories.map((cat) => (
            <div key={cat.id} className="py-1 first:pt-0 last:pb-0">
              <DocumentUploadField
                title={cat.name}
                note={t(
                  'cab.competence.qualificationsDesc',
                  'Upload certificates, diplomas, and official competence records (PDF, Word, Excel, Images max 20 MB).'
                )}
                files={(cat.documents ?? []).map(mapDocToUploadedFile)}
                readOnly
                accept={QUALIFICATION_ACCEPT}
                onOpenFile={handleOpenQualFile}
              />
            </div>
          ))}

          {(categories.length === 0 || uncategorizedQualifications.length > 0) && (
            <div className="py-1 first:pt-0 last:pb-0">
              <DocumentUploadField
                title={
                  categories.length > 0
                    ? t(
                        'cab.competence.qualifications.generalDocuments',
                        'General Qualification Documents'
                      )
                    : t('cab.competence.qualificationsDocuments', 'Qualification Documents')
                }
                note={t(
                  'cab.competence.qualificationsDesc',
                  'Upload certificates, diplomas, and official competence records (PDF, Word, Excel, Images max 20 MB).'
                )}
                files={uncategorizedQualifications.map(mapDocToUploadedFile)}
                readOnly
                accept={QUALIFICATION_ACCEPT}
                onOpenFile={handleOpenQualFile}
              />
            </div>
          )}
        </div>
      </SectionHeading>
    </div>
  )
}

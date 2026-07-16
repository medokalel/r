import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { EntityDataForm } from '@/components/dashboard/EntityDataForm'
import {
  EntityDataNav,
  subSections,
  type EntityDataSubSection,
  type EntityDataViewTab,
} from '@/components/dashboard/EntityDataNav'
import { FieldSelectionSummary } from '@/components/dashboard/entityData/FieldSelectionSummary'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { ProcessStepper } from '@/components/dashboard/ProcessStepper'
import { AppLayout } from '@/components/layout/AppLayout'

const STATUS_VIEWS: EntityDataViewTab[] = ['approved', 'underReview', 'rejected']

const viewTabCopyKeys: Record<EntityDataViewTab, { title: string; subtitle: string }> = {
  entityData: {
    title: 'accreditation.entityData.title',
    subtitle: 'accreditation.entityData.subtitle',
  },
  field: {
    title: 'accreditation.entityData.field.pageTitle',
    subtitle: 'accreditation.entityData.field.pageSubtitle',
  },
  documents: {
    title: 'accreditation.entityData.documents.pageTitle',
    subtitle: 'accreditation.entityData.documents.pageSubtitle',
  },
  feedback: {
    title: 'accreditation.entityData.feedback.pageTitle',
    subtitle: 'accreditation.entityData.feedback.pageSubtitle',
  },
  approved: { title: '', subtitle: '' },
  underReview: { title: '', subtitle: '' },
  rejected: { title: '', subtitle: '' },
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const [activeSubSection, setActiveSubSection] = useState<EntityDataSubSection>('legalIdentity')
  const [activeViewTab, setActiveViewTab] = useState<EntityDataViewTab>('entityData')
  const [fieldPhase, setFieldPhase] = useState<FieldPhase>('sectors')
  const [selectedSectors, setSelectedSectors] = useState<SectorKey[]>(['food'])
  const [selectedStandards, setSelectedStandards] = useState<StandardKey[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  const activeIndex = subSections.indexOf(activeSubSection)
  const copyKeys =
    activeViewTab === 'field' && fieldPhase === 'codes'
      ? {
          title: 'accreditation.entityData.field.codesTitle',
          subtitle: 'accreditation.entityData.field.pageSubtitle',
        }
      : viewTabCopyKeys[activeViewTab]

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleSubSectionChange = useCallback(
    (section: EntityDataSubSection) => {
      setActiveSubSection(section)
      scrollToContent()
    },
    [scrollToContent]
  )

  const handleViewTabChange = useCallback(
    (tab: EntityDataViewTab) => {
      setActiveViewTab(tab)
      if (tab !== 'field') {
        setFieldPhase('sectors')
      }
      scrollToContent()
    },
    [scrollToContent]
  )

  const handleBack = useCallback(() => {
    if (activeViewTab === 'field' && fieldPhase === 'codes') {
      setFieldPhase('sectors')
      scrollToContent()
      return
    }

    if (activeViewTab === 'feedback') {
      handleViewTabChange('documents')
      return
    }

    if (activeViewTab === 'documents') {
      handleViewTabChange('field')
      return
    }

    if (activeViewTab === 'field') {
      handleViewTabChange('entityData')
      return
    }

    if (activeIndex <= 0) return
    handleSubSectionChange(subSections[activeIndex - 1])
  }, [activeIndex, activeViewTab, fieldPhase, handleSubSectionChange, handleViewTabChange, scrollToContent])

  const handleNext = useCallback(() => {
    if (activeViewTab === 'field' && fieldPhase === 'sectors') {
      setFieldPhase('codes')
      scrollToContent()
      return
    }

    if (activeViewTab === 'field' && fieldPhase === 'codes') {
      handleViewTabChange('documents')
      return
    }

    if (activeViewTab === 'documents') {
      handleViewTabChange('feedback')
      return
    }

    if (activeViewTab === 'feedback') {
      handleViewTabChange('approved')
      return
    }

    if (activeViewTab === 'entityData') {
      if (activeIndex >= subSections.length - 1) {
        handleViewTabChange('field')
        return
      }
      handleSubSectionChange(subSections[activeIndex + 1])
    }
  }, [activeIndex, activeViewTab, fieldPhase, handleSubSectionChange, handleViewTabChange, scrollToContent])

  const isFieldSectorsView = activeViewTab === 'field' && fieldPhase === 'sectors'
  const isStatusView = STATUS_VIEWS.includes(activeViewTab)

  const footerBackDisabled =
    isStatusView ||
    (activeViewTab === 'entityData' && activeIndex === 0) ||
    (activeViewTab === 'field' && fieldPhase === 'sectors')

  const footerNextDisabled =
    isStatusView ||
    (activeViewTab === 'field' && fieldPhase === 'sectors' && selectedSectors.length === 0)

  const footerNextLabel = isFieldSectorsView
    ? t('accreditation.entityData.field.continueToCodes')
    : undefined

  const footerStartContent = isFieldSectorsView ? (
    <FieldSelectionSummary selectedSectors={selectedSectors} />
  ) : undefined

  return (
    <AppLayout>
      <AccreditationHeader
        orderNumber="N-EMS-00022"
        officerName="الاء طارق | Alaa Tarek"
        officerEmail="alaatarek78@gmail.com"
      />
      <ProcessStepper activeStep={0} />

      <div ref={contentRef} className="flex flex-1 flex-col gap-5 overflow-auto p-5">
        {!isStatusView && copyKeys.title && (
          <div className="space-y-2">
            <h2 className="text-h3-semi text-neutral-900">{t(copyKeys.title)}</h2>
            <p className={`text-body-2 text-neutral-600${isRTL ? ' font-light' : ''}`}>{t(copyKeys.subtitle)}</p>
          </div>
        )}

        {isStatusView && (
          <div className="flex items-center gap-2">
            {(['approved', 'underReview', 'rejected'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleViewTabChange(s)}
                className={`rounded px-3 py-1 text-small font-medium transition-colors ${
                  activeViewTab === s
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {s === 'approved' ? '✓ Approved' : s === 'underReview' ? '⏳ Under Review' : '✗ Rejected'}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-1 gap-5">
          {!isStatusView && (
            <EntityDataNav
              activeSubSection={activeSubSection}
              activeViewTab={activeViewTab}
              onSubSectionChange={handleSubSectionChange}
              onViewTabChange={handleViewTabChange}
            />
          )}
          <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
            <EntityDataForm
              section={activeSubSection}
              viewTab={activeViewTab}
              fieldPhase={fieldPhase}
              selectedSectors={selectedSectors}
              onSelectedSectorsChange={setSelectedSectors}
              selectedStandards={selectedStandards}
              onSelectedStandardsChange={setSelectedStandards}
            />
          </div>
        </div>
      </div>

      <DashboardFooter
        backDisabled={footerBackDisabled}
        nextDisabled={footerNextDisabled}
        nextLabel={footerNextLabel}
        startContent={footerStartContent}
        onBack={handleBack}
        onNext={handleNext}
      />
    </AppLayout>
  )
}

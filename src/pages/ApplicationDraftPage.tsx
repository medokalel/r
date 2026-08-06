import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationStepper } from '@/components/dashboard/cab/ApplicationStepper'
import { ApplicationDraftForm } from '@/components/dashboard/cab/ApplicationDraftForm'
import { ClientWorkflowProgress } from '@/components/dashboard/cab/ClientWorkflowProgress'
import { Button } from '@/components/ui/Button'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import {
  emptyApplicationDraftForm,
  isApplicationDraftComplete,
} from '@/lib/applicationDraftForm'

export function ApplicationDraftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyApplicationDraftForm)

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))

  const complete = isApplicationDraftComplete(form)

  // TODO: wire to a real "save application draft" endpoint once the backend
  // exposes one, and build steps 2-5 (Standards & Scope, Sites & Facilities,
  // Documents, Review & Confirm) — for now this just returns to the
  // dashboard, matching the other not-yet-backed CAB workflow steps.
  const handleSaveDraftAndContinue = () => {
    if (!complete) return
    navigate('/cab/dashboard')
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-h3-semi text-neutral-900">{t('cab.applicationDraft.title')}</h2>
            <p className="text-body-2 text-neutral-500">{t('cab.applicationDraft.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="tertiary" className="min-w-[130px] rounded-[var(--radius-sm)] bg-[#F3F6FD]">
              {t('common.saveDraft')}
            </Button>
            <Button variant="secondary" className="min-w-[110px] rounded-[var(--radius-sm)]">
              {t('cab.applicationDraft.preview')}
            </Button>
            <Button
              variant="primary"
              className="min-w-[150px] rounded-[var(--radius-sm)]"
              disabled={!complete}
              onClick={handleSaveDraftAndContinue}
            >
              {t('cab.applicationDraft.saveAndContinue')}
            </Button>
          </div>
        </div>

        <ApplicationStepper current={1} />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <ApplicationDraftForm form={form} onPatch={patch} />
          <ClientWorkflowProgress />
        </div>
      </div>

      <DashboardFooter
        onBack={() => navigate('/cab/dashboard')}
        backDisabled={false}
        onNext={handleSaveDraftAndContinue}
        nextDisabled={!complete}
        nextLabel={t('cab.applicationDraft.saveDraftAndContinue')}
      />
    </CabLayout>
  )
}
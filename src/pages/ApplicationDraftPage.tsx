import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationStepper } from '@/components/dashboard/cab/ApplicationStepper'
import { ApplicationDraftForm } from '@/components/dashboard/cab/ApplicationDraftForm'
import { ClientWorkflowProgress } from '@/components/dashboard/cab/ClientWorkflowProgress'
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
  // exposes one — for now this is a no-op stub, matching the other
  // not-yet-backed CAB workflow actions. Unlike "Save & Continue", saving a
  // draft doesn't require the form to be complete.
  const handleSaveDraft = () => {}

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
      <ApplicationStepper current={1} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="space-y-1">
          <h2 className="text-h3-semi text-neutral-900">{t('cab.applicationDraft.title')}</h2>
          <p className="text-body-2 text-neutral-500">{t('cab.applicationDraft.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
            <ApplicationDraftForm form={form} onPatch={patch} />
          </div>
          <ClientWorkflowProgress />
        </div>
      </div>

      <DashboardFooter
        onBack={() => navigate('/cab/dashboard')}
        backDisabled={false}
        onSaveDraft={handleSaveDraft}
        onNext={handleSaveDraftAndContinue}
        nextDisabled={!complete}
        nextLabel={t('cab.applicationDraft.saveDraftAndContinue')}
      />
    </CabLayout>
  )
}
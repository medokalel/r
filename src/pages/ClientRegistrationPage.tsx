import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ClientRegistrationForm } from '@/components/dashboard/cab/ClientRegistrationForm'
import { ClientWorkflowProgress } from '@/components/dashboard/cab/ClientWorkflowProgress'
import { Button } from '@/components/ui/Button'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import {
  emptyClientRegistrationForm,
  isClientRegistrationComplete,
} from '@/lib/clientRegistrationForm'

export function ClientRegistrationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyClientRegistrationForm)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))

  const complete = isClientRegistrationComplete(form)

  // TODO: wire to a real "create client" endpoint once the backend exposes
  // one — for now this just returns to the dashboard, matching the other
  // not-yet-backed CAB workflow steps (see CabComingSoonStep).
  const handleSaveDraftAndContinue = () => {
    if (!complete) return
    navigate('/cab/dashboard')
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.clientRegistration.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-h3-semi text-neutral-900">{t('cab.clientRegistration.title')}</h2>
            <p className="text-body-2 text-neutral-500">{t('cab.clientRegistration.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="tertiary" className="min-w-[140px] rounded-[var(--radius-sm)] bg-[#F3F6FD]">
              {t('common.saveDraft')}
            </Button>
            <Button
              variant="primary"
              className="min-w-[140px] rounded-[var(--radius-sm)]"
              disabled={!complete}
              onClick={handleSaveDraftAndContinue}
            >
              {t('cab.clientRegistration.saveAndContinue')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
            <ClientRegistrationForm
              form={form}
              onPatch={patch}
              attachedFile={attachedFile}
              onAttachFile={setAttachedFile}
            />
          </div>
          <ClientWorkflowProgress />
        </div>
      </div>

      <DashboardFooter
        onBack={() => navigate('/cab/dashboard')}
        onNext={handleSaveDraftAndContinue}
        nextDisabled={!complete}
        nextLabel={t('cab.clientRegistration.saveDraftAndContinue')}
      />
    </CabLayout>
  )
}
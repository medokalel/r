import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ClientRegistrationForm } from '@/components/dashboard/cab/ClientRegistrationForm'
import { buildClientWorkflowSteps } from '@/lib/workflowSteps'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import {
  emptyClientRegistrationForm,
  isClientRegistrationComplete,
} from '@/lib/clientRegistrationForm'
import {
  cabClientToForm,
  createCabClient,
  getCabClient,
  updateCabClient,
} from '@/lib/api/clientRegistrationApi'
import { ApiError } from '@/lib/api/client'

import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useClientRegistrationTourSteps } from '@/config/clientRegistrationTourSteps'

export function ClientRegistrationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId } = useParams()
  const editing = Boolean(clientId)
  const [form, setForm] = useState(emptyClientRegistrationForm)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [existingDocumentName, setExistingDocumentName] = useState<string | null>(null)
  const [clearDocument, setClearDocument] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(clientId ?? null)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    getCabClient(clientId)
      .then((client) => {
        if (cancelled) return
        setForm(cabClientToForm(client))
        setExistingDocumentName(client.supportingDocumentOriginalName)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFeedback({
            type: 'error',
            message: error instanceof Error ? error.message : t('cab.clientsPage.loadError'),
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, t])

  const tourSteps = useClientRegistrationTourSteps()

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))

  const complete = isClientRegistrationComplete(form)

  const save = async (status: 'DRAFT' | 'REGISTERED') => {
    setSaving(true)
    setFeedback(null)
    try {
      const result = draftId
        ? await updateCabClient(draftId, form, status, attachedFile, clearDocument)
        : await createCabClient(form, status, attachedFile)
      setDraftId(result.client.id)
      setAttachedFile(null)
      setClearDocument(false)
      setExistingDocumentName(result.client.supportingDocumentOriginalName)
      if (!clientId) {
        navigate(`/cab/clients/${result.client.id}/edit`, { replace: true })
      }
      setFeedback({ type: 'success', message: result.message })
      return result.client
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof ApiError ? error.message : t('cab.clientRegistration.saveError'),
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    void save('DRAFT')
  }

  const handleSaveDraftAndContinue = async () => {
    if (!complete) return
    const client = await save('REGISTERED')
    if (client) navigate(`/cab/clients/${client.id}`)
  }

  return (
    <CabLayout tourId="cab-client-registration" tourSteps={tourSteps}>
      <DashboardTourStep steps={tourSteps} stepId="header">
        <CabHeader
          title={t(editing ? 'cab.clientRegistration.editTitle' : 'cab.clientRegistration.title')}
          notificationCount={3}
        />
      </DashboardTourStep>

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-h3-semi text-neutral-900">
              {t(editing ? 'cab.clientRegistration.editTitle' : 'cab.clientRegistration.title')}
            </h2>
            <p className="text-body-2 text-neutral-500">{t('cab.clientRegistration.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cab/clients')}
            className="rounded-[8px] border border-primary px-4 py-2.5 text-[14px] font-medium text-primary hover:bg-[#e8edfc]"
          >
            {t('cab.clientRegistration.viewRegisteredClients')}
          </button>
        </div>
        {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={feedback.type === 'error' ? 'text-body-3 text-error-500' : 'text-body-3 text-success-600'}
            >
              {feedback.message}
            </p>
        )}

        {loading ? (
          <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-8 text-center text-neutral-500">
            {t('common.loading')}
          </div>
        ) : (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-5">
            <ClientRegistrationForm
              form={form}
              onPatch={patch}
              attachedFile={attachedFile}
              existingDocumentName={existingDocumentName}
              onAttachFile={(file) => {
                setClearDocument(false)
                setAttachedFile(file)
              }}
              onClearDocument={() => {
                setAttachedFile(null)
                setExistingDocumentName(null)
                setClearDocument(true)
              }}
            />
          </div>
          <DashboardTourStep steps={tourSteps} stepId="workflow-progress" className="w-full shrink-0 lg:w-[340px]">
            <WorkflowProgressCard
              steps={buildClientWorkflowSteps(t, 'application')}
              title={t('cab.clientRegistration.workflow.title')}
              viewFullLabel={t('cab.clientRegistration.workflow.viewFull')}
              statusLabels={{
                completed: t('cab.applications.receipt.workflow.completed'),
                inProgress: t('cab.clientRegistration.workflow.inProgress'),
                pending: t('cab.clientRegistration.workflow.pending'),
              }}
            />
          </DashboardTourStep>
        </div>
        )}
      </div>

      <DashboardTourStep steps={tourSteps} stepId="action-buttons">
        <DashboardFooter
          onBack={() => navigate(editing && clientId ? `/cab/clients/${clientId}` : '/cab/dashboard')}
          backDisabled={saving || loading}
          onSaveDraft={handleSaveDraft}
          saveDraftDisabled={saving || loading}
          saveDraftLoading={saving}
          onNext={handleSaveDraftAndContinue}
          nextDisabled={!complete || saving || loading}
          nextLabel={
            saving
              ? t('common.loading')
              : t(editing ? 'cab.clientRegistration.saveChanges' : 'cab.clientRegistration.saveDraftAndContinue')
          }
        />
      </DashboardTourStep>
    </CabLayout>
  )
}
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SsoDomainsStep } from '@/components/dashboard/cab/sso/SsoDomainsStep'
import { SsoIdpStep } from '@/components/dashboard/cab/sso/SsoIdpStep'
import { SsoProviderStep } from '@/components/dashboard/cab/sso/SsoProviderStep'
import { SsoSecurityStep } from '@/components/dashboard/cab/sso/SsoSecurityStep'
import { SsoStepNav } from '@/components/dashboard/cab/sso/SsoStepNav'
import { SsoUsersStep } from '@/components/dashboard/cab/sso/SsoUsersStep'
import { createSsoConnection, getSsoErrorMessage, updateSsoConnection } from '@/lib/api/ssoApi'
import {
  SSO_WIZARD_STEPS,
  type SsoConnection,
  type SsoOptions,
  type SsoProvider,
  type SsoWizardStep,
} from '@/lib/api/ssoTypes'
import { SSO_DEFAULT_ATTRIBUTE_MAPPING, SSO_FIXED_ISSUER, SSO_PROTOCOL } from '@/lib/sso'
import { buildSsoStepPayload, createSsoDraft, syncSsoDraft, type SsoDraft, type SsoDraftSetter } from '@/lib/ssoForm'
import { toast } from '@/lib/toast'

interface SsoConnectionWizardProps {
  /** `null` while creating a new connection. */
  connection: SsoConnection | null
  /** The provider to start with (chosen on the add screen). Ignored when editing. */
  provider: SsoProvider
  initialStep?: SsoWizardStep
  options: SsoOptions
  language: string
  /** Called whenever the connection is created or changed, so the list behind stays current. */
  onConnectionChange: (connection: SsoConnection) => void
  onClose: () => void
}

export function SsoConnectionWizard({
  connection: initialConnection,
  provider,
  initialStep = 'provider',
  options,
  language,
  onConnectionChange,
  onClose,
}: SsoConnectionWizardProps) {
  const { t } = useTranslation()
  const [connection, setConnection] = useState<SsoConnection | null>(initialConnection)
  const [draft, setDraft] = useState<SsoDraft>(() => createSsoDraft(initialConnection, provider))
  const [step, setStep] = useState<SsoWizardStep>(initialConnection ? initialStep : 'provider')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stepIndex = SSO_WIZARD_STEPS.indexOf(step)
  const isLast = stepIndex === SSO_WIZARD_STEPS.length - 1
  const canSave = step !== 'provider' || draft.name.trim().length > 0

  const set: SsoDraftSetter = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }))

  const handleConnectionUpdated = (updated: SsoConnection) => {
    setConnection(updated)
    onConnectionChange(updated)
  }

  const handleProviderChange = (next: SsoProvider) => {
    setDraft((previous) => ({
      ...previous,
      provider: next,
      // Provider defaults apply until the connection is created.
      issuerUrl: SSO_FIXED_ISSUER[next] ?? '',
      attributeMapping: { ...SSO_DEFAULT_ATTRIBUTE_MAPPING[next] },
    }))
  }

  /** Saves the current step. Returns the saved connection, or `null` when it failed. */
  const persist = async (): Promise<SsoConnection | null> => {
    setSaving(true)
    setError(null)
    try {
      if (!connection) {
        const created = await createSsoConnection({ name: draft.name, provider: draft.provider })
        setDraft(createSsoDraft(created, created.provider))
        handleConnectionUpdated(created)
        toast.success(t('cab.sso.wizard.created'))
        return created
      }
      const saved = await updateSsoConnection(
        connection.id,
        buildSsoStepPayload(step, draft, SSO_PROTOCOL[connection.provider]),
      )
      setDraft((previous) => syncSsoDraft(previous, saved))
      handleConnectionUpdated(saved)
      toast.success(t('cab.sso.wizard.saved'))
      return saved
    } catch (caught) {
      setError(getSsoErrorMessage(caught, t))
      return null
    } finally {
      setSaving(false)
    }
  }

  const goTo = (next: SsoWizardStep) => {
    setError(null)
    setStep(next)
  }

  const handleNext = async () => {
    const saved = await persist()
    if (!saved) return
    if (isLast) onClose()
    else goTo(SSO_WIZARD_STEPS[stepIndex + 1])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-snug text-neutral-900">
            {connection
              ? t('cab.sso.wizard.titleEdit', { name: connection.name })
              : t('cab.sso.wizard.titleNew')}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {t('cab.sso.wizard.stepOf', { current: stepIndex + 1, total: SSO_WIZARD_STEPS.length })}
          </p>
        </div>
        <Button type="button" variant="tertiary" size="sm" disabled={saving} onClick={onClose}>
          {t('cab.sso.wizard.close')}
        </Button>
      </div>

      <SsoStepNav
        current={step}
        canOpenStep={(target) => target === 'provider' || connection !== null}
        onSelect={goTo}
        disabled={saving}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-error-200 bg-error-50 px-4 py-3 text-[13px] text-error-700"
        >
          {error}
        </p>
      ) : null}

      <div key={step}>
        {step === 'provider' && (
          <SsoProviderStep
            name={draft.name}
            provider={draft.provider}
            locked={connection !== null}
            onNameChange={(name) => set('name', name)}
            onProviderChange={handleProviderChange}
          />
        )}
        {step === 'idp' && connection && <SsoIdpStep connection={connection} draft={draft} set={set} />}
        {step === 'domains' && connection && (
          <SsoDomainsStep
            connection={connection}
            draft={draft}
            set={set}
            language={language}
            disabled={saving}
            onConnectionUpdated={handleConnectionUpdated}
          />
        )}
        {step === 'users' && <SsoUsersStep draft={draft} set={set} options={options} />}
        {step === 'security' && connection && (
          <SsoSecurityStep
            connection={connection}
            draft={draft}
            set={set}
            options={options}
            language={language}
            onConnectionUpdated={handleConnectionUpdated}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-5">
        <div>
          {stepIndex > 0 ? (
            <Button type="button" variant="tertiary" disabled={saving} onClick={() => goTo(SSO_WIZARD_STEPS[stepIndex - 1])}>
              {t('cab.sso.wizard.back')}
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {connection && step !== 'provider' ? (
            <Button type="button" variant="secondary" disabled={saving} onClick={() => void persist()}>
              {t('cab.sso.wizard.save')}
            </Button>
          ) : null}
          <Button type="button" disabled={saving || !canSave} onClick={() => void handleNext()}>
            {isLast ? t('cab.sso.wizard.finish') : t('cab.sso.wizard.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}

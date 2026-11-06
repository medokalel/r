import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { SsoTestPanel } from '@/components/dashboard/cab/sso/SsoTestPanel'
import type { SsoConnection, SsoOptions } from '@/lib/api/ssoTypes'
import { getSsoMissingFields, getSsoRequireBlocker } from '@/lib/sso'
import type { SsoDraft, SsoDraftSetter } from '@/lib/ssoForm'

interface SsoSecurityStepProps {
  connection: SsoConnection
  draft: SsoDraft
  set: SsoDraftSetter
  options: SsoOptions
  language: string
  onConnectionUpdated: (connection: SsoConnection) => void
}

export function SsoSecurityStep({ connection, draft, set, options, language, onConnectionUpdated }: SsoSecurityStepProps) {
  const { t } = useTranslation()
  const missing = getSsoMissingFields(connection)
  const enabled = draft.status === 'ENABLED'
  const blocker = getSsoRequireBlocker(connection, draft.breakGlassUserId)

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title={t('cab.sso.test.title')}>
        <SsoTestPanel connection={connection} language={language} onUpdated={onConnectionUpdated} />
      </SectionCard>

      <SectionCard title={t('cab.sso.wizard.statusTitle')}>
        <div className="flex items-start gap-3">
          <Toggle
            size="sm"
            checked={enabled}
            disabled={!enabled && missing.length > 0}
            onChange={(checked) => set('status', checked ? 'ENABLED' : 'DISABLED')}
            aria-label={t('cab.sso.wizard.statusTitle')}
          />
          <div>
            <p className="text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.statusHint')}</p>
            {missing.length > 0 ? (
              <p className="mt-2 text-[13px] text-warning-700">
                {t('cab.sso.wizard.missing', {
                  fields: missing.map((field) => t(`cab.sso.wizard.${field}`)).join(', '),
                })}
              </p>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('cab.sso.wizard.requireTitle')}>
        <div className="flex items-start gap-3">
          <Toggle
            size="sm"
            checked={draft.requireSso}
            disabled={!draft.requireSso && blocker !== null}
            onChange={(checked) => set('requireSso', checked)}
            aria-label={t('cab.sso.wizard.requireTitle')}
          />
          <div>
            <p className="text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.requireHint')}</p>
            {blocker === 'domain' ? (
              <p className="mt-2 text-[13px] text-warning-700">{t('cab.sso.wizard.requireNeedsDomain')}</p>
            ) : null}
            {blocker === 'breakGlass' ? (
              <p className="mt-2 text-[13px] text-warning-700">{t('cab.sso.wizard.requireNeedsAdmin')}</p>
            ) : null}
            {draft.requireSso ? (
              <p className="mt-2 text-[13px] text-[#a05a00]">{t('cab.sso.wizard.requireWarning')}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 max-w-md">
          <SelectField
            id="sso-break-glass"
            label={t('cab.sso.wizard.breakGlass')}
            value={draft.breakGlassUserId ?? ''}
            placeholder={t('cab.sso.wizard.chooseAdmin')}
            onChange={(value) => set('breakGlassUserId', value || null)}
            options={options.admins.map((admin) => ({
              value: admin.id,
              label: `${admin.name} (${admin.email})`,
            }))}
          />
          <p className="mt-2 text-small-light text-neutral-500">{t('cab.sso.wizard.breakGlassHint')}</p>
        </div>
      </SectionCard>
    </div>
  )
}

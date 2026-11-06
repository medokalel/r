import { useTranslation } from 'react-i18next'
import { FormLabel } from '@/components/ui/FormField'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextField, Textarea } from '@/components/ui/TextField'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { SsoCopyField } from '@/components/dashboard/cab/sso/SsoCopyField'
import { SSO_ISSUER_PLACEHOLDER } from '@/lib/sso'
import type { SsoDraft, SsoDraftSetter } from '@/lib/ssoForm'
import type { SsoConnection } from '@/lib/api/ssoTypes'

interface SsoIdpStepProps {
  connection: SsoConnection
  draft: SsoDraft
  set: SsoDraftSetter
}

const GUIDE_STEPS = [1, 2, 3, 4] as const

export function SsoIdpStep({ connection, draft, set }: SsoIdpStepProps) {
  const { t } = useTranslation()
  const isOidc = connection.protocol === 'OIDC'

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title={t('cab.sso.wizard.pasteTitle')}>
        <p className="mb-4 text-[13px] leading-[1.7] text-neutral-600">
          {t(isOidc ? 'cab.sso.wizard.pasteHintOidc' : 'cab.sso.wizard.pasteHintSaml')}
        </p>
        <div className="flex flex-col gap-3">
          {isOidc ? (
            <>
              <SsoCopyField label={t('cab.sso.wizard.redirectUri')} value={connection.sp.redirectUri} />
              {connection.provider === 'okta' ? (
                <SsoCopyField label={t('cab.sso.wizard.loginUrl')} value={connection.sp.loginUrl} />
              ) : null}
            </>
          ) : (
            <>
              <SsoCopyField label={t('cab.sso.wizard.acsUrl')} value={connection.sp.acsUrl} />
              <SsoCopyField label={t('cab.sso.wizard.entityId')} value={connection.sp.entityId} />
              <SsoCopyField label={t('cab.sso.wizard.metadataUrl')} value={connection.sp.metadataUrl} />
              <SsoCopyField label={t('cab.sso.wizard.loginUrl')} value={connection.sp.loginUrl} />
            </>
          )}
        </div>

        <details className="mt-4 rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px]">
          <summary className="cursor-pointer font-medium text-primary">
            {t('cab.sso.wizard.guideTitle', { provider: t(`cab.sso.providers.${connection.provider}`) })}
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 ps-5 leading-[1.7] text-neutral-700">
            {GUIDE_STEPS.map((step) => (
              <li key={step}>{t(`cab.sso.wizard.guide.${connection.provider}${step}`)}</li>
            ))}
          </ol>
        </details>
      </SectionCard>

      <SectionCard title={t('cab.sso.wizard.fromIdp')}>
        {isOidc ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="sso-issuer-url"
              dir="ltr"
              className="text-start"
              label={t('cab.sso.wizard.issuerUrl')}
              required
              value={draft.issuerUrl}
              placeholder={SSO_ISSUER_PLACEHOLDER[connection.provider]}
              onChange={(event) => set('issuerUrl', event.target.value)}
              autoComplete="off"
            />
            <TextField
              id="sso-client-id"
              dir="ltr"
              className="text-start"
              label={t('cab.sso.wizard.clientId')}
              required
              value={draft.clientId}
              onChange={(event) => set('clientId', event.target.value)}
              autoComplete="off"
            />
            <div className="flex flex-col gap-2">
              <TextField
                id="sso-client-secret"
                type="password"
                dir="ltr"
                className="text-start"
                label={t('cab.sso.wizard.clientSecret')}
                value={draft.clientSecret}
                disabled={draft.clearSecret}
                onChange={(event) => set('clientSecret', event.target.value)}
                autoComplete="new-password"
              />
              {connection.hasSecret ? (
                <>
                  <p className="text-small-light text-neutral-500">{t('cab.sso.wizard.secretStored')}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
                    <Checkbox
                      checked={draft.clearSecret}
                      onChange={() => set('clearSecret', !draft.clearSecret)}
                      aria-label={t('cab.sso.wizard.secretClear')}
                    />
                    {t('cab.sso.wizard.secretClear')}
                  </label>
                </>
              ) : null}
            </div>
            <TextField
              id="sso-scopes"
              dir="ltr"
              className="text-start"
              label={t('cab.sso.wizard.scopes')}
              value={draft.scopes}
              onChange={(event) => set('scopes', event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.metadataHint')}</p>
            <TextField
              id="sso-saml-metadata-url"
              dir="ltr"
              className="text-start"
              label={t('cab.sso.wizard.samlMetadataUrl')}
              value={draft.samlMetadataUrl}
              onChange={(event) => set('samlMetadataUrl', event.target.value)}
              autoComplete="off"
            />
            <div className="flex flex-col gap-2">
              <FormLabel htmlFor="sso-saml-metadata-xml">{t('cab.sso.wizard.samlMetadataXml')}</FormLabel>
              <Textarea
                id="sso-saml-metadata-xml"
                dir="ltr"
                spellCheck={false}
                value={draft.samlMetadataXml}
                onChange={(event) => set('samlMetadataXml', event.target.value)}
                className="resize-y text-start font-mono text-[13px]"
              />
              {connection.hasSamlMetadataXml ? (
                <p className="text-small-light text-neutral-500">{t('cab.sso.wizard.metadataStored')}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="sso-saml-entity-id"
                dir="ltr"
                className="text-start"
                label={t('cab.sso.wizard.samlIdpEntityId')}
                value={draft.samlIdpEntityId}
                onChange={(event) => set('samlIdpEntityId', event.target.value)}
                autoComplete="off"
              />
              <TextField
                id="sso-saml-sso-url"
                dir="ltr"
                className="text-start"
                label={t('cab.sso.wizard.samlSsoUrl')}
                required
                value={draft.samlSsoUrl}
                onChange={(event) => set('samlSsoUrl', event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <FormLabel htmlFor="sso-saml-certificate" required>
                {t('cab.sso.wizard.samlIdpCertificate')}
              </FormLabel>
              <Textarea
                id="sso-saml-certificate"
                dir="ltr"
                spellCheck={false}
                value={draft.samlIdpCertificate}
                onChange={(event) => set('samlIdpCertificate', event.target.value)}
                className="resize-y text-start font-mono text-[13px]"
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

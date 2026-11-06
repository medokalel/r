import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Badge, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { SsoCopyField } from '@/components/dashboard/cab/sso/SsoCopyField'
import { AppIcon, PlusIcon } from '@/components/icons'
import { getSsoErrorMessage, verifySsoDomain } from '@/lib/api/ssoApi'
import type { SsoConnection } from '@/lib/api/ssoTypes'
import {
  SSO_DOMAIN_ISSUE_KEYS,
  formatSsoDate,
  getSsoDomainIssue,
  normalizeSsoDomain,
} from '@/lib/sso'
import type { SsoDraft, SsoDraftSetter } from '@/lib/ssoForm'
import { toast } from '@/lib/toast'

interface SsoDomainsStepProps {
  connection: SsoConnection
  draft: SsoDraft
  set: SsoDraftSetter
  language: string
  disabled: boolean
  onConnectionUpdated: (connection: SsoConnection) => void
}

export function SsoDomainsStep({ connection, draft, set, language, disabled, onConnectionUpdated }: SsoDomainsStepProps) {
  const { t } = useTranslation()
  const [newDomain, setNewDomain] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newDomain.trim()) return
    const issue = getSsoDomainIssue(newDomain, draft.domains)
    if (issue) {
      setDomainError(t(SSO_DOMAIN_ISSUE_KEYS[issue]))
      return
    }
    set('domains', [...draft.domains, normalizeSsoDomain(newDomain)])
    setNewDomain('')
    setDomainError(null)
  }

  const handleVerify = async (domain: string) => {
    setVerifying(domain)
    try {
      const result = await verifySsoDomain(connection.id, domain)
      onConnectionUpdated(result.connection)
      if (result.verified) toast.success(t('cab.sso.wizard.domainVerified', { domain }))
      else toast.warning(t('cab.sso.wizard.domainNotVerified', { domain }))
    } catch (caught) {
      toast.error(getSsoErrorMessage(caught, t))
    } finally {
      setVerifying(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.domainsHint')}</p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <TextField
            id="sso-new-domain"
            dir="ltr"
            className="text-start"
            aria-label={t('cab.sso.wizard.addDomain')}
            value={newDomain}
            placeholder={t('cab.sso.wizard.domainPlaceholder')}
            error={domainError ?? undefined}
            onChange={(event) => {
              setNewDomain(event.target.value)
              setDomainError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            autoComplete="off"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-12 shrink-0"
          icon={<AppIcon icon={PlusIcon} size={18} />}
          disabled={disabled || !newDomain.trim()}
          onClick={handleAdd}
        >
          {t('cab.sso.wizard.addDomain')}
        </Button>
      </div>

      {draft.domains.length === 0 ? (
        <p className="text-[13px] text-neutral-500">{t('cab.sso.card.noDomains')}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {draft.domains.map((domainName) => {
            const saved = connection.domains.find((item) => item.domain === domainName)
            return (
              <li key={domainName}>
                <SectionCard
                  title={domainName}
                  action={
                    <div className="flex items-center gap-1">
                      {saved ? (
                        <Badge tone={saved.verified ? 'green' : 'amber'}>
                          {saved.verified
                            ? t('cab.sso.wizard.verifiedOn', { date: formatSsoDate(saved.verifiedAt, language) })
                            : t('cab.sso.wizard.notVerified')}
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="tertiary"
                        size="sm"
                        disabled={disabled}
                        onClick={() =>
                          set(
                            'domains',
                            draft.domains.filter((item) => item !== domainName),
                          )
                        }
                      >
                        {t('cab.sso.common.remove')}
                      </Button>
                    </div>
                  }
                >
                  {saved ? (
                    saved.verified ? null : (
                      <div className="flex flex-col gap-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_96px]">
                          <SsoCopyField label={t('cab.sso.wizard.txtHost')} value={saved.txtRecord.host} />
                          <SsoCopyField label={t('cab.sso.wizard.txtType')} value={saved.txtRecord.type} />
                        </div>
                        <SsoCopyField label={t('cab.sso.wizard.txtValue')} value={saved.txtRecord.value} />
                        {saved.lastCheckError ? (
                          <p className="text-[13px] text-warning-700">{saved.lastCheckError}</p>
                        ) : null}
                        <div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={disabled || verifying !== null}
                            onClick={() => void handleVerify(saved.domain)}
                          >
                            {verifying === saved.domain ? t('cab.sso.wizard.verifying') : t('cab.sso.wizard.verify')}
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-[13px] text-neutral-500">{t('cab.sso.wizard.unsavedDomains')}</p>
                  )}
                </SectionCard>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

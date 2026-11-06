import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Badge, ReadOnlyField } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, ShieldIcon } from '@/components/icons'
import { getSsoErrorMessage, testSsoConnection } from '@/lib/api/ssoApi'
import type { SsoConnection } from '@/lib/api/ssoTypes'
import { formatSsoDateTime, getSsoMissingFields, ssoErrorKey } from '@/lib/sso'

interface SsoTestPanelProps {
  connection: SsoConnection
  language: string
  onUpdated: (connection: SsoConnection) => void
}

/** Runs a test sign-in and shows what the identity provider sent and how iCASCO reads it. */
export function SsoTestPanel({ connection, language, onUpdated }: SsoTestPanelProps) {
  const { t } = useTranslation()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const incomplete = getSsoMissingFields(connection).length > 0
  const lastTest = connection.lastTest
  const result = lastTest?.result
  const mapped = result?.mapped
  const lastRunAt = formatSsoDateTime(lastTest?.at, language)

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    try {
      onUpdated(await testSsoConnection(connection.id))
    } catch (caught) {
      setError(getSsoErrorMessage(caught, t))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.test.hint')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<AppIcon icon={ShieldIcon} size={16} />}
          disabled={running || incomplete}
          onClick={() => void handleRun()}
        >
          {running ? t('cab.sso.test.running') : t('cab.sso.test.run')}
        </Button>
        {lastTest ? (
          <span className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600">
            <Badge tone={lastTest.status === 'SUCCESS' ? 'green' : 'red'}>{t(`cab.sso.test.${lastTest.status}`)}</Badge>
            {t('cab.sso.test.lastRun', { date: lastRunAt })}
          </span>
        ) : (
          <span className="text-[13px] text-neutral-500">{t('cab.sso.test.none')}</span>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-error-200 bg-error-50 px-3 py-2 text-[13px] text-error-700">
          {error}
        </p>
      ) : null}

      {lastTest?.status === 'FAILED' && result ? (
        <div role="alert" className="rounded-[var(--radius-sm)] border border-error-200 bg-error-50 px-3 py-2.5 text-[13px] text-error-700">
          <p className="font-semibold">{t('cab.sso.test.error')}</p>
          <p className="mt-1">{result.code ? t(ssoErrorKey(result.code)) : result.error}</p>
        </div>
      ) : null}

      {lastTest?.status === 'SUCCESS' && mapped ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-[13px] font-semibold text-neutral-900">{t('cab.sso.test.mapped')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label={t('cab.sso.test.email')}>
              <span lang="en" dir="ltr">
                {mapped.email}
              </span>
            </ReadOnlyField>
            <ReadOnlyField label={t('cab.sso.test.name')}>{mapped.name}</ReadOnlyField>
            <ReadOnlyField label={t('cab.sso.test.groups')}>
              {mapped.groups.length > 0 ? (
                <span lang="en" dir="ltr">
                  {mapped.groups.join(', ')}
                </span>
              ) : (
                t('cab.sso.test.noGroups')
              )}
            </ReadOnlyField>
            <ReadOnlyField label={t('cab.sso.test.role')}>
              {mapped.role ? t(`cab.sso.roles.${mapped.role}`, { defaultValue: mapped.role }) : t('cab.sso.test.noRole')}
            </ReadOnlyField>
            {mapped.matchedGroup ? (
              <ReadOnlyField label={t('cab.sso.test.matchedGroup')}>
                <span lang="en" dir="ltr">
                  {mapped.matchedGroup}
                </span>
              </ReadOnlyField>
            ) : null}
            <ReadOnlyField label={t('cab.sso.test.domainVerified')}>
              {result?.domainVerified ? t('cab.sso.common.yes') : t('cab.sso.common.no')}
            </ReadOnlyField>
            <ReadOnlyField label={t('cab.sso.test.userExists')}>
              {result?.userExists
                ? t('cab.sso.common.yes')
                : result?.wouldProvision
                  ? t('cab.sso.test.wouldProvision')
                  : t('cab.sso.common.no')}
            </ReadOnlyField>
          </div>

          {result?.warnings && result.warnings.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <li
                  key={warning}
                  className="rounded-[var(--radius-sm)] border border-[#fde9c8] bg-[#fef8ee] px-3 py-2 text-[13px] text-[#a05a00]"
                >
                  {t(`cab.sso.test.warnings.${warning}`)}
                </li>
              ))}
            </ul>
          ) : null}

          {result?.claims ? (
            <details className="text-[13px]">
              <summary className="cursor-pointer font-medium text-primary">{t('cab.sso.test.claims')}</summary>
              <pre
                dir="ltr"
                className="mt-2 max-h-56 overflow-auto rounded-[var(--radius-sm)] border border-neutral-200 bg-white p-3 text-start font-mono text-[12px] leading-[1.6] text-neutral-800"
              >
                {JSON.stringify(result.claims, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

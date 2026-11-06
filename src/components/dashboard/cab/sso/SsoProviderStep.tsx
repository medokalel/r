import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/ui/FormField'
import { TextField } from '@/components/ui/TextField'
import { SsoProviderOption } from '@/components/dashboard/cab/sso/SsoProviderOption'
import { SSO_PROVIDERS, type SsoProvider } from '@/lib/api/ssoTypes'

interface SsoProviderStepProps {
  name: string
  provider: SsoProvider
  /** The provider (and so the protocol) cannot change once the connection exists. */
  locked: boolean
  onNameChange: (name: string) => void
  onProviderChange: (provider: SsoProvider) => void
}

export function SsoProviderStep({ name, provider, locked, onNameChange, onProviderChange }: SsoProviderStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <TextField
        id="sso-connection-name"
        label={t('cab.sso.wizard.name')}
        required
        maxLength={80}
        value={name}
        placeholder={t('cab.sso.wizard.namePlaceholder')}
        onChange={(event) => onNameChange(event.target.value)}
      />

      <FormField label={t('cab.sso.wizard.chooseProvider')} required>
        <div role="group" className="grid gap-3 sm:grid-cols-2">
          {SSO_PROVIDERS.map((item) => (
            <SsoProviderOption
              key={item}
              provider={item}
              selected={provider === item}
              disabled={locked && provider !== item}
              onSelect={() => onProviderChange(item)}
            />
          ))}
        </div>
        {locked ? <p className="text-small-light text-neutral-500">{t('cab.sso.wizard.protocolLocked')}</p> : null}
      </FormField>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { Toggle } from '@/components/ui/Toggle'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, PlusIcon } from '@/components/icons'
import type { SsoOptions } from '@/lib/api/ssoTypes'
import { SSO_DEFAULT_ROLE_FALLBACK } from '@/lib/sso'
import type { SsoDraft, SsoDraftSetter } from '@/lib/ssoForm'

interface SsoUsersStepProps {
  draft: SsoDraft
  set: SsoDraftSetter
  options: SsoOptions
}

/** Select needs a real value for "no role", so this stands in for `null`. */
const NO_ROLE = '__none__'

export function SsoUsersStep({ draft, set, options }: SsoUsersStepProps) {
  const { t } = useTranslation()
  const roles = options.roles.length > 0 ? options.roles : [SSO_DEFAULT_ROLE_FALLBACK]
  const roleOptions = roles.map((role) => ({ value: role, label: t(`cab.sso.roles.${role}`, { defaultValue: role }) }))

  const updateRule = (index: number, patch: Partial<SsoDraft['groupRoleMapping'][number]>) =>
    set(
      'groupRoleMapping',
      draft.groupRoleMapping.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)),
    )

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title={t('cab.sso.wizard.attrTitle')}>
        <p className="mb-4 text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.attrHint')}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ['email', 'attrEmail'],
              ['name', 'attrName'],
              ['groups', 'attrGroups'],
            ] as const
          ).map(([field, labelKey]) => (
            <TextField
              key={field}
              id={`sso-attr-${field}`}
              dir="ltr"
              className="text-start"
              label={t(`cab.sso.wizard.${labelKey}`)}
              value={draft.attributeMapping[field]}
              onChange={(event) => set('attributeMapping', { ...draft.attributeMapping, [field]: event.target.value })}
              autoComplete="off"
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('cab.sso.wizard.jit')}>
        <div className="flex items-start gap-3">
          <Toggle
            size="sm"
            checked={draft.jitEnabled}
            onChange={(checked) => set('jitEnabled', checked)}
            aria-label={t('cab.sso.wizard.jit')}
          />
          <p className="text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.jitHint')}</p>
        </div>
        <div className="mt-4 max-w-sm">
          <SelectField
            id="sso-default-role"
            label={t('cab.sso.wizard.defaultRole')}
            value={draft.defaultRole ?? NO_ROLE}
            onChange={(value) => set('defaultRole', value === NO_ROLE ? null : value)}
            options={[{ value: NO_ROLE, label: t('cab.sso.wizard.noAccess') }, ...roleOptions]}
          />
        </div>
      </SectionCard>

      <SectionCard
        title={t('cab.sso.wizard.rulesTitle')}
        action={
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            icon={<AppIcon icon={PlusIcon} size={16} />}
            onClick={() => set('groupRoleMapping', [...draft.groupRoleMapping, { group: '', role: roles[0] }])}
          >
            {t('cab.sso.wizard.addRule')}
          </Button>
        }
      >
        <p className="mb-4 text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.wizard.rulesHint')}</p>
        {draft.groupRoleMapping.length === 0 ? (
          <p className="text-[13px] text-neutral-500">{t('cab.sso.wizard.noRules')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {draft.groupRoleMapping.map((rule, index) => (
              <li key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <TextField
                  id={`sso-rule-group-${index}`}
                  dir="ltr"
                  className="text-start"
                  label={t('cab.sso.wizard.group')}
                  value={rule.group}
                  onChange={(event) => updateRule(index, { group: event.target.value })}
                  autoComplete="off"
                />
                <SelectField
                  id={`sso-rule-role-${index}`}
                  label={t('cab.sso.wizard.role')}
                  value={rule.role}
                  onChange={(value) => updateRule(index, { role: value })}
                  options={roleOptions}
                />
                <Button
                  type="button"
                  variant="tertiary"
                  className="h-12"
                  onClick={() =>
                    set(
                      'groupRoleMapping',
                      draft.groupRoleMapping.filter((_, ruleIndex) => ruleIndex !== index),
                    )
                  }
                >
                  {t('cab.sso.common.remove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { AppIcon, EditIcon, LockIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { fieldInputClassName } from '@/components/ui/fieldStyles'
import { createUser, type AppUserRole, type CreateUserInput } from '@/lib/api/usersApi'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  name: '',
  role: '' as AppUserRole | '',
  countryCode: 'EG' as CountryCode,
  phone: '',
  email: '',
  password: '',
}

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function isFormComplete(form: typeof EMPTY_FORM): boolean {
  return Boolean(
    form.name.trim() && form.role.trim() && form.phone.trim() && form.email.trim() && form.password
  )
}

function AddUserForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async () => {
    setSaving(true)
    try {
      const input: CreateUserInput = {
        name: form.name,
        role: form.role as AppUserRole,
        phone: `+${form.countryCode === 'EG' ? '20' : ''}${form.phone}`,
        email: form.email,
        password: form.password,
      }
      await createUser(input)
      onCreated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Fixed header: title at start, circular close at end */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#f0f0f0] px-6 py-5">
        <Dialog.Title className="text-[24px] font-semibold leading-[1.6] text-neutral-900">
          {t('users.addUserModal.title')}
        </Dialog.Title>
        <Dialog.Close asChild>
          <button
            type="button"
            aria-label={t('common.close')}
            className="flex size-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </Dialog.Close>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <TextField
          id="add-user-name"
          label={t('users.addUserModal.username')}
          icon={EditIcon}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('users.addUserModal.usernamePlaceholder')}
        />

        <div className="space-y-2">
          <label htmlFor="add-user-role" className="block text-[15px] font-medium text-neutral-900">
            {t('users.addUserModal.role')}
          </label>
          <SelectField
            value={form.role}
            onChange={(value) => set('role', value as AppUserRole)}
            options={[
              { value: 'auditor', label: t('users.roles.auditor') },
              { value: 'reviewer', label: t('users.roles.reviewer') },
            ]}
            placeholder={t('users.addUserModal.rolePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-neutral-900">
            {t('users.addUserModal.mobileNumber')}
          </label>
          <PhoneInputRow
            rowClassName="gap-3"
            value={form.countryCode}
            onChange={(code) => set('countryCode', code)}
            aria-label={t('register.countryCode')}
            className="border border-neutral-200"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-blue-500">
                <AppIcon icon={PhoneIcon} size={20} />
              </span>
              <input
                id="add-user-phone"
                type="tel"
                lang="en"
                dir="ltr"
                placeholder="ex: 567XXXXXXXX"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={cn(fieldInputClassName, 'ps-12')}
              />
            </div>
          </PhoneInputRow>
        </div>

        <TextField
          id="add-user-email"
          type="email"
          label={t('users.addUserModal.email')}
          icon={MailIcon}
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="ex: info@foods.com"
        />

        <TextField
          id="add-user-password"
          type="text"
          label={t('users.addUserModal.password')}
          icon={LockIcon}
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder={t('users.addUserModal.password')}
        />

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-fit"
          onClick={() => set('password', generatePassword())}
        >
          {t('users.addUserModal.createPassword')}
        </Button>

        {/* Footer actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="lg"
            className="flex-1 bg-error-50 text-error-500 hover:bg-error-100"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={onSubmit}
            disabled={saving || !isFormComplete(form)}
          >
            {saving ? t('common.loading') : t('users.addUserModal.add')}
          </Button>
        </div>
      </div>
    </>
  )
}

interface AddUserModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

/** "Add user" dialog opened from the Users table header button. */
export function AddUserModal({ open, onClose, onCreated }: AddUserModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(560px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-white shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          {open && <AddUserForm key={open ? 'open' : 'closed'} onClose={onClose} onCreated={onCreated} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
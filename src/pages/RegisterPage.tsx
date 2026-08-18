import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AccountRegisterFlow } from '@/components/auth/AccountRegisterFlow'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export function RegisterPage() {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)

  return (
    <AuthLayout reverse contentClassName="!max-w-[780px]">
      <LanguageToggle variant="icon" className="mb-10" />
      <AccountRegisterFlow onSubmittedChange={setSubmitted} />
      {!submitted && (
        <p className="text-center text-body-2-medium text-neutral-500 mt-8">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-body-2-semibold text-primary underline underline-offset-2">
            {t('auth.signIn')}
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}

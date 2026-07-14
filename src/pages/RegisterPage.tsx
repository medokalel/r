import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthFieldLabel } from '@/components/auth/AuthFieldLabel'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { DEFAULT_COUNTRY_CODE, getCountryOptions, type CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { AuthSelectField } from '@/components/auth/AuthSelectField'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { authInputClassName, AuthTextField, authFieldValueClassName, authPlaceholderClassName } from '@/components/auth/AuthTextField'
import { EntityTypeOption, type EntityType } from '@/components/auth/EntityTypeOption'
import { FileUploadField } from '@/components/auth/FileUploadField'
import { OtpInput } from '@/components/auth/OtpInput'
import { RegisterStepNav } from '@/components/auth/RegisterStepNav'
import {
  AppIcon,
  EyeIcon,
  EyeSlashIcon,
  LegalCapacityIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserOctagonIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { cn } from '@/lib/utils'
import {
  clearRegisterDraft,
  loadRegisterDraft,
  saveRegisterDraft,
} from '@/lib/registerDraftStorage'
import {
  isValidEmail,
  isValidMobile,
  isValidPassword,
  passwordsMatch,
} from '@/lib/authValidation'
import {
  formatPhoneNumber,
  register,
  sendVerificationCode,
  uploadAuthorizationLetter,
  verifyEmail,
} from '@/lib/api/authApi'
import { ApiError } from '@/lib/api/client'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'

const OTP_LENGTH = 6

interface RegisterForm {
  entityType: EntityType | null
  governmentAgency: string
  email: string
  otp: string[]
  management: string
  facilityOwner: string
  legalCapacity: string
  authorizationFile: File | null
  authorizationFileName: string
  activity: string
  country: CountryCode
  governorate: string
  mobile: string
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

const emptyOtp = () => Array.from({ length: OTP_LENGTH }, () => '')

const initialForm: RegisterForm = {
  entityType: null,
  governmentAgency: '',
  email: '',
  otp: emptyOtp(),
  management: '',
  facilityOwner: '',
  legalCapacity: '',
  authorizationFile: null,
  authorizationFileName: '',
  activity: '',
  country: DEFAULT_COUNTRY_CODE,
  governorate: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

function createInitialState() {
  const draft = loadRegisterDraft()
  if (!draft) {
    return { step: 1, form: initialForm, codeSent: false }
  }

  return {
    step: draft.step,
    codeSent: draft.codeSent,
    form: {
      ...initialForm,
      ...draft.form,
      otp: draft.form.otp.length === OTP_LENGTH ? draft.form.otp : emptyOtp(),
      authorizationFile: null,
      password: '',
      confirmPassword: '',
    },
  }
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [initialState] = useState(createInitialState)
  const [step, setStep] = useState(initialState.step)
  const [form, setForm] = useState<RegisterForm>(initialState.form)
  const [codeSent, setCodeSent] = useState(initialState.codeSent)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  useEffect(() => {
    saveRegisterDraft({
      step,
      codeSent,
      form: {
        entityType: form.entityType,
        governmentAgency: form.governmentAgency,
        email: form.email,
        otp: form.otp,
        management: form.management,
        facilityOwner: form.facilityOwner,
        legalCapacity: form.legalCapacity,
        authorizationFileName: form.authorizationFile?.name ?? form.authorizationFileName,
        activity: form.activity,
        country: form.country,
        governorate: form.governorate,
        mobile: form.mobile,
        agreePrivacy: form.agreePrivacy,
      },
    })
  }, [step, codeSent, form])

  const patch = (f: Partial<RegisterForm>) =>
    setForm((prev) => {
      const next = { ...prev, ...f }
      if ('authorizationFile' in f) {
        next.authorizationFileName = f.authorizationFile?.name ?? ''
      }
      return next
    })
  const next = () => setStep((s) => Math.min(s + 1, 4))
  const back = () => setStep((s) => Math.max(s - 1, 1))

  const otpComplete = form.otp.every((d) => d.length === 1)
  const emailValid = isValidEmail(form.email)
  const mobileValid = isValidMobile(form.mobile)
  const passwordValid = isValidPassword(form.password)
  const passwordsMatchValue = passwordsMatch(form.password, form.confirmPassword)

  const handleEntitySelect = (type: EntityType) => {
    patch({ entityType: type })
    setStep(2)
  }

  const handleSendCode = async () => {
    if (!emailValid || isSendingCode) return

    setIsSendingCode(true)
    setStepError(null)

    try {
      await sendVerificationCode(form.email.trim())
      setCodeSent(true)
      setEmailVerified(false)
    } catch (error) {
      setStepError(
        error instanceof ApiError ? error.message : t('errors.generic')
      )
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndContinue = async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail) return

    setIsVerifyingEmail(true)
    setStepError(null)

    try {
      await verifyEmail(form.email.trim(), form.otp.join(''))
      setEmailVerified(true)
      setStep((s) => Math.min(s + 1, 4))
    } catch (error) {
      setStepError(
        error instanceof ApiError ? error.message : t('errors.generic')
      )
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleStepNext = () => {
    if (step === 2) {
      if (!codeSent || !otpComplete) return
      if (!emailVerified) {
        void handleVerifyAndContinue()
        return
      }
    }
    setStepError(null)
    next()
  }

  const handleCreateAccount = async () => {
    if (
      !form.entityType ||
      !form.authorizationFile ||
      isCreatingAccount
    ) {
      return
    }

    setIsCreatingAccount(true)
    setStepError(null)

    try {
      const governorates = await fetchGovernorateOptions(form.country)
      const city =
        governorates.find((g) => g.id === form.governorate)?.name ??
        form.governorate

      const upload = await uploadAuthorizationLetter(form.authorizationFile)

      await register({
        entityType: form.entityType,
        email: form.email.trim(),
        organizationName: form.governmentAgency,
        administrationName: form.management,
        facilityOwnerManager: form.facilityOwner,
        activity: form.activity,
        legalCapacity: form.legalCapacity,
        city,
        authorizationLetterUrl: upload.fileUrl,
        phone: formatPhoneNumber(form.country, form.mobile),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })

      clearRegisterDraft()
      navigate('/login')
    } catch (error) {
      setStepError(
        error instanceof ApiError ? error.message : t('errors.generic')
      )
    } finally {
      setIsCreatingAccount(false)
    }
  }

  return (
    <AuthLayout>
      <LanguageToggle variant="icon" className="mb-10" />

      {step === 1 ? (
        <StepEntityType selected={form.entityType} onSelect={handleEntitySelect} />
      ) : (
        <>
          <h1 className="text-h1 text-neutral-900 mb-6">{t('register.title')}</h1>
          <RegisterStepNav current={(step - 1) as 1 | 2 | 3} className="mb-6" />

          {step === 2 && (
            <StepVerification
              form={form}
              codeSent={codeSent}
              isSendingCode={isSendingCode}
              onPatch={patch}
              onSendCode={handleSendCode}
            />
          )}
          {step === 3 && <StepLegal form={form} onPatch={patch} />}
          {step === 4 && (
            <StepAccount
              form={form}
              showPassword={showPassword}
              showConfirm={showConfirm}
              passwordsMatch={passwordsMatchValue}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onToggleConfirm={() => setShowConfirm(!showConfirm)}
              onPatch={patch}
            />
          )}

          {stepError && (
            <p className="text-small-light text-error-500 mt-4">{stepError}</p>
          )}

          <AuthStepActions
            className="mt-8"
            onBack={back}
            onNext={step === 4 ? handleCreateAccount : handleStepNext}
            nextLabel={
              step === 4
                ? isCreatingAccount
                  ? t('register.creatingAccount')
                  : t('register.createAccount')
                : step === 2 && codeSent && !emailVerified
                  ? isVerifyingEmail
                    ? t('register.verifyingEmail')
                    : t('register.verifyEmail')
                  : t('common.next')
            }
            nextDisabled={
              (step === 2 &&
                (!emailValid ||
                  !form.governmentAgency ||
                  !codeSent ||
                  !otpComplete ||
                  isVerifyingEmail)) ||
              (step === 3 &&
                (!form.management ||
                  !form.facilityOwner ||
                  !form.legalCapacity ||
                  !form.authorizationFile ||
                  !form.activity ||
                  !form.country ||
                  !form.governorate)) ||
              (step === 4 &&
                (!mobileValid ||
                  !passwordValid ||
                  !passwordsMatchValue ||
                  !form.agreePrivacy ||
                  isCreatingAccount))
            }
            showBack
          />
        </>
      )}

      <p className="text-center text-body-2-medium text-neutral-500 mt-8">
        {t('auth.hasAccount')}{' '}
        <Link
          to="/login"
          className="text-body-2-semibold text-primary underline underline-offset-2"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthLayout>
  )
}

function StepEntityType({
  selected,
  onSelect,
}: {
  selected: EntityType | null
  onSelect: (type: EntityType) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      <div className="mb-8 space-y-2">
        <h1 className="text-h1 text-neutral-900">{t('register.title')}</h1>
        <p className="text-body-2 text-neutral-500">{t('register.chooseEntityType')}</p>
      </div>
      <EntityTypeOption
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  )
}

function StepVerification({
  form,
  codeSent,
  isSendingCode,
  onPatch,
  onSendCode,
}: {
  form: RegisterForm
  codeSent: boolean
  isSendingCode: boolean
  onPatch: (f: Partial<RegisterForm>) => void
  onSendCode: () => void
}) {
  const { t } = useTranslation()
  const emailValid = isValidEmail(form.email)
  const emailError =
    form.email.trim().length > 0 && !emailValid ? t('validation.invalidEmail') : undefined

  return (
    <div className="space-y-6 w-full">
      <AuthSelectField
        id="government-agency"
        label={
          form.entityType === 'governmental'
            ? t('register.governmentAgency')
            : t('register.organizationName')
        }
        required
        value={form.governmentAgency}
        placeholder={
          form.entityType === 'governmental'
            ? t('register.governmentAgencyPlaceholder')
            : t('register.organizationNamePlaceholder')
        }
        onChange={(e) => onPatch({ governmentAgency: e.target.value })}
      >
        <option value="agency-1">{t('register.sampleAgency1')}</option>
        <option value="agency-2">{t('register.sampleAgency2')}</option>
      </AuthSelectField>

      <div className="space-y-3">
        <AuthFieldLabel htmlFor="reg-email" required>
          {t('auth.email')}
        </AuthFieldLabel>
        <div
          className={cn(
            'flex h-12 items-center gap-3 rounded-[var(--radius-sm)] border bg-white ps-4 pe-1.5',
            emailError ? 'border-error-400' : 'border-neutral-200'
          )}
        >
          <AppIcon icon={MailIcon} size={20} className="shrink-0 text-primary" />
          <input
            id="reg-email"
            type="email"
            lang="en"
            placeholder="ex: info@foods.com"
            value={form.email}
            onChange={(e) => onPatch({ email: toEnglishDigits(e.target.value) })}
            className={cn(
              'min-w-0 flex-1 bg-transparent pe-1 focus:outline-none',
              authFieldValueClassName,
              authPlaceholderClassName,
              englishDigitsClassName
            )}
          />
          <Button
            type="button"
            variant="primary"
            onClick={onSendCode}
            disabled={!emailValid || isSendingCode}
            className={cn(
              'h-10 w-[131px] shrink-0 gap-[10px] rounded-[var(--radius-sm)] px-6',
              'text-body-2-semibold lowercase'
            )}
          >
            {isSendingCode ? t('register.sendingCode') : t('register.verify')}
          </Button>
        </div>
        {emailError && <p className="text-small-light text-error-500">{emailError}</p>}
      </div>

      {codeSent && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-body-1-medium text-neutral-900">{t('register.emailVerification')}</p>
            <p className="text-body-2 text-neutral-500">{t('register.codeSentPrompt')}</p>
          </div>
          <OtpInput value={form.otp} onChange={(otp) => onPatch({ otp })} />
        </div>
      )}
    </div>
  )
}

function StepLegal({
  form,
  onPatch,
}: {
  form: RegisterForm
  onPatch: (f: Partial<RegisterForm>) => void
}) {
  const { t, i18n } = useTranslation()
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])
  const [governoratesLoading, setGovernoratesLoading] = useState(false)

  const countries = useMemo(
    () => getCountryOptions(i18n.language),
    [i18n.language]
  )

  useEffect(() => {
    if (!form.country) {
      setGovernorates([])
      return
    }

    let cancelled = false
    setGovernoratesLoading(true)

    fetchGovernorateOptions(form.country)
      .then((options) => {
        if (!cancelled) setGovernorates(options)
      })
      .finally(() => {
        if (!cancelled) setGovernoratesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [form.country])

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value as CountryCode
    onPatch({ country, governorate: '' })
  }

  const governoratePlaceholder = !form.country
    ? t('register.selectCountryFirst')
    : governoratesLoading
      ? t('register.loadingGovernorates')
      : governorates.length === 0
        ? t('register.noGovernoratesAvailable')
        : t('register.governoratePlaceholder')

  return (
    <div className="space-y-6 w-full">
      <AuthTextField
        id="management"
        label={t('register.management')}
        required
        placeholder={t('register.managementPlaceholder')}
        value={form.management}
        onChange={(e) => onPatch({ management: e.target.value })}
      />
      <AuthTextField
        id="facility-owner"
        label={t('register.facilityOwner')}
        icon={UserOctagonIcon}
        required
        placeholder={t('register.facilityOwnerPlaceholder')}
        value={form.facilityOwner}
        onChange={(e) => onPatch({ facilityOwner: e.target.value })}
      />
      <AuthTextField
        id="legal-capacity"
        label={t('register.legalCapacity')}
        icon={LegalCapacityIcon}
        required
        placeholder={t('register.legalCapacityPlaceholder')}
        value={form.legalCapacity}
        onChange={(e) => onPatch({ legalCapacity: e.target.value })}
      />
      <FileUploadField
        label={t('register.authorizationLetter')}
        required
        file={form.authorizationFile}
        savedFileName={form.authorizationFileName}
        onChange={(authorizationFile) => onPatch({ authorizationFile })}
      />
      <AuthSelectField
        id="activity"
        label={t('register.activity')}
        required
        value={form.activity}
        placeholder={t('register.activityPlaceholder')}
        onChange={(e) => onPatch({ activity: e.target.value })}
      >
        <option value="food">{t('register.activityFood')}</option>
        <option value="retail">{t('register.activityRetail')}</option>
      </AuthSelectField>
      <AuthSelectField
        id="country"
        label={t('register.country')}
        required
        value={form.country}
        placeholder={t('register.countryPlaceholder')}
        onChange={handleCountryChange}
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name}
          </option>
        ))}
      </AuthSelectField>
      <AuthSelectField
        id="governorate"
        label={t('register.governorate')}
        required
        value={form.governorate}
        placeholder={governoratePlaceholder}
        onChange={(e) => onPatch({ governorate: e.target.value })}
        disabled={!form.country || governoratesLoading || governorates.length === 0}
      >
        {governorates.map((governorate) => (
          <option key={governorate.id} value={governorate.id}>
            {governorate.name}
          </option>
        ))}
      </AuthSelectField>
    </div>
  )
}

function StepAccount({
  form,
  showPassword,
  showConfirm,
  passwordsMatch,
  onTogglePassword,
  onToggleConfirm,
  onPatch,
}: {
  form: RegisterForm
  showPassword: boolean
  showConfirm: boolean
  passwordsMatch: boolean
  onTogglePassword: () => void
  onToggleConfirm: () => void
  onPatch: (f: Partial<RegisterForm>) => void
}) {
  const { t } = useTranslation()
  const mobileError =
    form.mobile.trim().length > 0 && !isValidMobile(form.mobile)
      ? t('validation.invalidMobile')
      : undefined
  const passwordError =
    form.password.length > 0 && !isValidPassword(form.password)
      ? t('validation.passwordTooShort')
      : undefined

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-3">
        <AuthFieldLabel required>{t('register.mobileNumber')}</AuthFieldLabel>
        <PhoneInputRow
          rowClassName="gap-3"
          value={form.country}
          onChange={() => {}}
          disabled
          aria-label={t('register.countryCode')}
          className="border border-neutral-200"
        >
          <div className="relative flex-1">
            <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
              <AppIcon icon={PhoneIcon} size={20} />
            </span>
            <input
              id="mobile"
              type="tel"
              lang="en"
              dir="ltr"
              placeholder="ex: 567XXXXXXXX"
              value={form.mobile}
              onChange={(e) => onPatch({ mobile: toEnglishDigits(e.target.value) })}
              className={cn(
                authInputClassName,
                englishDigitsClassName,
                'ps-12',
                mobileError && 'border-error-400 focus:ring-error-400 focus:border-error-400'
              )}
            />
          </div>
        </PhoneInputRow>
        {mobileError && <p className="text-small-light text-error-500">{mobileError}</p>}
      </div>

      <AuthTextField
        id="password"
        label={t('auth.password')}
        icon={LockIcon}
        required
        type={showPassword ? 'text' : 'password'}
        placeholder={t('auth.password')}
        value={form.password}
        onChange={(e) => onPatch({ password: e.target.value })}
        error={passwordError}
        trailing={
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <AppIcon icon={showPassword ? EyeIcon : EyeSlashIcon} size={20} />
          </button>
        }
      />

      <AuthTextField
        id="confirm-password"
        label={t('register.confirmPassword')}
        icon={LockIcon}
        required
        type={showConfirm ? 'text' : 'password'}
        placeholder={t('register.confirmPasswordPlaceholder')}
        value={form.confirmPassword}
        onChange={(e) => onPatch({ confirmPassword: e.target.value })}
        error={
          form.confirmPassword && !passwordsMatch ? t('register.passwordMismatch') : undefined
        }
        trailing={
          <button
            type="button"
            onClick={onToggleConfirm}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            <AppIcon icon={showConfirm ? EyeIcon : EyeSlashIcon} size={20} />
          </button>
        }
      />

      <div className="flex items-center gap-2 justify-start">
        <Checkbox.Root
          id="privacy"
          checked={form.agreePrivacy}
          onCheckedChange={(v) => onPatch({ agreePrivacy: Boolean(v) })}
          className={cn(
            'h-5 w-5 rounded-[var(--radius-xs)] border border-neutral-200 bg-white',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
            'flex items-center justify-center shrink-0'
          )}
        >
          <Checkbox.Indicator>
            <CheckIcon className="text-white w-3.5 h-3.5" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="privacy" className="text-body-2-medium text-primary cursor-pointer">
          {t('register.agreePrivacyLead')}{' '}
        </label>
        <Link
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-2-medium text-primary underline hover:opacity-80"
        >
          {t('register.privacyPolicy')}
        </Link>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AgreementSignaturesCard } from '@/components/dashboard/cab/agreements/AgreementSignaturesCard'
import { AgreementTextCard } from '@/components/dashboard/cab/agreements/AgreementTextCard'
import { SignAgreementDialog } from '@/components/dashboard/cab/agreements/SignAgreementDialog'
import { AppIcon, PdfFileIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { downloadAgreementPdf } from '@/lib/api/agreementPdfGenerator'
import {
  getClientAgreement,
  requestClientSigningCode,
  signClientAgreement,
  type CertificationAgreement,
  type SignaturePayload,
} from '@/lib/api/cabCertificationAgreementsApi'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'

export function ClientAgreementDetailsPage() {
  const { agreementId } = useParams<{ agreementId: string }>()
  const { t, i18n } = useTranslation()
  const isAr = Boolean(i18n.language?.startsWith('ar'))

  const [agreement, setAgreement] = useState<CertificationAgreement | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [signing, setSigning] = useState(false)
  // The document follows the site language; the switch only overrides it until the site language changes.
  const siteLang = isAr ? 'ar' : 'en'
  const [picked, setPicked] = useState<{ lang: 'en' | 'ar'; siteLang: 'en' | 'ar' } | null>(null)
  const docLang = picked?.siteLang === siteLang ? picked.lang : siteLang

  useEffect(() => {
    if (!agreementId) return
    let active = true
    getClientAgreement(agreementId)
      .then((loaded) => {
        if (!active) return
        setAgreement(loaded)
        setState('ready')
      })
      .catch(() => active && setState('missing'))
    return () => {
      active = false
    }
  }, [agreementId])

  // After signing, the CAB countersigns from its own session: re-read now and then until it is active.
  const awaitingCountersign = agreement?.status === 'client_signed'
  useEffect(() => {
    if (!agreementId || !awaitingCountersign) return
    const timer = setInterval(() => {
      getClientAgreement(agreementId).then(setAgreement).catch(() => undefined)
    }, 15000)
    return () => clearInterval(timer)
  }, [agreementId, awaitingCountersign])

  /** Runs inside the dialog: a failure is thrown back so the dialog can show it. */
  const handleSign = async (payload: SignaturePayload) => {
    if (!agreement) return
    setAgreement(await signClientAgreement(agreement.id, payload))
    setSigning(false)
    toast.success(t('clientAgreements.signedToast', 'Agreement signed. Your certification body will countersign it.'))
  }

  const clientName = agreement ? (isAr ? agreement.values.clientLegalNameAr : agreement.values.clientLegalNameEn) : ''

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientAgreements.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <nav className="flex flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.agreements} className="font-light text-neutral-400 hover:text-primary">
            {t('clientAgreements.pageTitle', 'Agreements')}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-medium text-neutral-700" dir="ltr">{agreementId}</span>
        </nav>

        {state === 'loading' && <p className="text-[14px] text-neutral-500">{t('clientAgreements.loading', 'Loading agreements…')}</p>}

        {state === 'missing' && (
          <div role="status" className="flex flex-col items-center gap-4 rounded-[16px] border border-[#ececec] bg-white px-6 py-14 text-center">
            <p className="text-[16px] font-bold text-neutral-700">{t('clientAgreements.notFound', 'Agreement not found')}</p>
            <Link to={ROUTES.agreements} className="text-[14px] font-medium text-primary hover:underline">
              {t('clientAgreements.back', 'Back to agreements')}
            </Link>
          </div>
        )}

        {agreement && state === 'ready' && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[24px] font-bold text-neutral-900">
                  {t('clientAgreements.cardTitle', 'Certification agreement')} <span dir="ltr">{agreement.reference}</span>
                </h2>
                <p className="mt-1 text-[14px] text-neutral-500">{clientName}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadAgreementPdf(agreement, docLang)}
                icon={<AppIcon icon={PdfFileIcon} size={18} />}
                className="h-11 whitespace-nowrap"
              >
                {t('clientAgreements.download', 'Download PDF')}
              </Button>
            </div>

            {agreement.status === 'sent' && (
              <section className="rounded-[16px] border border-[#fde9c8] bg-[#fff8ec] p-5">
                <h3 className="text-[16px] font-bold text-[#8a5a00]">{t('clientAgreements.reviewTitle', 'Review and sign')}</h3>
                <p className="mt-1 text-[14px] text-[#8a5a00]">
                  {t('clientAgreements.reviewHint', 'Read the agreement below. By signing you accept its terms on behalf of {{client}}.', { client: clientName })}
                </p>
                <Button type="button" variant="primary" onClick={() => setSigning(true)} className="mt-4 h-11 rounded-[10px] px-6 text-[15px]">
                  {t('clientAgreements.sign', 'Sign agreement')}
                </Button>
              </section>
            )}

            {agreement.status === 'client_signed' && (
              <p role="status" className="rounded-[12px] border border-[#d6e2ff] bg-[#f4f7ff] px-5 py-3.5 text-[14px] text-primary">
                {t('clientAgreements.signedNotice', 'You signed this agreement. Your certification body will countersign it next.')}
              </p>
            )}

            {agreement.status === 'active' && (
              <p role="status" className="rounded-[12px] border border-[#bbf7d0] bg-[#eafaf1] px-5 py-3.5 text-[14px] text-[#15803d]">
                {t('clientAgreements.activeNotice', 'This agreement is signed by both parties and in force.')}
              </p>
            )}

            <section className="rounded-[16px] border border-[#ececec] bg-white p-6 sm:p-8">
              <AgreementTextCard
                agreement={agreement}
                docLang={docLang}
                onChangeDocLang={(lang) => setPicked({ lang, siteLang })}
                isAr={isAr}
              />
            </section>

            <AgreementSignaturesCard clientSignature={agreement.clientSignature} cabSignature={agreement.cabSignature} isAr={isAr} />

            <SignAgreementDialog
              open={signing}
              onClose={() => setSigning(false)}
              reference={agreement.reference}
              fingerprint={agreement.fingerprint}
              defaultName={(agreement.values.signatoryEn ?? '').split('—')[0].trim()}
              defaultTitle={(agreement.values.signatoryEn ?? '').split('—')[1]?.trim() ?? ''}
              requestCode={() => requestClientSigningCode(agreement.id)}
              onSign={handleSign}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}

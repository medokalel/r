import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AgreementStatusBadge } from '@/components/dashboard/cab/agreements/AgreementStatusBadge'
import {
  AppIcon,
  CheckIcon,
  EditIcon,
  ExportIcon,
  ShieldIcon,
  UserIcon,
} from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { getAgreementStatusLabel } from '@/lib/agreementStatus'
import {
  countersignCertificationAgreement,
  getCertificationAgreementById,
  type CertificationAgreement,
} from '@/lib/api/cabCertificationAgreementsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { ROUTES, cabCertificationAgreementDetailsPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type SignatureMode = 'draw' | 'type' | 'upload'

async function computeSha256(agreement: CertificationAgreement): Promise<string> {
  if (agreement.clientSignature?.fingerprint) {
    return agreement.clientSignature.fingerprint
  }
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return ''
  }
  const canonical = JSON.stringify({
    reference: agreement.reference,
    version: agreement.version,
    values: agreement.values,
    sections: agreement.sections,
  })
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const inputClass =
  'h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CabCertificationAgreementCountersignPage() {
  const { agreementId } = useParams<{ agreementId: string }>()
  return <AgreementCountersignForm key={agreementId} agreementId={agreementId} />
}

function AgreementCountersignForm({ agreementId }: { agreementId?: string }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAr = Boolean(i18n.language?.startsWith('ar'))

  const [agreement, setAgreement] = useState<CertificationAgreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [fingerprint, setFingerprint] = useState('')

  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [mode, setMode] = useState<SignatureMode>('draw')
  const [typedSignature, setTypedSignature] = useState('')
  const [uploadedDataUrl, setUploadedDataUrl] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    if (!agreementId) {
      setLoading(false)
      return
    }
    let active = true
    getCertificationAgreementById(agreementId)
      .then((loaded) => {
        if (!active) return
        setAgreement(loaded)
        void computeSha256(loaded).then((hash) => {
          if (active) setFingerprint(hash)
        })
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [agreementId])

  const backToDetails = () =>
    navigate(agreementId ? cabCertificationAgreementDetailsPath(agreementId) : ROUTES.cabCertificationAgreements)

  if (loading) {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'التوقيع المقابل' : 'Countersign agreement'} />
      </CabLayout>
    )
  }

  if (!agreement) {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'التوقيع المقابل' : 'Countersign agreement'} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-[16px] font-bold text-neutral-700">
            {isAr ? 'لم يتم العثور على الاتفاقية المطلوبة' : 'Agreement not found'}
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.cabCertificationAgreements)}>
            {isAr ? 'العودة إلى الاتفاقيات' : 'Back to agreements'}
          </Button>
        </main>
      </CabLayout>
    )
  }

  if (agreement.status !== 'client_signed') {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'التوقيع المقابل' : 'Countersign agreement'} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-[16px] font-bold text-neutral-700">
            {isAr
              ? 'الاتفاقية ليست في مرحلة التوقيع المقابل حالياً.'
              : 'This agreement is not currently awaiting CAB countersignature.'}
          </p>
          <Button variant="primary" onClick={backToDetails}>
            {isAr ? 'العودة إلى الاتفاقية' : 'Back to agreement'}
          </Button>
        </main>
      </CabLayout>
    )
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.setPointerCapture(e.pointerId)
    isDrawingRef.current = true
    const { x, y } = getCanvasPoint(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1236a3'
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawn) setHasDrawn(true)
  }

  const handlePointerUp = () => {
    isDrawingRef.current = false
  }

  const readUploadedFile = (file: File) => {
    setUploadedFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedDataUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readUploadedFile(file)
  }

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      readUploadedFile(file)
    }
  }

  const hasSignature =
    (mode === 'draw' && hasDrawn) ||
    (mode === 'type' && typedSignature.trim().length > 0) ||
    (mode === 'upload' && uploadedDataUrl.length > 0)

  const canSubmit =
    signerName.trim().length > 0 &&
    signerTitle.trim().length > 0 &&
    hasSignature &&
    confirmed &&
    !busy

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    try {
      await countersignCertificationAgreement(agreement.id)
      const signatureDataUrl =
        mode === 'draw'
          ? canvasRef.current?.toDataURL('image/png')
          : mode === 'upload'
            ? uploadedDataUrl
            : undefined
      try {
        localStorage.setItem(
          `icasco_cab_sig_${agreement.id}`,
          JSON.stringify({
            signerName: signerName.trim(),
            signerTitle: signerTitle.trim(),
            method: mode,
            signatureDataUrl,
            typedSignature: mode === 'type' ? typedSignature.trim() : undefined,
          }),
        )
      } catch {
        // Ignore storage quota errors
      }
      toast.success(isAr ? 'تم التوقيع المقابل وتفعيل الاتفاقية' : 'Agreement countersigned and activated')
      navigate(cabCertificationAgreementDetailsPath(agreement.id), { replace: true })
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  const shortHash = fingerprint ? `${fingerprint.slice(0, 8)}...${fingerprint.slice(-8)}` : '—'

  return (
    <CabLayout>
      <CabHeader title={isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'} notificationCount={3} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {isAr ? 'مركز التطبيقات' : 'Application Hub'}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCertificationAgreements} className="font-light text-neutral-400 hover:text-primary">
            {isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'}
          </Link>
          <Chevron />
          <Link to={cabCertificationAgreementDetailsPath(agreement.id)} className="font-light text-neutral-400 hover:text-primary" dir="ltr">
            {agreement.reference}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{isAr ? 'التوقيع المقابل' : 'Countersign'}</span>
        </nav>

        {/* iCASCO Page Header Bar */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {isAr ? 'التوقيع المقابل على اتفاقية منح الشهادة' : 'Countersign certification agreement'}{' '}
              <span className="text-primary" dir="ltr">{agreement.reference}</span>
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {isAr
                ? 'أنت توقّع هذه الاتفاقية نيابة عن جهة المنح، ويسري توقيعك على النص باللغتين.'
                : 'You are signing on behalf of the certification body; your signature applies to both language versions.'}
            </p>
          </div>

          <button
            type="button"
            onClick={backToDetails}
            className="flex h-11 shrink-0 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rtl-flip"
              aria-hidden
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{isAr ? 'العودة إلى الاتفاقية' : 'Back to agreement'}</span>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          {/* Left 8 Columns */}
          <div className="flex flex-col gap-5 xl:col-span-8">
            {/* Section 1: Signatory Identity */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f0f0] pb-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
                  <AppIcon icon={UserIcon} size={18} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {isAr ? 'بيانات الموقّع المخوّل' : 'Authorised signatory details'}
                  </h2>
                  <p className="text-[12px] text-neutral-500">
                    {isAr ? 'تُسجّل هذه البيانات رسمياً في شهادة التوقيع وسجل التدقيق.' : 'Recorded officially in the signature certificate and audit trail.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-neutral-800">
                    {isAr ? 'الاسم الكامل' : 'Full name'} <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder={isAr ? 'أدخل الاسم الكامل' : 'Enter full name'}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-neutral-800">
                    {isAr ? 'المسمى الوظيفي' : 'Job title'} <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: المدير التنفيذي' : 'e.g. Managing Director'}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Electronic Signature Pad */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0f0] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eafaf1] text-[#16a34a]">
                    <AppIcon icon={ShieldIcon} size={18} />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold text-neutral-900">
                      {isAr ? 'التوقيع الإلكتروني' : 'Electronic signature'}
                    </h2>
                    <p className="text-[12px] text-neutral-500">
                      {isAr ? 'اختر طريقة التوقيع بالرسم أو الكتابة أو رفع صورة.' : 'Choose to draw, type, or upload your signature.'}
                    </p>
                  </div>
                </div>

                <div className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
                  {(
                    [
                      { key: 'draw', ar: 'رسم', en: 'Draw' },
                      { key: 'type', ar: 'كتابة', en: 'Type' },
                      { key: 'upload', ar: 'رفع', en: 'Upload' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setMode(tab.key)}
                      className={cn(
                        'h-full rounded-[6px] px-3.5 text-[12px] font-medium transition-colors',
                        mode === tab.key
                          ? 'bg-[#1236a3] text-white shadow-xs'
                          : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                      )}
                    >
                      {isAr ? tab.ar : tab.en}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'draw' && (
                <div className="space-y-2">
                  <div className="relative overflow-hidden rounded-[12px] border border-dashed border-[#cbd5e1] bg-[#f9fafc]">
                    <canvas
                      ref={canvasRef}
                      width={700}
                      height={200}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className="h-[190px] w-full cursor-crosshair touch-none"
                    />
                    {!hasDrawn && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-[13px] text-neutral-400">
                        <AppIcon icon={EditIcon} size={15} />
                        <span>
                          {isAr
                            ? 'وقّع هنا بإصبعك أو بالقلم أو بالفأرة'
                            : 'Sign here with your finger, stylus, or mouse'}
                        </span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-x-10 bottom-8 border-b border-[#cbd5e1]" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      disabled={!hasDrawn}
                      className="text-[12px] font-semibold text-neutral-500 transition-colors hover:text-primary disabled:opacity-40"
                    >
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'type' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder={isAr ? 'اكتب اسمك لاعتماده كتوقيع...' : 'Type your name as signature...'}
                    className={inputClass}
                  />
                  <div className="flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#cbd5e1] bg-[#f9fafc] px-4">
                    <span className="font-serif text-[30px] italic text-primary">
                      {typedSignature.trim() || (isAr ? 'معاينة التوقيع' : 'Signature preview')}
                    </span>
                  </div>
                </div>
              )}

              {mode === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFile}
                  onClick={() => uploadInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      uploadInputRef.current?.click()
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#d5dce6] bg-white px-6 py-7 transition-colors hover:border-primary"
                >
                  {uploadedDataUrl ? (
                    <>
                      <img src={uploadedDataUrl} alt="Signature" className="max-h-[110px] object-contain" />
                      {uploadedFileName && (
                        <p className="truncate text-[13px] font-medium text-primary">{uploadedFileName}</p>
                      )}
                      <div
                        className="flex flex-wrap items-center justify-center gap-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => uploadInputRef.current?.click()}
                          className="text-[13px] font-bold text-primary underline"
                        >
                          {isAr ? 'تغيير الملف' : 'Change file'}
                        </button>
                        <span className="text-neutral-300">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedDataUrl('')
                            setUploadedFileName('')
                            if (uploadInputRef.current) uploadInputRef.current.value = ''
                          }}
                          className="text-[13px] font-medium text-neutral-500 hover:text-[#dc2626]"
                        >
                          {isAr ? 'إزالة' : 'Remove'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                        <AppIcon icon={ExportIcon} size={22} />
                      </span>
                      <div className="text-start">
                        <p className="text-[14px] font-semibold text-neutral-800">
                          {isAr ? (
                            <>
                              اسحب ملفك وأفلته هنا أو{' '}
                              <span className="font-bold text-primary underline">تصفح</span>
                            </>
                          ) : (
                            <>
                              Drag and drop your file here or{' '}
                              <span className="font-bold text-primary underline">Browse</span>
                            </>
                          )}
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          {isAr
                            ? 'PNG أو JPG أو SVG حتى 5 ميغابايت'
                            : 'PNG, JPG, or SVG up to 5 MB'}
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-3.5 text-[13px] leading-relaxed text-neutral-700">
                <Checkbox
                  checked={confirmed}
                  onChange={() => setConfirmed((prev) => !prev)}
                  className="mt-0.5"
                />
                <span>
                  {isAr
                    ? 'قرأت الاتفاقية وأوافق على توقيعها إلكترونياً، ويُسجّل معها الاسم والمسمى الوظيفي وتوقيت وتاريخ التوقيع وبصمة المستند.'
                    : 'I have read the agreement and agree to sign it electronically, recording my name, job title, timestamp, and document fingerprint.'}
                </span>
              </label>
            </section>
          </div>

          {/* Right Sticky Summary & Actions Sidebar (4 cols) */}
          <aside className="flex flex-col gap-5 xl:col-span-4 xl:sticky xl:top-6">
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="flex items-center justify-between gap-2 border-b border-[#ececec] pb-3.5">
                <h3 className="text-[15px] font-bold text-neutral-900">
                  {isAr ? 'ملخص التوقيع' : 'Signing summary'}
                </h3>
                <AgreementStatusBadge
                  status={agreement.status}
                  label={getAgreementStatusLabel(agreement.status, isAr)}
                />
              </div>

              <div className="mt-4 space-y-3 text-[13px]">
                <div>
                  <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'مرجع الاتفاقية' : 'Reference'}</p>
                  <p className="mt-0.5 font-bold text-primary" dir="ltr">{agreement.reference}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'العميل' : 'Client'}</p>
                  <p className="mt-0.5 font-semibold text-neutral-900">
                    {isAr ? agreement.values.clientLegalNameAr : agreement.values.clientLegalNameEn}
                  </p>
                </div>
                {agreement.clientSignature && (
                  <div className="rounded-[10px] border border-[#bbf7d0] bg-[#eafaf1]/50 p-3">
                    <p className="text-[11px] font-semibold text-[#15803d]">
                      {isAr ? 'توقيع العميل المسجل' : 'Client signature recorded'}
                    </p>
                    <p className="mt-1 font-semibold text-neutral-900">{agreement.clientSignature.signerName}</p>
                    <p className="text-[11px] text-neutral-500" dir="ltr">{agreement.clientSignature.signedAt}</p>
                  </div>
                )}
                <div className="rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-3">
                  <p className="text-[11px] font-medium text-neutral-500">
                    {isAr ? 'بصمة المستند (SHA-256)' : 'Document fingerprint (SHA-256)'}
                  </p>
                  <p className="mt-1 font-mono text-[11px] font-medium text-neutral-800" dir="ltr">
                    {shortHash}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 border-t border-[#f0f0f0] pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canSubmit}
                  icon={<AppIcon icon={CheckIcon} size={18} />}
                  className="h-11 w-full"
                >
                  {isAr ? 'التوقيع المقابل' : 'Countersign'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={backToDetails}
                  className="h-11 w-full"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </section>
          </aside>
        </form>
      </main>
    </CabLayout>
  )
}

export default CabCertificationAgreementCountersignPage

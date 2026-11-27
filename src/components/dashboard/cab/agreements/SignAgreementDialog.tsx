import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api/client'
import type { SignaturePayload, SigningCodeInfo } from '@/lib/api/cabCertificationAgreementsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toEnglishDigits } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

type Mode = 'draw' | 'type' | 'upload'
type Captured = SignaturePayload['signature']

const MAX_UPLOAD_BYTES = 250 * 1024
const CODE_RESEND_SECONDS = 30
const typedFont = "'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive"

interface SignAgreementDialogProps {
  open: boolean
  onClose: () => void
  /** e.g. "AGR-0003 v1" */
  reference: string
  /** SHA-256 of the exact text being signed, as returned by the backend. */
  fingerprint: string
  defaultName: string
  defaultTitle: string
  requestCode: () => Promise<SigningCodeInfo>
  /** Signs with the collected details; throws on failure (the dialog shows the message). */
  onSign: (payload: SignaturePayload) => Promise<void>
}

/** Name, title, a drawn / typed / uploaded signature, consent and an emailed 6-digit code. */
export function SignAgreementDialog({ open, onClose, ...form }: SignAgreementDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 max-h-[calc(100vh-32px)] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[16px] bg-white p-6 shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          {/* Mounted only while open, so every opening starts with an empty form. */}
          <SignForm {...form} onClose={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SignForm({
  onClose,
  reference,
  fingerprint,
  defaultName,
  defaultTitle,
  requestCode,
  onSign,
}: Omit<SignAgreementDialogProps, 'open'>) {
  const { t } = useTranslation()
  const [name, setName] = useState(defaultName)
  const [title, setTitle] = useState(defaultTitle)
  const [mode, setMode] = useState<Mode>('draw')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [upload, setUpload] = useState<{ dataUrl: string; name: string } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [captured, setCaptured] = useState<Captured | null>(null)
  const [consent, setConsent] = useState(false)
  const [codeInfo, setCodeInfo] = useState<SigningCodeInfo | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const hex = fingerprint.replace(/^SHA256:/, '')
  const shortFingerprint = hex.length > 18 ? `${hex.slice(0, 8)}…${hex.slice(-8)}` : hex

  /** Server messages are English; show them in the site language when we know them. */
  const describe = (e: unknown): string => {
    if (e instanceof ApiError) {
      const m = e.message
      const left = m.match(/Incorrect code\. (\d+) attempts? left/)
      if (left) return t('signAgreement.errors.incorrect', { count: Number(left[1]), defaultValue: m })
      if (/expired or was never requested/.test(m)) return t('signAgreement.errors.expired', m)
      if (/Too many incorrect/.test(m)) return t('signAgreement.errors.locked', m)
      if (/just sent/.test(m)) return t('signAgreement.errors.wait', m)
      if (/changed after you opened/.test(m)) return t('signAgreement.errors.changed', m)
      if (/could not be delivered/.test(m)) return t('signAgreement.errors.delivery', m)
      if (/already signed/.test(m)) return t('signAgreement.errors.already', m)
    }
    return getUserErrorMessage(e, t)
  }

  // ---- drawing
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) * canvas.width) / rect.width, y: ((e.clientY - rect.top) * canvas.height) / rect.height }
  }
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    setCaptured(null)
    setHasDrawn(true)
    const { x, y } = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1236a3'
  }
  const moveDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  const clearCanvas = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setCaptured(null)
  }

  // ---- the three signature kinds
  const switchMode = (next: Mode) => {
    setMode(next)
    setCaptured(null)
    if (next === 'type' && !typedText) setTypedText(name)
  }
  const handleFile = (file?: File) => {
    setCaptured(null)
    setUpload(null)
    setUploadError('')
    if (!file) return
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setUploadError(t('signAgreement.uploadWrongType', 'Choose a PNG, JPG or WebP image.'))
    if (file.size > MAX_UPLOAD_BYTES) return setUploadError(t('signAgreement.uploadTooLarge', 'The image is too large (250 KB at most).'))
    const reader = new FileReader()
    reader.onload = () => setUpload({ dataUrl: String(reader.result), name: file.name })
    reader.readAsDataURL(file)
  }
  const canCapture = mode === 'draw' ? hasDrawn : mode === 'type' ? typedText.trim().length > 0 : Boolean(upload)
  const captureSignature = () => {
    if (mode === 'draw' && canvasRef.current) setCaptured({ method: 'draw', dataUrl: canvasRef.current.toDataURL('image/png') })
    if (mode === 'type') setCaptured({ method: 'type', typedText: typedText.trim() })
    if (mode === 'upload' && upload) setCaptured({ method: 'upload', dataUrl: upload.dataUrl })
  }

  // ---- code
  const emailCode = async () => {
    setError('')
    setSending(true)
    try {
      setCodeInfo(await requestCode())
      setCooldown(CODE_RESEND_SECONDS)
    } catch (e) {
      setError(describe(e))
    } finally {
      setSending(false)
    }
  }

  const ready = name.trim() && title.trim() && captured && consent && code.length === 6
  const submit = async () => {
    if (!ready || !captured) return
    setError('')
    setBusy(true)
    try {
      await onSign({ signerName: name.trim(), signerTitle: title.trim(), signature: captured, consent: true, code, fingerprint })
    } catch (e) {
      setError(describe(e))
      setBusy(false)
    }
  }

  const fieldClass = 'h-11 w-full rounded-[10px] border border-[#e2e2e2] px-3.5 text-[14px] outline-none focus:border-primary'
  const tabs: { key: Mode; label: string }[] = [
    { key: 'draw', label: t('signAgreement.draw', 'Draw') },
    { key: 'type', label: t('signAgreement.type', 'Type') },
    { key: 'upload', label: t('signAgreement.upload', 'Upload') },
  ]

  return (
    <>
      <Dialog.Title className="text-[20px] font-semibold text-neutral-900">{t('signAgreement.title', 'Sign the certification agreement')}</Dialog.Title>
      <p className="mt-2 text-[14px] leading-[1.7] text-neutral-600">
        {t('signAgreement.intro', 'You are signing {{reference}}. Your signature applies to the text in both languages.', { reference })}
      </p>
      <p className="mt-2 text-[12px] text-neutral-500" dir="ltr">
        {t('signAgreement.fingerprint', 'Document fingerprint (SHA-256): {{value}}', { value: shortFingerprint })}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-[13px] font-semibold text-neutral-800">{t('signAgreement.fullName', 'Full name')} *</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[13px] font-semibold text-neutral-800">{t('signAgreement.jobTitle', 'Job title')} *</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </label>
      </div>

      <div className="mt-5">
        <span className="block text-[13px] font-semibold text-neutral-800">{t('signAgreement.signature', 'Signature')}</span>
        <div role="tablist" className="mt-2 inline-flex h-10 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={mode === tab.key}
              onClick={() => switchMode(tab.key)}
              className={cn('h-full rounded-[6px] px-4 text-[13px] font-medium transition-colors', mode === tab.key ? 'bg-[#1236a3] text-white shadow-xs' : 'text-neutral-600 hover:bg-white hover:text-neutral-900')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {/* The canvas stays mounted (hidden) so a drawing survives switching tabs. */}
          <div className={cn('relative', mode !== 'draw' && 'hidden')}>
            <canvas
              ref={canvasRef}
              width={600}
              height={160}
              onPointerDown={startDrawing}
              onPointerMove={moveDrawing}
              onPointerUp={() => (drawingRef.current = false)}
              onPointerCancel={() => (drawingRef.current = false)}
              className="h-40 w-full touch-none rounded-[10px] border border-dashed border-[#c5cbd5] bg-[#fcfcfd]"
              aria-label={t('signAgreement.drawHint', 'Sign here with your finger, pen or mouse')}
            />
            {!hasDrawn && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-neutral-400">
                {t('signAgreement.drawHint', 'Sign here with your finger, pen or mouse')}
              </span>
            )}
          </div>

          {mode === 'type' && (
            <div className="space-y-2">
              <input
                type="text"
                value={typedText}
                onChange={(e) => {
                  setTypedText(e.target.value)
                  setCaptured(null)
                }}
                placeholder={t('signAgreement.typeLabel', 'Type your name')}
                className={fieldClass}
              />
              <div className="flex h-24 items-center justify-center rounded-[10px] border border-dashed border-[#c5cbd5] bg-[#fcfcfd] px-3 text-[34px] text-[#1236a3]" style={{ fontFamily: typedFont }} dir="ltr">
                {typedText}
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="block w-full text-[13px] text-neutral-700 file:me-3 file:rounded-[8px] file:border-0 file:bg-[#e8edfc] file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-primary"
              />
              <p className="text-[12px] text-neutral-500">{t('signAgreement.uploadHint', 'A PNG, JPG or WebP image of your signature, up to 250 KB.')}</p>
              {uploadError && <p role="alert" className="text-[12px] text-[#b91c1c]">{uploadError}</p>}
              {upload && <img src={upload.dataUrl} alt={upload.name} className="max-h-24 rounded-[8px] border border-[#ececec] bg-white p-2" />}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {mode === 'draw' && (
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>{t('signAgreement.clear', 'Clear')}</Button>
          )}
          <Button type="button" variant={captured ? 'outline' : 'primary'} size="sm" disabled={!canCapture} onClick={captureSignature}>
            {t('signAgreement.useSignature', 'Use this signature')}
          </Button>
          {captured && <span className="text-[13px] font-medium text-[#15803d]">✓ {t('signAgreement.signatureReady', 'Signature ready')}</span>}
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[14px] leading-[1.6] text-neutral-800">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[#1236a3]" />
        <span>{t('signAgreement.consent', 'I have read the agreement and agree to sign it electronically. My name, title, signature, date and time, IP address and device are recorded with it.')}</span>
      </label>

      <div className="mt-5 rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-4">
        <h4 className="text-[14px] font-semibold text-neutral-900">{t('signAgreement.codeTitle', 'Signing code')}</h4>
        <p className="mt-1 text-[13px] text-neutral-600">
          {t('signAgreement.codeHelp', 'We email you a 6 digit code. It is valid for 10 minutes and you have 5 attempts.')}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={sending || cooldown > 0} onClick={() => void emailCode()}>
            {sending
              ? t('signAgreement.sending', 'Sending…')
              : codeInfo
                ? t('signAgreement.emailNewCode', 'Email me a new code')
                : t('signAgreement.emailCode', 'Email me a code')}
            {cooldown > 0 && !sending ? ` (${cooldown})` : ''}
          </Button>
          {codeInfo && <span className="text-[13px] text-[#15803d]" dir="ltr">{t('signAgreement.codeSent', 'We sent a code to {{email}}.', { email: codeInfo.sentTo })}</span>}
        </div>
        <label className="mt-3 block space-y-1.5">
          <span className="block text-[13px] font-semibold text-neutral-800">{t('signAgreement.enterCode', 'Enter the 6 digit code')}</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 6))}
            dir="ltr"
            className="h-12 w-full rounded-[10px] border border-[#e2e2e2] bg-white text-center text-[20px] tracking-[0.5em] outline-none focus:border-primary"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="button" variant="primary" size="sm" disabled={!ready || busy} onClick={() => void submit()}>
          {busy ? t('signAgreement.signing', 'Signing…') : t('signAgreement.submit', 'Sign agreement')}
        </Button>
      </div>
    </>
  )
}

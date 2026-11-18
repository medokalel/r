import { useRef, useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { SelectField } from '@/components/ui/Select'
import { IcascoFileDropzone } from '@/components/cab/auditPlanning/shared'
import type { AttendeeRecord } from '@/lib/api/cabAuditPlanningApi'
import { cn } from '@/lib/utils'

interface AttendanceSignaturePanelProps {
  title: string
  attendees: AttendeeRecord[]
  onAddAttendee: (attendee: AttendeeRecord) => void
  onRemoveAttendee: (id: string) => void
}

export function AttendanceSignaturePanel({
  title,
  attendees,
  onAddAttendee,
  onRemoveAttendee,
}: AttendanceSignaturePanelProps) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [organization, setOrganization] = useState<AttendeeRecord['organization']>('Client')
  const [attendedRemotely, setAttendedRemotely] = useState(false)
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw')
  const [typedSignature, setTypedSignature] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [capturedSignature, setCapturedSignature] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>
    return {
      x: (mouseEvent.clientX - rect.left) * scaleX,
      y: (mouseEvent.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    isDrawingRef.current = true
    setHasDrawn(true)
    const { x, y } = getCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1236a3'
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = getCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setHasDrawn(false)
    setCapturedSignature('')
  }

  const handleUseSignature = () => {
    if (signatureMode === 'draw' && canvasRef.current) {
      setCapturedSignature(canvasRef.current.toDataURL('image/png'))
    } else if (signatureMode === 'type' && typedSignature.trim()) {
      setCapturedSignature(`typed:${typedSignature.trim()}`)
    } else if (signatureMode === 'upload' && uploadedFile) {
      setCapturedSignature(`file:${uploadedFile.name}`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    let finalSig = capturedSignature
    if (!finalSig && signatureMode === 'draw' && hasDrawn && canvasRef.current) {
      finalSig = canvasRef.current.toDataURL('image/png')
    }
    if (!finalSig && signatureMode === 'type' && typedSignature.trim()) {
      finalSig = `typed:${typedSignature.trim()}`
    }
    if (!finalSig && signatureMode === 'upload' && uploadedFile) {
      finalSig = `file:${uploadedFile.name}`
    }

    onAddAttendee({
      id: `att-${Date.now()}`,
      name: name.trim(),
      position: position.trim(),
      organization,
      attendedRemotely,
      signatureMode,
      signatureValue: finalSig || undefined,
    })

    setName('')
    setPosition('')
    setAttendedRemotely(false)
    setTypedSignature('')
    setUploadedFile(null)
    setCapturedSignature('')
    clearCanvas()
  }

  return (
    <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
      <div>
        <h3 className="text-[15px] font-bold text-neutral-900">{title}</h3>
        <p className="mt-0.5 text-[12px] text-neutral-500">
          Each attendee signs on this device: draw, type or upload the signature.
        </p>
      </div>

      {/* Recorded Attendees */}
      {attendees.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] py-4 text-center text-[13px] text-neutral-400">
          No attendee recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {attendees.map((att) => (
            <div
              key={att.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#ececec] bg-[#fcfcfd] px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-neutral-900">{att.name}</span>
                  <span className="rounded-[4px] bg-[#eef2ff] px-2 py-0.5 text-[11px] font-semibold text-[#1236a3]">
                    {att.organization}
                  </span>
                  {att.attendedRemotely && (
                    <span className="rounded-[4px] bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                      Remote
                    </span>
                  )}
                </div>
                {att.position && <p className="text-[12px] text-neutral-500">{att.position}</p>}
              </div>

              <div className="flex items-center gap-3">
                {att.signatureValue ? (
                  att.signatureValue.startsWith('data:image') ? (
                    <img
                      src={att.signatureValue}
                      alt={`${att.name} signature`}
                      className="h-9 rounded border border-[#e2e2e2] bg-white px-1"
                    />
                  ) : (
                    <span className="rounded-[4px] border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-semibold text-[#15803d]">
                      Signed ({att.signatureValue.replace(/^(typed:|file:)/, '')})
                    </span>
                  )
                ) : (
                  <span className="rounded-[4px] bg-[#fff7ed] px-2.5 py-1 text-[11px] font-medium text-[#ea580c]">
                    Pending signature
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveAttendee(att.id)}
                  className="text-[12px] font-semibold text-neutral-400 hover:text-error-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add an attendee inline form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[10px] border border-[#e2e8f5] bg-[#f9fafc] p-4"
      >
        <h4 className="text-[14px] font-bold text-neutral-900">Add an attendee</h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">
              Name <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] focus:border-[#1236a3] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] focus:border-[#1236a3] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">
              Organization
            </label>
            <SelectField
              value={organization}
              onChange={(val) => setOrganization(val as AttendeeRecord['organization'])}
              options={['Client', 'Audit team', 'Observer']}
              className="h-10"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-neutral-700">
          <Checkbox
            checked={attendedRemotely}
            onChange={() => setAttendedRemotely((prev) => !prev)}
          />
          <span>Attended remotely</span>
        </label>

        {/* Signature Pad */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-neutral-700">Signature</span>
            <div className="inline-flex rounded-[8px] border border-[#e2e2e2] bg-white p-0.5 text-[12px]">
              {(['draw', 'type', 'upload'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSignatureMode(mode)}
                  className={cn(
                    'rounded-[6px] px-3 py-1 font-medium capitalize transition',
                    signatureMode === mode
                      ? 'bg-[#1236a3] text-white'
                      : 'text-neutral-600 hover:text-neutral-900',
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {signatureMode === 'draw' && (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-[8px] border border-dashed border-[#c7d7fa] bg-white">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="h-[140px] w-full cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <span className="pointer-events-none absolute bottom-2 start-3 text-[11px] text-neutral-400">
                    Sign here with your finger, pen or mouse
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="h-8 rounded-[6px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleUseSignature}
                  className="h-8 rounded-[6px] border border-[#1236a3] bg-white px-3 text-[12px] font-semibold text-[#1236a3] hover:bg-[#f3f6fd]"
                >
                  Use this signature
                </button>
                {capturedSignature && (
                  <span className="text-[12px] font-medium text-[#15803d]">✓ Signature captured</span>
                )}
              </div>
            </div>
          )}

          {signatureMode === 'type' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type full name as signature"
                className="h-10 flex-1 rounded-[8px] border border-[#e2e2e2] bg-white px-3 font-serif text-[15px] italic text-[#1236a3]"
              />
              <button
                type="button"
                onClick={handleUseSignature}
                className="h-10 rounded-[8px] border border-[#1236a3] bg-white px-3.5 text-[12px] font-semibold text-[#1236a3] hover:bg-[#f3f6fd]"
              >
                Use this signature
              </button>
            </div>
          )}

          {signatureMode === 'upload' && (
            <IcascoFileDropzone
              fileName={uploadedFile?.name}
              onSelectFile={(file) => {
                setUploadedFile(file)
                setCapturedSignature(`file:${file.name}`)
              }}
              onClear={() => {
                setUploadedFile(null)
                setCapturedSignature('')
              }}
              hint="PNG, JPG or SVG up to 5 MB"
            />
          )}

          <p className="text-[11px] text-neutral-400">
            Optional now: the attendee can also sign later.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
          >
            Add attendee
          </button>
        </div>
      </form>
    </section>
  )
}

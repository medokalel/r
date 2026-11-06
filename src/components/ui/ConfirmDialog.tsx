import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  /** Defaults to the shared "Cancel" label. */
  cancelLabel?: string
  /** Use for actions that delete or cannot be undone. */
  destructive?: boolean
  /**
   * Runs when the person confirms. The dialog stays open (buttons disabled) until it settles —
   * the caller closes it and handles any error itself.
   */
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

/** Small confirmation dialog for destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className="fixed start-1/2 top-1/2 z-50 w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] bg-white p-6 shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          <Dialog.Title className="text-[20px] font-semibold leading-snug text-neutral-900">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-3 text-[14px] leading-[1.7] text-neutral-600">
              {description}
            </Dialog.Description>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onClose}>
              {cancelLabel ?? t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant={destructive ? 'destructive' : 'primary'}
              size="sm"
              disabled={busy}
              onClick={() => void handleConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

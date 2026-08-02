import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui/TextField'
import { CvvHintTooltip } from '@/components/dashboard/wallet/CvvHintTooltip'
import {
  WalletModalActions,
  WalletModalShell,
  WalletSecurityNotice,
} from '@/components/dashboard/wallet/WalletModalShell'

interface UpdateAccountModalProps {
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function UpdateAccountModal({ open, onClose, onUpdate }: UpdateAccountModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    paymentMethodName: '',
    cardHolderName: '',
    cardNumber: '8000 0000 6080 1016 7519',
    cvv: '567',
  })

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onUpdate()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.updateAccountModal.title')}
      subtitle={t('wallet.updateAccountModal.subtitle')}
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <TextField
          id="update-payment-name"
          label={t('wallet.addPaymentModal.paymentMethodName')}
          value={form.paymentMethodName}
          onChange={(e) => setForm((prev) => ({ ...prev, paymentMethodName: e.target.value }))}
          placeholder={t('wallet.addPaymentModal.paymentMethodNamePlaceholder')}
        />
        <TextField
          id="update-card-holder"
          label={t('wallet.addPaymentModal.cardHolderName')}
          value={form.cardHolderName}
          onChange={(e) => setForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
          placeholder={t('wallet.addPaymentModal.cardHolderNamePlaceholder')}
        />
        <TextField
          id="update-card-number"
          label={t('wallet.addPaymentModal.cardNumber')}
          value={form.cardNumber}
          onChange={(e) => setForm((prev) => ({ ...prev, cardNumber: e.target.value }))}
          dir="ltr"
        />
        <TextField
          id="update-cvv"
          label={t('wallet.addPaymentModal.cvv')}
          labelExtra={<CvvHintTooltip />}
          value={form.cvv}
          onChange={(e) => setForm((prev) => ({ ...prev, cvv: e.target.value }))}
          dir="ltr"
        />

        <WalletSecurityNotice />

        <WalletModalActions
          onCancel={onClose}
          onConfirm={handleUpdate}
          confirmLabel={t('wallet.updateAccountModal.update')}
          loading={loading}
        />
      </div>
    </WalletModalShell>
  )
}

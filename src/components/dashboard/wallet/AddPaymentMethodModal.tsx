import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { CvvHintTooltip } from '@/components/dashboard/wallet/CvvHintTooltip'
import {
  PaymentMethodToggle,
  WalletModalActions,
  WalletModalShell,
  WalletSecurityNotice,
} from '@/components/dashboard/wallet/WalletModalShell'

interface AddPaymentMethodModalProps {
  open: boolean
  onClose: () => void
  onAdd: () => void
}

export function AddPaymentMethodModal({ open, onClose, onAdd }: AddPaymentMethodModalProps) {
  const { t } = useTranslation()
  const [method, setMethod] = useState<'visa' | 'bank'>('visa')
  const [loading, setLoading] = useState(false)

  const [visaForm, setVisaForm] = useState({
    paymentMethodName: '',
    cardHolderName: '',
    cardNumber: '8000 0000 6080 1016 7519',
    cvv: '567',
  })

  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankBranch: 'grandmother',
    iban: '8000 0000 6080 1016 7519',
    paymentMethodName: '',
    accountHolderName: '',
    accountNumber: '2345607968574635',
    swiftCode: 'XXXXsar36748',
  })

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onAdd()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.addPaymentModal.title')}
      subtitle={t('wallet.addPaymentModal.subtitle')}
      wide={method === 'bank'}
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <PaymentMethodToggle value={method} onChange={setMethod} />

        {method === 'visa' ? (
          <div className="flex flex-col gap-5">
            <TextField
              id="visa-payment-name"
              label={t('wallet.addPaymentModal.paymentMethodName')}
              value={visaForm.paymentMethodName}
              onChange={(e) => setVisaForm((prev) => ({ ...prev, paymentMethodName: e.target.value }))}
              placeholder={t('wallet.addPaymentModal.paymentMethodNamePlaceholder')}
            />
            <TextField
              id="visa-card-holder"
              label={t('wallet.addPaymentModal.cardHolderName')}
              value={visaForm.cardHolderName}
              onChange={(e) => setVisaForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
              placeholder={t('wallet.addPaymentModal.cardHolderNamePlaceholder')}
            />
            <TextField
              id="visa-card-number"
              label={t('wallet.addPaymentModal.cardNumber')}
              value={visaForm.cardNumber}
              onChange={(e) => setVisaForm((prev) => ({ ...prev, cardNumber: e.target.value }))}
              dir="ltr"
            />
            <TextField
              id="visa-cvv"
              label={t('wallet.addPaymentModal.cvv')}
              labelExtra={<CvvHintTooltip />}
              value={visaForm.cvv}
              onChange={(e) => setVisaForm((prev) => ({ ...prev, cvv: e.target.value }))}
              dir="ltr"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              id="bank-payment-name"
              label={t('wallet.addPaymentModal.paymentMethodName')}
              value={bankForm.paymentMethodName}
              onChange={(e) => setBankForm((prev) => ({ ...prev, paymentMethodName: e.target.value }))}
              placeholder={t('wallet.addPaymentModal.bankPaymentNamePlaceholder')}
            />
            <TextField
              id="bank-account-holder"
              label={t('wallet.addPaymentModal.accountHolderName')}
              value={bankForm.accountHolderName}
              onChange={(e) => setBankForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
              placeholder={t('wallet.addPaymentModal.accountHolderNamePlaceholder')}
            />
            <SelectField
              id="bank-name"
              label={t('wallet.addPaymentModal.bankName')}
              value={bankForm.bankName}
              onChange={(value) => setBankForm((prev) => ({ ...prev, bankName: value }))}
              placeholder={t('wallet.addPaymentModal.bankNamePlaceholder')}
              options={[
                t('wallet.addPaymentModal.bankOptions.national'),
                t('wallet.addPaymentModal.bankOptions.rajhi'),
                t('wallet.addPaymentModal.bankOptions.riyad'),
              ]}
            />
            <TextField
              id="bank-account-number"
              label={t('wallet.addPaymentModal.accountNumber')}
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
              dir="ltr"
            />
            <SelectField
              id="bank-branch"
              label={t('wallet.addPaymentModal.bankBranch')}
              value={bankForm.bankBranch}
              onChange={(value) => setBankForm((prev) => ({ ...prev, bankBranch: value }))}
              options={['grandmother', 'Jeddah', 'Riyadh']}
            />
            <TextField
              id="bank-iban"
              label={t('wallet.addPaymentModal.iban')}
              value={bankForm.iban}
              onChange={(e) => setBankForm((prev) => ({ ...prev, iban: e.target.value }))}
              dir="ltr"
            />
            <TextField
              id="bank-swift"
              label={t('wallet.addPaymentModal.swiftCode')}
              value={bankForm.swiftCode}
              onChange={(e) => setBankForm((prev) => ({ ...prev, swiftCode: e.target.value }))}
              dir="ltr"
            />
          </div>
        )}

        <WalletSecurityNotice />

        <WalletModalActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={t('wallet.addPaymentModal.add')}
          loading={loading}
        />
      </div>
    </WalletModalShell>
  )
}

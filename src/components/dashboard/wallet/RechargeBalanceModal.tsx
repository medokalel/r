import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, RiyalSymbolIcon } from '@/components/icons'
import {
  PaymentMethodToggle,
  WalletModalActions,
  WalletModalShell,
} from '@/components/dashboard/wallet/WalletModalShell'
interface RechargeBalanceModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (amount: number, paymentMethod: 'visa' | 'bank') => void
}

const QUICK_AMOUNTS = [500, 1000, 2000]

export function RechargeBalanceModal({ open, onClose, onConfirm }: RechargeBalanceModalProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('0.0')
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'bank'>('visa')
  const [loading, setLoading] = useState(false)

  const numericAmount = parseFloat(amount) || 0

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onConfirm(numericAmount, paymentMethod)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const addQuickAmount = (value: number) => {
    const current = parseFloat(amount) || 0
    setAmount((current + value).toFixed(1))
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.rechargeModal.title')}
      subtitle={t('wallet.rechargeModal.subtitle')}
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <div className="space-y-2">
          <label htmlFor="recharge-amount" className="block text-[15px] font-medium text-neutral-900">
            {t('wallet.rechargeModal.amountLabel')}
          </label>
          <div className="relative">
            <input
              id="recharge-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white py-3 pe-12 ps-4 text-center text-[18px] font-medium outline-none focus:border-primary"
              dir="ltr"
            />
            <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center">
              <AppIcon icon={RiyalSymbolIcon} size={18} className="text-primary" />
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => addQuickAmount(value)}
                className="rounded-full border border-neutral-200 bg-[#f4f4f4] px-4 py-1.5 text-[13px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary"
              >
                + {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[15px] font-medium text-neutral-900">
            {t('wallet.rechargeModal.choosePaymentMethod')}
          </p>
          <PaymentMethodToggle value={paymentMethod} onChange={setPaymentMethod} />
        </div>

        <WalletModalActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={t('wallet.rechargeModal.confirm')}
          confirmDisabled={numericAmount <= 0}
          loading={loading}
        />
      </div>
    </WalletModalShell>
  )
}

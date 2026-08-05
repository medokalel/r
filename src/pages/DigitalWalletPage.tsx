import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AddPaymentMethodModal } from '@/components/dashboard/wallet/AddPaymentMethodModal'
import { BalanceSection } from '@/components/dashboard/wallet/BalanceSection'
import { RechargeBalanceModal } from '@/components/dashboard/wallet/RechargeBalanceModal'
import { RequestRefundModal } from '@/components/dashboard/wallet/RequestRefundModal'
import { UpdateAccountModal } from '@/components/dashboard/wallet/UpdateAccountModal'
import { WalletToastOverlay, type WalletToastVariant } from '@/components/dashboard/wallet/WalletToast'
import { WalletTransactionsTable } from '@/components/dashboard/wallet/WalletTransactionsTable'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  MOCK_LINKED_ACCOUNTS,
  MOCK_SAVED_VISA_CARDS,
  MOCK_WALLET_BALANCE,
  MOCK_WALLET_TRANSACTIONS,
  type WalletBalance,
} from '@/lib/api/walletMockData'

type ActiveModal = 'recharge' | 'addPayment' | 'refund' | 'update' | null

export function DigitalWalletPage() {
  const { t } = useTranslation()
  const [balance, setBalance] = useState<WalletBalance>(MOCK_WALLET_BALANCE)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [toast, setToast] = useState<WalletToastVariant | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleRecharge = (amount: number, _paymentMethod?: 'visa' | 'bank', _savedMethodId?: string) => {
    if (amount <= 0) {
      setToast('error')
      return
    }
    setBalance((prev) => ({
      ...prev,
      availableCredit: prev.availableCredit + amount,
    }))
    setToast('success')
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="wallet.pageTitle" />

      {toast && (
        <WalletToastOverlay
          variant={toast}
          onClose={() => setToast(null)}
          onRetry={() => {
            setToast(null)
            setActiveModal('recharge')
          }}
        />
      )}

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
        <BalanceSection
          balance={balance}
          linkedAccounts={MOCK_LINKED_ACCOUNTS}
          onRecharge={() => setActiveModal('recharge')}
          onRefund={() => setActiveModal('refund')}
          onAddPaymentMethod={() => setActiveModal('addPayment')}
          onUpdateAccount={() => setActiveModal('update')}
        />

        <WalletTransactionsTable transactions={MOCK_WALLET_TRANSACTIONS} />

        <div className="flex items-center justify-end gap-3 pb-2">
          <button
            type="button"
            className="rounded-[8px] border border-[#1236a3] bg-white px-10 py-3 text-[16px] font-semibold text-[#1236a3] transition-colors hover:bg-[#e8edfc]"
          >
            {t('common.back')}
          </button>
          <button
            type="button"
            className="rounded-[8px] bg-[#1236a3] px-10 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-[#0f2d88]"
          >
            {t('common.next')}
          </button>
        </div>
      </div>

      <RechargeBalanceModal
        open={activeModal === 'recharge'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleRecharge}
        visaCards={MOCK_SAVED_VISA_CARDS}
        bankAccounts={MOCK_LINKED_ACCOUNTS}
      />
      <AddPaymentMethodModal
        open={activeModal === 'addPayment'}
        onClose={() => setActiveModal(null)}
        onAdd={() => undefined}
      />
      <RequestRefundModal
        open={activeModal === 'refund'}
        onClose={() => setActiveModal(null)}
        onSubmit={() => undefined}
      />
      <UpdateAccountModal
        open={activeModal === 'update'}
        onClose={() => setActiveModal(null)}
        onUpdate={() => undefined}
      />
    </AppLayout>
  )
}

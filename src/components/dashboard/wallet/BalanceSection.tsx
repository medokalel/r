import { useTranslation } from 'react-i18next'
import { AppIcon, EyeIcon, RiyalSymbolIcon } from '@/components/icons'
import {
  formatWalletAmount,
  type LinkedBankAccount,
  type WalletBalance,
} from '@/lib/api/walletMockData'
import { cn } from '@/lib/utils'

interface BalanceSectionProps {
  balance: WalletBalance
  linkedAccount: LinkedBankAccount
  onRecharge: () => void
  onRefund: () => void
  onAddPaymentMethod: () => void
  onUpdateAccount: () => void
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AmountDisplay({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-[32px] font-semibold leading-none text-neutral-900" dir="ltr">
        {formatWalletAmount(value)}
      </span>
      <AppIcon icon={RiyalSymbolIcon} size={22} className="text-primary" />
    </div>
  )
}

export function BalanceSection({
  balance,
  linkedAccount,
  onRecharge,
  onRefund,
  onAddPaymentMethod,
  onUpdateAccount,
}: BalanceSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-neutral-900">
            {t('wallet.balanceSection.title')}
          </h2>
          <p className="mt-1 max-w-[640px] text-[14px] leading-[1.6] text-neutral-500">
            {t('wallet.balanceSection.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPaymentMethod}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {t('wallet.balanceSection.addPaymentMethod')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Available Credit */}
        <div className="flex flex-col rounded-[12px] border border-[#ececec] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600">
              {t('wallet.balanceSection.availableCredit')}
            </span>
            <button type="button" className="text-neutral-400 hover:text-primary" aria-label={t('wallet.balanceSection.toggleBalance')}>
              <AppIcon icon={EyeIcon} size={18} />
            </button>
          </div>
          <AmountDisplay value={balance.availableCredit} />
          <p className="mt-2 text-[13px] leading-[1.5] text-neutral-500">
            {t('wallet.balanceSection.availableCreditHint')}
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            <button
              type="button"
              onClick={onRecharge}
              className="rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t('wallet.balanceSection.rechargeBalance')}
            </button>
            <button
              type="button"
              onClick={onRefund}
              className="rounded-[var(--radius-sm)] border border-primary bg-white px-5 py-2.5 text-[14px] font-medium text-primary transition-colors hover:bg-[#e8edfc]"
            >
              {t('wallet.balanceSection.requestRefund')}
            </button>
          </div>
        </div>

        {/* Suspended Balance */}
        <div className="flex flex-col rounded-[12px] border border-[#ececec] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-600">
              {t('wallet.balanceSection.suspendedBalance')}
            </span>
            <ClockIcon className="text-neutral-400" />
          </div>
          <AmountDisplay value={balance.suspendedBalance} />
          <p className="mt-2 text-[13px] leading-[1.5] text-neutral-500">
            {t('wallet.balanceSection.suspendedBalanceHint')}
          </p>
          <div className="mt-auto space-y-2 pt-5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-neutral-500">{t('wallet.balanceSection.financialDues')}</span>
              <span className="flex items-center gap-1 font-medium text-neutral-800" dir="ltr">
                {formatWalletAmount(balance.financialDues)}
                <AppIcon icon={RiyalSymbolIcon} size={14} className="text-primary" />
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-neutral-500">{t('wallet.balanceSection.refundsUnderReview')}</span>
              <span className="flex items-center gap-1 font-medium text-neutral-800" dir="ltr">
                {formatWalletAmount(balance.refundsUnderReview)}
                <AppIcon icon={RiyalSymbolIcon} size={14} className="text-primary" />
              </span>
            </div>
          </div>
        </div>

        {/* Linked Bank Account */}
        <div className="flex flex-col rounded-[12px] bg-[#1236a3] p-5 text-white">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-medium text-white/90">
              {t('wallet.balanceSection.linkedBankAccount')}
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[12px] text-white/70">{t('wallet.balanceSection.bankName')}</p>
              <p className="text-[14px] font-medium">{linkedAccount.bankName}</p>
            </div>
            <div>
              <p className="text-[12px] text-white/70">{t('wallet.balanceSection.accountHolder')}</p>
              <p className="text-[14px] font-medium">{linkedAccount.accountHolderName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpdateAccount}
            className="mt-auto pt-5 text-start text-[13px] font-medium text-[#93b4ff] underline-offset-2 hover:underline"
          >
            {t('wallet.balanceSection.updateAccountInfo')}
          </button>
          <div className="mt-4 flex justify-center gap-1.5">
            <span className="size-2 rounded-full bg-white" />
            <span className="size-2 rounded-full bg-white/40" />
            <span className="size-2 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  )
}

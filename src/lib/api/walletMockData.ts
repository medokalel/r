export type WalletPaymentMethod = 'mada' | 'bank_transfer' | 'visa'

export type WalletTransactionStatus = 'successful' | 'pending' | 'failed'

export interface WalletTransaction {
  id: string
  transactionNumber: string
  date: string
  statementTitle: string
  statementSubtitle?: string
  paymentMethod: WalletPaymentMethod
  amount: number
  status: WalletTransactionStatus
}

export interface WalletBalance {
  availableCredit: number
  suspendedBalance: number
  financialDues: number
  refundsUnderReview: number
}

export interface LinkedBankAccount {
  id: string
  bankName: string
  accountHolderName: string
}

export interface SavedVisaCard {
  id: string
  paymentMethodName: string
  cardHolderName: string
  cardNumberMasked: string
}

export const MOCK_SAVED_VISA_CARDS: SavedVisaCard[] = [
  {
    id: 'visa-1',
    paymentMethodName: 'Primary company card',
    cardHolderName: 'Industrial Production Company Limited',
    cardNumberMasked: '8000-0000-6080-7519',
  },
  {
    id: 'visa-2',
    paymentMethodName: 'Operations Visa',
    cardHolderName: 'Ahmed Al-Rashid',
    cardNumberMasked: '4111-1111-1111-4242',
  },
]

export const MOCK_WALLET_BALANCE: WalletBalance = {
  availableCredit: 12500,
  suspendedBalance: 4000,
  financialDues: 2400,
  refundsUnderReview: 1600,
}

export const MOCK_LINKED_ACCOUNTS: LinkedBankAccount[] = [
  {
    id: '1',
    bankName: 'National Bank of Saudi Arabia',
    accountHolderName: 'Industrial Production Company Limited',
  },
  {
    id: '2',
    bankName: 'Al Rajhi Bank',
    accountHolderName: 'Jeddah Branch Operations Account',
  },
  {
    id: '3',
    bankName: 'Riyad Bank',
    accountHolderName: 'Accreditation Services Holding',
  },
]

/** @deprecated Use MOCK_LINKED_ACCOUNTS */
export const MOCK_LINKED_ACCOUNT: LinkedBankAccount = MOCK_LINKED_ACCOUNTS[0]

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: '1',
    transactionNumber: 'TRX-20260512-0091',
    date: '05/12/2026',
    statementTitle: 'Audit day fees - second stage',
    statementSubtitle: 'ISO 9001 Dial number N-EMS-00022',
    paymentMethod: 'mada',
    amount: 8500,
    status: 'successful',
  },
  {
    id: '2',
    transactionNumber: 'TRX-20260510-0088',
    date: '05/10/2026',
    statementTitle: 'Recharge wallet balance',
    paymentMethod: 'bank_transfer',
    amount: 5000,
    status: 'successful',
  },
  {
    id: '3',
    transactionNumber: 'TRX-20260508-0085',
    date: '05/08/2026',
    statementTitle: 'Audit day fees - first stage',
    statementSubtitle: 'ISO 14001 Dial number N-EMS-00018',
    paymentMethod: 'visa',
    amount: 6200,
    status: 'successful',
  },
  {
    id: '4',
    transactionNumber: 'TRX-20260505-0082',
    date: '05/05/2026',
    statementTitle: 'Accreditation application fee',
    statementSubtitle: 'ISO 45001 Dial number N-EMS-00015',
    paymentMethod: 'mada',
    amount: 3200,
    status: 'successful',
  },
  {
    id: '5',
    transactionNumber: 'TRX-20260501-0079',
    date: '05/01/2026',
    statementTitle: 'Recharge wallet balance',
    paymentMethod: 'visa',
    amount: 10000,
    status: 'successful',
  },
]

export function formatWalletAmount(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

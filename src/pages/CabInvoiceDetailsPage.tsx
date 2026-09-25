import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useInvoiceDetailsTourSteps } from '@/config/invoiceDetailsTourSteps'
import { ROUTES } from '@/lib/routes'
import {
  getCabInvoiceById,
  getInvoiceIssueGate,
  issueInvoice,
  saveInvoiceDraft,
  updateInvoiceTax,
  recordPayment,
  type CabInvoiceItem,
} from '@/lib/api/cabInvoiceRegisterApi'
import { cn } from '@/lib/utils'

export function CabInvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = useInvoiceDetailsTourSteps()
  const [invoice, setInvoice] = useState<CabInvoiceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [issuing, setIssuing] = useState(false)

  // Active tab state
  const [activeTab, setActiveTab] = useState<'items' | 'installments' | 'attachments' | 'moreDetails'>('items')

  // Tax configuration modal
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [selectedTax, setSelectedTax] = useState('vat15')

  // Record payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('500.00')
  const [paymentDate, setPaymentDate] = useState('2024-03-20')
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer')
  const [paymentReference, setPaymentReference] = useState('TRX-12345')

  // Toast/Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [taxWarning, setTaxWarning] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const loadInvoice = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getCabInvoiceById(invoiceId || 'inv-0024')
      setInvoice(data)
    } catch {
      setLoadError(t('common.loadFailed', 'Failed to load. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  if (loading || !invoice) {
    return (
      <CabLayout sidebarVariant="invoices">
        <CabHeader title={t('invoices.details.breadcrumb')} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          {loadError ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-error-600">{loadError}</p>
              <button
                type="button"
                onClick={loadInvoice}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90"
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-neutral-500">{t('common.loading')}</div>
          )}
        </main>
      </CabLayout>
    )
  }

  const isFinalized = invoice.status === 'Issued' || invoice.status === 'Paid' || invoice.status === 'Partially paid'
  const isDraft = invoice.status === 'Draft' || (!isFinalized && invoice.status === 'Unpaid')

  const subtotal = invoice.items.reduce((acc, it) => acc + it.amount, 0)
  const taxAmount = invoice.taxRate ? (subtotal * invoice.taxRate.percentage) / 100 : 0
  const total = subtotal + taxAmount
  const balanceDue = Math.max(0, total - invoice.paidAmount)

  const handleConfigureTax = async (e: React.FormEvent) => {
    e.preventDefault()
    let rateObj = { id: 'vat15', label: 'VAT 15% (Saudi Arabia)', percentage: 15 }
    if (selectedTax === 'notax') {
      rateObj = { id: 'notax', label: 'No tax (0%)', percentage: 0 }
    } else if (selectedTax === 'vat5') {
      rateObj = { id: 'vat5', label: 'VAT 5%', percentage: 5 }
    } else if (selectedTax === 'gst10') {
      rateObj = { id: 'gst10', label: 'GST 10%', percentage: 10 }
    }

    setActionError(null)
    try {
      await updateInvoiceTax(invoice.id, rateObj)
      setShowTaxModal(false)
      setTaxWarning(false)
      setToastMessage(t('invoices.details.taxSuccessToast'))
      setTimeout(() => setToastMessage(null), 3000)
      loadInvoice()
    } catch (err) {
      setActionError(
        err instanceof Error && err.message === 'INVOICE_IMMUTABLE'
          ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
          : t('common.saveFailed', 'Save failed. Your values were preserved — please try again.')
      )
    }
  }

  const handleSaveDraft = async () => {
    setActionError(null)
    setSavingDraft(true)
    try {
      await saveInvoiceDraft(invoice.id, {})
      setToastMessage(t('invoices.details.draftSavedToast'))
      setTimeout(() => setToastMessage(null), 3000)
      loadInvoice()
    } catch (err) {
      setActionError(
        err instanceof Error && err.message === 'INVOICE_IMMUTABLE'
          ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
          : t('common.saveFailed', 'Save failed. Your values were preserved — please try again.')
      )
    } finally {
      setSavingDraft(false)
    }
  }

  const handleIssueInvoice = async () => {
    const gate = getInvoiceIssueGate(invoice)
    if (!gate.ok) {
      setTaxWarning(true)
      setActionError(
        gate.missingBilling
          ? t('invoices.details.billingRequired', 'Billing details are required before issuing.')
          : t('invoices.details.taxWarning')
      )
      return
    }
    setActionError(null)
    setIssuing(true)
    try {
      await issueInvoice(invoice.id)
      setToastMessage(t('invoices.details.issuedToast'))
      setTimeout(() => setToastMessage(null), 3500)
      loadInvoice()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setActionError(
        code === 'BILLING_REQUIRED'
          ? t('invoices.details.billingRequired', 'Billing details are required before issuing.')
          : code === 'TAX_REQUIRED'
            ? t('invoices.details.taxWarning')
            : code === 'INVOICE_IMMUTABLE'
              ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
              : t('common.saveFailed', 'Save failed. Your values were preserved — please try again.')
      )
    } finally {
      setIssuing(false)
    }
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(paymentAmount) || 0
    if (amt <= 0) {
      setPaymentError(t('invoices.register.amountPositiveError', 'Amount must be greater than zero.'))
      return
    }
    if (invoice && amt - invoice.balance > 0.009) {
      setPaymentError(
        t('invoices.register.amountExceedsError', 'Amount cannot exceed the remaining balance ({{balance}} {{currency}}).', {
          balance: invoice.balance.toFixed(2),
          currency: invoice.currency,
        })
      )
      return
    }

    setPaymentError(null)
    try {
      await recordPayment(invoice.id, {
        amount: amt,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference,
      })

      setShowPaymentModal(false)
      setToastMessage(t('invoices.details.paymentSuccessToast'))
      setTimeout(() => setToastMessage(null), 3000)
      loadInvoice()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setPaymentError(
        code === 'AMOUNT_EXCEEDS_BALANCE'
          ? t('invoices.register.amountExceedsError', 'Amount cannot exceed the remaining balance ({{balance}} {{currency}}).', {
              balance: invoice.balance.toFixed(2),
              currency: invoice.currency,
            })
          : code === 'INVOICE_SETTLED'
            ? t('invoices.register.settledError', 'This invoice is already settled.')
            : t('common.saveFailed', 'Save failed. Your values were preserved — please try again.')
      )
    }
  }

  return (
    <CabLayout sidebarVariant="invoices" tourId="invoice-details-tour" tourSteps={tourSteps}>
      <CabHeader
        title={invoice.invoiceNumber}
        subtitle={`${t('invoices.details.client')} ${invoice.clientCode} – ${invoice.clientName}`}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-3 sm:p-5">
        {actionError && (
          <div role="alert" className="p-3.5 bg-error-50 border border-error-200 rounded-[8px] text-[13px] font-medium text-error-700">
            {actionError}
          </div>
        )}
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-[8px] shadow-xl text-[14px] font-semibold animate-in slide-in-from-top-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CabTourStep steps={tourSteps} stepId="inv-details-header">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-[13px] text-neutral-400">
                <span
                  onClick={() => navigate(ROUTES.cabInvoices)}
                  className="cursor-pointer hover:underline text-neutral-500 font-medium"
                >
                  {t('invoices.details.breadcrumb')}
                </span>
                <span>›</span>
                <span className="font-semibold text-primary">{invoice.invoiceNumber}</span>
              </nav>

              <div className="flex items-center gap-3">
                <h1 className="text-[20px] font-bold tracking-tight text-neutral-900">
                  {invoice.invoiceNumber}
                </h1>
                <span
                  className={cn(
                    'inline-flex min-w-[110px] items-center justify-center rounded-full px-3.5 py-1 text-[12px] font-bold',
                    invoice.status.toLowerCase() === 'paid' && 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]',
                    invoice.status.toLowerCase() === 'partially paid' && 'bg-primary-subtle text-primary border border-[#c7d7f9]',
                    invoice.status.toLowerCase() === 'unpaid' && 'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]',
                    invoice.status.toLowerCase() === 'draft' && 'bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]',
                    invoice.status.toLowerCase() === 'issued' && 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]'
                  )}
                >
                  {invoice.status}
                </span>
              </div>

              <p className="text-[13px] text-neutral-500 mt-1 flex flex-wrap items-center gap-2">
                <span>{t('invoices.details.fromOrder')}</span>
                <span className="text-primary font-semibold hover:underline cursor-pointer">
                  {invoice.relatedOrder}
                </span>
                <span className="inline-flex rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[11px] font-medium text-[#16a34a]">
                  {invoice.orderStatus}
                </span>
                <span className="text-neutral-300">|</span>
                <span>{t('invoices.details.client')}</span>
                <span className="text-primary font-semibold hover:underline cursor-pointer">
                  {invoice.clientCode} – {invoice.clientName}
                </span>
              </p>
            </div>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="inv-details-actions">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!isDraft || savingDraft}
                title={isFinalized ? t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.') : undefined}
                className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {savingDraft ? t('common.saving', 'Saving...') : t('invoices.details.saveDraft')}
              </button>

              <button
                type="button"
                onClick={() => !isFinalized && setShowTaxModal(true)}
                disabled={isFinalized}
                title={isFinalized ? t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.') : undefined}
                className="h-11 rounded-[8px] bg-primary px-4 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t('invoices.details.configureTax')}
              </button>

              <button
                type="button"
                onClick={handleIssueInvoice}
                disabled={isFinalized || issuing}
                title={isFinalized ? t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.') : undefined}
                className={cn(
                  'h-11 rounded-[8px] px-4 text-[14px] font-medium transition-colors disabled:cursor-not-allowed',
                  invoice.taxRate
                    ? 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
                    : 'bg-neutral-100 text-neutral-400 border border-[#e2e2e2]'
                )}
              >
                {issuing ? t('common.saving', 'Saving...') : t('invoices.details.issueInvoice')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentError(null)
                  setPaymentAmount(invoice.balance > 0 ? (invoice.balance >= 500 ? '500.00' : invoice.balance.toFixed(2)) : '0.00')
                  setShowPaymentModal(true)
                }}
                disabled={invoice.balance <= 0}
                className="h-11 w-11 flex items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                title={t('invoices.register.recordPayment')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </CabTourStep>
        </div>

        {taxWarning && (
          <div className="p-3.5 bg-[#fff7ed] border border-[#ffedd5] rounded-[8px] flex items-center justify-between text-[13px] text-[#ea580c]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">{t('invoices.details.taxWarning')}</span>
            </div>
            <button
              type="button"
              onClick={() => !isFinalized && setShowTaxModal(true)}
              disabled={isFinalized}
              className="px-3 py-1.5 bg-[#ea580c] text-white rounded-[6px] font-medium text-[12px] hover:bg-[#c2410c] disabled:opacity-50"
            >
              {t('invoices.details.configureNow')}
            </button>
          </div>
        )}
        {isFinalized && (
          <div className="p-3.5 bg-[#e8edfc] border border-[#c5d7fa] rounded-[8px] text-[13px] font-semibold text-primary">
            {t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.')}
          </div>
        )}

        {/* Top 3-Column Info Card */}
        <CabTourStep steps={tourSteps} stepId="inv-details-info-grid">
          <div className="rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
            {/* Column 1: Dates & Numbers */}
            <div className="space-y-3 md:border-r border-[#ececec] md:pe-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.invoiceNumber')}</span>
                <span className="font-bold text-neutral-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.issueDate')}</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-[#e2e2e2] rounded-[8px] text-neutral-800">
                  <span>Mar 8, 2025</span>
                  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.dueDate')}</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-[#e2e2e2] rounded-[8px] text-neutral-800">
                  <span>Apr 7, 2025</span>
                  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.status')}</span>
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-[#e8edfc] text-primary">
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Column 2: Client Details */}
            <div className="space-y-3 md:border-r border-[#ececec] md:pe-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.clientLabel')}</span>
                <span className="font-semibold text-primary hover:underline cursor-pointer">
                  {invoice.clientCode} – {invoice.clientName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.country')}</span>
                <span className="font-medium text-neutral-800">{invoice.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.primaryContact')}</span>
                <span className="font-medium text-neutral-800">{invoice.primaryContact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.email')}</span>
                <span className="text-primary hover:underline cursor-pointer">{invoice.contactEmail}</span>
              </div>
            </div>

            {/* Column 3: Order, App, Currency */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.relatedOrder')}</span>
                <span className="font-semibold text-primary hover:underline cursor-pointer">
                  {invoice.relatedOrder}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.application')}</span>
                <span className="font-semibold text-primary hover:underline cursor-pointer">
                  {invoice.relatedApplication}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.poReference')}</span>
                <input
                  type="text"
                  defaultValue={invoice.poReference || 'PO-7789'}
                  className="w-28 rounded-[8px] border border-[#e2e2e2] bg-neutral-50 px-2.5 py-1 text-[13px] text-neutral-800 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">{t('invoices.details.currency')}</span>
                <div className="relative">
                  <select
                    defaultValue={invoice.currency}
                    className="appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-2.5 py-1 text-[13px] text-neutral-800 pr-7 focus:outline-none font-semibold"
                  >
                    <option value="USD">USD</option>
                    <option value="SAR">SAR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <svg className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* Middle Section: Bill-to & Amounts Cards */}
        <CabTourStep steps={tourSteps} stepId="inv-details-amounts">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bill-to Card */}
            <div className="lg:col-span-7 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                <h3 className="text-[16px] font-bold text-neutral-900">Bill-to</h3>
                <button type="button" className="rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                  Use client address
                </button>
              </div>
              <div className="space-y-1 text-[13px] text-neutral-700">
                <div className="font-bold text-neutral-900">{invoice.billingAddress.name}</div>
                <div>{invoice.billingAddress.line1}</div>
                <div>{invoice.billingAddress.cityArea}</div>
                <div>{invoice.billingAddress.country}</div>
              </div>
              <div className="p-3.5 bg-[#e8edfc] border border-[#c5d7fa] rounded-[8px] flex items-start gap-2.5 text-[13px] text-primary font-medium">
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This invoice uses the client's registered address at the time of invoicing (snapshot).</span>
              </div>
            </div>

            {/* Amounts Summary Box */}
            <div className="lg:col-span-5 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none space-y-3.5">
              <h3 className="text-[16px] font-bold text-neutral-900 border-b border-[#ececec] pb-3">
                Amounts ({invoice.currency})
              </h3>
              <div className="flex justify-between items-center text-[13px] text-neutral-600">
                <span>{t('invoices.details.subtotal')}</span>
                <span className="font-bold text-neutral-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <span>Tax</span>
                  {invoice.taxRate ? (
                    <span className="inline-flex rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                      {invoice.taxRate.label}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 italic">
                      {t('invoices.details.noTax')}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-neutral-700">
                  {invoice.taxRate ? `${taxAmount.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="border-t border-[#ececec] pt-3 flex justify-between items-center text-[15px] font-bold text-neutral-900">
                <span>{t('invoices.details.total')}</span>
                <span className="text-[16px] text-neutral-900">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-neutral-600">
                <span>{t('invoices.details.amountPaid')}</span>
                <span className="font-semibold text-neutral-900">{invoice.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-[#ececec] pt-2 flex justify-between items-center text-[15px] font-bold text-primary">
                <span>{t('invoices.details.balanceDue')}</span>
                <span className="text-[18px] font-bold text-primary">{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* Tab Navigation Section */}
        <CabTourStep steps={tourSteps} stepId="inv-details-tabs-breakdown">
          <div className="space-y-4">
            <div className="border-b border-[#ececec] flex items-center gap-6 text-[14px]">
              {[
                { key: 'items', label: t('invoices.details.tabItems') },
                { key: 'installments', label: t('invoices.details.tabInstallments') },
                { key: 'attachments', label: t('invoices.details.tabAttachments') },
                { key: 'moreDetails', label: t('invoices.details.tabMoreDetails') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'pb-3 transition-colors border-b-2 font-medium',
                    activeTab === tab.key
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          {/* Tab 1: Invoice items table */}
          {activeTab === 'items' && (
            <div className="overflow-hidden rounded-[8px] border border-[#ececec] bg-white shadow-none">
              <table className="w-full border-collapse text-start text-[14px]">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="w-12 p-[18px] text-center text-[14px] font-medium">#</th>
                    <th className="p-[18px] text-start text-[14px] font-medium">Item / Service</th>
                    <th className="p-[18px] text-start text-[14px] font-medium">{t('invoices.details.colDescription')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('invoices.details.colQty')}</th>
                    <th className="p-[18px] text-end text-[14px] font-medium">{t('invoices.details.colUnit')} ({invoice.currency})</th>
                    <th className="p-[18px] text-end text-[14px] font-medium">{t('invoices.details.colAmount')} ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={cn('hover:bg-[#e8edfc]/50 transition-colors', index % 2 === 1 ? 'bg-[#f9fafc]' : '')}>
                      <td className="px-4 py-3.5 text-center text-[13px] text-neutral-500">{index + 1}</td>
                      <td className="px-4 py-3.5 text-[15px] font-medium text-neutral-900">{item.name}</td>
                      <td className="px-4 py-3.5 text-[14px] text-neutral-600">{item.description}</td>
                      <td className="px-4 py-3.5 text-center text-[14px] text-neutral-800 font-medium">{item.qty}</td>
                      <td className="px-4 py-3.5 text-end text-[14px] text-neutral-800 font-medium">
                        {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-end text-[15px] font-bold text-neutral-900">
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-[#f8fafc] border-t border-[#ececec] flex justify-end gap-6 text-[14px] font-bold text-neutral-900">
                <span>{t('invoices.details.subtotal')} ({invoice.currency})</span>
                <span className="text-primary">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Bottom Side-by-Side Cards: Installments & Attachments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Installments Card */}
            <div className="rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none space-y-3">
              <h3 className="text-[16px] font-bold text-neutral-900 border-b border-[#ececec] pb-3">
                {t('invoices.details.tabInstallments')}
              </h3>
              <div className="overflow-hidden rounded-[8px] border border-[#ececec] bg-white">
                <table className="w-full border-collapse text-start text-[14px]">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="w-10 p-3.5 text-center text-[13px] font-medium">#</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">{t('invoices.details.dueDate')}</th>
                      <th className="p-3.5 text-end text-[13px] font-medium">{t('invoices.details.colAmount')} ({invoice.currency})</th>
                      <th className="p-3.5 text-center text-[13px] font-medium">{t('invoices.details.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.installments.map((inst, index) => (
                      <tr key={inst.id} className={cn('hover:bg-[#e8edfc]/50 transition-colors', index % 2 === 1 ? 'bg-[#f9fafc]' : '')}>
                        <td className="px-3.5 py-3 text-center text-[13px] text-neutral-400">{index + 1}</td>
                        <td className="px-3.5 py-3 text-[14px] font-medium text-neutral-800">{inst.dueDate}</td>
                        <td className="px-3.5 py-3 text-end text-[14px] font-bold text-neutral-900">
                          {inst.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="inline-flex rounded-full bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-medium text-primary">
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attachments Card */}
            <div className="rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none space-y-3">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                <h3 className="text-[16px] font-bold text-neutral-900">{t('invoices.details.tabAttachments')}</h3>
                <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8edfc] text-primary hover:bg-primary/20 border border-primary/30 text-[13px] font-semibold rounded-[8px] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>Add file</span>
                </button>
              </div>
              <div className="overflow-hidden rounded-[8px] border border-[#ececec] bg-white">
                <table className="w-full border-collapse text-start text-[14px]">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="p-3.5 text-start text-[13px] font-medium">File name</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">Type</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">Size</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">Uploaded on</th>
                      <th className="w-8 p-3.5 text-center text-[13px] font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.attachments.map((att, index) => (
                      <tr key={att.id} className={cn('hover:bg-[#e8edfc]/50 transition-colors', index % 2 === 1 ? 'bg-[#f9fafc]' : '')}>
                        <td className="px-3.5 py-3 text-[14px] font-semibold text-error-600 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-error-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>{att.name}</span>
                        </td>
                        <td className="px-3.5 py-3 text-[13px] text-neutral-600">{att.type}</td>
                        <td className="px-3.5 py-3 text-[13px] text-neutral-600">{att.size}</td>
                        <td className="px-3.5 py-3 text-[13px] text-neutral-600">{att.uploadedOn}</td>
                        <td className="px-3.5 py-3 text-center text-neutral-400">
                          <button type="button" className="hover:text-neutral-700">
                            ⋮
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </CabTourStep>

        {/* Configure Tax Modal */}
        {showTaxModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[12px] shadow-2xl border border-[#ececec] w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-neutral-900">{t('invoices.details.taxModalTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleConfigureTax} className="p-4 space-y-4 text-[14px]">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">{t('invoices.details.taxModalSubtitle')}</label>
                  <div className="relative">
                    <select
                      value={selectedTax}
                      onChange={(e) => setSelectedTax(e.target.value)}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 pr-8 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="vat15">VAT 15% (Saudi Arabia)</option>
                      <option value="vat5">VAT 5%</option>
                      <option value="gst10">GST 10%</option>
                      <option value="notax">No tax (0%)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowTaxModal(false)}
                    className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {t('invoices.register.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-11 rounded-[8px] bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary/90"
                  >
                    {t('invoices.details.applyTax')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[12px] shadow-2xl border border-[#ececec] w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-neutral-900">
                  {t('invoices.details.recordPaymentTitle', { invoiceNumber: invoice.invoiceNumber })}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-[14px]">
                {paymentError && (
                  <div role="alert" className="p-2.5 bg-error-50 border border-error-200 rounded-[8px] font-medium text-error-700 text-[13px]">
                    {paymentError}
                  </div>
                )}
                <div className="p-3 bg-[#e8edfc] border border-[#c5d7fa] rounded-[8px] text-primary text-[13px] font-medium">
                  <span className="font-bold">
                    {t(
                      'invoices.register.allocationPreview',
                      'Allocation: {{amount}} {{currency}}. Remaining: {{remaining}} {{currency}}.',
                      {
                        amount: (parseFloat(paymentAmount) || 0).toFixed(2),
                        currency: invoice.currency,
                        remaining: Math.max(0, invoice.balance - (parseFloat(paymentAmount) || 0)).toFixed(2),
                      }
                    )}
                  </span>{' '}
                  {t('invoices.register.paymentInfoNote')}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('invoices.register.amountLabel', { currency: invoice.currency })}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">{t('invoices.register.paymentDateLabel')}</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">{t('invoices.register.paymentMethodLabel')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Bank transfer">{t('invoices.register.bankTransfer')}</option>
                    <option value="Credit Card">{t('invoices.register.creditCard')}</option>
                    <option value="Cheque">{t('invoices.register.cheque')}</option>
                    <option value="Cash">{t('invoices.register.cash')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">{t('invoices.register.referenceLabel')}</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {t('invoices.register.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-11 rounded-[8px] bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary/90"
                  >
                    {t('invoices.register.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </CabLayout>
  )
}

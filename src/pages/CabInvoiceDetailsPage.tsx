import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ROUTES } from '@/lib/routes'
import {
  getCabInvoiceById,
  updateInvoiceTax,
  recordPayment,
  type CabInvoiceItem,
} from '@/lib/api/cabInvoiceRegisterApi'

export function CabInvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [invoice, setInvoice] = useState<CabInvoiceItem | null>(null)
  const [loading, setLoading] = useState(true)

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

  const loadInvoice = async () => {
    setLoading(true)
    const data = await getCabInvoiceById(invoiceId || 'inv-0024')
    setInvoice(data)
    setLoading(false)
  }

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  if (loading || !invoice) {
    return (
      <CabLayout>
        <CabHeader title={t('invoices.details.breadcrumb')} />
        <div className="p-8 text-center text-sm text-gray-500">{t('common.loading')}</div>
      </CabLayout>
    )
  }

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

    await updateInvoiceTax(invoice.id, rateObj)
    setShowTaxModal(false)
    setTaxWarning(false)
    setToastMessage(t('invoices.details.taxSuccessToast'))
    setTimeout(() => setToastMessage(null), 3000)
    loadInvoice()
  }

  const handleIssueInvoice = () => {
    if (!invoice.taxRate) {
      setTaxWarning(true)
      return
    }
    setToastMessage(t('invoices.details.issuedToast'))
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(paymentAmount) || 0
    if (amt <= 0) return

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
  }

  return (
    <CabLayout>
      <CabHeader
        title={invoice.invoiceNumber}
        subtitle={`${t('invoices.details.client')} ${invoice.clientCode} – ${invoice.clientName}`}
      />
      <div className="p-6 max-w-[1360px] mx-auto space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-in slide-in-from-top-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
              <span
                onClick={() => navigate(ROUTES.cabInvoices)}
                className="cursor-pointer hover:underline text-gray-600"
              >
                {t('invoices.details.breadcrumb')}
              </span>
              <span className="text-gray-400">›</span>
              <span className="text-gray-800 font-semibold">{invoice.invoiceNumber}</span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {invoice.invoiceNumber}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                {invoice.status}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>{t('invoices.details.fromOrder')}</span>
              <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
                {invoice.relatedOrder}
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {invoice.orderStatus}
              </span>
              <span className="text-gray-400">|</span>
              <span>{t('invoices.details.client')}</span>
              <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
                {invoice.clientCode} – {invoice.clientName}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setToastMessage(t('invoices.details.draftSavedToast'))
                setTimeout(() => setToastMessage(null), 2500)
              }}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              {t('invoices.details.saveDraft')}
            </button>

            <button
              onClick={() => setShowTaxModal(true)}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              {t('invoices.details.configureTax')}
            </button>

            <button
              onClick={handleIssueInvoice}
              className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                invoice.taxRate
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {t('invoices.details.issueInvoice')}
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg shadow-sm"
              title={t('invoices.register.recordPayment')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Warning banner if issue invoice clicked without tax */}
        {taxWarning && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">{t('invoices.details.taxWarning')}</span>
            </div>
            <button
              onClick={() => setShowTaxModal(true)}
              className="px-3 py-1 bg-amber-600 text-white rounded font-semibold text-xs hover:bg-amber-700"
            >
              {t('invoices.details.configureNow')}
            </button>
          </div>
        )}

        {/* Top 3-Column Info Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Column 1: Dates & Numbers */}
          <div className="space-y-3 md:border-r border-gray-100 pr-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.invoiceNumber')}</span>
              <span className="font-mono font-bold text-gray-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.issueDate')}</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                <span>Mar 8, 2025</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.dueDate')}</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                <span>Apr 7, 2025</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.status')}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Column 2: Client Details */}
          <div className="space-y-3 md:border-r border-gray-100 pr-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.clientLabel')}</span>
              <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                {invoice.clientCode} – {invoice.clientName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.country')}</span>
              <span className="font-medium text-gray-800">{invoice.country}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.primaryContact')}</span>
              <span className="font-medium text-gray-800">{invoice.primaryContact}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.email')}</span>
              <span className="text-blue-600 hover:underline cursor-pointer">{invoice.contactEmail}</span>
            </div>
          </div>

          {/* Column 3: Order, App, Currency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.relatedOrder')}</span>
              <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                {invoice.relatedOrder}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.application')}</span>
              <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                {invoice.relatedApplication}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.poReference')}</span>
              <input
                type="text"
                defaultValue={invoice.poReference || 'PO-7789'}
                className="w-28 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-800 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{t('invoices.details.currency')}</span>
              <div className="relative">
                <select
                  defaultValue={invoice.currency}
                  className="appearance-none px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-800 pr-7 focus:outline-none font-semibold"
                >
                  <option value="USD">USD</option>
                  <option value="SAR">SAR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Bill-to & Amounts Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bill-to Card */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-bold text-gray-900">Bill-to</h3>
              <button type="button" className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-all">
                Use client address
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-700">
              <div className="font-bold text-gray-900">{invoice.billingAddress.name}</div>
              <div>{invoice.billingAddress.line1}</div>
              <div>{invoice.billingAddress.cityArea}</div>
              <div>{invoice.billingAddress.country}</div>
            </div>
            <div className="p-3 bg-sky-50/80 border border-sky-100 rounded-lg flex items-start gap-2 text-xs text-sky-900">
              <svg className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>This invoice uses the client's registered address at the time of invoicing (snapshot).</span>
            </div>
          </div>

          {/* Amounts Summary Box */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
              Amounts ({invoice.currency})
            </h3>
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>{t('invoices.details.subtotal')}</span>
              <span className="font-bold text-gray-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span>Tax</span>
                {invoice.taxRate ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                    {invoice.taxRate.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium italic">
                    {t('invoices.details.noTax')}
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-700">
                {invoice.taxRate ? `${taxAmount.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>{t('invoices.details.total')}</span>
              <span className="text-base text-gray-900">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>{t('invoices.details.amountPaid')}</span>
              <span className="font-medium text-gray-900">{invoice.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-sm font-bold text-blue-900">
              <span>{t('invoices.details.balanceDue')}</span>
              <span className="text-base font-extrabold text-blue-700">{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Section */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 flex items-center gap-6 text-xs font-semibold">
            {[
              { key: 'items', label: t('invoices.details.tabItems') },
              { key: 'installments', label: t('invoices.details.tabInstallments') },
              { key: 'attachments', label: t('invoices.details.tabAttachments') },
              { key: 'moreDetails', label: t('invoices.details.tabMoreDetails') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Invoice items table */}
          {activeTab === 'items' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="w-10 px-4 py-3">#</th>
                    <th className="px-4 py-3">Item / Service</th>
                    <th className="px-4 py-3">{t('invoices.details.colDescription')}</th>
                    <th className="px-4 py-3 text-center">{t('invoices.details.colQty')}</th>
                    <th className="px-4 py-3 text-right">{t('invoices.details.colUnit')} ({invoice.currency})</th>
                    <th className="px-4 py-3 text-right">{t('invoices.details.colAmount')} ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.description}</td>
                      <td className="px-4 py-3 text-center text-gray-800 font-medium">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-medium">
                        {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-6 text-xs font-bold text-gray-900">
                <span>{t('invoices.details.subtotal')} ({invoice.currency})</span>
                <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Bottom Side-by-Side Cards: Installments & Attachments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Installments Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                {t('invoices.details.tabInstallments')}
              </h3>
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="w-8 px-3 py-2">#</th>
                    <th className="px-3 py-2">{t('invoices.details.dueDate')}</th>
                    <th className="px-3 py-2 text-right">{t('invoices.details.colAmount')} ({invoice.currency})</th>
                    <th className="px-3 py-2 text-center">{t('invoices.details.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.installments.map((inst, index) => (
                    <tr key={inst.id}>
                      <td className="px-3 py-2.5 text-gray-400">{index + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{inst.dueDate}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                        {inst.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attachments Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-900">{t('invoices.details.tabAttachments')}</h3>
                <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>Add file</span>
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2">File name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Uploaded on</th>
                    <th className="w-6 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.attachments.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-semibold text-red-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>{att.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{att.type}</td>
                      <td className="px-3 py-2.5 text-gray-600">{att.size}</td>
                      <td className="px-3 py-2.5 text-gray-600">{att.uploadedOn}</td>
                      <td className="px-3 py-2.5 text-center text-gray-400">
                        <button className="hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Configure Tax Modal */}
        {showTaxModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">{t('invoices.details.taxModalTitle')}</h3>
                <button onClick={() => setShowTaxModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleConfigureTax} className="p-4 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">{t('invoices.details.taxModalSubtitle')}</label>
                  <div className="relative">
                    <select
                      value={selectedTax}
                      onChange={(e) => setSelectedTax(e.target.value)}
                      className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="vat15">VAT 15% (Saudi Arabia)</option>
                      <option value="vat5">VAT 5%</option>
                      <option value="gst10">GST 10%</option>
                      <option value="notax">No tax (0%)</option>
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowTaxModal(false)}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg">
                    {t('invoices.register.cancel')}
                  </button>
                  <button type="submit"
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm">
                    {t('invoices.details.applyTax')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  {t('invoices.details.recordPaymentTitle', { invoiceNumber: invoice.invoiceNumber })}
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">
                    {t('invoices.register.amountLabel', { currency: invoice.currency })}
                  </label>
                  <input type="number" step="0.01" required value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">{t('invoices.register.paymentDateLabel')}</label>
                  <input type="date" required value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">{t('invoices.register.paymentMethodLabel')}</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none">
                    <option value="Bank transfer">{t('invoices.register.bankTransfer')}</option>
                    <option value="Credit Card">{t('invoices.register.creditCard')}</option>
                    <option value="Cheque">{t('invoices.register.cheque')}</option>
                    <option value="Cash">{t('invoices.register.cash')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">{t('invoices.register.referenceLabel')}</label>
                  <input type="text" value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowPaymentModal(false)}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg">
                    {t('invoices.register.cancel')}
                  </button>
                  <button type="submit"
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm">
                    {t('invoices.register.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}

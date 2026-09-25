import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCreateOfferTourSteps } from '@/config/createOfferTourSteps'
import { ROUTES } from '@/lib/routes'
import { createOffer, type OfferFeeItem } from '@/lib/api/cabOffersApi'
import { cn } from '@/lib/utils'

export function CabCreateOfferPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useCreateOfferTourSteps()

  // Form states matching Screenshot 2 & 3
  const [client] = useState('CL-0001 - Al Noor Food Industries')
  const [application, setApplication] = useState('APP-0024 (Accepted)')
  const [offerNumber] = useState('AUTO')
  const [currency, setCurrency] = useState('USD')
  const [validUntil, setValidUntil] = useState('2025-04-30')
  const [paymentTerms, setPaymentTerms] = useState('30 days from invoice date')
  const [notes, setNotes] = useState('')

  // Fee items
  const [fees, setFees] = useState<OfferFeeItem[]>([
    { id: '1', description: 'Audit fee', amount: 2000.0 },
    { id: '2', description: 'Administration fee', amount: 300.0 },
  ])

  // Add fee modal / inline state
  const [showAddFeeModal, setShowAddFeeModal] = useState(false)
  const [newFeeDescription, setNewFeeDescription] = useState('Surveillance audit fee')
  const [newFeeAmount, setNewFeeAmount] = useState('500.00')

  // More details accordion & fields
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(true)
  const [travelCosts, setTravelCosts] = useState<'Included' | 'Excluded' | 'Reimbursed'>('Excluded')
  const [optionalDiscount, setOptionalDiscount] = useState('0.00')
  const [termsAttachment, setTermsAttachment] = useState<{
    name: string
    size: string
  } | null>({
    name: 'Offer_Terms_Conditions.pdf',
    size: 'PDF • 248 KB',
  })
  const [approvalRoute, setApprovalRoute] = useState('Commercial Approval')

  // UI status & validation
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Fee calculations
  const totalBeforeTax =
    fees.reduce((acc, f) => acc + (Number(f.amount) || 0), 0) - (Number(optionalDiscount) || 0)
  const total = Math.max(0, totalBeforeTax)

  const handleAddFee = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeeDescription.trim()) return
    const amountNum = parseFloat(newFeeAmount) || 0
    const newItem: OfferFeeItem = {
      id: Date.now().toString(),
      description: newFeeDescription.trim(),
      amount: amountNum,
    }
    setFees([...fees, newItem])
    setShowAddFeeModal(false)
    setNewFeeDescription('')
    setNewFeeAmount('')
  }

  const handleRemoveFee = (id: string) => {
    setFees(fees.filter((f) => f.id !== id))
  }

  const validateForm = () => {
    const errs: { [key: string]: string } = {}
    if (!application) errs.application = 'Application is required.'
    if (!validUntil) errs.validUntil = 'Valid until is required.'
    if (fees.length === 0) errs.fees = 'At least one fee line is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (status: 'draft' | 'pending_approval') => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await createOffer({
        clientName: 'Al Noor Food Industries',
        clientCode: 'CL-0001',
        country: 'Saudi Arabia',
        primaryContact: 'Sara Ali',
        contactEmail: 'sara@alnoor.example',
        relatedApplication: application.split(' ')[0] || 'APP-0024',
        applicationStandard: 'ISO 22000:2018',
        applicationScope: 'Food safety management systems (ISO 22000)',
        currency,
        validUntil,
        paymentTerms,
        notes,
        fees,
        travelCosts,
        optionalDiscount: parseFloat(optionalDiscount) || 0,
        termsAttachmentName: termsAttachment?.name,
        approvalRoute,
        status,
      })

      setSuccessToast(
        status === 'pending_approval'
          ? 'Offer sent for approval successfully!'
          : 'Offer draft saved successfully!'
      )

      setTimeout(() => {
        navigate(ROUTES.cabOffers)
      }, 1200)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CabLayout
      sidebarVariant="offers"
      tourId="cab-create-offer"
      tourSteps={tourSteps}
    >
      <CabHeader
        title={t('cab.offers.createOffer', 'Create offer')}
        notificationCount={3}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        {/* Toast */}
        {successToast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-[14px] font-medium animate-in slide-in-from-top-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successToast}</span>
          </div>
        )}

        {/* Top Breadcrumb & Header */}
        <CabTourStep steps={tourSteps} stepId="create-offer-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-[13px] text-neutral-400">
                <span className="font-medium text-neutral-500">{t('cab.offersPage.title', 'Offers')}</span>
                <span>›</span>
                <span className="font-semibold text-primary">{t('cab.offers.createOffer', 'Create offer')}</span>
              </nav>
              <h1 className="text-[20px] font-bold text-neutral-900">
                {t('cab.offers.createOffer', 'Create offer')}
              </h1>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                {t('cab.offers.createOfferSubtitle', 'Prepare a commercial offer for the client based on an accepted application.')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.cabOffers)}
              className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t('cab.offers.backToOffers', 'Back to offers')}</span>
            </button>
          </div>
        </CabTourStep>

        {/* Top 2-Column Cards: Client and Application & Offer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Client and application */}
          <CabTourStep steps={tourSteps} stepId="create-offer-client-app">
            <div className="rounded-[16px] border border-[#ececec] bg-white p-4 sm:p-6 shadow-none space-y-4">
              <h2 className="text-[16px] font-bold text-neutral-900 border-b border-[#ececec] pb-3">
                {t('cab.offers.clientAndApp', 'Client and application')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Client <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={client}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-neutral-50 px-4 text-[14px] text-neutral-700 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Application <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={application}
                      onChange={(e) => {
                        setApplication(e.target.value)
                        if (errors.application) setErrors({ ...errors, application: '' })
                      }}
                      className={cn(
                        'h-11 w-full appearance-none rounded-[8px] border bg-white px-4 text-[14px] pr-8 focus:outline-none transition-colors',
                        errors.application
                          ? 'border-error-500 text-error-900 focus:border-error-500'
                          : 'border-[#e2e2e2] text-neutral-900 focus:border-primary'
                      )}
                    >
                      <option value="APP-0024 (Accepted)">APP-0024 (Accepted)</option>
                      <option value="APP-0019 (In progress)" disabled>
                        APP-0019 (In progress) — Not accepted
                      </option>
                      <option value="APP-0012 (Under review)" disabled>
                        APP-0012 (Under review) — Not accepted
                      </option>
                      <option value="APP-0007 (Draft)" disabled>
                        APP-0007 (Draft) — Not accepted
                      </option>
                    </select>
                    <svg className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {errors.application && (
                    <p className="text-[12px] text-error-600">{errors.application}</p>
                  )}
                </div>
              </div>

              {/* Read-only client details grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-[13px] rounded-[8px] bg-[#f8fafc] border border-[#ececec] p-4">
                <div>
                  <span className="text-neutral-500 block text-[12px]">Country</span>
                  <span className="font-semibold text-neutral-900">Saudi Arabia</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[12px]">Scope</span>
                  <span className="font-semibold text-neutral-900 leading-snug block">
                    Food safety management systems (ISO 22000)
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[12px]">Primary contact</span>
                  <span className="font-semibold text-neutral-900">Sara Ali</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[12px]">Standard</span>
                  <span className="font-semibold text-neutral-900">ISO 22000:2018</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500 block text-[12px]">Email</span>
                  <span className="font-semibold text-primary">sara@alnoor.example</span>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Card 2: Offer details */}
          <CabTourStep steps={tourSteps} stepId="create-offer-details">
            <div className="rounded-[16px] border border-[#ececec] bg-white p-4 sm:p-6 shadow-none space-y-4">
              <h2 className="text-[16px] font-bold text-neutral-900 border-b border-[#ececec] pb-3">
                {t('cab.offers.offerDetails', 'Offer details')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">Offer number</label>
                  <input
                    type="text"
                    readOnly
                    value={offerNumber}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-neutral-50 px-4 text-[14px] text-neutral-600 font-mono focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Currency <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-11 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] text-neutral-900 pr-8 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="USD">USD</option>
                      <option value="SAR">SAR</option>
                      <option value="EGP">EGP</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <svg className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Valid until <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => {
                      setValidUntil(e.target.value)
                      if (errors.validUntil) setErrors({ ...errors, validUntil: '' })
                    }}
                    className={cn(
                      'h-11 w-full rounded-[8px] border bg-white px-4 text-[14px] focus:outline-none transition-colors',
                      errors.validUntil
                        ? 'border-error-500 text-error-900 focus:border-error-500'
                        : 'border-[#e2e2e2] text-neutral-900 focus:border-primary'
                    )}
                  />
                  {errors.validUntil && (
                    <p className="text-[12px] text-error-600">{errors.validUntil}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Payment terms <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="h-11 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] text-neutral-900 pr-8 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="30 days from invoice date">30 days from invoice date</option>
                      <option value="15 days from invoice date">15 days from invoice date</option>
                      <option value="Upon receipt of invoice">Upon receipt of invoice</option>
                      <option value="50% advance, 50% upon completion">50% advance, 50% upon completion</option>
                    </select>
                    <svg className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any internal notes (optional)..."
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none transition-colors resize-none"
                />
                <p className="text-[12px] text-neutral-500">
                  Written notes take precedence over generated text. Keep them short and readable.
                </p>
              </div>
            </div>
          </CabTourStep>
        </div>

        {/* Fees Section */}
        <CabTourStep steps={tourSteps} stepId="create-offer-fees">
          <div className="rounded-[16px] border border-[#ececec] bg-white p-4 sm:p-6 shadow-none space-y-4">
            <h2 className="text-[16px] font-bold text-neutral-900 border-b border-[#ececec] pb-3">Fees</h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Table of fee lines */}
              <div className="lg:col-span-8 space-y-3">
                <div className="overflow-hidden rounded-[8px] border border-[#ececec] bg-white">
                  <table className="w-full border-collapse text-start text-[14px]">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="w-12 p-[14px] text-center font-medium">#</th>
                        <th className="p-[14px] text-start font-medium">Description</th>
                        <th className="p-[14px] text-end font-medium">Amount ({currency})</th>
                        <th className="w-12 p-[14px] text-center font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((item, index) => (
                        <tr key={item.id} className={cn('hover:bg-[#e8edfc]/50 transition-colors', index % 2 === 1 ? 'bg-[#f9fafc]' : '')}>
                          <td className="px-4 py-3.5 text-center text-neutral-500 font-medium">{index + 1}</td>
                          <td className="px-4 py-3.5 text-[15px] text-neutral-900 font-medium">{item.description}</td>
                          <td className="px-4 py-3.5 text-end text-[15px] font-medium text-neutral-900">
                            {Number(item.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFee(item.id)}
                              className="text-neutral-400 hover:text-error-600 transition-colors"
                              title="Remove fee line"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errors.fees && <p className="text-[12px] text-error-600">{errors.fees}</p>}

                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-primary/30 bg-[#e8edfc] px-4 text-[13px] font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <span className="text-[16px] leading-none">+</span>
                  <span>Add fee</span>
                </button>
              </div>

              {/* Totals Summary Box */}
              <div className="lg:col-span-4 rounded-[8px] bg-[#f8fafc] p-5 border border-[#ececec] space-y-3">
                <div className="flex justify-between items-center text-[13px] font-medium text-neutral-600">
                  <span>Total before tax</span>
                  <span className="text-[15px] font-bold text-neutral-900">
                    {totalBeforeTax.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[13px] text-neutral-600">
                  <span className="font-medium">Tax (Not configured)</span>
                  <span className="font-semibold text-neutral-700">—</span>
                </div>

                <div className="border-t border-[#ececec] pt-3 flex justify-between items-center text-[15px] font-bold text-neutral-900">
                  <span>Total ({currency})</span>
                  <span className="text-[18px] text-primary">
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* More Details Collapsible */}
        <CabTourStep steps={tourSteps} stepId="create-offer-more-details">
          <div className="rounded-[16px] border border-[#ececec] bg-white shadow-none overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreDetailsOpen(!moreDetailsOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-start font-bold text-neutral-900 text-[15px] bg-[#f8fafc] hover:bg-neutral-100/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className={cn("w-4 h-4 text-neutral-500 transition-transform", moreDetailsOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                More details
              </span>
            </button>

            {moreDetailsOpen && (
              <div className="p-4 sm:p-6 border-t border-[#ececec] space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column Fields */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Travel costs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <label className="text-[13px] font-medium text-neutral-800">Travel costs</label>
                      <div className="relative">
                        <select
                          value={travelCosts}
                          onChange={(e: any) => setTravelCosts(e.target.value)}
                          className="h-11 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] text-neutral-900 pr-8 focus:border-primary focus:outline-none"
                        >
                          <option value="Excluded">Excluded</option>
                          <option value="Included">Included</option>
                          <option value="Reimbursed">Reimbursed</option>
                        </select>
                        <svg className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Optional discount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <label className="text-[13px] font-medium text-neutral-800">
                        Optional discount ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={optionalDiscount}
                        onChange={(e) => setOptionalDiscount(e.target.value)}
                        placeholder="0.00"
                        className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Terms and conditions attachment */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[13px] font-medium text-neutral-800">
                        Terms and conditions attachment
                      </label>
                      {termsAttachment ? (
                        <div className="flex items-center justify-between p-3 bg-[#f8fafc] border border-[#ececec] rounded-[8px] text-[13px]">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <div>
                              <span className="font-semibold text-neutral-900 block">
                                {termsAttachment.name}
                              </span>
                              <span className="text-[12px] text-neutral-400">
                                {termsAttachment.size}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTermsAttachment(null)}
                            className="text-neutral-400 hover:text-neutral-700 p-1"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setTermsAttachment({
                              name: 'Offer_Terms_Conditions.pdf',
                              size: 'PDF • 248 KB',
                            })
                          }
                          className="w-full py-3 px-4 border-2 border-dashed border-[#e2e2e2] rounded-[8px] text-[13px] text-neutral-500 hover:bg-neutral-50 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>Upload terms and conditions PDF</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Approval route Stepper & Info Notice */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-neutral-800">Approval route</label>
                        <div className="relative w-52">
                          <select
                            value={approvalRoute}
                            onChange={(e) => setApprovalRoute(e.target.value)}
                            className="h-9 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-800 pr-7 focus:border-primary focus:outline-none"
                          >
                            <option value="Commercial Approval">Commercial Approval</option>
                            <option value="Standard Technical Route">Standard Technical Route</option>
                          </select>
                          <svg className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Vertical Approval Stepper */}
                      <div className="rounded-[8px] bg-[#f8fafc] p-4 border border-[#ececec] space-y-3">
                        <div className="relative pl-6 space-y-4">
                          {/* Step 1 */}
                          <div className="relative">
                            <div className="absolute -left-6 top-0.5 size-3 rounded-full bg-primary ring-4 ring-[#e8edfc]" />
                            <div className="absolute -left-[19px] top-3.5 w-0.5 h-7 bg-neutral-200" />
                            <div className="text-[13px] font-semibold text-neutral-900">
                              1. Commercial Manager
                            </div>
                            <div className="text-[12px] text-neutral-500">Pending</div>
                          </div>

                          {/* Step 2 */}
                          <div className="relative">
                            <div className="absolute -left-6 top-0.5 size-3 rounded-full bg-neutral-300 ring-4 ring-neutral-100" />
                            <div className="absolute -left-[19px] top-3.5 w-0.5 h-7 bg-neutral-200" />
                            <div className="text-[13px] font-semibold text-neutral-700">
                              2. Managing Director
                            </div>
                            <div className="text-[12px] text-neutral-400">Pending</div>
                          </div>

                          {/* Step 3 */}
                          <div className="relative">
                            <div className="absolute -left-6 top-0.5 size-3 rounded-full bg-neutral-300 ring-4 ring-neutral-100" />
                            <div className="text-[13px] font-semibold text-neutral-700">
                              3. Finance Manager
                            </div>
                            <div className="text-[12px] text-neutral-400">Pending</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Notice Banner */}
                    <div className="p-3.5 bg-[#e8edfc] border border-[#c5d7fa] rounded-[8px] flex items-start gap-2.5 text-[13px] text-primary leading-relaxed font-medium">
                      <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        The offer will be sent to the selected approval route before it can be issued to the client.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CabTourStep>

        {/* Footer Action Bar */}
        <CabTourStep steps={tourSteps} stepId="create-offer-actions">
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              className="flex h-11 items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white px-5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave('draft')}
                className="flex h-11 items-center justify-center rounded-[8px] border border-[#1236a3] bg-white px-5 text-[14px] font-medium text-primary hover:bg-[#e8edfc] transition-colors disabled:opacity-50"
              >
                {t('cab.offers.saveDraft', 'Save draft')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave('pending_approval')}
                className="flex h-11 items-center justify-center rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {t('cab.offers.sendForApproval', 'Send for approval')}
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* Add Fee Modal */}
        {showAddFeeModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-2xl border border-[#ececec] w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-neutral-900">Add fee</h3>
                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddFee} className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Description <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeeDescription}
                    onChange={(e) => setNewFeeDescription(e.target.value)}
                    placeholder="e.g. Surveillance audit fee"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    Amount ({currency}) <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(e.target.value)}
                    placeholder="500.00"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFeeModal(false)}
                    className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Discard Changes Modal */}
        {showDiscardModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-2xl border border-[#ececec] w-full max-w-sm p-5 space-y-4">
              <h3 className="text-[16px] font-bold text-neutral-900">Discard changes?</h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                You have unsaved changes. Are you sure you want to leave?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.cabOffers)}
                  className="h-10 rounded-[8px] bg-error-600 hover:bg-error-700 text-white px-4 text-[13px] font-medium shadow-sm"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}

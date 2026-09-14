import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { ROUTES } from '@/lib/routes'
import { createOffer, type OfferFeeItem } from '@/lib/api/cabOffersApi'

export function CabCreateOfferPage() {
  const navigate = useNavigate()

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
    <CabLayout>
      <div className="p-6 max-w-[1360px] mx-auto space-y-6">
        {/* Toast */}
        {successToast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-in slide-in-from-top-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successToast}</span>
          </div>
        )}

        {/* Top Breadcrumb & Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
              <span>Offers</span>
              <span className="text-gray-400">›</span>
              <span className="text-gray-800 font-semibold">Create offer</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create offer</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Prepare a commercial offer for the client based on an accepted application.
            </p>
          </div>

          <button
            onClick={() => navigate(ROUTES.cabOffers)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to offers</span>
          </button>
        </div>

        {/* Top 2-Column Cards: Client and Application & Offer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Client and application */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
              Client and application
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Client <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={client}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Application <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={application}
                    onChange={(e) => {
                      setApplication(e.target.value)
                      if (errors.application) setErrors({ ...errors, application: '' })
                    }}
                    className={`w-full appearance-none px-3 py-2 text-xs bg-white border rounded-lg pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                      errors.application
                        ? 'border-red-500 text-red-900 focus:border-red-500'
                        : 'border-gray-200 text-gray-800 focus:border-blue-500'
                    }`}
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
                  <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errors.application && (
                  <p className="text-[11px] text-red-600">{errors.application}</p>
                )}
              </div>
            </div>

            {/* Read-only client details grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Country</span>
                <span className="font-medium text-gray-800">Saudi Arabia</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Scope</span>
                <span className="font-medium text-gray-800 leading-snug block">
                  Food safety management systems (ISO 22000)
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Primary contact</span>
                <span className="font-medium text-gray-800">Sara Ali</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Standard</span>
                <span className="font-medium text-gray-800">ISO 22000:2018</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block text-[11px]">Email</span>
                <div className="flex items-center gap-1.5 text-blue-600 mt-0.5">
                  <span className="font-medium text-xs">sara@alnoor.example</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Offer details */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
              Offer details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-700">Offer number</label>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  readOnly
                  value={offerNumber}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono focus:outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full appearance-none px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="USD">USD</option>
                    <option value="SAR">SAR</option>
                    <option value="EGP">EGP</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Valid until <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => {
                      setValidUntil(e.target.value)
                      if (errors.validUntil) setErrors({ ...errors, validUntil: '' })
                    }}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                      errors.validUntil
                        ? 'border-red-500 text-red-900 focus:border-red-500'
                        : 'border-gray-200 text-gray-800 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.validUntil && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errors.validUntil}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Payment terms <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full appearance-none px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="30 days from invoice date">30 days from invoice date</option>
                    <option value="15 days from invoice date">15 days from invoice date</option>
                    <option value="Upon receipt of invoice">Upon receipt of invoice</option>
                    <option value="50% advance, 50% upon completion">50% advance, 50% upon completion</option>
                  </select>
                  <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any internal notes (optional)..."
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Fees Section */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">Fees</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Table of fee lines */}
            <div className="lg:col-span-8 space-y-3">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="w-10 px-3.5 py-2.5">#</th>
                      <th className="px-3.5 py-2.5">Description</th>
                      <th className="px-3.5 py-2.5 text-right">Amount ({currency})</th>
                      <th className="w-10 px-3.5 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fees.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-3 text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-3.5 py-3 text-gray-900 font-medium">{item.description}</td>
                        <td className="px-3.5 py-3 text-right font-semibold text-gray-900">
                          {Number(item.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <button
                            onClick={() => handleRemoveFee(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove fee line"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errors.fees && <p className="text-xs text-red-600">{errors.fees}</p>}

              <button
                type="button"
                onClick={() => setShowAddFeeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add fee</span>
              </button>
            </div>

            {/* Totals Summary Box */}
            <div className="lg:col-span-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                <span>Total before tax</span>
                <span className="text-sm font-bold text-gray-900">
                  {totalBeforeTax.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span>Tax</span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[11px] text-gray-400 italic">Not configured</span>
                </div>
                <span className="font-semibold text-gray-600">—</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Total ({currency})</span>
                <span className="text-base text-gray-900">
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* More Details Collapsible */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMoreDetailsOpen(!moreDetailsOpen)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-gray-900 text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              {moreDetailsOpen ? (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              More details
            </span>
          </button>

          {moreDetailsOpen && (
            <div className="p-5 border-t border-gray-100 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column Fields */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Travel costs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <label className="text-xs font-semibold text-gray-700">Travel costs</label>
                    <div className="relative">
                      <select
                        value={travelCosts}
                        onChange={(e: any) => setTravelCosts(e.target.value)}
                        className="w-full appearance-none px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="Excluded">Excluded</option>
                        <option value="Included">Included</option>
                        <option value="Reimbursed">Reimbursed</option>
                      </select>
                      <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Optional discount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Optional discount ({currency})
                      </label>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={optionalDiscount}
                      onChange={(e) => setOptionalDiscount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Terms and conditions attachment */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Terms and conditions attachment
                    </label>
                    {termsAttachment ? (
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <div>
                            <span className="font-semibold text-gray-800 block">
                              {termsAttachment.name}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {termsAttachment.size}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTermsAttachment(null)}
                          className="text-gray-400 hover:text-gray-700 p-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
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
                        className="w-full py-3 px-4 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-gray-700">Approval route</label>
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="relative w-48">
                        <select
                          value={approvalRoute}
                          onChange={(e) => setApprovalRoute(e.target.value)}
                          className="w-full appearance-none px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="Commercial Approval">Commercial Approval</option>
                          <option value="Standard Technical Route">Standard Technical Route</option>
                        </select>
                        <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Vertical Approval Stepper */}
                    <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-200 space-y-3">
                      <div className="relative pl-6 space-y-4">
                        {/* Step 1 */}
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                          <div className="absolute -left-[19px] top-3.5 w-0.5 h-7 bg-gray-200" />
                          <div className="text-xs font-semibold text-gray-900">
                            1. Commercial Manager
                          </div>
                          <div className="text-[11px] text-gray-500">Pending</div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-gray-100" />
                          <div className="absolute -left-[19px] top-3.5 w-0.5 h-7 bg-gray-200" />
                          <div className="text-xs font-semibold text-gray-700">
                            2. Managing Director
                          </div>
                          <div className="text-[11px] text-gray-400">Pending</div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-gray-100" />
                          <div className="text-xs font-semibold text-gray-700">
                            3. Finance Manager
                          </div>
                          <div className="text-[11px] text-gray-400">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Notice Banner */}
                  <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-2.5 text-xs text-sky-900">
                    <svg className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      The offer will be sent to the selected approval route before it can be issued
                      to the client.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('draft')}
              className="px-4 py-2 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('pending_approval')}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              Send for approval
            </button>
          </div>
        </div>

        {/* Add Fee Modal */}
        {showAddFeeModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Add fee</h3>
                <button
                  onClick={() => setShowAddFeeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddFee} className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeeDescription}
                    onChange={(e) => setNewFeeDescription(e.target.value)}
                    placeholder="e.g. Surveillance audit fee"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Amount ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(e.target.value)}
                    placeholder="500.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFeeModal(false)}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95">
              <h3 className="text-sm font-bold text-gray-900">Discard changes?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                You have unsaved changes. Are you sure you want to leave?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.cabOffers)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
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

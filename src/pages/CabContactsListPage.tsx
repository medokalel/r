import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { getContacts, type ContactItem } from '@/lib/api/cabContactsApi'
import { AppIcon, SearchIcon, UsersIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function CabContactsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const data = await getContacts({
        searchQuery,
        client: selectedClient,
        status: selectedStatus,
      })
      setContacts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [selectedClient, selectedStatus])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    fetchContacts()
  }

  const handleClear = () => {
    setSearchQuery('')
    setSelectedClient('all')
    setSelectedStatus('all')
    getContacts().then(setContacts)
  }

  return (
    <CabLayout sidebarVariant="contacts">
      <CabHeader
        title={t('cab.contacts.title', 'Contacts')}
        subtitle={t('cab.contacts.subtitle', 'Manage client contacts and authorized representatives')}
        notificationCount={2}
      />

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:p-8">
        {/* Page Header with Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-neutral-400 mb-1">
              <span>{t('cab.workspace.apps.contacts', 'Contacts')}</span>
              <span>/</span>
              <span className="text-[#1236a3] font-medium">{t('cab.contacts.list', 'All Contacts')}</span>
            </nav>
            <h2 className="text-[24px] font-bold text-neutral-900 tracking-tight">
              {t('cab.contacts.title', 'Contacts')}
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              {t('cab.contacts.description', 'List of all authorized client contacts, representatives and portal accounts.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/cab/contacts/new')}
            className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#1236a3] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0e2a80] active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t('cab.contacts.addContact', 'Add contact')}</span>
          </button>
        </div>

        {/* Filter Card */}
        <div className="rounded-[16px] border border-[#eaedf3] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.contacts.filters.search', 'Search contact, client or email')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('cab.contacts.filters.searchPlaceholder', 'e.g. Sara Ali, Al Noor, Quality Manager...')}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 ps-10 pe-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </div>
              </div>
            </div>

            {/* Client Filter */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.contacts.filters.client', 'Client')}
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
              >
                <option value="all">{t('cab.contacts.filters.allClients', 'All Clients')}</option>
                <option value="CL-0001">Al Noor Food Industries (CL-0001)</option>
                <option value="CLT-2025-0148">GreenLeaf Pvt. Ltd. (CLT-2025-0148)</option>
                <option value="CL-0019">Apex Health Systems (CL-0019)</option>
              </select>
            </div>

            {/* Status Filter & Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-700">
                  {t('cab.contacts.filters.status', 'Status')}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                >
                  <option value="all">{t('cab.contacts.filters.allStatuses', 'All Statuses')}</option>
                  <option value="active">{t('cab.contacts.status.active', 'Active')}</option>
                  <option value="pending">{t('cab.contacts.status.pending', 'Pending')}</option>
                  <option value="inactive">{t('cab.contacts.status.inactive', 'Inactive')}</option>
                </select>
              </div>

              <div className="pt-6 flex gap-1">
                <button
                  type="submit"
                  className="rounded-[10px] bg-[#1236a3] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0e2a80]"
                >
                  {t('common.search', 'Search')}
                </button>
                {(searchQuery || selectedClient !== 'all' || selectedStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-[10px] border border-[#d8dce5] px-3 py-2.5 text-[13px] text-neutral-600 hover:bg-neutral-50"
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Contacts Table Card */}
        <div className="rounded-[16px] border border-[#eaedf3] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaedf3]">
            <span className="text-[15px] font-bold text-neutral-900">
              {contacts.length} {t('cab.contacts.resultsCount', 'Contacts found')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-[14px]">
              <thead>
                <tr className="border-b border-[#eaedf3] bg-[#f8fafd] text-[13px] font-semibold text-neutral-600">
                  <th className="px-6 py-3.5 text-start">{t('cab.contacts.columns.contact', 'Contact')}</th>
                  <th className="px-6 py-3.5 text-start">{t('cab.contacts.columns.client', 'Client')}</th>
                  <th className="px-6 py-3.5 text-start">{t('cab.contacts.columns.role', 'Roles / Designation')}</th>
                  <th className="px-6 py-3.5 text-start">{t('cab.contacts.columns.phone', 'Phone')}</th>
                  <th className="px-6 py-3.5 text-start">{t('cab.contacts.columns.sites', 'Linked Site(s)')}</th>
                  <th className="px-6 py-3.5 text-start">{t('cab.contacts.columns.status', 'Status')}</th>
                  <th className="px-6 py-3.5 text-end">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedf3]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                      <div className="inline-block size-6 animate-spin rounded-full border-2 border-[#1236a3] border-t-transparent mb-2" />
                      <p>{t('common.loading', 'Loading contacts...')}</p>
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                      <AppIcon icon={UsersIcon} size={36} className="mx-auto text-neutral-300 mb-2" />
                      <p>{t('cab.contacts.noContactsFound', 'No contacts found matching your search.')}</p>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="transition-colors hover:bg-[#fcfdfe]">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-[14px] font-bold text-[#1236a3]">
                            {contact.firstName[0]}
                            {contact.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-[12px] text-neutral-500">{contact.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Client info */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900">{contact.clientName}</p>
                        <p className="text-[12px] text-neutral-500">
                          {contact.clientCode} · {contact.country}
                        </p>
                      </td>

                      {/* Job title & Roles */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-800">{contact.jobTitle}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.isPrimaryContact && (
                            <span className="inline-flex rounded-full bg-[#e8edfc] px-2 py-0.5 text-[11px] font-medium text-[#1236a3]">
                              {t('cab.contacts.roles.primary', 'Primary contact')}
                            </span>
                          )}
                          {contact.isAuthorizedSignatory && (
                            <span className="inline-flex rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                              {t('cab.contacts.roles.signatory', 'Signatory')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-neutral-700 font-medium">
                        {contact.phonePrefix} {contact.phoneNumber}
                      </td>

                      {/* Sites */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.linkedSites.map((site) => (
                            <span key={site} className="inline-flex rounded-[6px] bg-[#f1f3f9] px-2 py-0.5 text-[12px] font-semibold text-neutral-700">
                              {site}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
                            contact.status === 'active' && 'bg-[#ecfdf5] text-[#16a34a]',
                            contact.status === 'pending' && 'bg-[#fff7ed] text-[#ea580c]',
                            contact.status === 'inactive' && 'bg-[#fef2f2] text-[#dc2626]'
                          )}
                        >
                          {contact.status === 'active'
                            ? t('cab.contacts.status.active', 'Active')
                            : contact.status === 'pending'
                            ? t('cab.contacts.status.pending', 'Pending')
                            : t('cab.contacts.status.inactive', 'Inactive')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-end">
                        <button
                          type="button"
                          onClick={() => navigate('/cab/contacts/new')}
                          className="rounded-[8px] border border-[#d8dce5] bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 transition hover:border-[#1236a3] hover:text-[#1236a3]"
                        >
                          {t('common.edit', 'Edit')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CabLayout>
  )
}

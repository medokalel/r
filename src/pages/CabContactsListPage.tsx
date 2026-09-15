import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { getContacts, type ContactItem } from '@/lib/api/cabContactsApi'
import { AddCircleIcon, AppIcon, EyeIcon, SearchIcon, UsersIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function CabContactsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(1)

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
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Filter Card */}
        <div className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-none">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Search Input */}
            <div className="lg:col-span-6 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.contacts.filters.search', 'Search contact, client or email')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('cab.contacts.filters.searchPlaceholder', 'e.g. Sara Ali, Al Noor, Quality Manager...')}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 ps-10 pe-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </div>
              </div>
            </div>

            {/* Client Filter */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.contacts.filters.client', 'Client')}
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('cab.contacts.filters.allClients', 'All Clients')}</option>
                <option value="CL-0001">Al Noor Food Industries (CL-0001)</option>
                <option value="CLT-2025-0148">GreenLeaf Pvt. Ltd. (CLT-2025-0148)</option>
                <option value="CL-0019">Apex Health Systems (CL-0019)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.contacts.filters.status', 'Status')}
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('cab.contacts.filters.allStatuses', 'All Statuses')}</option>
                <option value="active">{t('cab.contacts.status.active', 'Active')}</option>
                <option value="pending">{t('cab.contacts.status.pending', 'Pending')}</option>
                <option value="inactive">{t('cab.contacts.status.inactive', 'Inactive')}</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="lg:col-span-12 flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <AppIcon icon={SearchIcon} size={16} />
                <span>{t('common.search', 'Search')}</span>
              </button>
              {(searchQuery || selectedClient !== 'all' || selectedStatus !== 'all') && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-[var(--radius-sm)] border border-[#d8dce5] px-4 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  {t('common.clear', 'Clear')}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Contacts Table Section */}
        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.contacts.title', 'Contacts')}</h2>
              <p className="text-[13px] text-neutral-500">
                {t('cab.contacts.resultsCount', '{{count}} contacts found', { count: contacts.length })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/cab/contacts/new')}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <AppIcon icon={AddCircleIcon} size={18} />
              <span>{t('cab.contacts.addContact', 'Add contact')}</span>
            </button>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px] border-collapse text-center">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.contacts.columns.contact', 'Contact')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.contacts.columns.client', 'Client')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.contacts.columns.role', 'Roles / Designation')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.contacts.columns.phone', 'Phone')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.contacts.columns.sites', 'Linked Site(s)')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('cab.contacts.columns.status', 'Status')}</th>
                  <th className="px-4 py-4 text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-neutral-500">
                      {t('common.loading', 'Loading...')}
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-neutral-500">
                      <AppIcon icon={UsersIcon} size={36} className="mx-auto text-neutral-300 mb-2" />
                      <p>{t('cab.contacts.noContactsFound', 'No contacts found matching your search.')}</p>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact, index) => (
                    <tr
                      key={contact.id}
                      className={cn('transition-colors', index % 2 ? 'bg-[#f9fafc]' : '', 'hover:bg-[#e8edfc]/50')}
                    >
                      {/* Name & Email */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-[14px] font-bold text-primary">
                            {contact.firstName[0]}
                            {contact.lastName[0]}
                          </div>
                          <div className="text-start">
                            <p className="font-semibold text-neutral-900">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-[12px] text-neutral-500">{contact.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Client info */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-neutral-900">{contact.clientName}</p>
                        <p className="text-[12px] text-neutral-500 font-mono">
                          {contact.clientCode} · {contact.country}
                        </p>
                      </td>

                      {/* Job title & Roles */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-800">{contact.jobTitle}</p>
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          {contact.isPrimaryContact && (
                            <span className="inline-flex rounded-full bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-medium text-primary">
                              {t('cab.contacts.roles.primary', 'Primary contact')}
                            </span>
                          )}
                          {contact.isAuthorizedSignatory && (
                            <span className="inline-flex rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
                              {t('cab.contacts.roles.signatory', 'Signatory')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 text-neutral-700 font-medium text-[13px]">
                        {contact.phonePrefix} {contact.phoneNumber}
                      </td>

                      {/* Sites */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-center gap-1">
                          {contact.linkedSites.map((site) => (
                            <span key={site} className="inline-flex rounded-[6px] bg-[#f1f3f9] px-2 py-0.5 text-[12px] font-semibold text-neutral-700">
                              {site}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-3 py-1 text-[12px] font-medium',
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
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => navigate('/cab/contacts/new')}
                          className="p-1.5 rounded-lg text-primary hover:bg-[#e8edfc] transition-colors"
                          aria-label={t('common.edit', 'Edit')}
                        >
                          <AppIcon icon={EyeIcon} size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 px-5 md:hidden">
            {!loading && contacts.map((contact) => (
              <div key={contact.id} className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-neutral-900">{contact.firstName} {contact.lastName}</span>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      contact.status === 'active' && 'bg-[#ecfdf5] text-[#16a34a]',
                      contact.status === 'pending' && 'bg-[#fff7ed] text-[#ea580c]',
                      contact.status === 'inactive' && 'bg-[#fef2f2] text-[#dc2626]'
                    )}
                  >
                    {contact.status}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-600">{contact.jobTitle} · {contact.clientName}</p>
                <p className="text-[12px] text-neutral-500">{contact.email}</p>
              </div>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
            {!loading && !contacts.length && <p className="py-6 text-center text-neutral-500">{t('cab.contacts.noContactsFound', 'No contacts found.')}</p>}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={1}
            onPageChange={(nextPage) => setPage(nextPage)}
            className="mt-5 px-5"
          />
        </section>
      </main>
    </CabLayout>
  )
}

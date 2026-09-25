import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useContactsListTourSteps } from '@/config/contactsListTourSteps'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { getContacts, type ContactItem } from '@/lib/api/cabContactsApi'
import { AddCircleIcon, AppIcon, FilterFunnelIcon, SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

export function CabContactsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useContactsListTourSteps()

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

  const totalPages = Math.max(1, Math.ceil(contacts.length / PAGE_SIZE))
  const paginated = contacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <CabLayout
      sidebarVariant="contacts"
      tourId="cab-contacts-list"
      tourSteps={tourSteps}
    >
      <CabTourStep steps={tourSteps} stepId="contacts-header">
        <div>
          <CabHeader title={t('cab.contacts.title', 'Contacts')} notificationCount={3} />
        </div>
      </CabTourStep>

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        {/* Main Card Container */}
        <div className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          {/* Top Bar: Search, Filters & Action Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <CabTourStep steps={tourSteps} stepId="contacts-search-filters">
              <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={t('cab.contacts.filters.searchPlaceholder', 'Search contact, client or email...')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    className="h-11 flex-1 shrink-0 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white hover:opacity-90 sm:flex-none"
                  >
                    {t('common.search', 'Search')}
                  </button>
                  <TableFilterSelect
                    label={t('cab.contacts.filters.client', 'Client')}
                    value={selectedClient}
                    onChange={(value) => {
                      setPage(1)
                      setSelectedClient(value)
                    }}
                    options={[
                      { value: 'all', label: t('cab.contacts.filters.allClients', 'All Clients') },
                      { value: 'CL-0001', label: 'Al Noor Food Industries (CL-0001)' },
                      { value: 'CLT-2025-0148', label: 'GreenLeaf Pvt. Ltd. (CLT-2025-0148)' },
                      { value: 'CL-0019', label: 'Apex Health Systems (CL-0019)' },
                    ]}
                  />
                  <TableFilterSelect
                    label={t('cab.contacts.filters.status', 'Status')}
                    value={selectedStatus}
                    onChange={(value) => {
                      setPage(1)
                      setSelectedStatus(value)
                    }}
                    options={[
                      { value: 'all', label: t('cab.contacts.filters.allStatuses', 'All Statuses') },
                      { value: 'active', label: t('cab.contacts.status.active', 'Active') },
                      { value: 'pending', label: t('cab.contacts.status.pending', 'Pending') },
                      { value: 'inactive', label: t('cab.contacts.status.inactive', 'Inactive') },
                    ]}
                  />
                  <button
                    type="button"
                    aria-label={t('common.filter', 'Filter')}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f6fd] text-primary hover:bg-[#e8edfc]"
                    onClick={() => handleSearch()}
                  >
                    <AppIcon icon={FilterFunnelIcon} size={20} />
                  </button>
                </div>
              </div>
            </CabTourStep>

            {/* Add Contact Button */}
            <CabTourStep steps={tourSteps} stepId="contacts-add-btn">
              <button
                type="button"
                onClick={() => navigate('/cab/contacts/new')}
                className="flex h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
              >
                <AppIcon icon={AddCircleIcon} size={18} />
                <span>{t('cab.contacts.addContact', 'Add contact')}</span>
              </button>
            </CabTourStep>
          </div>

          {/* Desktop Table View */}
          <CabTourStep steps={tourSteps} stepId="contacts-table">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] border-collapse text-center">
                <thead className="border-b border-[#ececec]">
                  <tr className="rounded-[10px] bg-[#1236a3] text-white">
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.contacts.columns.contact', 'Contact')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.contacts.columns.client', 'Client')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.contacts.columns.role', 'Roles / Designation')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.contacts.columns.phone', 'Phone')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.contacts.columns.sites', 'Linked Site(s)')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.contacts.columns.status', 'Status')}</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                        —
                      </td>
                    </tr>
                  ) : (
                    paginated.map((contact, index) => (
                      <tr
                        key={contact.id}
                        className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}
                      >
                        {/* Contact Name & Email */}
                        <td className="px-4 py-4">
                          <p className="text-[15px] font-medium text-neutral-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-[13px] text-neutral-500">
                            {contact.email}
                          </p>
                        </td>

                        {/* Client info */}
                        <td className="px-4 py-4">
                          <p className="text-[15px] font-medium text-neutral-900">
                            {contact.clientName}
                          </p>
                          <p className="text-[13px] text-neutral-500">
                            {contact.clientCode} · {contact.country}
                          </p>
                        </td>

                        {/* Job title & Roles */}
                        <td className="px-4 py-4">
                          <p className="text-[15px] text-neutral-700">
                            {contact.jobTitle}
                          </p>
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
                        <td className="px-4 py-4 text-[15px] text-neutral-700">
                          {contact.phonePrefix} {contact.phoneNumber}
                        </td>

                        {/* Linked Sites */}
                        <td className="px-4 py-4 text-neutral-700">
                          <div className="flex flex-wrap justify-center gap-1">
                            {contact.linkedSites.map((site) => (
                              <span key={site} className="inline-flex rounded-[6px] bg-[#f1f3f9] px-2 py-0.5 text-[12px] font-medium text-neutral-700">
                                {site}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {index === 0 ? (
                            <CabTourStep steps={tourSteps} stepId="contacts-status">
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors',
                                  contact.status.toLowerCase() === 'active' && 'bg-[#dcfce7] text-[#15803d]',
                                  contact.status.toLowerCase() === 'pending' && 'bg-[#fef9c3] text-[#a16207]',
                                  contact.status.toLowerCase() === 'inactive' && 'bg-[#f1f5f9] text-[#475569]'
                                )}
                              >
                                {t(`cab.contacts.status.${contact.status.toLowerCase()}`, contact.status)}
                              </span>
                            </CabTourStep>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors',
                                contact.status.toLowerCase() === 'active' && 'bg-[#dcfce7] text-[#15803d]',
                                contact.status.toLowerCase() === 'pending' && 'bg-[#fef9c3] text-[#a16207]',
                                contact.status.toLowerCase() === 'inactive' && 'bg-[#f1f5f9] text-[#475569]'
                              )}
                            >
                              {t(`cab.contacts.status.${contact.status.toLowerCase()}`, contact.status)}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => navigate('/cab/contacts/new')}
                            className="text-[14px] font-medium text-primary hover:underline"
                          >
                            {t('common.view', 'View')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CabTourStep>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {!loading && paginated.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => navigate('/cab/contacts/new')}
                className="w-full rounded-[12px] border border-[#ececec] p-4 text-start hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold text-neutral-900">{contact.firstName} {contact.lastName}</p>
                  <span
                    className={cn(
                      'inline-flex min-w-[85px] items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                      contact.status.toLowerCase() === 'active' && 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]',
                      contact.status.toLowerCase() === 'pending' && 'bg-[#fef9c3] text-[#a16207] border border-[#fef08a]',
                      contact.status.toLowerCase() === 'inactive' && 'bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]'
                    )}
                  >
                    {t(`cab.contacts.status.${contact.status.toLowerCase()}`, contact.status)}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-500 mt-1">{contact.jobTitle} · {contact.clientName}</p>
                <p className="mt-2 text-[14px] text-neutral-700">{contact.email}</p>
                {contact.phoneNumber && (
                  <p className="mt-1 text-[13px] text-neutral-500">{contact.phonePrefix} {contact.phoneNumber}</p>
                )}
              </button>
            ))}
            {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
            {!loading && !contacts.length && <p className="py-6 text-center text-neutral-500">—</p>}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      </div>
    </CabLayout>
  )
}

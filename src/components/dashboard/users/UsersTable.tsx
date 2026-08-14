import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, EditIcon, SearchIcon, TrashIcon } from '@/components/icons'
import { Toggle } from '@/components/ui/Toggle'
import type { AppUser, AppUserStatus } from '@/lib/api/usersApi'
import { matchesSearch } from '@/lib/tableTools'
import { cn } from '@/lib/utils'

interface UsersTableProps {
  users: AppUser[]
  loading: boolean
  onAddUser?: () => void
  onEditUser?: (user: AppUser) => void
  onDeleteUser?: (user: AppUser) => void
  onStatusChange?: (user: AppUser, status: AppUserStatus) => void
}

export function UsersTable({
  users,
  loading,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onStatusChange,
}: UsersTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const filteredUsers = users.filter((user) =>
    matchesSearch(
      [user.fullName, user.email, user.phoneNumber ?? '', user.role],
      appliedQuery
    )
  )

  const handleSearch = () => setAppliedQuery(query)

  return (
    <div className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AppIcon
              icon={SearchIcon}
              size={18}
              className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('users.searchPlaceholder')}
              className="w-80 rounded-[var(--radius-sm)] border border-neutral-200 bg-white py-2.5 ps-3 pe-10 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary/90"
          >
            {t('users.search')}
          </button>
        </div>
        <button
          type="button"
          onClick={onAddUser}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary/90"
        >
          <AppIcon icon={AddCircleIcon} size={18} />
          {t('users.addUser')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-center">
          <thead className="border-b border-[#ececec]">
            <tr className="bg-[#1236a3] text-white">
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.index')}
              </th>
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.name')}
              </th>
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.role')}
              </th>
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.email')}
              </th>
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.phone')}
              </th>
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.status')}
              </th>
              <th className="px-4 py-4 text-center text-[14px] font-medium">
                {t('users.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  —
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                  <td className="px-4 py-4 text-[15px] text-neutral-700">{index + 1}</td>
                  <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
                    {user.fullName || '—'}
                  </td>
                  <td className="px-4 py-4 text-[15px] text-neutral-700">{user.role || '—'}</td>
                  <td className="px-4 py-4 text-[15px] text-neutral-700">{user.email}</td>
                  <td className="px-4 py-4 text-[15px] text-neutral-700" dir="ltr">
                    {user.phoneCountryCode && user.phoneNumber
                      ? `${user.phoneCountryCode} ${user.phoneNumber}`
                      : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <Toggle
                        checked={user.status === 'ACTIVE'}
                        label={t(`users.status.${user.status.toLowerCase()}`)}
                        onChange={(checked) =>
                          onStatusChange?.(user, checked ? 'ACTIVE' : 'INACTIVE')
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => onDeleteUser?.(user)}
                        aria-label={t('users.table.delete')}
                        className="text-error-500 transition-colors hover:text-error-700"
                      >
                        <AppIcon icon={TrashIcon} size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditUser?.(user)}
                        aria-label={t('users.table.edit')}
                        className="text-neutral-500 transition-colors hover:text-primary"
                      >
                        <AppIcon icon={EditIcon} size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppLayout } from '@/components/layout/AppLayout'
import { UsersStatCards } from '@/components/dashboard/users/UsersStatCards'
import { UsersTable } from '@/components/dashboard/users/UsersTable'
import {
  UsersStatsSkeleton,
  UsersTableSkeleton,
} from '@/components/dashboard/users/UsersLoadingSkeleton'
import {
  deleteUser,
  getUsersStats,
  listUsers,
  setUserStatus,
  type AppUser,
  type AppUserStatus,
  type UsersStats,
} from '@/lib/api/usersApi'

export function UsersPage() {
  const [stats, setStats] = useState<UsersStats | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    return Promise.all([getUsersStats(), listUsers()])
      .then(([statsResult, usersResult]) => {
        setStats(statsResult)
        setUsers(usersResult)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleStatusChange = (user: AppUser, status: AppUserStatus) => {
    // Optimistic update, then sync — mirrors the eventual real API call
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status } : u)))
    setUserStatus(user.id, status).then(load)
  }

  const handleDeleteUser = (user: AppUser) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    deleteUser(user.id).then(load)
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="users.pageTitle" />

      <div className="flex flex-col gap-5 overflow-auto p-5">
        {loading ? <UsersStatsSkeleton /> : <UsersStatCards stats={stats} loading={loading} />}

        {loading ? (
          <UsersTableSkeleton />
        ) : (
          <UsersTable
            users={users}
            loading={loading}
            onStatusChange={handleStatusChange}
            onDeleteUser={handleDeleteUser}
            // TODO: wire up an add/edit user form once the backend exposes
            // create/update endpoints — see usersApi.ts
            onAddUser={() => undefined}
            onEditUser={() => undefined}
          />
        )}
      </div>
    </AppLayout>
  )
}
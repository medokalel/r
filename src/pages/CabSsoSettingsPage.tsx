import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { SsoActivityList } from '@/components/dashboard/cab/sso/SsoActivityList'
import { SsoConnectionCard } from '@/components/dashboard/cab/sso/SsoConnectionCard'
import { SsoConnectionWizard } from '@/components/dashboard/cab/sso/SsoConnectionWizard'
import { SsoLoadingSkeleton } from '@/components/dashboard/cab/sso/SsoLoadingSkeleton'
import { SsoProviderOption } from '@/components/dashboard/cab/sso/SsoProviderOption'
import { AppIcon, PlusIcon, ShieldIcon } from '@/components/icons'
import {
  deleteSsoConnection,
  getSsoErrorMessage,
  getSsoOptions,
  listSsoConnections,
  listSsoEvents,
  updateSsoConnection,
} from '@/lib/api/ssoApi'
import {
  SSO_PROVIDERS,
  type SsoConnection,
  type SsoEvent,
  type SsoOptions,
  type SsoProvider,
  type SsoWizardStep,
} from '@/lib/api/ssoTypes'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'

const ACTIVITY_LIMIT = 8

interface EditorState {
  connection: SsoConnection | null
  provider: SsoProvider
  step: SsoWizardStep
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Single sign-on settings for a CAB: connect an identity provider, verify the staff email
 * domains, test the connection and turn it on.
 *
 * Not linked from the workspace yet (the tile stays "Coming soon"); the page opens by URL.
 * Data comes from the mock in `ssoApi.ts` until the backend endpoints exist.
 */
export function CabSsoSettingsPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const [connections, setConnections] = useState<SsoConnection[] | null>(null)
  const [options, setOptions] = useState<SsoOptions | null>(null)
  const [events, setEvents] = useState<SsoEvent[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [picking, setPicking] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SsoConnection | null>(null)

  const load = useCallback(() => {
    Promise.all([listSsoConnections(), getSsoOptions(), listSsoEvents(ACTIVITY_LIMIT)])
      .then(([loadedConnections, loadedOptions, loadedEvents]) => {
        setConnections(loadedConnections)
        setOptions(loadedOptions)
        setEvents(loadedEvents)
      })
      .catch(() => setLoadFailed(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refreshEvents = useCallback(() => {
    listSsoEvents(ACTIVITY_LIMIT)
      .then(setEvents)
      .catch(() => undefined)
  }, [])

  const handleRetry = () => {
    setLoadFailed(false)
    load()
  }

  const upsertConnection = useCallback(
    (connection: SsoConnection) => {
      setConnections((previous) => {
        const list = previous ?? []
        return list.some((item) => item.id === connection.id)
          ? list.map((item) => (item.id === connection.id ? connection : item))
          : [...list, connection]
      })
      refreshEvents()
    },
    [refreshEvents],
  )

  const runForConnection = async (id: string, action: () => Promise<SsoConnection>, successMessage?: string) => {
    setBusyId(id)
    try {
      upsertConnection(await action())
      if (successMessage) toast.success(successMessage)
    } catch (caught) {
      toast.error(getSsoErrorMessage(caught, t))
    } finally {
      setBusyId(null)
    }
  }

  const handleToggle = (connection: SsoConnection, enabled: boolean) =>
    runForConnection(
      connection.id,
      () => updateSsoConnection(connection.id, { status: enabled ? 'ENABLED' : 'DISABLED' }),
      t(enabled ? 'cab.sso.card.enabled' : 'cab.sso.card.disabled'),
    )

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteSsoConnection(pendingDelete.id)
      setConnections((previous) => (previous ?? []).filter((item) => item.id !== pendingDelete.id))
      refreshEvents()
      toast.success(t('cab.sso.card.deleted'))
      setPendingDelete(null)
    } catch (caught) {
      toast.error(getSsoErrorMessage(caught, t))
    }
  }

  const openNew = (provider: SsoProvider) => {
    setPicking(false)
    setEditor({ connection: null, provider, step: 'provider' })
  }

  const closeEditor = () => {
    setEditor(null)
    refreshEvents()
  }

  const hasConnections = (connections?.length ?? 0) > 0
  const ready = connections !== null && options !== null

  return (
    <CabLayout>
      <CabHeader title={t('cab.sso.page.title')} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.sso.page.breadcrumbHub')}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCompanyProfile} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.sso.page.breadcrumbSettings')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{t('cab.sso.page.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AppIcon icon={ShieldIcon} size={28} className="mt-1 shrink-0 text-primary" />
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-neutral-900">{t('cab.sso.page.title')}</h1>
              <p className="mt-1 max-w-2xl text-[14px] text-neutral-500">{t('cab.sso.page.subtitle')}</p>
            </div>
          </div>
          {ready && !editor && hasConnections ? (
            <Button
              type="button"
              icon={<AppIcon icon={PlusIcon} size={20} />}
              onClick={() => setPicking((open) => !open)}
            >
              {t('cab.sso.page.add')}
            </Button>
          ) : null}
        </div>

        {loadFailed && !ready ? (
          <ErrorState description={t('cab.sso.page.loadError')} onRetry={handleRetry} />
        ) : null}
        {!loadFailed && !ready ? <SsoLoadingSkeleton /> : null}

        {ready && editor ? (
          <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5 sm:p-6">
            <SsoConnectionWizard
              connection={editor.connection}
              provider={editor.provider}
              initialStep={editor.step}
              options={options}
              language={language}
              onConnectionChange={upsertConnection}
              onClose={closeEditor}
            />
          </div>
        ) : null}

        {ready && !editor ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              {!hasConnections || picking ? (
                <SectionCard title={hasConnections ? t('cab.sso.page.add') : t('cab.sso.page.emptyTitle')}>
                  {!hasConnections ? (
                    <p className="mb-4 text-[13px] leading-[1.7] text-neutral-600">{t('cab.sso.page.emptyHint')}</p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SSO_PROVIDERS.map((provider) => (
                      <SsoProviderOption key={provider} provider={provider} onSelect={() => openNew(provider)} />
                    ))}
                  </div>
                </SectionCard>
              ) : null}

              {connections.map((connection) => (
                <SsoConnectionCard
                  key={connection.id}
                  connection={connection}
                  language={language}
                  busy={busyId === connection.id}
                  onEdit={() => setEditor({ connection, provider: connection.provider, step: 'provider' })}
                  onTest={() => setEditor({ connection, provider: connection.provider, step: 'security' })}
                  onToggle={(enabled) => void handleToggle(connection, enabled)}
                  onDelete={() => setPendingDelete(connection)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <SectionCard title={t('cab.sso.page.howTitle')}>
                <ol className="list-decimal space-y-2 ps-5 text-[13px] leading-[1.7] text-neutral-700">
                  {(['how1', 'how2', 'how3', 'how4'] as const).map((key) => (
                    <li key={key}>{t(`cab.sso.page.${key}`)}</li>
                  ))}
                </ol>
              </SectionCard>
              <SectionCard title={t('cab.sso.page.activity')}>
                <SsoActivityList events={events} language={language} />
              </SectionCard>
            </div>
          </div>
        ) : null}
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        destructive
        title={t('cab.sso.card.deleteTitle', { name: pendingDelete?.name ?? '' })}
        description={t('cab.sso.card.deleteBody')}
        confirmLabel={t('cab.sso.card.delete')}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </CabLayout>
  )
}

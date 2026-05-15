import {
  useEffect,
  useReducer,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { issueToken } from '~/lib/api'
import { dispatchSetAuth, useAuthStore } from '~/stores/auth-store'

function subscribeHydration(onStoreChange: () => void) {
  return useAuthStore.persist.onFinishHydration(onStoreChange)
}

function getHydrationSnapshot() {
  return useAuthStore.persist.hasHydrated()
}

function getHydrationServerSnapshot() {
  return false
}

function useStoreHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  )
}

type BootstrapState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

type BootstrapAction =
  | { type: 'start' }
  | { type: 'ready' }
  | { type: 'error'; message: string }

function bootstrapReducer(
  state: BootstrapState,
  action: BootstrapAction,
): BootstrapState {
  switch (action.type) {
    case 'start':
      return { status: 'loading', error: null }
    case 'ready':
      return { status: 'ready', error: null }
    case 'error':
      return { status: 'error', error: action.message }
    default:
      return state
  }
}

const initialBootstrap: BootstrapState = { status: 'idle', error: null }

export default function ProviderAuth({ children }: PropsWithChildren) {
  const hydrated = useStoreHydrated()
  const [bootstrap, dispatch] = useReducer(bootstrapReducer, initialBootstrap)

  useEffect(() => {
    if (!hydrated) return

    let cancelled = false
    dispatch({ type: 'start' })

    void (async () => {
      try {
        const storedUserId = useAuthStore.getState().userId
        const userId = storedUserId ?? uuidv4()
        const { token, user_id } = await issueToken(userId)
        if (cancelled) return
        dispatchSetAuth(user_id, token)
        dispatch({ type: 'ready' })
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Не удалось авторизоваться'
        dispatch({ type: 'error', message })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hydrated])

  if (!hydrated || bootstrap.status !== 'ready') {
    if (bootstrap.status === 'error') {
      return <p role="alert">{bootstrap.error}</p>
    }
    return null
  }

  return children
}

import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

const STORAGE_NAME = 'ai-chat-auth'
const USER_ID_KEY = `${STORAGE_NAME}-userId`
const TOKEN_KEY = `${STORAGE_NAME}-token`

type AuthState = {
  userId: string | null
  token: string | null
}

function migrateLegacyStorage(): AuthState | null {
  const legacy = localStorage.getItem(STORAGE_NAME)
  if (!legacy) return null

  try {
    const data = JSON.parse(legacy) as { state?: AuthState }
    const state = data.state ?? (data as AuthState)
    localStorage.removeItem(STORAGE_NAME)
    if (state.userId) localStorage.setItem(USER_ID_KEY, state.userId)
    if (state.token) sessionStorage.setItem(TOKEN_KEY, state.token)
    return {
      userId: state.userId ?? null,
      token: state.token ?? null,
    }
  } catch {
    localStorage.removeItem(STORAGE_NAME)
    return null
  }
}

const splitAuthStorage: StateStorage = {
  getItem: () => {
    const userId = localStorage.getItem(USER_ID_KEY)
    const token = sessionStorage.getItem(TOKEN_KEY)

    if (userId === null && token === null) {
      const migrated = migrateLegacyStorage()
      if (!migrated) return null
      return JSON.stringify({ state: migrated, version: 0 })
    }

    return JSON.stringify({
      state: {
        userId,
        token,
      },
      version: 0,
    })
  },
  setItem: (_name, value) => {
    const { state } = JSON.parse(value) as { state: AuthState }
    if (state.userId) {
      localStorage.setItem(USER_ID_KEY, state.userId)
    } else {
      localStorage.removeItem(USER_ID_KEY)
    }
    if (state.token) {
      sessionStorage.setItem(TOKEN_KEY, state.token)
    } else {
      sessionStorage.removeItem(TOKEN_KEY)
    }
  },
  removeItem: () => {
    localStorage.removeItem(USER_ID_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(STORAGE_NAME)
  },
}

export const useAuthStore = create(
  persist<AuthState>(
    () => ({
      userId: null,
      token: null,
    }),
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(() => splitAuthStorage),
    },
  ),
)

export const dispatchClearAuth = () => useAuthStore.persist.clearStorage()

export const dispatchSetAuth = (userId: string, token: string) =>
  useAuthStore.setState({ userId, token }, true)

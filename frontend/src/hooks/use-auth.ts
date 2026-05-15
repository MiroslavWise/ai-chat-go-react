import { useAuthStore } from '~/stores/auth-store'

export function useAuth() {
  const userId = useAuthStore((s) => s.userId)
  const token = useAuthStore((s) => s.token)
  return { userId, token, isAuthenticated: Boolean(userId && token) }
}

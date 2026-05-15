import { useAuthStore } from "~/stores/auth-store"

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export type Chat = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (init?.token) {
    headers.set('Authorization', `Bearer ${init.token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
      details?: string
    } | null
    const message = body?.details
      ? `${body.error ?? 'API error'}: ${body.details}`
      : (body?.error ?? `API error: ${response.status}`)
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export async function fetchHealth(): Promise<string> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`)
  }
  return response.text()
}

export async function issueToken(userId: string): Promise<{ token: string; user_id: string }> {
  return request('/auth/token', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

const headerToken = () => {
  const token = useAuthStore.getState().token
  if (!token) {
    throw new Error('No token found')
  }
  return token
}

async function listChats(): Promise<Chat[]> {
  const token = headerToken()
  return request('/chats', { token })
}

async function createChat(
  token: string,
  title?: string,
): Promise<Chat> {
  return request('/chats', {
    method: 'POST',
    token,
    body: JSON.stringify({ title: title ?? '' }),
  })
}

async function listMessages(chatId: string): Promise<Message[]> {
  const token = headerToken()
  return request(`/chats/${chatId}/messages`, { token })
}

async function sendMessage(
  chatId: string,
  content: string,
): Promise<{ message: Message; assistant?: Message }> {
  const token = headerToken()

  return request(`/chats/${chatId}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ content }),
  })
}

export { API_BASE, listChats, createChat, listMessages, sendMessage }

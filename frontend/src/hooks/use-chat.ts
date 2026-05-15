import { useCallback, useEffect, useState } from 'react'
import {
  createChat,
  listMessages,
  messagesFromSendResponse,
  sendMessage,
  type Chat,
  type Message,
} from '~/lib/api'

export function useActiveChat() {
  const [chat, setChat] = useState<Chat | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const created = await createChat()
        if (!cancelled) setChat(created)
      } catch (err) {
        if (!cancelled) {
          setBootError(
            err instanceof Error ? err.message : 'Не удалось создать чат',
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { chat, bootError }
}

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void listMessages(chatId)
      .then((items) => {
        if (!cancelled) setMessages(items)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Не удалось загрузить сообщения',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [chatId])

  const send = useCallback(
    async (content: string) => {
      if (!chatId) return

      setSending(true)
      setError(null)

      try {
        const response = await sendMessage(chatId, content)
        setMessages((prev) => [...prev, ...messagesFromSendResponse(response)])
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Не удалось отправить сообщение'
        setError(message)
        throw err
      } finally {
        setSending(false)
      }
    },
    [chatId],
  )

  return { messages, loading, sending, error, send }
}

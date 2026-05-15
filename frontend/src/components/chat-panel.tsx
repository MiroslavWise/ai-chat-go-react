import { useState, type FormEvent } from "react"
import { useActiveChat, useChatMessages } from "~/hooks/use-chat"
import type { Message } from "~/lib/api"

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <article className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"}`}>
      <header className="chat-message__role">{isUser ? "Вы" : "Ассистент"}</header>
      <p className="chat-message__content">{message.content}</p>
    </article>
  )
}

export default function ChatPanel() {
  const { chat, bootError } = useActiveChat()
  const { messages, loading, sending, error, send } = useChatMessages(chat?.id ?? null)
  const [draft, setDraft] = useState("")

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setDraft("")
    try {
      await send(content)
    } catch {
      setDraft(content)
    }
  }

  if (bootError) {
    return <p role="alert">{bootError}</p>
  }

  if (!chat) {
    return <p className="chat-status">Подготовка чата…</p>
  }

  return (
    <section className="chat-panel" aria-label="Чат">
      <div className="chat-messages">
        {loading && messages.length === 0 ? <p className="chat-status">Загрузка сообщений…</p> : null}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <form className="chat-composer" onSubmit={onSubmit}>
        <textarea
          className="chat-composer__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Сообщение…"
          rows={3}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !draft.trim()}>
          {sending ? "Отправка…" : "Отправить"}
        </button>
      </form>
    </section>
  )
}

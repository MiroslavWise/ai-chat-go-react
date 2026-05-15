import { useQueryState } from "nuqs"

import type { Message } from "~/lib/api"
import { useMessages } from "~/hooks/use-messages"

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <article className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"}`}>
      <header className="chat-message__role">{isUser ? "Вы" : "Ассистент"}</header>
      <p className="chat-message__content">{message.content}</p>
    </article>
  )
}

function ListMessages() {
  const [chatId] = useQueryState("chatId")
  const { data: messages = [], isLoading, isError, error } = useMessages(chatId)

  if (!chatId) {
    return (
      <div className="w-full flex-1 flex items-center justify-center px-4 text-sm text-muted-foreground">
        Выберите чат или отправьте сообщение
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center px-4 text-sm text-muted-foreground">
        Загрузка сообщений…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full flex-1 flex items-center justify-center px-4 text-sm text-destructive" role="alert">
        {error instanceof Error ? error.message : "Не удалось загрузить сообщения"}
      </div>
    )
  }

  return (
    <div className="chat-messages w-full flex-1 min-h-0 mx-4 my-2">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}

ListMessages.displayName = "ListMessages"
export default ListMessages

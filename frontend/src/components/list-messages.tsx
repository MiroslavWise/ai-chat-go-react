import { useEffect, useRef } from "react"
import { useQueryState } from "nuqs"

import { cn } from "~/lib/utils"
import type { Message } from "~/lib/api"
import { useMessages } from "~/hooks/use-messages"

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <article className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(100%,42rem)] rounded-lg border px-2 py-1.5 text-left text-xs leading-snug",
          isUser ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-muted/60 text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
      </div>
    </article>
  )
}

function ListMessages() {
  const [chatId] = useQueryState("chatId")
  const { data: messages = [], isLoading, isError, error } = useMessages(chatId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  if (!chatId) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center px-3 text-xs text-muted-foreground">
        Выберите чат или отправьте сообщение
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex flex-1 min-h-0 items-center justify-center px-3 text-xs text-muted-foreground">Загрузка сообщений…</div>
  }

  if (isError) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center px-3 text-xs text-destructive" role="alert">
        {error instanceof Error ? error.message : "Не удалось загрузить сообщения"}
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
      {messages.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Сообщений пока нет</p>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
    </div>
  )
}

ListMessages.displayName = "ListMessages"
export default ListMessages

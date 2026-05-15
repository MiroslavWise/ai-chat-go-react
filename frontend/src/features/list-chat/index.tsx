import { useQueryState } from "nuqs"
import { useQuery } from "@tanstack/react-query"

import { Item } from "~/components/ui/item"
import { Separator } from "~/components/ui/separator"

import { cn } from "~/lib/utils"
import { listChats } from "~/lib/api"
import { queryKeys } from "~/lib/query-keys"

function ListChat() {
  const [chatId, setChatId] = useQueryState("chatId")

  const { data } = useQuery({
    queryKey: queryKeys.chats(),
    queryFn: () => listChats(),
  })

  const chats = data ?? []

  return (
    <aside className="w-full h-full flex flex-col p-2 gap-1 border-r border-border">
      <Item className="w-full" onClick={() => setChatId(null)} variant="muted" size="sm">
        <span className={cn("text-xs font-medium", chatId === null ? "text-primary" : "text-muted-foreground")}>Новый чат</span>
      </Item>
      <Separator orientation="horizontal" className="w-full" />
      {chats.map(({ id, title }) => (
        <Item className="w-full" key={id} onClick={() => setChatId(id)} variant="outline" size="sm">
          <span className={cn("text-xs font-medium truncate", chatId === id ? "text-primary" : "text-muted-foreground")}>{title}</span>
        </Item>
      ))}
    </aside>
  )
}

ListChat.displayName = "ListChat"
export default ListChat

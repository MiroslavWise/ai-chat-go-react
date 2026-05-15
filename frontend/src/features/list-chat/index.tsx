import { Menu } from "lucide-react"
import { useQueryState } from "nuqs"
import { useQuery } from "@tanstack/react-query"

import { Item } from "~/components/ui/item"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"

import { cn } from "~/lib/utils"
import { listChats } from "~/lib/api"
import { queryKeys } from "~/lib/query-keys"
import { useMobileMenu } from "~/provider/provider-mobile-menu"

function ListChat() {
  const { isOpen, toggle } = useMobileMenu()
  const [chatId, setChatId] = useQueryState("chatId")

  const { data } = useQuery({
    queryKey: queryKeys.chats(),
    queryFn: () => listChats(),
  })

  const chats = data ?? []

  return (
    <>
      <aside className={cn("w-full h-full lg:flex flex-col p-2 gap-1 lg:border-r lg:border-border", isOpen ? "flex" : "hidden lg:flex")}>
        <Item className="w-full" onClick={() => setChatId(null)} variant="muted" size="sm">
          <span className={cn("text-xs font-medium", chatId === null ? "text-primary" : "text-muted-foreground")}>Новый чат</span>
        </Item>
        <Separator orientation="horizontal" className="w-[calc(100%+1rem)] -mx-2" />
        {chats.map(({ id, title }) => (
          <Item className="w-full" key={id} onClick={() => setChatId(id)} variant="outline" size="sm">
            <span className={cn("text-xs font-medium truncate", chatId === id ? "text-primary" : "text-muted-foreground")}>{title}</span>
          </Item>
        ))}
      </aside>
      <Button variant="outline" size="icon" className="absolute top-2 right-2 lg:hidden z-10" onClick={toggle}>
        <Menu className="size-4" />
      </Button>
    </>
  )
}

ListChat.displayName = "ListChat"
export default ListChat

import { useQueryState } from "nuqs"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, type Resolver } from "react-hook-form"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

import { queryKeys } from "~/lib/query-keys"
import { useSendMessage } from "~/hooks/use-messages"
import { chatTitleFromContent, createChat } from "~/lib/api"
import { resolverMessage, type MessageSchema } from "~/schemas/message"

function FormSendMessage() {
  const [chatId, setChatId] = useQueryState("chatId")
  const queryClient = useQueryClient()
  const sendMessageMutation = useSendMessage()

  const { control, handleSubmit, reset } = useForm<MessageSchema>({
    resolver: resolverMessage as Resolver<MessageSchema>,
    defaultValues: {
      content: "",
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    if (sendMessageMutation.isPending) return

    try {
      if (chatId) {
        await sendMessageMutation.mutateAsync({ chatId, content: data.content })
      } else {
        const chat = await createChat(chatTitleFromContent(data.content))
        await sendMessageMutation.mutateAsync({ chatId: chat.id, content: data.content })
        await queryClient.invalidateQueries({ queryKey: queryKeys.chats() })
        setChatId(chat.id)
      }
      reset()
    } catch {
      // ошибка отображается через isError мутации при необходимости
    }
  })

  const isLoading = sendMessageMutation.isPending

  return (
    <form onSubmit={onSubmit} className="w-full relative h-90 p-2 border-t border-border mt-auto">
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState: { error } }) => (
          <Textarea placeholder="Send a message" className="w-full h-full resize-none" {...field} aria-invalid={!!error} />
        )}
      />
      {sendMessageMutation.isError ? (
        <p className="absolute left-4 bottom-16 text-sm text-destructive" role="alert">
          {sendMessageMutation.error instanceof Error ? sendMessageMutation.error.message : "Не удалось отправить сообщение"}
        </p>
      ) : null}
      <Button disabled={isLoading} variant="outline" size="icon" type="submit" className="absolute right-4 bottom-4">
        Отправить
      </Button>
    </form>
  )
}

FormSendMessage.displayName = "FormSendMessage"
export default FormSendMessage

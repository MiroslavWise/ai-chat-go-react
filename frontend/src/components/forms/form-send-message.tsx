import { useQueryState } from "nuqs"
import { Mic, Square, Volume2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, type Resolver } from "react-hook-form"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

import { cn } from "~/lib/utils"
import { queryKeys } from "~/lib/query-keys"
import { useSendMessage } from "~/hooks/use-messages"
import { useVoiceInput } from "~/hooks/use-voice-input"
import { useVoiceOutput } from "~/hooks/use-voice-output"
import { chatTitleFromContent, createChat } from "~/lib/api"
import { resolverMessage, type MessageSchema } from "~/schemas/message"

function FormSendMessage() {
  const [chatId, setChatId] = useQueryState("chatId")
  const queryClient = useQueryClient()
  const sendMessageMutation = useSendMessage()

  const { control, handleSubmit, reset, watch, setValue } = useForm<MessageSchema>({
    resolver: resolverMessage as Resolver<MessageSchema>,
    defaultValues: {
      content: "",
    },
  })

  const content = watch("content")

  const voiceInput = useVoiceInput({
    value: content,
    onChange: (next) => setValue("content", next, { shouldValidate: true }),
  })

  const voiceOutput = useVoiceOutput()

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
      await voiceInput.stopListening()
      voiceOutput.stop()
      reset()
    } catch {}
  })

  const isLoading = sendMessageMutation.isPending
  const voiceNotice = voiceInput.notice ?? voiceOutput.notice

  return (
    <form onSubmit={onSubmit} className="w-full relative h-25 p-2 border-t border-border mt-auto">
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState: { error } }) => (
          <Textarea
            placeholder="Send a message"
            className="w-full h-full resize-none pr-24 pb-12 pl-24 text-xs leading-snug"
            {...field}
            aria-invalid={!!error}
          />
        )}
      />
      <div className="absolute left-4 bottom-4 flex gap-1">
        <Button
          type="button"
          variant={voiceInput.listening ? "destructive" : "outline"}
          size="icon"
          disabled={isLoading}
          className={cn(voiceInput.listening && "animate-pulse")}
          aria-pressed={voiceInput.listening}
          aria-label={voiceInput.listening ? "Остановить запись" : "Голосовой ввод"}
          title={voiceInput.listening ? "Остановить запись" : "Голосовой ввод"}
          onClick={() => voiceInput.toggleListening()}
        >
          {voiceInput.listening ? <Square /> : <Mic />}
        </Button>
        <Button
          type="button"
          variant={voiceOutput.speaking ? "secondary" : "outline"}
          size="icon"
          disabled={isLoading}
          aria-pressed={voiceOutput.speaking}
          aria-label={voiceOutput.speaking ? "Остановить озвучивание" : "Озвучить текст"}
          title={voiceOutput.speaking ? "Остановить озвучивание" : "Озвучить текст"}
          onClick={() => voiceOutput.toggleSpeak(content)}
        >
          <Volume2 />
        </Button>
      </div>
      {voiceNotice ? (
        <p className="absolute left-4 right-24 bottom-14 text-xs text-muted-foreground" role="status">
          {voiceNotice}
        </p>
      ) : null}
      {sendMessageMutation.isError ? (
        <p className="absolute left-4 bottom-16 text-xs text-destructive" role="alert">
          {sendMessageMutation.error instanceof Error ? sendMessageMutation.error.message : "Не удалось отправить сообщение"}
        </p>
      ) : null}
      <Button disabled={isLoading} variant="outline" type="submit" className="absolute right-4 bottom-4 text-xs" aria-label="Отправить">
        Отправить
      </Button>
    </form>
  )
}

FormSendMessage.displayName = "FormSendMessage"
export default FormSendMessage

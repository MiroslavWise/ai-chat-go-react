import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listMessages,
  messagesFromSendResponse,
  sendMessage,
  type Message,
} from "~/lib/api"
import { queryKeys } from "~/lib/query-keys"

export function useMessages(chatId: string | null) {
  return useQuery({
    queryKey: queryKeys.messages(chatId ?? ""),
    queryFn: () => listMessages(chatId!),
    enabled: !!chatId,
    staleTime: 30_000,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      sendMessage(chatId, content),
    onSuccess: (response, { chatId }) => {
      const added = messagesFromSendResponse(response)
      queryClient.setQueryData<Message[]>(queryKeys.messages(chatId), (old) => [
        ...(old ?? []),
        ...added,
      ])
    },
  })
}

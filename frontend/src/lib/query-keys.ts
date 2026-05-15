export const queryKeys = {
  chats: () => ["chats"] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
}

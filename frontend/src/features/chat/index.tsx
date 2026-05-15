import ListMessages from "~/components/list-messages"
import FormSendMessage from "~/components/forms/form-send-message"

function Chat() {
  return (
    <section className="w-full h-full min-h-0 overflow-hidden flex flex-col">
      <ListMessages />
      <FormSendMessage />
    </section>
  )
}

Chat.displayName = "Chat"
export default Chat

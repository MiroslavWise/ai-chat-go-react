import ListMessages from "~/components/list-messages"
import FormSendMessage from "~/components/forms/form-send-message"

function Chat() {
  return (
    <section className="w-full h-screen overflow-hidden flex flex-col">
      <ListMessages />
      <FormSendMessage />
    </section>
  )
}

Chat.displayName = "Chat"
export default Chat

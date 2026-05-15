import FormSendMessage from "~/components/forms/form-send-message"

function Chat() {
  return (
    <section className="w-full h-screen overflow-hidden px-4 flex flex-col py-2">
      <FormSendMessage />
    </section>
  )
}

Chat.displayName = "Chat"
export default Chat

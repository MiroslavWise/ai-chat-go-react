import Chat from "./features/chat"
import ListChat from "./features/list-chat"

function App() {
  return (
    <main className="w-full h-screen overflow-hidden grid grid-cols-[15rem_minmax(0,1fr)] min-h-0">
      <ListChat />
      <Chat />
    </main>
  )
}

export default App

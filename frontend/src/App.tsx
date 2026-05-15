import "~/App.css"
import Chat from "./features/chat"
import ListChat from "./features/list-chat"

function App() {
  return (
    <main className="w-full grid grid-cols-[10rem_minmax(0,1fr)] h-full min-h-0">
      <ListChat />
      <Chat />
    </main>
  )
}

export default App

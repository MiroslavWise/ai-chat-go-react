import "~/App.css"
import ListChat from "./features/list-chat"

function App() {
  return (
    <main className="w-full grid grid-cols-[10rem_minmax(0,1fr)]">
      <ListChat />
    </main>
  )
}

export default App

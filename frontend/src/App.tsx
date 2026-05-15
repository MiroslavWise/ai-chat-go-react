import Chat from "./features/chat"
import ListChat from "./features/list-chat"
import ProviderMobileMenu from "./provider/provider-mobile-menu"

function App() {
  return (
    <ProviderMobileMenu>
      <main className="w-full h-screen overflow-hidden flex lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] min-h-0">
        <ListChat />
        <Chat />
      </main>
    </ProviderMobileMenu>
  )
}

export default App

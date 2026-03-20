import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ModalProvider } from "@/components/shared/ModalProvider"

function App() {
  return (
    <ModalProvider>
      <Pages />
      <Toaster />
    </ModalProvider>
  )
}

export default App 
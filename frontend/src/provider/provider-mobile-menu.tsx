import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react"

const initialState: IState = {
  isOpen: false,
  toggle: () => {},
  close: () => {},
}

const create = createContext<IState>(initialState)

export default ({ children }: PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value = useMemo(() => ({ isOpen, toggle, close }), [isOpen])

  return <create.Provider value={value}>{children}</create.Provider>
}

export const useMobileMenu = () => useContext(create)

interface IState {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

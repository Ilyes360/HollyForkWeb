import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import type { FloorPlan } from "./types"
import { useSalleStore } from "./store"

interface SalleEditionConfig {
  initialPlan: FloorPlan
  onSave: (plan: FloorPlan) => void
  onClose: () => void
}

interface SalleEditionContextValue {
  isEditing: boolean
  startEditing: (config: SalleEditionConfig) => void
  stopEditing: () => void
  onSaveRef: React.RefObject<((plan: FloorPlan) => void) | null>
  onCloseRef: React.RefObject<(() => void) | null>
}

const SalleEditionContext = createContext<SalleEditionContextValue>({
  isEditing: false,
  startEditing: () => {},
  stopEditing: () => {},
  onSaveRef: { current: null },
  onCloseRef: { current: null },
})

export function SalleEditionProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const onSaveRef = useRef<((plan: FloorPlan) => void) | null>(null)
  const onCloseRef = useRef<(() => void) | null>(null)
  const loadPlan = useSalleStore((s) => s.loadPlan)
  const reset = useSalleStore((s) => s.reset)

  const startEditing = useCallback(
    (config: SalleEditionConfig) => {
      loadPlan(config.initialPlan)
      onSaveRef.current = config.onSave
      onCloseRef.current = config.onClose
      setIsEditing(true)
    },
    [loadPlan]
  )

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    reset()
    onSaveRef.current = null
    onCloseRef.current = null
  }, [reset])

  return (
    <SalleEditionContext.Provider
      value={{ isEditing, startEditing, stopEditing, onSaveRef, onCloseRef }}
    >
      {children}
    </SalleEditionContext.Provider>
  )
}

export function useSalleEdition() {
  return useContext(SalleEditionContext)
}

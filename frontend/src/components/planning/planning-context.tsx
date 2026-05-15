import {
  createContext,
  useContext,
  useReducer,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react"
import type {
  Shift,
  Employee,
  DayOfWeek,
  ServiceType,
  ServiceConfig,
  DropServiceType,
} from "./types"
import { serviceConfig as defaultServiceConfig } from "./data"
import {
  planningReducer,
  type PlanningState,
  type PlanningAction,
} from "./reducer"

type DragEndHandler = (event: unknown) => void

interface EditionConfig {
  employees: Employee[]
  initialShifts: Shift[]
  onSave: (shifts: Shift[]) => void
  onClose: () => void
}

interface PlanningEditionContextValue {
  isEditing: boolean
  startEditing: (config: EditionConfig) => void
  stopEditing: () => void
  employees: Employee[]
  state: PlanningState
  dispatch: Dispatch<PlanningAction>
  onSaveRef: React.RefObject<((shifts: Shift[]) => void) | null>
  onCloseRef: React.RefObject<(() => void) | null>
  serviceConfig: ServiceConfig
  setServiceConfig: (config: ServiceConfig) => void
  handleDragEnd: DragEndHandler
}

const defaultState: PlanningState = { shifts: [], isDirty: false }

const PlanningEditionContext = createContext<PlanningEditionContextValue>({
  isEditing: false,
  startEditing: () => {},
  stopEditing: () => {},
  employees: [],
  state: defaultState,
  dispatch: () => {},
  onSaveRef: { current: null },
  onCloseRef: { current: null },
  serviceConfig: defaultServiceConfig,
  setServiceConfig: () => {},
  handleDragEnd: () => {},
})

export function PlanningEditionProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [state, dispatch] = useReducer(planningReducer, defaultState)
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>(
    () => defaultServiceConfig
  )
  const onSaveRef = useRef<((shifts: Shift[]) => void) | null>(null)
  const onCloseRef = useRef<(() => void) | null>(null)
  const serviceConfigRef = useRef(serviceConfig)
  // Sync ref in an effect to avoid accessing refs during render (React Compiler rule)
  useEffect(() => {
    serviceConfigRef.current = serviceConfig
  }, [serviceConfig])

  const startEditing = useCallback((config: EditionConfig) => {
    setEmployees(config.employees)
    dispatch({ type: "RESET", payload: { shifts: config.initialShifts } })
    onSaveRef.current = config.onSave
    onCloseRef.current = config.onClose
    setIsEditing(true)
  }, [])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    setEmployees([])
    onSaveRef.current = null
    onCloseRef.current = null
  }, [])

  const handleDragEnd = useCallback((event: unknown) => {
    const e = event as {
      operation: {
        source?: { id: string; data?: Record<string, unknown> }
        target?: { id: string; data?: Record<string, unknown> }
      }
    }
    const { source, target } = e.operation
    if (!source || !target) return

    const targetId = String(target.id)
    const parts = targetId.split("-")
    const targetDay = parts[0] as DayOfWeek
    const targetService = parts.slice(1).join("-") as DropServiceType

    const sourceId = String(source.id)
    const sourceData = source.data as Record<string, unknown> | undefined
    const cfg = serviceConfigRef.current

    if (sourceId.startsWith("employee-") && sourceData?.type === "employee") {
      const employee = sourceData.employee as Employee

      if (targetService === "journee") {
        dispatch({
          type: "ADD_SHIFT",
          payload: {
            employeeId: employee.id,
            day: targetDay,
            service: "midi",
            startTime: cfg.midi.start,
            endTime: cfg.midi.end,
            isFullDay: true,
          },
        })
        dispatch({
          type: "ADD_SHIFT",
          payload: {
            employeeId: employee.id,
            day: targetDay,
            service: "soir",
            startTime: cfg.soir.start,
            endTime: cfg.soir.end,
            isFullDay: true,
          },
        })
      } else {
        const svcCfg = cfg[targetService as ServiceType]
        dispatch({
          type: "ADD_SHIFT",
          payload: {
            employeeId: employee.id,
            day: targetDay,
            service: targetService as ServiceType,
            startTime: svcCfg.start,
            endTime: svcCfg.end,
            isFullDay: false,
          },
        })
      }
    } else if (sourceId.startsWith("shift-") && sourceData?.type === "shift") {
      const shift = sourceData.shift as Shift
      if (targetService === "journee") return

      dispatch({
        type: "MOVE_SHIFT",
        payload: {
          shiftId: shift.id,
          toDay: targetDay,
          toService: targetService as ServiceType,
        },
      })
    }
  }, [])

  return (
    <PlanningEditionContext.Provider
      value={{
        isEditing,
        startEditing,
        stopEditing,
        employees,
        state,
        dispatch,
        onSaveRef,
        onCloseRef,
        serviceConfig,
        setServiceConfig,
        handleDragEnd,
      }}
    >
      {children}
    </PlanningEditionContext.Provider>
  )
}

export function usePlanningEdition() {
  return useContext(PlanningEditionContext)
}

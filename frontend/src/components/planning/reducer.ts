import type { Shift, DayOfWeek, ServiceType } from "./types"

export interface PlanningState {
  shifts: Shift[]
  isDirty: boolean
}

export type PlanningAction =
  | {
      type: "ADD_SHIFT"
      payload: {
        employeeId: string
        day: DayOfWeek
        service: ServiceType
        startTime: string
        endTime: string
        isFullDay: boolean
      }
    }
  | { type: "REMOVE_SHIFT"; payload: { shiftId: string } }
  | {
      type: "MOVE_SHIFT"
      payload: { shiftId: string; toDay: DayOfWeek; toService: ServiceType }
    }
  | {
      type: "UPDATE_SHIFT_TIME"
      payload: { shiftId: string; startTime: string; endTime: string }
    }
  | { type: "RESET"; payload: { shifts: Shift[] } }

export function planningReducer(
  state: PlanningState,
  action: PlanningAction
): PlanningState {
  switch (action.type) {
    case "ADD_SHIFT": {
      const { employeeId, day, service, startTime, endTime, isFullDay } =
        action.payload
      // Check for duplicate
      const exists = state.shifts.some(
        (s) =>
          s.employeeId === employeeId &&
          s.day === day &&
          s.service === service
      )
      if (exists) return state

      const newShift: Shift = {
        id: crypto.randomUUID(),
        employeeId,
        day,
        service,
        startTime,
        endTime,
        isFullDay,
      }
      return {
        shifts: [...state.shifts, newShift],
        isDirty: true,
      }
    }

    case "REMOVE_SHIFT": {
      const shift = state.shifts.find((s) => s.id === action.payload.shiftId)
      if (!shift) return state

      let newShifts: Shift[]
      if (shift.isFullDay) {
        // Remove both midi and soir for this employee+day
        newShifts = state.shifts.filter(
          (s) =>
            !(
              s.employeeId === shift.employeeId &&
              s.day === shift.day &&
              s.isFullDay
            )
        )
      } else {
        newShifts = state.shifts.filter(
          (s) => s.id !== action.payload.shiftId
        )
      }
      return { shifts: newShifts, isDirty: true }
    }

    case "MOVE_SHIFT": {
      const { shiftId, toDay, toService } = action.payload
      const shift = state.shifts.find((s) => s.id === shiftId)
      if (!shift) return state

      // Check for duplicate at destination
      const exists = state.shifts.some(
        (s) =>
          s.employeeId === shift.employeeId &&
          s.day === toDay &&
          s.service === toService &&
          s.id !== shiftId
      )
      if (exists) return state

      const newShifts = state.shifts.map((s) =>
        s.id === shiftId
          ? { ...s, day: toDay, service: toService, isFullDay: false }
          : s
      )
      return { shifts: newShifts, isDirty: true }
    }

    case "UPDATE_SHIFT_TIME": {
      const { shiftId, startTime, endTime } = action.payload
      const newShifts = state.shifts.map((s) =>
        s.id === shiftId ? { ...s, startTime, endTime } : s
      )
      return { shifts: newShifts, isDirty: true }
    }

    case "RESET":
      return { shifts: action.payload.shifts, isDirty: false }

    default:
      return state
  }
}

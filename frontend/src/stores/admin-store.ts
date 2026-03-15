import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Establishment,
  Employee,
  Role,
  ServiceConfig,
  StorageZone,
} from "./admin-types"
import { POSITION_DISPLAY_MAP } from "./admin-types"
import type {
  Employee as PlanningEmployee,
  ServiceConfig as PlanningServiceConfig,
} from "@/components/planning/types"
import { mockEstablishments, mockEmployees, mockRoles } from "./admin-mock-data"

interface AdminStore {
  groupName: string
  establishments: Establishment[]
  employees: Employee[]
  roles: Role[]
  currentEstablishmentId: string

  // Establishment CRUD
  addEstablishment: (establishment: Establishment) => void
  updateEstablishment: (id: string, data: Partial<Establishment>) => void
  removeEstablishment: (id: string) => void

  // Employee CRUD
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
  removeEmployee: (id: string) => void

  // Group
  setGroupName: (name: string) => void

  // Current establishment
  setCurrentEstablishment: (id: string) => void

  // Reset
  reset: () => void

  // Cross-page selectors
  getActiveEstablishment: () => Establishment | undefined
  getServiceConfigs: (id?: string) => ServiceConfig[]
  getStorageZones: (id?: string) => StorageZone[]
  getEmployeesByEstablishment: (id?: string) => Employee[]
  getPlanningEmployees: () => PlanningEmployee[]
  getPlanningServiceConfig: () => PlanningServiceConfig
  getTotalCapacity: () => number
}

const initialState = {
  groupName: "Holly Fork",
  establishments: mockEstablishments,
  employees: mockEmployees,
  roles: mockRoles,
  currentEstablishmentId: "est-1",
}


export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Establishment CRUD ---
      addEstablishment: (establishment) =>
        set((state) => ({
          establishments: [...state.establishments, establishment],
        })),

      updateEstablishment: (id, data) =>
        set((state) => ({
          establishments: state.establishments.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
          ),
        })),

      removeEstablishment: (id) =>
        set((state) => ({
          establishments: state.establishments.filter((e) => e.id !== id),
          employees: state.employees.filter((e) => e.establishmentId !== id),
          currentEstablishmentId:
            state.currentEstablishmentId === id
              ? state.establishments.find((e) => e.id !== id)?.id ?? ""
              : state.currentEstablishmentId,
        })),

      // --- Employee CRUD ---
      addEmployee: (employee) =>
        set((state) => ({
          employees: [...state.employees, employee],
        })),

      updateEmployee: (id, data) =>
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
          ),
        })),

      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        })),

      // --- Group ---
      setGroupName: (name) => set({ groupName: name }),

      // --- Current establishment ---
      setCurrentEstablishment: (id) =>
        set({ currentEstablishmentId: id }),

      // --- Reset ---
      reset: () => set(initialState),

      // --- Cross-page selectors ---
      getActiveEstablishment: () => {
        const { establishments, currentEstablishmentId } = get()
        return establishments.find((e) => e.id === currentEstablishmentId)
      },

      getServiceConfigs: (id?) => {
        const { establishments, currentEstablishmentId } = get()
        const estId = id ?? currentEstablishmentId
        const est = establishments.find((e) => e.id === estId)
        return est?.services ?? []
      },

      getStorageZones: (id?) => {
        const { establishments, currentEstablishmentId } = get()
        const estId = id ?? currentEstablishmentId
        const est = establishments.find((e) => e.id === estId)
        return est?.storageZones ?? []
      },

      getEmployeesByEstablishment: (id?) => {
        const { employees, currentEstablishmentId } = get()
        const estId = id ?? currentEstablishmentId
        return employees.filter((e) => e.establishmentId === estId)
      },

      getPlanningEmployees: (): PlanningEmployee[] => {
        const employees = get().getEmployeesByEstablishment()
        return employees
          .filter((e) => e.accountStatus === "active")
          .map((e) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            role: POSITION_DISPLAY_MAP[e.position],
            department: e.department,
            contractHours: e.weeklyHours,
            avatarColor: e.avatarColor,
          }))
      },

      getPlanningServiceConfig: (): PlanningServiceConfig => {
        const services = get().getServiceConfigs()
        const midi = services.find((s) => s.name === "Midi")
        const soir = services.find((s) => s.name === "Soir")
        const journee = services.find((s) => s.name === "Journée")
        return {
          midi: { start: midi?.startTime ?? "10:00", end: midi?.endTime ?? "15:00" },
          soir: { start: soir?.startTime ?? "18:00", end: soir?.endTime ?? "23:00" },
          journee: { start: journee?.startTime ?? "10:00", end: journee?.endTime ?? "23:00" },
        }
      },

      getTotalCapacity: () => {
        const est = get().getActiveEstablishment()
        return est?.totalCapacity ?? 48
      },
    }),
    {
      name: "holly-fork-admin",
      version: 2,
      migrate: () => ({
        ...initialState,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<typeof initialState> | undefined
        // If persisted data has empty arrays (stale cache), re-seed with mock data
        const establishments =
          persisted?.establishments && persisted.establishments.length > 0
            ? persisted.establishments
            : initialState.establishments
        const employees =
          persisted?.employees && persisted.employees.length > 0
            ? persisted.employees
            : initialState.employees
        const roles =
          persisted?.roles && persisted.roles.length > 0
            ? persisted.roles
            : initialState.roles
        return {
          ...currentState,
          ...persisted,
          groupName: persisted?.groupName || initialState.groupName,
          establishments,
          employees,
          roles,
          currentEstablishmentId:
            persisted?.currentEstablishmentId || initialState.currentEstablishmentId,
        }
      },
    }
  )
)

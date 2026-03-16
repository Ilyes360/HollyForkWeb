import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface GettingStartedTask {
  id: string
  label: string
  description: string
  to: string
  completed: boolean
}

interface GettingStartedStore {
  tasks: GettingStartedTask[]
  dismissed: boolean
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
  dismiss: () => void
  reset: () => void
}

const initialTasks: GettingStartedTask[] = [
  {
    id: "restaurant-profile",
    label: "Complétez votre restaurant",
    description: "Horaires, couverts, équipe",
    to: "/settings",
    completed: true, // Done via onboarding
  },
  {
    id: "floor-plan",
    label: "Configurez votre salle",
    description: "Ajoutez tables et zones",
    to: "/salle",
    completed: false,
  },
  {
    id: "team-member",
    label: "Ajoutez un employé",
    description: "Serveurs, cuisine, managers",
    to: "/admin",
    completed: false,
  },
  {
    id: "first-service",
    label: "Créez votre premier service",
    description: "Planifiez un service midi ou soir",
    to: "/planning",
    completed: false,
  },
  {
    id: "first-reservation",
    label: "Acceptez une réservation",
    description: "Créez ou acceptez une résa",
    to: "/reservations",
    completed: false,
  },
]

export const useGettingStartedStore = create<GettingStartedStore>()(
  persist(
    (set) => ({
      tasks: initialTasks,
      dismissed: false,
      completeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: true } : t
          ),
        })),
      uncompleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: false } : t
          ),
        })),
      dismiss: () => set({ dismissed: true }),
      reset: () => set({ tasks: initialTasks, dismissed: false }),
    }),
    {
      name: "holly-fork-getting-started",
      version: 2,
      migrate: () => ({ tasks: initialTasks, dismissed: false }),
      merge: (_persisted, current) => ({
        ...current,
        tasks: initialTasks,
        dismissed: false,
      }),
    }
  )
)

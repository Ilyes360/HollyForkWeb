import { create } from "zustand"
import { persist } from "zustand/middleware"
import { GETTING_STARTED } from "@/lib/copy/onboarding"

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

type TaskId = keyof typeof GETTING_STARTED.tasks

const TASK_ROUTES: Record<TaskId, string> = {
  "restaurant-profile": "/settings",
  "floor-plan": "/salle",
  "team-member": "/admin",
  "first-service": "/planning",
  "first-reservation": "/reservations",
}

const TASK_DEFAULTS: Record<TaskId, boolean> = {
  "restaurant-profile": true,
  "floor-plan": false,
  "team-member": false,
  "first-service": false,
  "first-reservation": false,
}

const initialTasks: GettingStartedTask[] = (
  Object.keys(GETTING_STARTED.tasks) as TaskId[]
).map((id) => ({
  id,
  label: GETTING_STARTED.tasks[id].label,
  description: GETTING_STARTED.tasks[id].description,
  to: TASK_ROUTES[id],
  completed: TASK_DEFAULTS[id],
}))

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
      name: "holy-fork-getting-started",
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

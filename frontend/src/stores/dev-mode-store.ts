import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthUser } from "@/api/auth/types"

export const DEV_MOCK_USER: AuthUser = {
  id: 1,
  username: "demo",
  email: "demo@hollyfork.fr",
  firstName: "Marie",
  lastName: "Dupont",
  employeeId: 1,
  employeeName: "Marie Dupont",
  employeeType: "Gérant",
  employeeTypeId: 1,
  restaurantId: 1,
  restaurantName: "Holly Fork — Marais",
}

export const DEV_MOCK_RESTAURANTS = [
  { restaurantId: 1, name: "Holly Fork — Marais", address: "12 rue des Rosiers, Paris 4e" },
  { restaurantId: 2, name: "Holly Fork — Opéra", address: "8 bd des Capucines, Paris 9e" },
]

type DevModeState = {
  isDevMode: boolean
  toggle: () => void
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set, get) => ({
      isDevMode: false,
      toggle: () => set({ isDevMode: !get().isDevMode }),
    }),
    { name: "holly-fork-dev-mode" },
  ),
)

/**
 * Call this after toggling dev mode to apply side effects.
 * Kept separate from the store to avoid circular imports.
 */
export function applyDevModeTransition(isDevMode: boolean) {
  // Lazy imports to break circular dependency
  import("@/stores/auth-store").then(({ useAuthStore }) => {
    import("@/api/client").then(({ setTokens, clearTokens }) => {
      import("@/api/query-client").then(({ queryClient }) => {
        if (isDevMode) {
          setTokens("dev-mock-access-token", "dev-mock-refresh-token")
          useAuthStore.getState().setUser(DEV_MOCK_USER)
        } else {
          clearTokens()
          useAuthStore.getState().clearUser()
        }
        queryClient.clear()
      })
    })
  })
}

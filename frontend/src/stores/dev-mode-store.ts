import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthUser } from "@/api/auth/types"

export const DEV_MOCK_USER: AuthUser = {
  id: 1,
  username: "demo",
  email: "demo@holyfork.fr",
  firstName: "Marie",
  lastName: "Dupont",
  employeeId: 1,
  employeeName: "Marie Dupont",
  employeeType: "Gérant",
  employeeTypeId: 1,
  restaurantId: 1,
  restaurantName: "Holy Fork — Marais",
}

export const DEV_MOCK_RESTAURANTS = [
  {
    restaurantId: 1,
    name: "Holy Fork — Marais",
    address: "12 rue des Rosiers, Paris 4e",
  },
  {
    restaurantId: 2,
    name: "Holy Fork — Opéra",
    address: "8 bd des Capucines, Paris 9e",
  },
]

type DevModeState = {
  isDevMode: boolean
  toggle: () => void
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set, get) => ({
      // In production, always force false; in dev, start false (persist middleware restores saved value)
      isDevMode: false,
      toggle: import.meta.env.DEV
        ? () => {
            const next = !get().isDevMode
            set({ isDevMode: next })

            // Start or stop MSW worker on toggle (real browser only — skip in jsdom/Node)
            if (
              typeof navigator !== "undefined" &&
              "serviceWorker" in navigator
            ) {
              if (next) {
                import("@/mocks/browser").then(({ worker }) => {
                  worker.start({ onUnhandledRequest: "bypass" })
                })
              } else {
                import("@/mocks/browser").then(({ worker }) => {
                  worker.stop()
                })
              }
            }
          }
        : () => {
            // No-op in production
          },
    }),
    {
      name: "holy-fork-dev-mode",
      // In production, override any persisted isDevMode to false
      ...(import.meta.env.DEV
        ? {}
        : {
            merge: (_persistedState: unknown, currentState: DevModeState) =>
              currentState,
          }),
    }
  )
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

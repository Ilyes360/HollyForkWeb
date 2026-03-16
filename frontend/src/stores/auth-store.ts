import { create } from "zustand"
import { persist } from "zustand/middleware"
import { MOCK_MODE } from "@/api/client"
import type { AuthUser } from "@/api/auth/types"

const MOCK_USER: AuthUser = {
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

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: MOCK_MODE ? MOCK_USER : null,
      isAuthenticated: MOCK_MODE,

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearUser: () =>
        MOCK_MODE
          ? set({ user: MOCK_USER, isAuthenticated: true })
          : set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "holly-fork-auth",
      ...(MOCK_MODE && {
        merge: () => ({
          user: MOCK_USER,
          isAuthenticated: true,
          setUser: () => {},
          clearUser: () => {},
        }),
      }),
    },
  ),
)

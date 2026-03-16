import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useAuthStore } from "@/stores/auth-store"
import { useRestaurants } from "@/api/restaurants/queries"
import { MOCK_MODE } from "@/api/client"

/**
 * Minimal store for tracking which restaurant is currently selected.
 * Stores the numeric restaurant ID from the backend.
 */
type ActiveRestaurantStore = {
  selectedId: number | null
  setSelectedId: (id: number | null) => void
}

export const useActiveRestaurantStore = create<ActiveRestaurantStore>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelectedId: (id) => set({ selectedId: id }),
    }),
    { name: "holly-fork-active-restaurant" },
  ),
)

const MOCK_RESTAURANTS = [
  { restaurantId: 1, name: "Holly Fork — Marais", address: "12 rue des Rosiers, Paris 4e" },
  { restaurantId: 2, name: "Holly Fork — Opéra", address: "8 bd des Capucines, Paris 9e" },
]

/**
 * Hook combining the selected restaurant ID with auth context.
 *
 * Priority:
 * 1. If a valid selectedId is persisted and exists in the restaurant list → use it
 * 2. Otherwise, fallback to the user's own restaurantId from auth
 * 3. Otherwise, fallback to the first restaurant in the list
 */
export function useActiveRestaurant() {
  const user = useAuthStore((s) => s.user)
  const { data: restaurants, isLoading } = useRestaurants(!MOCK_MODE && !!user)
  const selectedId = useActiveRestaurantStore((s) => s.selectedId)
  const setSelectedId = useActiveRestaurantStore((s) => s.setSelectedId)

  const list = MOCK_MODE ? MOCK_RESTAURANTS : (restaurants ?? [])

  // Check if selectedId is valid (exists in the loaded list)
  const selectedIsValid =
    selectedId !== null && list.some((r) => r.restaurantId === selectedId)

  let effectiveId: number | null
  if (selectedIsValid) {
    effectiveId = selectedId
  } else if (user?.restaurantId) {
    effectiveId = user.restaurantId
  } else if (list.length > 0) {
    effectiveId = list[0].restaurantId
  } else {
    effectiveId = null
  }

  return {
    /** Currently active restaurant ID. `null` only if no restaurants exist. */
    restaurantId: effectiveId,
    /** All restaurants accessible to this user */
    restaurants: list,
    /** Whether restaurants are still loading */
    isLoading: MOCK_MODE ? false : isLoading,
    /** Change the active restaurant. Pass `null` for "Tous les restaurants". */
    setRestaurantId: setSelectedId,
  }
}

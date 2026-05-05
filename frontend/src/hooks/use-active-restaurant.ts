import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useAuthStore } from "@/stores/auth-store"
import { useDevModeStore, DEV_MOCK_RESTAURANTS } from "@/stores/dev-mode-store"
import { useRestaurants } from "@/api/restaurants/queries"

/**
 * Minimal store for tracking which restaurant is currently selected.
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

/**
 * Hook combining the selected restaurant ID with auth context.
 * In dev mode, uses mock restaurants. In user mode, fetches from API.
 */
export function useActiveRestaurant() {
  const user = useAuthStore((s) => s.user)
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const { data: restaurants, isLoading } = useRestaurants(!isDevMode && !!user)
  const selectedId = useActiveRestaurantStore((s) => s.selectedId)
  const setSelectedId = useActiveRestaurantStore((s) => s.setSelectedId)

  const list = isDevMode ? DEV_MOCK_RESTAURANTS : (restaurants ?? [])

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
    restaurantId: effectiveId,
    restaurants: list,
    isLoading: isDevMode ? false : isLoading,
    setRestaurantId: setSelectedId,
  }
}

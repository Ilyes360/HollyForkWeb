import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useAuthStore } from "@/stores/auth-store"
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
 * Fetches restaurants from API.
 */
export function useActiveRestaurant() {
  const user = useAuthStore((s) => s.user)
  const { data: restaurants, isLoading } = useRestaurants(!!user)
  const selectedId = useActiveRestaurantStore((s) => s.selectedId)
  const setSelectedId = useActiveRestaurantStore((s) => s.setSelectedId)

  const list = restaurants ?? []

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
    isLoading,
    setRestaurantId: setSelectedId,
  }
}

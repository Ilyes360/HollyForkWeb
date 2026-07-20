import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../client"
import type { UserProfile, RestaurantEmployeesResponse } from "./types"

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  restaurantEmployees: (deviceToken: string) =>
    [...authKeys.all, "restaurant-employees", deviceToken] as const,
}

/**
 * Récupère le profil de l'utilisateur connecté.
 * Activé uniquement si un token existe.
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => apiGet<UserProfile>("auth/profile/"),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/**
 * Récupère la liste des employés du restaurant associé au device token.
 */
export function useRestaurantEmployees(deviceToken: string | null) {
  return useQuery({
    queryKey: authKeys.restaurantEmployees(deviceToken!),
    queryFn: () =>
      apiGet<RestaurantEmployeesResponse>("auth/restaurant-employees/", {
        deviceToken: deviceToken!,
      }),
    enabled: !!deviceToken,
    staleTime: 30_000,
    retry: false,
  })
}

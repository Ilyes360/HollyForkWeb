import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../client"
import type { UserProfile } from "./types"

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
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

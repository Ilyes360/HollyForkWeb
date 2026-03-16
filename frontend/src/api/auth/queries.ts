import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../client"
import type { UserProfile, MfaStatusResponse } from "./types"

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  mfaStatus: () => [...authKeys.all, "mfa-status"] as const,
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
    staleTime: 5 * 60 * 1000, // 5 min — le profil change rarement
    retry: false, // pas de retry sur 401 (= pas connecté)
  })
}

/**
 * Vérifie si le MFA est activé pour l'utilisateur connecté.
 */
export function useMfaStatus(enabled = true) {
  return useQuery({
    queryKey: authKeys.mfaStatus(),
    queryFn: () => apiGet<MfaStatusResponse>("auth/mfa/status/"),
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}

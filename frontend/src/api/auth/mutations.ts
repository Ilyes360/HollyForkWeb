import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost } from "../client"
import { setTokens, clearTokens } from "../client"
import { toAuthUser } from "./types"
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutResponse,
} from "./types"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Login par email + password.
 */
export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiPost<LoginResponse>("auth/login/", data),
    onSuccess: (result) => {
      setTokens(result.accessToken, result.refreshToken)
      setUser(toAuthUser(result))
    },
  })
}

/**
 * Inscription d'un nouvel utilisateur.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiPost<RegisterResponse>("auth/register/", data),
  })
}

/**
 * Déconnexion.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const clearUser = useAuthStore((s) => s.clearUser)

  return useMutation({
    mutationFn: () => apiPost<LogoutResponse>("auth/logout/"),
    onSettled: () => {
      clearTokens()
      clearUser()
      queryClient.clear()
    },
  })
}

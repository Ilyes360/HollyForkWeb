import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost } from "../client"
import { setTokens, clearTokens } from "../client"
import { authKeys } from "./queries"
import { toAuthUser } from "./types"
import type {
  LoginRequest,
  LoginResult,
  RegisterRequest,
  RegisterResponse,
  VerifyMfaRequest,
  LoginResponse,
  MfaSetupResponse,
  LogoutResponse,
} from "./types"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Login par email + password.
 * Gère les deux cas : login direct et MFA required.
 */
export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiPost<LoginResult>("auth/login/", data),
    onSuccess: (result) => {
      // Si MFA requis, on ne stocke pas de token — le composant gère le flow
      if ("requiresMfa" in result && result.requiresMfa) return

      const loginData = result as LoginResponse
      setTokens(loginData.accessToken, loginData.refreshToken)
      setUser(toAuthUser(loginData))
    },
  })
}

/**
 * Vérification MFA après login.
 * Retourne les tokens JWT si le code est valide.
 */
export function useVerifyMfa() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: VerifyMfaRequest) =>
      apiPost<LoginResponse>("auth/verify-mfa/", data),
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
      // Toujours nettoyer, même si l'appel API échoue
      clearTokens()
      clearUser()
      queryClient.clear()
    },
  })
}

/**
 * Setup MFA — génère le secret et l'URL QR code.
 */
export function useMfaSetup() {
  return useMutation({
    mutationFn: () => apiPost<MfaSetupResponse>("auth/mfa/setup/"),
  })
}

/**
 * Confirmation MFA — active le MFA avec un code valide.
 */
export function useMfaConfirm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) =>
      apiPost<{ detail: string }>("auth/mfa/confirm/", { code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.mfaStatus() })
    },
  })
}

/**
 * Désactivation MFA.
 */
export function useMfaDisable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (password: string) =>
      apiPost<{ detail: string }>("auth/mfa/disable/", { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.mfaStatus() })
    },
  })
}

/**
 * Suppression du compte.
 */
export function useDeleteAccount() {
  const clearUser = useAuthStore((s) => s.clearUser)

  return useMutation({
    mutationFn: () => apiPost<{ message: string }>("auth/delete-account/"),
    onSuccess: () => {
      clearTokens()
      clearUser()
    },
  })
}

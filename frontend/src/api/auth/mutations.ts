import { useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiPost, setTokens, clearTokens, setDeviceToken } from "../client"
import { toAuthUser, toAuthUserFromQuickLogin } from "./types"
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutResponse,
  DeviceLoginRequest,
  DeviceLoginResponse,
  QuickLoginRequest,
  QuickLoginResponse,
} from "./types"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Login par email + password.
 */
export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutationWithDefaults({
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
  return useMutationWithDefaults({
    mutationFn: (data: RegisterRequest) =>
      apiPost<RegisterResponse>("auth/register/", data),
  })
}

/**
 * Device login — Step 1: associate iPad to restaurant.
 */
export function useDeviceLogin() {
  return useMutationWithDefaults({
    mutationFn: (data: DeviceLoginRequest) =>
      apiPost<DeviceLoginResponse>("auth/device-login/", data),
    onSuccess: (result) => {
      setDeviceToken(result.deviceToken)
    },
  })
}

/**
 * Quick login — Step 3: employee PIN login.
 */
export function useQuickLogin() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutationWithDefaults({
    mutationFn: (data: QuickLoginRequest) =>
      apiPost<QuickLoginResponse>("auth/quick-login/", data),
    onSuccess: (result) => {
      setTokens(result.accessToken, result.refreshToken)
      setUser(toAuthUserFromQuickLogin(result))
    },
  })
}

/**
 * Déconnexion.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const clearUser = useAuthStore((s) => s.clearUser)

  return useMutationWithDefaults({
    mutationFn: () => apiPost<LogoutResponse>("auth/logout/"),
    onSuccess: () => {
      clearTokens()
      clearUser()
      queryClient.clear()
    },
    onError: () => {
      // Even if the API call fails, clean up client-side state
      // to prevent the user from being stuck in a half-logged-out state
      clearTokens()
      clearUser()
      queryClient.clear()
    },
  })
}

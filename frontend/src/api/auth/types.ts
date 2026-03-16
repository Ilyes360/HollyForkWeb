/**
 * Types pour l'API d'authentification.
 * Correspondent aux réponses du backend Django (déjà en camelCase après transformation).
 */

// ─── Login (email + password) ────────────────────────────────────────────────

export type LoginRequest = {
  email: string
  password: string
}

/** Réponse login standard (sans MFA) */
export type LoginResponse = {
  message: string
  accessToken: string
  token: string
  refreshToken: string
  userId: number
  username: string
  email: string
  firstName: string
  lastName: string
  employeeId: number | null
  employeeName: string | null
  employeeFirstName: string | null
  employeeLastName: string | null
  employeeType: string | null
  employeeTypeId: number | null
  restaurantId: number | null
  restaurantName: string | null
}

/** Réponse login quand MFA est requis */
export type LoginMfaRequiredResponse = {
  requiresMfa: true
  tempToken: string
  email: string
  firstName: string
  lastName: string
}

/** Union des deux réponses possibles au login */
export type LoginResult = LoginResponse | LoginMfaRequiredResponse

export function isMfaRequired(
  result: LoginResult,
): result is LoginMfaRequiredResponse {
  return "requiresMfa" in result && result.requiresMfa === true
}

// ─── Register ────────────────────────────────────────────────────────────────

export type RegisterRequest = {
  username: string
  email: string
  password: string
  password2: string
  firstName?: string
  lastName?: string
  employeeFirstName: string
  employeeLastName: string
  pinCode: string
  typeEmployeId: number
  restaurantId: number
}

export type RegisterResponse = {
  message: string
  idUser: number
  username: string
  email: string
  firstName: string
  lastName: string
  verificationToken: string | null
  nextStep: string | null
  employeeId: number | null
  employeeName: string | null
  employeeFirstName: string | null
  employeeLastName: string | null
  employeeType: string | null
  employeeTypeId: number | null
}

// ─── MFA ─────────────────────────────────────────────────────────────────────

export type VerifyMfaRequest = {
  tempToken: string
  code: string
}

export type MfaSetupResponse = {
  secret: string
  otpauthUrl: string
}

export type MfaStatusResponse = {
  mfaEnabled: boolean
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

export type RefreshRequest = {
  refresh: string
}

export type RefreshResponse = {
  access: string
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  dateJoined: string
  isActive: boolean
  mfaEnabled: boolean
  employeeId?: number
  employeeName?: string
  employeeFirstName?: string
  employeeLastName?: string
  employeeType?: string
  employeeTypeId?: number
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export type LogoutResponse = {
  message: string
}

// ─── Mapping helper ─────────────────────────────────────────────────────────

/**
 * Mappe une LoginResponse vers un AuthUser pour le store Zustand.
 * Note : `LoginResponse.token` est un alias legacy de `accessToken` (ne pas utiliser).
 */
export function toAuthUser(data: LoginResponse): AuthUser {
  return {
    id: data.userId,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    employeeType: data.employeeType,
    employeeTypeId: data.employeeTypeId,
    restaurantId: data.restaurantId,
    restaurantName: data.restaurantName,
  }
}

// ─── User session (ce qu'on stocke côté front) ──────────────────────────────

export type AuthUser = {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  employeeId: number | null
  employeeName: string | null
  employeeType: string | null
  employeeTypeId: number | null
  restaurantId: number | null
  restaurantName: string | null
}

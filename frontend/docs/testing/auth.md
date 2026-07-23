# Auth — Detail couverture

> Sous-features : 1 (Device Login), 2a (Auth Login/Register), 2b (Auth Guards)

## 1. Device Login (Critique)

### Hooks (api/auth/)

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useDeviceLogin() | ✅ | 3 | features/device-login/hooks.test.tsx |
| useQuickLogin() | ✅ | 3 | features/device-login/hooks.test.tsx |
| useRestaurantEmployees() | ✅ | 3 | features/device-login/hooks.test.tsx |

### Composants

| Composant | C2 | C4 a11y | Tests | Fichier test |
|-----------|:--:|:-------:|-------|-------------|
| DeviceSetupStep | ✅ | ✅ | 7 | features/device-login/steps.test.tsx |
| EmployeeSelectStep | ✅ | ✅ | 7 | features/device-login/steps.test.tsx |
| PinLoginStep | ✅ | ✅ | 6 | features/device-login/steps.test.tsx |
| PinPad | ✅ | ✅ | 14 | features/device-login/pin-pad.test.tsx |

### Mapping / Utils

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| toAuthUser() | ❌ | — | — |
| toAuthUserFromQuickLogin() | ❌ | — | — |

---

## 2a. Auth Login/Register (Critique)

### Hooks (api/auth/)

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useLogin() | ✅ | 1 | features/auth/hooks.test.tsx |
| useRegister() | ✅ | 1 | features/auth/hooks.test.tsx |
| useLogout() | ✅ | 1 | features/auth/hooks.test.tsx |
| useProfile() | ❌ | — | — |

### Pages (composants inline — pas de composants extraits)

| Page | C2 | C4 a11y | Notes |
|------|:--:|:-------:|-------|
| LoginPage | ❌ | ❌ | Formulaire inline, pas extrait |
| RegisterPage | ❌ | ❌ | Formulaire inline |
| ForgotPasswordPage | ❌ | ❌ | Formulaire inline |

### Stores

| Store | Teste | Tests | Fichier test |
|-------|:-----:|-------|-------------|
| useAuthStore | ✅ | 5 | integration/auth/auth-store.test.ts |

---

## 2b. Auth Guards (Critique)

### Guards

| Guard | Teste | Tests | Fichier test |
|-------|:-----:|-------|-------------|
| AuthGuard | ❌ | — | — |
| GuestGuard | ❌ | — | — |
| PermissionGuard | ❌ | — | — |

### Hooks associes

| Hook | C1 | Notes |
|------|:--:|-------|
| usePermissions() | ❌ | Resolution permissions RBAC |
| useActiveRestaurant() | ❌ | Contexte restaurantId |

---

## Hors-feature (integration auth)

| Fichier test | Type | Tests |
|-------------|------|-------|
| integration/auth/logout.test.tsx | Integration | Logout flow |
| integration/dev-mode/dev-mode.test.ts | Unit | Dev mode store |
| integration/dev-mode/dev-mode-guard.test.tsx | Integration | Guard dev mode |

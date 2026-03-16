# Prompt : Intégration Auth — Branchement réel, sécurité, et permissions

## CONTEXTE PROJET

Holly Fork — dashboard admin SaaS de gestion de restaurant multi-établissements.
Stack front : React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui.
Backend : Django REST Framework, SimpleJWT, drf-spectacular (Swagger à `/api/docs/`).
Architecture multi-tenant : chaque ressource est scopée à un restaurant.
Rôles métier : Gérant, Chef, Responsable salle, Serveur.

**Ampleur du backend** : ~193 endpoints, 30 modèles, 15 apps Django. L'auth est le socle — si elle est mal posée, tout le reste s'écroule.

## ÉTAT ACTUEL DU CODE (à date)

### Ce qui est fait et fonctionnel

- `frontend/src/api/client.ts` — Client HTTP ky avec injection Bearer, refresh automatique sur 401, mutex anti-concurrence, case-transform snake/camel automatique.
- `frontend/src/api/auth/types.ts` — Types complets : LoginRequest, LoginResponse, LoginMfaRequiredResponse, RegisterRequest, VerifyMfaRequest, UserProfile, AuthUser, etc.
- `frontend/src/api/auth/mutations.ts` — Hooks TanStack Query : useLogin, useVerifyMfa, useRegister, useLogout, useMfaSetup, useMfaConfirm, useMfaDisable, useDeleteAccount.
- `frontend/src/api/auth/queries.ts` — useProfile (5min stale), useMfaStatus (10min stale), query keys factory.
- `frontend/src/api/query-client.ts` — QueryClient configuré (staleTime 2min, gcTime 10min, retry 1).
- `frontend/src/stores/auth-store.ts` — Zustand store persisté (holly-fork-auth) avec user, isAuthenticated, setUser, clearUser.
- `frontend/src/guards/auth-guard.tsx` — Guard basique (check user + loading state).
- `frontend/src/pages/public/login.tsx` et `register.tsx` — Pages existantes.

### Ce qui est cassé ou pas branché

1. **`QueryClientProvider` absent de `main.tsx`** — TanStack Query ne fonctionne pas. Tous les hooks (useLogin, useProfile, etc.) crashent à l'exécution.
2. **Les pages login/register utilisent `contexts/auth-context.tsx`** — un mock local qui simule l'auth avec localStorage. Les vrais hooks API (useLogin, useRegister) ne sont pas appelés.
3. **Les guards sont commentés dans `router.tsx`** — toutes les pages sont accessibles sans auth.
4. **`auth-guard.tsx` dépend de `useAuth()` (mock context)** au lieu de `useAuthStore` (Zustand) — il ne verra jamais le vrai user.
5. **Double source de vérité** — AuthContext (mock) ET useAuthStore (Zustand) stockent indépendamment un "user". Les composants ne savent pas lequel utiliser.

### Problèmes de sécurité

6. **Les deux tokens (access + refresh) sont en localStorage** — vulnérable XSS. Un script injecté peut voler le refresh token et obtenir des accès persistants. Le prompt original recommandait httpOnly cookie (Option A) mais l'implémentation a choisi localStorage (Option C, la moins sécurisée).
7. **Le CSRF token n'est pas géré** — le backend expose `GET /api/csrf-token/` mais le client ne l'utilise pas. Si le backend Django a CsrfViewMiddleware actif, les POST sans token CSRF échoueront.
8. **Le refresh silencieux au démarrage n'existe pas** — aucune vérification au boot que le token stocké est encore valide.

### Problèmes de qualité de code

9. **Mapping user dupliqué** — dans `useLogin()` et `useVerifyMfa()`, le même bloc de mapping `setUser({ id: loginData.userId, ... })` est copié-collé (10 champs identiques). Extraire une fonction `toAuthUser(response: LoginResponse): AuthUser`.
10. **`LoginResponse` a un champ `token` ET `accessToken`** — doublon. Clarifier lequel est le bon avec le backend et supprimer l'autre.
11. **Pas de validation Zod sur les réponses API** — les types sont des `type` purs, le runtime ne vérifie rien. Si le backend renvoie un format inattendu, l'app crashe silencieusement.
12. **`apiDelete<T>` appelle `.json()` systématiquement** — si le backend renvoie 204 No Content, ça crash.

### Problème architectural critique (non traité dans l'ancien prompt)

13. **Pas de notion de "restaurant actif"** — Le backend est multi-tenant. Après le login, le user a un `restaurantId` dans son profil. Mais l'app n'a aucun mécanisme pour :
    - Stocker le restaurant actif dans un état global.
    - Injecter le `restaurantId` dans les requêtes API qui le nécessitent.
    - Permettre à un Gérant multi-établissements de switcher de restaurant.
    Cela impacte TOUTE l'intégration API qui suit. C'est un prérequis architectural.

14. **Le système de permissions backend est bien plus riche que prévu** — Le backend expose 9 endpoints de permissions (`/api/staff/permissions/*`) : matrice rôle×permission, hiérarchie, check simple, check multiple, mes permissions. Le front ne peut pas se contenter d'une matrice hardcodée — il doit consommer l'API de permissions.

---

## TÂCHES À RÉALISER (dans cet ordre)

### Phase 1 — Branchement minimal (rendre l'auth fonctionnelle)

**1.1 — Ajouter `QueryClientProvider` dans `main.tsx`**

```
Avant : ThemeProvider > AuthProvider (mock) > RouterProvider
Après : QueryClientProvider > ThemeProvider > RouterProvider
```

- Importer `queryClient` depuis `@/api/query-client`.
- Supprimer l'import et l'utilisation de `AuthProvider` (mock context).
- Le Zustand store (`useAuthStore`) n'a pas besoin de Provider, il est global.

**1.2 — Migrer `auth-guard.tsx`**

- Remplacer `useAuth()` par `useAuthStore`.
- Ajouter un check de validité du token au mount : appeler `useProfile({ enabled: !!getAccessToken() })`. Si le profil charge → user valide. Si 401 → clearTokens + clearUser + redirect /login.
- Pendant le chargement initial (`isLoading` ou profil en cours de fetch) → afficher un spinner/skeleton plein écran, PAS un flash de la page login.
- Stocker la route demandée (`location.pathname`) pour la redirect post-login via le state de `<Navigate>`.

**1.3 — Migrer `login.tsx`**

- Remplacer `useAuth().login()` par `useLogin()` de `@/api/auth/mutations`.
- Gérer les deux cas du `LoginResult` :
  - Login direct → `useLogin.onSuccess` stocke déjà tokens + user → naviguer vers `state?.from || "/"`.
  - MFA requis → afficher le formulaire de code TOTP, appeler `useVerifyMfa()`.
- Afficher les erreurs API en français :
  - 400/401 → "Email ou mot de passe incorrect"
  - 429 → "Trop de tentatives, réessayez dans quelques minutes"
  - 500/réseau → "Le serveur est temporairement indisponible"
- Validation du formulaire avec Zod (email valide, password non vide).
- Si l'user est déjà authentifié (`useAuthStore.isAuthenticated`), redirect vers `/`.

**1.4 — Migrer `register.tsx`**

- Remplacer `useAuth().register()` par `useRegister()`.
- Après inscription réussie, NE PAS auto-login (le backend peut demander une vérification email). Redirect vers `/login` avec un message de succès.
- Validation Zod complète du formulaire (email, password match, champs requis).

**1.5 — Activer les guards dans `router.tsx`**

- Décommenter `AuthGuard` comme element wrapper des routes protégées.
- Créer un `GuestGuard` qui redirect les users authentifiés vers `/` s'ils tentent d'accéder à `/login` ou `/register`.

**1.6 — Supprimer `contexts/auth-context.tsx`**

- Vérifier qu'aucun import ne reste (grep `auth-context` et `useAuth` dans tout le front).
- Supprimer le fichier. Une seule source de vérité : `useAuthStore`.

### Phase 2 — Contexte restaurant (prérequis pour toute l'intégration API)

**C'est la pièce manquante la plus critique.** Sans contexte restaurant, aucune requête métier ne peut fonctionner car le backend scope tout par restaurant.

**2.1 — Étendre le store Zustand**

Le store `auth-store.ts` a déjà `restaurantId` et `restaurantName` dans `AuthUser`. Ajouter :

```ts
type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  activeRestaurantId: number | null   // ← NOUVEAU
  activeRestaurantName: string | null // ← NOUVEAU
  setUser: (user: AuthUser) => void
  clearUser: () => void
  setActiveRestaurant: (id: number, name: string) => void // ← NOUVEAU
}
```

- Au login, `activeRestaurantId` est initialisé avec le `restaurantId` du profil.
- Pour un Gérant multi-établissements, un sélecteur de restaurant permet de changer `activeRestaurantId` sans se re-connecter.
- Si l'user n'a qu'un seul restaurant, le sélecteur est masqué.

**2.2 — Injecter le restaurant dans les requêtes**

Deux options selon ce que le backend attend :

**Option A — Le backend filtre par query param (ex: `?restaurant=3`)** :
- Les hooks query passent `activeRestaurantId` dans les searchParams.
- Chaque hook inclut `activeRestaurantId` dans son queryKey → un changement de restaurant invalide tout le cache automatiquement.

**Option B — Le backend déduit le restaurant du token JWT** :
- Le backend connaît déjà le restaurant de l'user via le token.
- Pas besoin de passer le param, mais le switch de restaurant nécessite un endpoint dédié ou un nouveau token.

Vérifier dans le Swagger (`/api/docs/`) laquelle est la bonne approche. Documenter la réponse.

**2.3 — Hook `useActiveRestaurant`**

```ts
export function useActiveRestaurant() {
  const { activeRestaurantId, activeRestaurantName, setActiveRestaurant } = useAuthStore()
  return { restaurantId: activeRestaurantId, restaurantName: activeRestaurantName, setActiveRestaurant }
}
```

Ce hook est utilisé par TOUS les hooks de données métier. C'est le chaînon entre l'auth et le reste de l'API.

### Phase 3 — Corrections de sécurité

**3.1 — Évaluer la faisabilité httpOnly cookie**

Avant de modifier quoi que ce soit, vérifier côté backend :
- Est-ce que `TokenRefreshView` de SimpleJWT peut être configuré pour set le refresh token en `Set-Cookie: httpOnly; Secure; SameSite=Strict` ?
- Est-ce que le CORS backend est configuré avec `credentials: true` ?

**Si le backend peut supporter les httpOnly cookies :**
- Modifier `LoginView` côté back pour renvoyer le refresh token dans un Set-Cookie httpOnly.
- Modifier `client.ts` : supprimer `REFRESH_KEY` du localStorage, le refresh se fait automatiquement via le cookie.
- L'access token reste en mémoire (variable module-level), PAS en localStorage.
- Un refresh de page → appel à `/auth/token/refresh/` (cookie envoyé auto) → nouveau access token.

**Si le backend ne peut PAS supporter les httpOnly cookies :**
- Documenter comme dette technique dans `docs/security/TOKEN_STORAGE.md`.
- Mitigation : Content-Security-Policy strict, pas de `dangerouslySetInnerHTML`, audit des dépendances.
- Plan de migration : ticket backend pour httpOnly cookie.

**3.2 — CSRF**

- Vérifier si le backend Django a `CsrfViewMiddleware` actif pour les endpoints API.
- Si oui : ajouter un hook `beforeRequest` dans `client.ts` qui lit le cookie `csrftoken` et le met dans le header `X-CSRFToken`.
- Si non (API stateless avec JWT uniquement, exempt de CSRF) : documenter pourquoi.

**3.3 — Vérification token au boot**

- Au démarrage de l'app, si un access token existe en localStorage :
  1. Tenter un `GET /auth/profile/` avec ce token.
  2. Si 200 → hydrater le store Zustand avec le profil frais (pas les données stale du localStorage).
  3. Si 401 → tenter un refresh. Si le refresh réussit, refaire le GET /profile. Si le refresh échoue → clearTokens + redirect /login.
- Cela garantit qu'un token expiré/révoqué ne laisse pas l'app dans un état "fantôme connecté".

### Phase 4 — Qualité de code

**4.1 — Extraire le mapping user**

Créer dans `api/auth/types.ts` :
```ts
export function toAuthUser(res: LoginResponse): AuthUser {
  return {
    id: res.userId,
    username: res.username,
    email: res.email,
    firstName: res.firstName,
    lastName: res.lastName,
    employeeId: res.employeeId,
    employeeName: res.employeeName,
    employeeType: res.employeeType,
    employeeTypeId: res.employeeTypeId,
    restaurantId: res.restaurantId,
    restaurantName: res.restaurantName,
  }
}
```
L'utiliser dans `useLogin()` et `useVerifyMfa()`.

**4.2 — Clarifier le doublon `token` / `accessToken` dans LoginResponse**

Vérifier la réponse réelle du backend. Garder un seul champ.

**4.3 — Ajouter des schémas Zod sur les réponses critiques**

Les réponses d'auth sont critiques (tokens, user data). Ajouter :
- `LoginResponseSchema` — valider que accessToken et refreshToken sont des strings non-vides.
- `UserProfileSchema` — valider la structure du profil.
- Utiliser `schema.parse()` dans les queryFn/mutationFn.

Ne PAS mettre Zod sur les réponses triviales (logout message, mfa status boolean).

**4.4 — Gérer le 204 No Content dans apiDelete**

```ts
export async function apiDelete<T = void>(url: string, options?: Options): Promise<T> {
  const response = await api.delete(url, options)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T
  }
  const raw = await response.json()
  return camelizeKeys<T>(raw)
}
```

**4.5 — Redirect post-login vers la page d'origine**

- Dans `AuthGuard` : `<Navigate to="/login" state={{ from: location.pathname }} replace />`
- Dans `login.tsx` : `navigate(state?.from || "/", { replace: true })`

### Phase 5 — Permissions dynamiques (consommer l'API du backend)

**Le backend expose un système de permissions complet.** Ne PAS hardcoder une matrice front — la consommer depuis l'API.

**5.1 — Endpoints de permissions à intégrer**

```
GET  /api/staff/permissions/me/                         → mes permissions
GET  /api/staff/permissions/roles/                      → tous les rôles
GET  /api/staff/permissions/matrix/                     → matrice complète
POST /api/staff/permissions/check/                      → vérifier une permission
POST /api/staff/permissions/check-multiple/             → vérifier plusieurs permissions
GET  /api/staff/permissions/roles/<role>/permissions/   → permissions d'un rôle
GET  /api/staff/permissions/hierarchy/                  → hiérarchie des rôles
```

**5.2 — Hook `useMyPermissions`**

```ts
export function useMyPermissions() {
  return useQuery({
    queryKey: authKeys.myPermissions(),
    queryFn: () => apiGet<MyPermissionsResponse>("staff/permissions/me/"),
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: !!getAccessToken(),
  })
}
```

Ce hook est appelé UNE FOIS au boot (dans le AuthGuard, après le profil). Les permissions sont cachées 5min. Pas besoin de les re-fetch à chaque navigation.

**5.3 — Hook `usePermissions` (consumer-facing)**

```ts
export function usePermissions() {
  const { data: permissions } = useMyPermissions()
  return {
    can: (permission: string) => permissions?.includes(permission) ?? false,
    canAny: (...perms: string[]) => perms.some(p => permissions?.includes(p) ?? false),
    canAll: (...perms: string[]) => perms.every(p => permissions?.includes(p) ?? false),
    permissions: permissions ?? [],
  }
}
```

**5.4 — Guard par permission**

Le `AuthGuard` accepte un prop `requiredPermission?: string`. Si l'user est authentifié mais n'a pas la permission → page 403.

```tsx
// Dans router.tsx
{
  element: <AuthGuard requiredPermission="admin.access" />,
  children: [
    { path: "admin", element: <AdminLayout /> },
  ],
}
```

**5.5 — Filtrage sidebar**

La sidebar consomme `usePermissions()` pour ne rendre que les items autorisés. Ne pas utiliser `display: none` — ne pas rendre le composant du tout.

**Rappel** : les permissions front sont UX-only. Le backend vérifie les permissions sur chaque endpoint via son middleware. Le front ne fait que filtrer l'affichage.

---

## CE QUE TU NE FAIS PAS

- Ne crée pas de nouveaux fichiers de documentation (la doc viendra après que ça marche).
- Ne touche pas aux autres domaines API (réservations, stocks, etc.) — auth + restaurant context d'abord.
- Ne modifie pas le backend sauf si explicitement demandé pour CSRF ou httpOnly cookies.
- Ne rajoute pas de features non listées (reset password, email verification, device login, quick login) — elles viendront après.
- Ne hardcode pas de matrice de permissions — consomme l'API du backend.

## CRITÈRES DE VALIDATION

L'auth est considérée "branchée" quand :

**Fonctionnel :**
- [ ] L'app démarre sans crash (QueryClientProvider en place)
- [ ] `/login` affiche le formulaire, soumet vers l'API réelle, gère les erreurs en français
- [ ] Un login réussi redirige vers la page d'origine (ou `/`) avec la sidebar visible
- [ ] Le flow MFA fonctionne (login → code TOTP → accès)
- [ ] Un refresh de page maintient la session (vérifie le token au boot)
- [ ] `/login` redirige vers `/` si déjà connecté
- [ ] Les routes protégées redirigent vers `/login` si pas connecté
- [ ] Le logout vide tout (tokens, store, cache TanStack) et redirige vers `/login`

**Architecture :**
- [ ] `contexts/auth-context.tsx` est supprimé, aucun import restant
- [ ] Aucun copier-coller de mapping user (fonction `toAuthUser` utilisée partout)
- [ ] Le restaurant actif est dans le store Zustand et accessible via `useActiveRestaurant()`
- [ ] Les permissions sont chargées depuis l'API (`/staff/permissions/me/`), pas hardcodées
- [ ] La sidebar est filtrée par permissions dynamiques

**Sécurité :**
- [ ] Le choix de stockage des tokens est documenté (httpOnly cookie ou dette technique acceptée)
- [ ] Le CSRF est géré ou documenté comme non-nécessaire
- [ ] Le boot vérifie la validité du token avant d'afficher l'app

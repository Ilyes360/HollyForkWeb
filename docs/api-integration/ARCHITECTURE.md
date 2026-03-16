# Architecture d'intégration API — Holly Fork

## Stack d'intégration

| Besoin | Lib | Version | Justification |
|--------|-----|---------|---------------|
| Data fetching + cache | `@tanstack/react-query` | 5.x | Cache, refetch, mutations, devtools. Standard React. |
| Client HTTP | `ky` | 1.x | Fetch-based, léger (3kb), interceptors, retry natif, JSON auto. |
| Validation formulaires | `zod` + `react-hook-form` | déjà installés | Validation runtime côté formulaires uniquement. |
| State auth | `zustand` | déjà installé | Cohérent avec les stores existants du projet. |
| Transformation clés | `case-transform.ts` custom | — | snake_case (Django) ↔ camelCase (React), sans dépendance. |

## Structure des fichiers

```
src/
├── api/
│   ├── client.ts              # Instance ky + helpers typés (apiGet, apiPost, etc.)
│   ├── query-client.ts        # QueryClient avec config par défaut
│   ├── types.ts               # Types partagés (PaginatedResponse, ApiError, ListParams)
│   ├── case-transform.ts      # camelizeKeys() / snakifyKeys()
│   └── auth/
│       ├── types.ts           # Types requête/réponse auth
│       ├── queries.ts         # useProfile(), useMfaStatus()
│       ├── mutations.ts       # useLogin(), useLogout(), useRegister(), useMfa*()
│       └── index.ts           # Re-export barrel
├── stores/
│   └── auth-store.ts          # Zustand store (user + tokens)
```

### Convention par domaine (futur)

Chaque domaine métier suit le même pattern :

```
src/api/[domaine]/
├── types.ts                   # Types requête/réponse (camelCase, post-transformation)
├── queries.ts                 # Hooks useQuery (lecture)
├── mutations.ts               # Hooks useMutation (écriture)
└── index.ts                   # Re-export barrel
```

Domaines prévus : `reservations/`, `staff/`, `inventory/`, `menu/`, `planning/`, `suppliers/`, `billing/`, `salles/`, `dashboard/`, `settings/`, `reports/`.

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichier types | `[domaine]/types.ts` | `api/auth/types.ts` |
| Hook query | `use[Entité](s)` | `useReservations()`, `useProfile()` |
| Hook mutation | `use[Action][Entité]` | `useCreateReservation()`, `useLogin()` |
| Query key factory | `[domaine]Keys` | `authKeys.profile()` |
| Type réponse | `[Entité]Response` | `LoginResponse` |
| Type requête | `[Entité]Request` | `LoginRequest` |

## Flux d'une donnée (back → composant)

```
1. Composant appelle useReservations()
2. TanStack Query vérifie le cache (queryKey: reservationKeys.list())
3. Si stale/absent → queryFn appelle apiGet<PaginatedResponse<Reservation>>("reservations/")
4. apiGet() fait ky.get() avec Bearer token auto-injecté
5. La réponse JSON est transformée par camelizeKeys()
6. TanStack Query stocke en cache et retourne { data, isLoading, error }
7. Le composant consomme data directement (types camelCase)
```

Pour une mutation :
```
1. Composant appelle createReservation.mutate(formData)
2. useMutation → apiPost("reservations/", formData)
3. apiPost() transforme formData en snake_case via snakifyKeys()
4. La réponse est camelisée et retournée
5. onSuccess → queryClient.invalidateQueries(reservationKeys.all)
6. Le cache se rafraîchit automatiquement
```

## Authentification

### Flow login standard
1. `useLogin().mutate({ email, password })`
2. POST `/api/auth/login/`
3. Réponse : `{ accessToken, refreshToken, userId, ... }`
4. `setTokens()` stocke dans localStorage
5. `useAuthStore.setUser()` met à jour le state Zustand
6. Le client ky injecte le Bearer token sur toutes les requêtes suivantes

### Flow MFA
1. Login retourne `{ requiresMfa: true, tempToken }`
2. Le composant affiche le formulaire TOTP
3. `useVerifyMfa().mutate({ tempToken, code })`
4. POST `/api/auth/verify-mfa/`
5. Même suite que le login standard

### Refresh automatique
Le client ky intercepte les 401, appelle `/api/auth/token/refresh/`, et rejoue la requête originale avec le nouveau token. Mutex intégré pour éviter les refreshs concurrents.

### Logout
1. `useLogout().mutate()`
2. POST `/api/auth/logout/`
3. `onSettled` : clear tokens + clear user + clear tout le cache TanStack Query

## Pagination

Le backend utilise `PageNumberPagination` (20 items/page par défaut).

```typescript
// Le type PaginatedResponse<T> est prêt dans api/types.ts
type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

## Transformation snake_case ↔ camelCase

Gérée automatiquement par `case-transform.ts` dans les helpers `apiGet`, `apiPost`, etc.

- **Réponses API** : `camelizeKeys()` transforme `access_token` → `accessToken`
- **Corps de requête** : `snakifyKeys()` transforme `firstName` → `first_name`
- **Récursif** : fonctionne sur les objets imbriqués et les tableaux

Les types front sont toujours en camelCase. Aucun composant ne voit jamais du snake_case.

## Gestion des erreurs

Les erreurs ky sont des `HTTPError` avec un `.response`. Le backend renvoie :
- `{ detail: "message" }` pour les erreurs simples
- `{ field_name: ["erreur"] }` pour les erreurs de validation
- `{ non_field_errors: ["erreur"] }` pour les erreurs globales

Le type `ApiError` dans `api/types.ts` couvre ces cas. Chaque mutation gère ses erreurs via `onError` de TanStack Query.

## Écarts front/back identifiés

### Questions ouvertes (à résoudre avec le dev back)

| # | Écart | Front | Back | Impact |
|---|-------|-------|------|--------|
| 1 | Réservation : status, canal, service | `ReservationStatus`, `ReservationCanal`, champ `service` | Aucun de ces champs | Le front a des features que le back ne supporte pas |
| 2 | Produit vs Ingredient+Stock | Type `Product` unifié | `Ingredient` + `Stock` séparés | Mapping complexe nécessaire |
| 3 | Recette vs Article | Type `Recipe` avec allergens, temps_prep, marge | `Article` + `ArticleIngredient` sans ces champs | Champs manquants côté back |
| 4 | Employee : department, contract, avatar | Présents dans le type front | Absents du model back | Features front-only ou à ajouter au back |
| 5 | Dashboard KPIs | Calculés localement | Endpoint `/api/dashboard/kpis/` existe | Vérifier que les KPIs matchent |
| 6 | Plan de salle | Konva elements (murs, zones, déco) | Seulement Table avec position_x/y | Le back ne stocke pas le layout complet |
| 7 | Services (Midi/Soir/Journée) | Config front locale | Pas de model back | Feature front-only |

### Endpoints back non utilisés par le front (actuellement)

- `billing/` — Factures, paiements, méthodes de paiement
- `commandes/` — Commandes client (orders)
- `notes/` — Notes internes
- `reports/` — Génération de rapports
- `dashboard/map/` — Données cartographiques

## Ordre d'intégration recommandé

| Phase | Domaine | Endpoints | Pourquoi |
|-------|---------|-----------|----------|
| 1 | **Auth** | login, register, logout, refresh, profile | Prérequis pour tout le reste |
| 2 | **Restaurant** | CRUD restaurants | Nécessaire pour le contexte multi-établissement |
| 3 | **Staff** | employees, types, permissions | Dépend de restaurant |
| 4 | **Reservations** | CRUD réservations | Feature principale, CRUD simple |
| 5 | **Salles** | salles + tables | Lié aux réservations |
| 6 | **Inventory** | ingredients, stocks, réapprovisionnement | Indépendant |
| 7 | **Menu** | articles, catégories, article-ingredients | Dépend d'inventory |
| 8 | **Suppliers** | fournisseurs, jours livraison, commandes fournisseur | Lié à inventory |
| 9 | **Planning** | shifts | Dépend de staff |
| 10 | **Dashboard** | KPIs | Agrège les données des phases précédentes |
| 11 | **Settings** | notifications, billing settings | Non critique |
| 12 | **Billing/Reports** | Factures, rapports | Dernière priorité |

## Stratégie de migration mock → API

1. Le `QueryClientProvider` est ajouté dans `main.tsx`
2. Pour chaque domaine, on crée le dossier `api/[domaine]/` avec types + queries + mutations
3. Dans la page, on remplace `useAdminStore()` par `useEmployees()` (TanStack Query)
4. Les mocks restent en place pour les domaines non encore migrés
5. Variable `VITE_USE_MOCKS` disponible si besoin de fallback

## Config staleTime par domaine

| Domaine | staleTime | Raison |
|---------|-----------|--------|
| Auth/Profile | 5 min | Change rarement |
| Restaurants | 10 min | Quasi-statique |
| Employees/Roles | 5 min | Change peu |
| Réservations | 30 sec | Change souvent (arrivées, annulations) |
| Stocks | 1 min | Mis à jour à chaque commande |
| Planning | 2 min | Change pendant la planification |
| Dashboard KPIs | 1 min | Données temps réel souhaitées |

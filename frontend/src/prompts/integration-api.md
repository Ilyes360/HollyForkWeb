# Prompt : Intégration API — Architecture et implémentation des domaines métier

## CONTEXTE PROJET

Holly Fork — dashboard admin SaaS multi-établissements pour la restauration.
Stack front : React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query 5 + Zustand + ky + Zod + react-hook-form.
Backend : Django REST Framework, SimpleJWT, drf-spectacular.
Proxy Vite : `/api` → `http://localhost:8000`.
Swagger UI : `http://localhost:8000/api/docs/`
OpenAPI schema : `GET /api/schema/`

**Ampleur** : ~193 endpoints, 30 modèles, 15 apps Django, 27 ViewSets.
Multi-tenant : quasi toute ressource est scopée à un restaurant.

## PRÉREQUIS — NE PAS COMMENCER SANS

Avant d'intégrer le moindre domaine métier, vérifier que le prompt `auth-api.md` est complètement implémenté :

- [ ] Auth fonctionnelle (login, logout, refresh, guards actifs)
- [ ] `QueryClientProvider` dans `main.tsx`
- [ ] `contexts/auth-context.tsx` supprimé
- [ ] Restaurant actif dans le store Zustand (`activeRestaurantId`)
- [ ] Permissions chargées depuis l'API (`/staff/permissions/me/`)

Si ce n'est pas le cas, STOP. Aller finir `auth-api.md` d'abord.

---

## CE QUI EXISTE DÉJÀ (ne pas refaire)

### Couche API en place

```
frontend/src/api/
├── client.ts         — Client HTTP ky, Bearer auto, refresh 401 avec mutex, case-transform
├── query-client.ts   — QueryClient (staleTime 2min, gcTime 10min, retry 1)
├── types.ts          — PaginatedResponse<T>, ApiError, ListParams
├── case-transform.ts — camelizeKeys / snakifyKeys récursif
└── auth/             — Domaine auth complet (types, queries, mutations)
```

### Conventions établies (à respecter strictement)

- **HTTP** : `apiGet<T>`, `apiPost<T>`, `apiPut<T>`, `apiPatch<T>`, `apiDelete<T>` — case-transform automatique.
- **Types** : camelCase côté front. Le snake_case du backend est transformé à la frontière.
- **Query keys** : factory pattern par domaine.
- **Fichiers** : un dossier par domaine dans `src/api/`, avec `types.ts`, `queries.ts`, `mutations.ts`, `index.ts`.
- **Store** : Zustand pour l'état auth et le restaurant actif uniquement. Les données métier passent par TanStack Query (PAS de store Zustand par domaine).
- **Validation** : Zod sur les réponses critiques (auth, transactions financières). Pas sur les lectures simples tant que le backend est stable.

---

## CORRECTIONS DU CLIENT AVANT D'INTÉGRER

Le client `api/client.ts` a des limitations à corriger AVANT de créer les hooks métier.

### C.1 — apiDelete : gérer le 204

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

### C.2 — Support des query params dans apiGet

Les endpoints de liste acceptent des filtres (`?page=2&status=confirmed&restaurant=3`). Enrichir `apiGet` :

```ts
export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Options,
): Promise<T> {
  const searchParams = params
    ? Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [toSnakeCase(k), String(v)])
      )
    : undefined
  const raw = await api.get(url, { ...options, searchParams }).json()
  return camelizeKeys<T>(raw)
}
```

Les clés des params sont automatiquement converties en snake_case : `{ pageSize: 20 }` → `?page_size=20`.

### C.3 — Helper upload (pour les reports avec fichiers)

```ts
export async function apiUpload<T>(url: string, formData: FormData, options?: Options): Promise<T> {
  const raw = await api.post(url, { ...options, body: formData }).json()
  return camelizeKeys<T>(raw)
}
```

Pas de `json:` ni de `snakifyKeys` — FormData gère son propre encoding. Les clés du FormData doivent être en snake_case manuellement.

### C.4 — Error handler centralisé

```ts
import { HTTPError } from "ky"

export async function extractApiError(error: unknown): Promise<ApiError> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json()
      return camelizeKeys<ApiError>(body)
    } catch {
      return { detail: `Erreur ${error.response.status}` }
    }
  }
  if (error instanceof Error) {
    return { detail: error.message }
  }
  return { detail: "Une erreur inattendue est survenue" }
}
```

Ce helper est utilisé dans les `onError` des mutations pour afficher des messages propres.

### C.5 — Gestion globale des erreurs 403

Ajouter un hook `afterResponse` dans le client ky pour toaster automatiquement les 403 :

```ts
afterResponse: [
  async (_request, _options, response) => {
    if (response.status === 403) {
      // Émettre un event que le layout écoute pour afficher un toast
      window.dispatchEvent(new CustomEvent("api:forbidden"))
    }
  },
],
```

Le layout principal écoute cet event et affiche : "Vous n'avez pas la permission d'effectuer cette action."

---

## ARCHITECTURE MULTI-RESTAURANT

### Principe fondamental

Le backend scope quasi toute ressource à un restaurant. Le front doit :
1. Connaître le `activeRestaurantId` (depuis le store Zustand, défini dans `auth-api.md` phase 2).
2. L'inclure dans chaque queryKey (pour que le changement de restaurant invalide tout le cache).
3. Le passer en query param si le backend l'attend (vérifier dans le Swagger).

### Impact sur les query keys

```ts
// MAUVAIS — pas de scope restaurant, cache partagé entre restaurants
export const reservationKeys = {
  list: (params) => ["reservations", "list", params] as const,
}

// BON — le cache est scopé par restaurant automatiquement
export const reservationKeys = {
  all: (restaurantId: number) => ["reservations", restaurantId] as const,
  lists: (restaurantId: number) => [...reservationKeys.all(restaurantId), "list"] as const,
  list: (restaurantId: number, params: ReservationListParams) =>
    [...reservationKeys.lists(restaurantId), params] as const,
  details: (restaurantId: number) => [...reservationKeys.all(restaurantId), "detail"] as const,
  detail: (restaurantId: number, id: number) =>
    [...reservationKeys.details(restaurantId), id] as const,
}
```

Quand l'user change de restaurant, TOUT le cache du domaine est invalide car le `restaurantId` dans la clé change. Pas besoin d'invalidation manuelle.

### Hook type avec restaurant

```ts
export function useReservations(params: ReservationListParams = {}) {
  const { restaurantId } = useActiveRestaurant()
  return useQuery({
    queryKey: reservationKeys.list(restaurantId!, params),
    queryFn: () => apiGet<PaginatedResponse<Reservation>>("reservations/", { ...params, restaurant: restaurantId }),
    enabled: !!restaurantId,
  })
}
```

Le `enabled: !!restaurantId` garantit qu'on ne fetch jamais sans contexte restaurant.

---

## STRUCTURE PAR DOMAINE

Chaque domaine métier suit le même pattern que `api/auth/` :

```
frontend/src/api/{domaine}/
├── types.ts      — Types request/response en camelCase
├── queries.ts    — Hooks useQuery + query keys factory (avec restaurantId)
├── mutations.ts  — Hooks useMutation
└── index.ts      — Barrel export
```

### Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Dossier | kebab-case | `api/reservations/` |
| Query hook | `use{Entity}` ou `use{Entities}` | `useReservation(id)`, `useReservations(params)` |
| Mutation hook | `use{Action}{Entity}` | `useCreateReservation`, `useUpdateReservation` |
| Query keys | `{domaine}Keys.{scope}(restaurantId, ...)` | `reservationKeys.list(restaurantId, params)` |
| Types | PascalCase | `Reservation`, `CreateReservationRequest` |

### Pattern query keys complet (avec nested resources)

```ts
// Domaine simple (reservations)
export const reservationKeys = {
  all: (rid: number) => ["reservations", rid] as const,
  lists: (rid: number) => [...reservationKeys.all(rid), "list"] as const,
  list: (rid: number, params: ReservationListParams) => [...reservationKeys.lists(rid), params] as const,
  details: (rid: number) => [...reservationKeys.all(rid), "detail"] as const,
  detail: (rid: number, id: number) => [...reservationKeys.details(rid), id] as const,
}

// Domaine avec nested resources (commandes + lignes)
export const commandeKeys = {
  all: (rid: number) => ["commandes", rid] as const,
  lists: (rid: number) => [...commandeKeys.all(rid), "list"] as const,
  list: (rid: number, params: CommandeListParams) => [...commandeKeys.lists(rid), params] as const,
  details: (rid: number) => [...commandeKeys.all(rid), "detail"] as const,
  detail: (rid: number, id: number) => [...commandeKeys.details(rid), id] as const,
  // Nested : lignes d'une commande
  lignes: (rid: number, commandeId: number) => [...commandeKeys.detail(rid, commandeId), "lignes"] as const,
}
```

Invalidation chirurgicale :
- Nouvelle commande → `invalidate(commandeKeys.lists(rid))`
- Ajout d'une ligne → `invalidate(commandeKeys.lignes(rid, commandeId))` + `invalidate(commandeKeys.detail(rid, commandeId))`
- Suppression commande → `invalidate(commandeKeys.all(rid))` (rare, en cascade)

---

## PATTERNS AVANCÉS (nécessaires vu la complexité du backend)

### P.1 — Workflows et transitions d'état

Le backend a des workflows complexes (commandes, commandes fournisseur). Le front doit les gérer proprement.

**Commande** : `EN_COURS` → `VALIDEE` / `ANNULEE`
**Kitchen status** : `PENDING` → `IN_PROGRESS` → `READY`
**Commande fournisseur** : `DRAFT` → `SENT` → `CONFIRMED` → `DELIVERED` / `CANCELLED`

Pattern mutation pour transition :

```ts
export function useUpdateCommandeStatus() {
  const queryClient = useQueryClient()
  const { restaurantId } = useActiveRestaurant()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommandeStatus }) =>
      apiPatch<Commande>(`commandes/${id}/`, { status }),
    onSuccess: (_, { id }) => {
      // Invalider le détail ET la liste (le compteur par statut change)
      queryClient.invalidateQueries({ queryKey: commandeKeys.detail(restaurantId!, id) })
      queryClient.invalidateQueries({ queryKey: commandeKeys.lists(restaurantId!) })
    },
  })
}
```

Pour les transitions avec effets de bord (annuler une commande restaure le stock), invalider aussi les domaines impactés :

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: commandeKeys.lists(restaurantId!) })
  queryClient.invalidateQueries({ queryKey: stockKeys.all(restaurantId!) }) // stock restauré
}
```

### P.2 — Polling pour les données temps réel (service actif)

Pendant le service, les commandes et le statut cuisine changent en permanence. `staleTime` court ne suffit pas — il faut du polling actif.

```ts
export function useCommandesActives(params: CommandeListParams = {}) {
  const { restaurantId } = useActiveRestaurant()
  return useQuery({
    queryKey: commandeKeys.list(restaurantId!, { ...params, status: "EN_COURS" }),
    queryFn: () => apiGet<PaginatedResponse<Commande>>("commandes/", { ...params, status: "EN_COURS", restaurant: restaurantId }),
    enabled: !!restaurantId,
    staleTime: 5_000,       // 5 sec
    refetchInterval: 10_000, // polling toutes les 10 sec
  })
}
```

**Quand activer le polling** :
- Page Cuisine (commandes en cours, statut kitchen) → `refetchInterval: 10_000`
- Page Salle (tables occupées, commandes par table) → `refetchInterval: 15_000`
- Page Réservations (pendant le service) → `refetchInterval: 30_000`

**Quand ne PAS poller** :
- Dashboard (KPIs calculés, rafraîchis manuellement ou toutes les minutes)
- Admin, Settings, Fournisseurs (données stables)
- Toute page hors heures de service

Le polling peut être conditionné à une variable "service actif" si cette notion existe dans le backend.

### P.3 — Optimistic updates

**OUI** (actions fréquentes, réversibles, feedback immédiat attendu) :
- Changer le statut kitchen d'une commande (`PENDING` → `IN_PROGRESS` → `READY`)
- Modifier une quantité en stock
- Déplacer un shift dans le planning (drag & drop)
- Changer le statut d'une table (libre → occupée)

**NON** (irréversible, effets de bord, ou données financières) :
- Créer/supprimer une réservation
- Valider/annuler une commande (effets stock)
- Modifier un prix ou une recette
- Toute action sur la facturation (TVA, paiements)
- Créer/supprimer un employé
- Commandes fournisseur (workflow multi-étapes)

Pattern optimistic update :

```ts
export function useUpdateKitchenStatus() {
  const queryClient = useQueryClient()
  const { restaurantId } = useActiveRestaurant()

  return useMutation({
    mutationFn: ({ id, kitchenStatus }: { id: number; kitchenStatus: KitchenStatus }) =>
      apiPatch<Commande>(`commandes/${id}/`, { kitchenStatus }),

    onMutate: async ({ id, kitchenStatus }) => {
      const queryKey = commandeKeys.detail(restaurantId!, id)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Commande>(queryKey)
      if (previous) {
        queryClient.setQueryData(queryKey, { ...previous, kitchenStatus })
      }
      return { previous, queryKey }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: commandeKeys.detail(restaurantId!, id) })
    },
  })
}
```

### P.4 — Bulk operations

Le backend supporte des opérations bulk (calcul CMV, mise à jour stock). Pattern :

```ts
export function useBulkUpdateStock() {
  const queryClient = useQueryClient()
  const { restaurantId } = useActiveRestaurant()

  return useMutation({
    mutationFn: (updates: Array<{ ingredientId: number; quantity: number }>) =>
      apiPost<void>("stocks/bulk-update/", { updates }),
    onSuccess: () => {
      // Invalider tout le domaine stock (trop de clés individuelles à invalider)
      queryClient.invalidateQueries({ queryKey: stockKeys.all(restaurantId!) })
    },
  })
}
```

### P.5 — Données historiques (commandes archivées)

Le backend archive les commandes validées/annulées dans des tables séparées (`CommandeHistoric`, `LigneCommandeHistoric`). Le front doit :

- Avoir des hooks séparés pour les commandes actives et l'historique.
- Ou un hook unique avec un flag `historic: boolean` qui change l'endpoint.
- L'historique ne polle pas (données statiques) et a un `staleTime` long (5min).

```ts
export function useCommandesHistorique(params: CommandeHistoriqueParams = {}) {
  const { restaurantId } = useActiveRestaurant()
  return useQuery({
    queryKey: commandeKeys.historique(restaurantId!, params),
    queryFn: () => apiGet<PaginatedResponse<CommandeHistoric>>("commandes/historique/", { ...params, restaurant: restaurantId }),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000, // 5 min — données archivées, stables
  })
}
```

### P.6 — File upload (reports)

Le modèle `Report` a un `FileField`. Pour créer un report avec fichier :

```ts
export function useCreateReport() {
  const queryClient = useQueryClient()
  const { restaurantId } = useActiveRestaurant()

  return useMutation({
    mutationFn: (data: { title: string; type: ReportType; file?: File }) => {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("type", data.type)
      formData.append("restaurant", String(restaurantId))
      if (data.file) formData.append("file", data.file)
      return apiUpload<Report>("reports/", formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists(restaurantId!) })
    },
  })
}
```

### P.7 — Calculs financiers (TVA, CMV)

Les données financières (factures, CMV) sont calculées côté backend. Le front :
- NE recalcule PAS la TVA ou le CMV localement.
- Affiche les valeurs renvoyées par le backend telles quelles.
- Valide avec Zod que les montants sont des `number` valides (pas de `NaN`, pas de `null` sur des champs requis).

```ts
const FactureSchema = z.object({
  id: z.number(),
  totalHt: z.number(),
  totalTtc: z.number(),
  totalTva: z.number(),
  lignes: z.array(z.object({
    articleNom: z.string(),
    quantite: z.number(),
    prixUnitaire: z.number(),
    totalHt: z.number(),
    tauxTva: z.number(),
    montantTva: z.number(),
  })),
})
```

---

## STRATÉGIE DE CACHE PAR DOMAINE

### staleTime recommandé

| Domaine | staleTime | refetchInterval | Justification |
|---------|-----------|-----------------|---------------|
| Auth (profil) | 5 min | - | Change rarement |
| Permissions | 5 min | - | Changent avec les promotions |
| Établissements | 10 min | - | Change très rarement |
| Employés | 5 min | - | |
| Types employé | 10 min | - | Référentiel quasi statique |
| Menu (articles) | 5 min | - | Modifié rarement pendant service |
| Catégories | 10 min | - | |
| Stocks | 1 min | - | Quantités changent avec commandes |
| Ingrédients | 5 min | - | |
| Fournisseurs | 5 min | - | Données stables |
| Commandes fournisseur | 2 min | - | |
| Réservations | 30 sec | 30s pendant service | Changent fréquemment |
| Commandes actives | 5 sec | 10s pendant service | Temps réel pendant service |
| Commandes historique | 5 min | - | Données archivées |
| Salles | 5 min | - | Plan rarement modifié |
| Tables | 30 sec | 15s pendant service | Statut occupation temps réel |
| Planning (shifts) | 2 min | - | Modifié ponctuellement |
| Facturation | 2 min | - | |
| Dashboard KPIs | 2 min | - | Agrégation, pas de polling |
| Settings | 10 min | - | |
| Notes | 5 min | - | |
| Reports | 5 min | - | |

### Prefetch

- **Au hover** sur un item de liste : `queryClient.prefetchQuery` pour le détail. Chargement perçu instantané au clic.
- **Au mount sidebar** : prefetch Dashboard KPIs si pas en cache.
- **`placeholderData: keepPreviousData`** sur toutes les listes paginées — évite le flash blanc pendant la pagination.

---

## ERROR HANDLING

### Erreurs globales (gérées par le client ou le layout)

| Status | Comportement | Message |
|--------|-------------|---------|
| 401 | Refresh + retry (déjà dans client.ts) | Si refresh échoue : redirect /login |
| 403 | Toast automatique (hook afterResponse) | "Vous n'avez pas la permission" |
| 500 | Toast | "Erreur serveur, réessayez" |
| Réseau | Toast | "Connexion perdue" |

### Erreurs locales (gérées par le composant)

| Status | Comportement | Message |
|--------|-------------|---------|
| 400 validation | Mapper champ par champ dans react-hook-form | Afficher sous chaque champ |
| 404 | Redirect ou message inline | "Cet élément n'existe plus" |
| 409 conflit | Message + bouton recharger | "Modifié par quelqu'un d'autre" |

### Messages d'erreur

TOUJOURS en français. JAMAIS de stack traces ou de messages techniques exposés à l'utilisateur.
- Pas de "JWT malformed" → "Session expirée, veuillez vous reconnecter"
- Pas de "IntegrityError" → "Cette action n'est pas possible car des données liées existent"

---

## ORDRE D'INTÉGRATION

L'ordre suit la chaîne de dépendances des données :

| Phase | Domaine | Dossier API | Endpoints (approx.) | Dépend de |
|-------|---------|-------------|---------------------|-----------|
| 0 | Auth + Permissions | `api/auth/` | 16 + 9 | - |
| 1 | Établissements (Restaurant) | `api/restaurants/` | 7 | Auth |
| 2 | Types employé + Employés | `api/staff/` | 21 | Restaurants |
| 3 | Catégories + Articles (Menu) | `api/menu/` | 21 | Restaurants |
| 4 | Ingrédients + Stocks | `api/inventory/` | 21 | Menu, Restaurants |
| 5 | Fournisseurs + Commandes fournisseur | `api/suppliers/` | 14 | Stocks |
| 6 | Salles + Tables | `api/salles/` | 14 | Restaurants |
| 7 | Réservations | `api/reservations/` | 7 | Restaurants, Salles |
| 8 | Commandes + Lignes | `api/commandes/` | 14 | Menu, Salles |
| 9 | Facturation + Paiements | `api/billing/` | 16 | Commandes |
| 10 | Planning (Shifts) | `api/planning/` | 7 | Employés |
| 11 | Notes | `api/notes/` | 7 | Restaurants |
| 12 | Dashboard KPIs | `api/dashboard/` | 2 | Tous |
| 13 | Settings | `api/settings/` | 12 | Auth |
| 14 | Reports | `api/reports/` | 9 | Tous |

**Chaque phase est un PR atomique** : types + hooks + migration des pages + suppression des mocks. Pas de domaine "à moitié branché".

### Migration mock → API par domaine

Pour chaque domaine :

1. **Lire le Swagger** (`/api/docs/`) pour les endpoints du domaine. Documenter les écarts avec les mocks existants.
2. **Créer `api/{domaine}/types.ts`** — basé sur le Swagger, PAS sur les mocks (les mocks peuvent avoir des champs inventés).
3. **Créer `api/{domaine}/queries.ts`** — hooks query avec query keys factory incluant `restaurantId`.
4. **Créer `api/{domaine}/mutations.ts`** — hooks mutation avec invalidation.
5. **Créer `api/{domaine}/index.ts`** — barrel export.
6. **Migrer les pages** — remplacer `useState(mockData)` / `const data = MOCK_DATA` par les hooks TanStack Query.
7. **Supprimer les mocks** du domaine (ou déplacer dans `__mocks__/` pour les tests).
8. **Tester** avec le backend réel.

### Si le backend n'est pas toujours accessible

Utiliser MSW (Mock Service Worker) plutôt que des mocks inline. MSW intercepte les requêtes au niveau réseau — les composants et hooks ne changent pas. Ça permet de basculer entre mock et API réelle sans toucher au code.

---

## BONNES PRATIQUES À APPLIQUER SYSTÉMATIQUEMENT

### Ce que chaque hook query DOIT avoir

- Un `queryKey` issu du factory (jamais de string en dur), incluant `restaurantId`.
- Un type de retour explicite (pas de `any`).
- Un `enabled` si la query dépend d'un paramètre optionnel (`id`, `restaurantId`).
- Un `staleTime` approprié au domaine (voir table ci-dessus) s'il diffère du défaut.

### Ce que chaque hook mutation DOIT avoir

- Des types request et response explicites dans `mutationFn`.
- Un `onSuccess` qui invalide les query keys pertinentes (chirurgicalement, pas tout le cache).
- Si effets de bord cross-domaine (annuler commande → stock) : invalider les deux domaines.

### Ce qu'un composant NE DOIT PAS faire

- Appeler `apiGet`/`apiPost` directement — toujours passer par un hook.
- Stocker des données API dans un `useState` local — utiliser le cache TanStack Query.
- Transformer les données dans le composant — utiliser `select` dans le hook query.
- Recalculer des données financières (TVA, CMV) — afficher ce que le backend renvoie.
- Afficher un spinner plein écran pour un rechargement de liste — utiliser `placeholderData: keepPreviousData`.

### Debounce sur la recherche

Les champs de recherche qui filtrent via l'API doivent être debounced (300ms). Ne pas envoyer une requête à chaque frappe.

### Pagination

Le backend DRF utilise `PageNumberPagination` : `{ count, next, previous, results }`.
Le type `PaginatedResponse<T>` existe déjà dans `api/types.ts`. Tous les hooks de liste paginée l'utilisent.

La pagination est gérée par un query param `page` (et optionnellement `pageSize`). Inclure ces params dans le queryKey pour que chaque page soit cachée indépendamment.

---

## CE QUE TU NE FAIS PAS

- Ne crée pas de hooks pour des endpoints que le front n'utilise pas encore.
- Ne crée pas de store Zustand pour les données métier — TanStack Query est le cache.
- Ne crée pas d'abstraction générique "useCrud" — chaque domaine a ses spécificités. Un pattern copié-collé est préférable à une abstraction prématurée.
- Ne rajoute pas de librairies (openapi-generator, orval, etc.) sauf décision explicite — ky + TanStack Query + types manuels suffisent.
- Ne modifie pas les composants UI au-delà du strict nécessaire pour brancher l'API (pas de refacto esthétique pendant l'intégration).
- Ne touche pas à l'auth pendant l'intégration des domaines — elle est traitée séparément.
- Ne rajoute pas de WebSocket/SSE sans validation que le backend le supporte — utiliser le polling TanStack Query en attendant.

## CRITÈRES DE VALIDATION PAR DOMAINE

Un domaine est considéré "intégré" quand :

- [ ] Les types correspondent au Swagger (pas aux anciens mocks)
- [ ] Les query keys incluent le `restaurantId`
- [ ] Les hooks query ont le bon `staleTime` et `enabled`
- [ ] Les mutations invalident chirurgicalement les bonnes clés
- [ ] Les pages affichent les données de l'API réelle
- [ ] Les formulaires soumettent vers l'API et affichent les erreurs de validation
- [ ] Les mocks du domaine sont supprimés (ou déplacés dans `__mocks__/`)
- [ ] Aucun `useState(mockData)` restant dans les pages du domaine
- [ ] Les listes paginées utilisent `PaginatedResponse<T>` et `keepPreviousData`

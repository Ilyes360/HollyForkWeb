# Holly Fork — Frontend Engineering Standards

> Document de référence unique. Toute décision technique doit s'y conformer.
> Dernière mise à jour : 2026-05-15.
> Maintenu par : l'équipe frontend. Tout changement doit passer par une PR revue.
>
> **Onboarding :** lire §22 (règles d'or) d'abord, puis §5 (API), §6 (TanStack Query), §17 (dev mode) avant ta première PR.

---

## 1. Identité du projet

| Champ | Valeur |
|-------|--------|
| Nom | Holly Fork |
| Type | Dashboard SaaS B2B — gestion de restaurant |
| Domaines métier | Réservations, planning, carte/menu, stocks, commandes fournisseurs, facturation, salle/plan |
| Utilisateurs | Gérants et employés de restaurants |
| Langue UI | Français uniquement (pas d'i18n) |
| Backend | Django REST Framework — JWT — `http://localhost:8000/api/` |

---

## 2. Stack technique — Versions exactes

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | ≥ 20 |
| Package manager | **pnpm** | ≥ 9 (pnpm-lock.yaml présent) |
| Framework UI | React | 19.2 |
| Langage | TypeScript | 5.9 (strict) |
| Bundler | Vite | 7 |
| Routing | React Router | 7 (createBrowserRouter) |
| Data fetching | TanStack Query | 5 |
| Client HTTP | ky | 1.14 |
| Génération API | Orval | 8.9 (OpenAPI → hooks TanStack Query + MSW mocks) |
| Validation | Zod | 4 |
| Forms | React Hook Form | 7 + @hookform/resolvers |
| État synchrone | Zustand | 5 |
| UI primitives | shadcn (style base-maia) + @base-ui/react | 1.3 |
| Icônes | Hugeicons (@hugeicons/react) | 1.1 |
| Styling | Tailwind CSS | 4 (plugin Vite, config inline dans index.css) |
| Charts | Recharts | 2.15 |
| Cartographie | Mapbox GL + react-map-gl | 3.20 / 8.1 |
| Canvas | Konva + react-konva | 10 / 19 |
| Animations | Motion (ex Framer Motion) | 12 |
| Drag & Drop | @dnd-kit/react | 0.3 |
| Dates | date-fns | 4 |
| Toasts | Sonner | 2 |
| Tests unitaires/intégration | Vitest | 4 + @testing-library/react 16 |
| Mocking API | MSW (Mock Service Worker) | 2.14 |
| Linting | ESLint 9 (flat config) + typescript-eslint |
| Formatting | Prettier 3 + prettier-plugin-tailwindcss |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PAGES / ROUTES                         │
│    React Router v7 — src/router.tsx                       │
│    Composants pages dans src/pages/                       │
│    Lazy loading : routes lourdes (salle, planning, dash)  │
│    Error boundaries : par route                           │
├─────────────────────────────────────────────────────────┤
│                    COMPOSANTS                             │
│    UI primitives : src/components/ui/ (shadcn)            │
│    Feature components : src/components/{domaine}/         │
│    Layout : src/components/layout/                        │
├─────────────────────────────────────────────────────────┤
│               HOOKS DATA (TanStack Query)                │
│    Hooks Orval générés : src/api/generated/endpoints/     │
│    Hooks custom métier : src/hooks/use-{domaine}.ts       │
│    Critère : §5.3 pour savoir quand wrapper              │
├─────────────────────────────────────────────────────────┤
│                    CLIENT HTTP (ky)                       │
│    Instance unique : src/api/client.ts                    │
│    Mutator Orval : src/api/mutator.ts                     │
│    Auth interceptors, CSRF, case transform                │
├─────────────────────────────────────────────────────────┤
│               ÉTAT SYNCHRONE (Zustand)                   │
│    Auth : src/stores/auth-store.ts                        │
│    UI state only : floor-plan, getting-started            │
│    Pas de mock data — MSW pour le dev offline (§17)      │
├─────────────────────────────────────────────────────────┤
│               TYPES & VALIDATION                         │
│    Types Orval générés : src/api/generated/schemas/       │
│    Types manuels auth : src/api/auth/types.ts             │
│    Types domaine : src/components/{domaine}/types.ts      │
│    Erreurs typées : src/api/errors.ts                     │
└─────────────────────────────────────────────────────────┘
```

### Flux d'un appel API

```
Composant
  → useXxx() hook (src/hooks/ ou src/api/generated/)
    → apiGet/apiPost (src/api/client.ts) OU kyMutator (Orval)
      → ky instance avec interceptors (auth, CSRF, retry 401)
        → snakifyKeys(body) avant envoi
        → camelizeKeys(response) après réception
          → Retour typé au composant
```

---

## 4. Structure des dossiers

```
frontend/
├── docs/
│   └── api/openapi.json          # Spec OpenAPI du backend (source Orval)
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts             # Instance ky unique + helpers typés
│   │   ├── mutator.ts            # Mutator custom pour hooks Orval
│   │   ├── query-client.ts       # QueryClient config
│   │   ├── errors.ts             # Classes d'erreur typées (ApiError, 400-5xx)
│   │   ├── types.ts              # PaginatedResponse<T>, ApiError, ListParams
│   │   ├── case-transform.ts     # camelizeKeys / snakifyKeys
│   │   ├── pagination.ts         # fetchAllPages<T> helper
│   │   ├── auth/                 # Auth : types, queries, mutations
│   │   └── generated/            # ⚠️ AUTO-GÉNÉRÉ par Orval — NE PAS MODIFIER
│   │       ├── endpoints/{tag}/  # Hooks useQuery/useMutation par tag OpenAPI
│   │       └── schemas/          # Types TS générés depuis OpenAPI
│   ├── components/
│   │   ├── ui/                   # Primitives shadcn (button, card, dialog, etc.)
│   │   ├── layout/               # Header, sidebar, navigation
│   │   ├── carte/                # Menu/recettes (ubiquitous language — §16.3)
│   │   ├── commandes/            # Commandes fournisseurs
│   │   ├── planning/             # Planning staff
│   │   ├── reservations/         # Réservations
│   │   ├── salle/                # Éditeur plan de salle (Konva)
│   │   ├── stock/                # Gestion stocks
│   │   ├── dashboard/            # Widgets dashboard
│   │   ├── administration/       # Établissements, employés, rôles
│   │   ├── onboarding-wizard/    # Flow d'onboarding
│   │   └── shared/               # Composants partagés (tables, filtres)
│   ├── guards/
│   │   ├── auth-guard.tsx        # Protection routes authentifiées
│   │   └── guest-guard.tsx       # Redirection si déjà authentifié
│   ├── hooks/                    # Hooks custom (data + utilitaires)
│   ├── layouts/                  # RootLayout, PublicLayout
│   ├── lib/                      # Utilitaires (cn, copy texts)
│   ├── pages/                    # Composants de page par route
│   ├── stores/                   # Zustand stores (UI state only)
│   ├── test/                     # Setup MSW, render helper, handlers
│   ├── types/                    # Types partagés
│   ├── __tests__/                # Tests unitaires et intégration
│   ├── index.css                 # Tailwind v4 config + thème + CSS custom
│   ├── main.tsx                  # Point d'entrée React
│   └── router.tsx                # Config React Router v7
├── CLAUDE.md                     # ← CE FICHIER
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json / tsconfig.app.json
├── vite.config.ts
├── orval.config.ts
├── eslint.config.js
├── .prettierrc
└── components.json               # Config shadcn (style base-maia)
```

---

## 5. Règles API — Source de vérité

### 5.1 Principe fondamental

**Le backend Django est la source de vérité.** Le frontend consomme l'API telle qu'elle est documentée dans `docs/api/openapi.json` et le swagger à `http://localhost:8000/api/docs/`.

### 5.2 Flux de génération

```bash
# 1. Exporter le schema OpenAPI depuis le backend
curl http://localhost:8000/api/schema/?format=openapi-json > docs/api/openapi.json

# 2. Régénérer les hooks et types
pnpm gen:api    # → orval
```

Orval génère :
- **Hooks TanStack Query** dans `src/api/generated/endpoints/{tag}/{tag}.ts`
- **Types TypeScript** dans `src/api/generated/schemas/`
- **Handlers MSW** dans `src/api/generated/endpoints/{tag}/{tag}.msw.ts`

### 5.3 Quand utiliser un hook Orval directement vs un hook custom

| Situation | Utiliser |
|-----------|----------|
| L'endpoint Orval retourne exactement ce dont le composant a besoin | **Hook Orval directement** (`useArticlesList()`) |
| Il faut transformer le type API vers un type domaine (ex: `ApiArticle` → `Recipe`) | **Hook custom** wrappant `apiGet` avec `useMemo` pour la transformation |
| Il faut agréger plusieurs pages (`fetchAllPages`) | **Hook custom** wrappant `apiGet` |
| Il faut combiner plusieurs endpoints | **Hook custom** |
| Il faut une logique `enabled` spéciale (auth, restaurantId) | **Hook custom** wrappant `apiGet` ou le hook Orval |

**Règle** : un hook custom ne DOIT JAMAIS redéfinir une queryFn identique à ce qu'Orval génère. Si le hook custom n'ajoute rien (pas de transform, pas de pagination, pas de logique enabled), utiliser le hook Orval directement.

### 5.4 Les 7 règles API

1. **Client unique** — Tout appel HTTP passe par `src/api/client.ts` (instance ky). JAMAIS de `fetch()` ou `axios` direct.

2. **Fichiers générés = read-only** — Ne JAMAIS modifier `src/api/generated/`. Régénérer avec `pnpm gen:api`. Si un type Orval est incorrect, corriger l'OpenAPI spec côté backend, puis régénérer.

3. **Hooks custom wrappent, ne dupliquent pas** — Voir §5.3 pour le critère de décision.

4. **Case transform automatique** — Le client transforme automatiquement snake_case ↔ camelCase. Ne JAMAIS faire de transformation manuelle dans les hooks ou composants.

5. **Pagination** — Le backend utilise `PageNumberPagination` avec `PAGE_SIZE=20`.
   - **Listes bornées** (catégories, types employé, méthodes paiement, fournisseurs — typiquement < 100 items) : utiliser `fetchAllPages<T>()`.
   - **Listes non bornées** (réservations, commandes historiques, logs — potentiellement milliers d'items) : implémenter une pagination UI réelle (page-number ou infinite scroll avec `useInfiniteQuery`).
   - **Critère** : si la liste peut dépasser 200 items en production, NE PAS utiliser `fetchAllPages`. La safety limit (50 pages = 1000 items) est un filet de sécurité, pas un objectif — si elle se déclenche en prod, c'est qu'on a violé cette règle.

6. **Erreurs typées** — Le mutator et le client émettent des erreurs typées (`BadRequestError`, `UnauthorizedError`, etc.) via `src/api/errors.ts`. Ne JAMAIS `throw new Error("message")` générique.

7. **Pas d'API dans les composants** — Les composants utilisent UNIQUEMENT les hooks (useQuery/useMutation). Jamais d'appel API direct dans un composant.

### 5.5 Client HTTP — Détails

```typescript
// src/api/client.ts — Helpers typés disponibles :
apiGet<T>(url, params?, options?)     // GET + camelizeKeys
apiPost<T>(url, body?, options?)      // POST + snakifyKeys/camelizeKeys
apiPatch<T>(url, body?, options?)     // PATCH + snakifyKeys/camelizeKeys
apiPut<T>(url, body?, options?)       // PUT + snakifyKeys/camelizeKeys
apiDelete<T>(url, options?)           // DELETE
apiUpload<T>(url, formData, options?) // POST FormData (pas de JSON transform)
```

**Interceptors intégrés :**
- `beforeRequest` : injecte `Authorization: Bearer {token}` + `X-CSRFToken`
- `beforeRetry` : refresh token automatique sur 401 (dédupliqué)
- `afterResponse` : événement `api:forbidden` sur 403
- Retry : 1 tentative sur 401 uniquement

### 5.6 Authentification

| Élément | Détail |
|---------|--------|
| Login | POST `/api/auth/login/` → `{ accessToken, refreshToken, userId, ... }` |
| Refresh | POST `/api/auth/token/refresh/` → `{ access }` |
| Logout | POST `/api/auth/logout/` |
| Profil | GET `/api/auth/profile/` |
| Stockage tokens | `localStorage` (`holly_access_token`, `holly_refresh_token`) |
| CSRF | Cookie `csrftoken` → header `X-CSRFToken` sur mutations |
| Auth state | Zustand store `auth-store.ts` (persisté localStorage `holly-fork-auth`) |
| Guards | `AuthGuard` (vérifie token + profil), `GuestGuard` (redirige si connecté) |

**Trade-off sécurité tokens :** Les JWT sont stockés en `localStorage`, ce qui est vulnérable à une attaque XSS. Pour un SaaS B2B manipulant des données personnelles (réservations clients), des cookies `httpOnly` seraient plus défensifs. Ce choix est conscient : le backend Django envoie les tokens dans le body de la réponse login (pas en cookie), et migrer vers des cookies `httpOnly` nécessite un changement backend. **Mitigation** : s'assurer qu'une CSP stricte est en place, ne jamais injecter de HTML non sanitizé, ne jamais utiliser `dangerouslySetInnerHTML`.

---

## 6. TanStack Query — Conventions

### 6.1 Query Client defaults

```typescript
// src/api/query-client.ts
{
  queries: {
    staleTime: 2 * 60_000,        // 2 min — défaut global
    gcTime: 10 * 60_000,          // 10 min — garbage collect
    refetchOnWindowFocus: false,   // Défaut global off
    retry: 1,                      // 1 retry sur erreur
  },
  mutations: { retry: false }
}
```

### 6.2 staleTime et refetchOnWindowFocus par domaine

Les defaults globaux (2 min, pas de refetch on focus) sont des valeurs de base. Chaque hook DOIT surcharger quand le domaine l'exige :

| Domaine | staleTime | refetchOnWindowFocus | Justification |
|---------|-----------|---------------------|---------------|
| Auth / profil | 5 min | false | Change rarement en session |
| Référentiels (catégories, types employé, méthodes paiement) | 10 min | false | Données quasi-statiques |
| Listes métier (articles, stocks, fournisseurs) | 5 min | false | Changements modérés |
| Réservations, planning | 30 sec | **true** | Données temps réel — un gérant qui revient sur l'onglet doit voir les nouvelles résas |
| Commandes fournisseurs | 60 sec | true | Statuts qui changent |

### 6.3 Query keys — Invalidation

Chaque hook définit un objet `keys` local :

```typescript
const keys = {
  all: () => ["articles"] as const,
  list: (filters?: Record<string, string>) => ["articles", "list", filters] as const,
  detail: (id: number) => ["articles", "detail", id] as const,
}
```

**Règle d'invalidation après mutation :**

L'invalidation avec `queryKey: ["articles"]` invalide TOUT ce qui commence par `"articles"` (listes, détails, filtres). C'est voulu quand une mutation impacte potentiellement toutes les vues du domaine (création, suppression). Pour une mise à jour d'un seul item, invalider précisément :

```typescript
// Création/suppression → invalide tout le domaine (liste + détails)
onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() })

// Mise à jour d'un item → invalide le détail + la liste, pas les autres domaines
onSuccess: (_, { id }) => {
  qc.invalidateQueries({ queryKey: keys.detail(id) })
  qc.invalidateQueries({ queryKey: keys.list() })
}
```

**Note :** l'invalidation TanStack Query fonctionne en **prefix match** par défaut. Donc `qc.invalidateQueries({ queryKey: keys.list() })` invalide `["articles", "list"]`, `["articles", "list", { search: "pizza" }]`, etc. — toutes les variantes filtrées de la liste.

**Ne PAS invalider au-delà du domaine concerné** sauf dépendance explicite documentée (ex: supprimer un article invalide aussi les stocks liés).

### 6.4 Suspense — Position

Le projet utilise `isLoading` / `isError` patterns classiques, pas `useSuspenseQuery`. **Raison** : les pages ont des layouts complexes (sidebar, toolbar) qui doivent rester interactifs pendant le chargement. Suspense avec fallback remplacerait tout le sous-arbre, ce qui est pire pour l'UX. On pourra reconsidérer pour des composants isolés (détail d'un item dans un dialog) au cas par cas, mais ce n'est pas le défaut.

### 6.5 Pattern de hook data

```typescript
export function useArticles() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.all(),
    queryFn: () => fetchAllPages<ApiArticle>("articles/", {}),
    enabled: hasToken,
    staleTime: 5 * 60_000,
  })

  const mapped = useMemo(
    () => (query.data ?? []).map(apiArticleToRecipe),
    [query.data],
  )

  return {
    data: mapped,
    isLoading: query.isLoading,
    error: query.error,
  }
}
```

### 6.6 Mutations — Typage strict

```typescript
// ✅ Correct — type explicite pour les données d'entrée
export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; categorieId: number; price: string }) =>
      apiPost<ApiArticle>("articles/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

// ❌ Interdit — Record<string, unknown> détruit le type safety
mutationFn: (data: Record<string, unknown>) => apiPost(...)
```

---

## 7. Zustand — État synchrone

### 7.1 Stores

| Store | Fichier | Persist | Usage |
|-------|---------|---------|-------|
| Auth | `auth-store.ts` | Oui (localStorage `holly-fork-auth`) | user, isAuthenticated |
| Floor plan | `floor-plan-store.ts` | Non | Plan de salle actif |
| Getting started | `getting-started-store.ts` | Oui | Checklist onboarding |

### 7.2 Règles Zustand

- **UI state only** — Zustand ne contient que de l'état synchrone UI/session. Les données serveur sont dans le cache TanStack Query.
- **Pas de mock data dans les stores** — Les stores `inventory-store`, `recipe-store`, `admin-store` sont du legacy dev mode à supprimer (§17).
- **Pas de logique async** dans les stores — l'async est dans les hooks TanStack Query.
- **Pas de duplication** avec le cache TanStack Query.
- **Reset en tests** : `useXxxStore.setState(initialState)` dans `afterEach`.
- **Sélecteurs atomiques** : `useStore((s) => s.field)` — jamais `useStore()` sans sélecteur.

---

## 8. Composants UI

### 8.1 Source des primitives

Les composants UI dans `src/components/ui/` sont installés via **shadcn** (style `base-maia`) avec **@base-ui/react** comme couche headless.

```bash
# Installer un nouveau composant
npx shadcn@latest add <component>
```

**Config** : `components.json` — style `base-maia`, icônes `hugeicons`, aliases `@/components/ui`.

### 8.2 Conventions composants

```typescript
// ✅ Composant avec data-slot (convention shadcn base-maia)
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("...", className)} {...props} />
}

// ✅ Variantes avec CVA
const buttonVariants = cva("inline-flex items-center ...", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
})
```

### 8.3 Règles composants

- **Props** : utiliser `React.ComponentProps<"element">` pour l'extension native
- **className** : toujours merger avec `cn()` (clsx + tailwind-merge)
- **Pas de `React.FC`** : utiliser des fonctions nommées
- **Pas de default export** pour les composants UI — named exports uniquement
- **forwardRef** : utiliser `ref` prop native (React 19 — pas besoin de `forwardRef`)
- **Composants headless** : `@base-ui/react` pour Dialog, Select, Popover, Menu
- **Pas de Radix** direct : passer par shadcn/base-maia

### 8.4 Icônes

```typescript
import { Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

<HugeiconsIcon icon={Home01Icon} size={20} />
```

---

## 9. Styling — Tailwind CSS v4

### 9.1 Configuration

Tailwind v4 avec le plugin Vite (`@tailwindcss/vite`). La configuration est inline dans `src/index.css`.

### 9.2 Thème

- **Polices** : Cabinet Grotesk (display/headings), Satoshi (sans/body)
- **Couleur primaire** : Flush Orange (palette 11 shades, oklch)
- **Système de couleurs** : CSS variables oklch, light + dark mode (`.dark` class)
- **Radius** : base `0.625rem`, scales sm→4xl

### 9.3 Règles styling

- **Utilitaire `cn()`** : obligatoire pour merger les classes conditionnelles
- **Pas de `@apply`** dans les composants — uniquement dans `index.css` pour les reset/base
- **Pas de CSS modules** — Tailwind uniquement
- **Pas de styles inline** (`style={{}}`) sauf CSS variables dynamiques
- **Classes Tailwind triées** automatiquement par prettier-plugin-tailwindcss
- **Dark mode** : `@custom-variant dark (&:where(.dark, .dark *))`
- **Reduced motion** : respecter `prefers-reduced-motion: reduce` — toute animation doit avoir un fallback `motion-safe:` ou être désactivée via la media query

---

## 10. Routing — React Router v7

### 10.1 Architecture

```typescript
// src/router.tsx — createBrowserRouter
const router = createBrowserRouter([
  {
    element: <AuthGuard />,
    errorElement: <RootErrorBoundary />,     // §12.4
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/reservations", element: <ReservationsPage /> },
          { path: "/planning", lazy: () => import("@/pages/planning") },  // §10.3
          { path: "/cuisine", element: <CartePage /> },
          { path: "/stocks", element: <StocksPage /> },
          { path: "/commandes", element: <CommandesPage /> },
          // ... admin, settings (nested layouts)
        ],
      },
    ],
  },
  {
    element: <GuestGuard />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
])
```

### 10.2 Règles routing

- **Guards** : `AuthGuard` vérifie token + profil, `GuestGuard` redirige si connecté
- **Redirections** : utiliser `Navigate` pour les routes bloquées
- **Params typés** : `useParams()` avec cast explicite
- **Navigation** : `useNavigate()` — jamais de `window.location`

### 10.3 Code splitting — Lazy routes

Les routes contenant des dépendances lourdes DOIVENT être lazy-loadées :

| Route | Dépendance lourde | Lazy obligatoire |
|-------|-------------------|------------------|
| `/salle` | Konva + react-konva | Oui |
| `/planning` | Konva (gantt) | Oui |
| `/` (dashboard) | Recharts + Mapbox GL | Oui |
| `/reservations` | Recharts (gantt) | Oui |

**Critère** : lazy-loader toute route dont les dépendances spécifiques ajoutent > 50kb gzip au bundle. Vite + React Router 7 rendent ça trivial :

```typescript
{ path: "/salle", lazy: () => import("@/pages/salle") }
```

**Budget bundle** : le chunk initial (`dist/index-*.js`) ne doit pas dépasser **250kb gzip**.
- **Vérification manuelle** : `pnpm build && npx vite-bundle-visualizer`
- **Enforcement automatique** : configurer `build.chunkSizeWarningLimit` dans `vite.config.ts` (en kb non-gzip). Quand la CI sera en place, ajouter `size-limit` ou équivalent pour faire échouer le build si le budget est dépassé.

---

## 11. Forms — React Hook Form + Zod

### 11.1 Pattern standard

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Nom requis"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Prix invalide"),
})

type FormValues = z.infer<typeof schema>

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: "" },
  })

  const mutation = useCreateArticle()

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data, {
      onSuccess: () => toast.success("Créé"),
      onError: (err) => handleApiFormError(err, form),
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <Label>Nom</Label>
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Envoi..." : "Créer"}
        </Button>
      </form>
    </Form>
  )
}
```

### 11.2 Mapping erreurs serveur → champs formulaire

Le backend DRF retourne les erreurs de validation en snake_case avec les noms de champs comme clés. Le client les camelise. Pattern pour les mapper sur le formulaire :

```typescript
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { BadRequestError, ValidationError } from "@/api/errors"

function handleApiFormError<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
) {
  if (error instanceof BadRequestError || error instanceof ValidationError) {
    const body = error.body as Record<string, string[]>

    // Erreurs non liées à un champ
    if (body.nonFieldErrors) {
      toast.error(body.nonFieldErrors.join(", "))
      return
    }

    // Mapper chaque champ serveur (déjà camelCase grâce au client)
    // Le cast as Path<T> est nécessaire : le mapping dynamique string → champ typé
    // ne peut pas être vérifié statiquement. C'est l'unique exception au "pas de cast" (§13.2).
    for (const [field, messages] of Object.entries(body)) {
      if (Array.isArray(messages)) {
        form.setError(field as Path<T>, { message: messages[0] })
      }
    }
    return
  }

  // Erreur générique
  toast.error(error instanceof Error ? error.message : "Erreur inattendue")
}
```

### 11.3 Règles forms

- **Validation** : Zod schema OBLIGATOIRE pour tout formulaire
- **Types** : inférés depuis le schema (`z.infer<typeof schema>`)
- **Loading state** : désactiver le bouton submit pendant `mutation.isPending`
- **defaultValues** : toujours fournir des valeurs par défaut explicites

---

## 12. Gestion des erreurs

### 12.1 Hiérarchie des erreurs

```typescript
// src/api/errors.ts
ApiError (base — status, body, message)
├── BadRequestError     (400)
├── UnauthorizedError   (401)
├── ForbiddenError      (403)
├── NotFoundError       (404)
├── ValidationError     (422)
└── ServerError         (5xx)
```

### 12.2 Réaction par status

| Status | Réaction |
|--------|----------|
| 400 | Toast erreur + mapper les erreurs sur les champs si formulaire (§11.2) |
| 401 | Refresh token auto → retry → si échec : redirect `/login` |
| 403 | Event `api:forbidden` → toast "Accès refusé" — NE PAS retry |
| 404 | État "introuvable" dans le composant |
| 422 | Mapper les erreurs serveur sur les champs du formulaire (§11.2) |
| 5xx | Toast "Erreur serveur" |

### 12.3 Règles

- JAMAIS de `throw new Error("message")` — utiliser `createApiError(status, body)`
- JAMAIS de `try/catch` autour d'un `useQuery` — TanStack Query gère les erreurs
- Pour les mutations : `onError` callback dans `useMutation` ou dans `mutation.mutate(data, { onError })`
- `extractApiError(error)` dans `src/api/client.ts` pour extraire un message humain

### 12.4 Error boundaries

Chaque niveau de route doit avoir un error boundary pour éviter qu'un crash dans une page ne casse toute l'app :

```typescript
// src/components/shared/route-error-boundary.tsx
function RouteErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground mt-2">Rechargez la page ou contactez le support.</p>
      <Button onClick={() => window.location.reload()} className="mt-4">
        Recharger
      </Button>
    </div>
  )
}
```

**Placement :**
- `errorElement` sur la route racine protégée (catch-all)
- `errorElement` sur chaque route avec dépendance lourde (Konva, Mapbox) pour isoler les crashes

---

## 13. TypeScript — Règles strictes

### 13.1 Configuration active

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

### 13.2 Règles

- **Pas de `any`** — utiliser `unknown` + type guard si le type est inconnu
- **Pas de `as` cast** — Si un type Orval est incorrect, corriger l'OpenAPI spec backend et régénérer. Si c'est un type runtime (ex: `useParams()`), utiliser un type guard ou Zod parse. **Unique exception** : `as Path<T>` dans `handleApiFormError` (§11.2) — mapping dynamique string → champ typé, borné et localisé.
- **Pas de `!` non-null assertion** sauf dans les `queryFn` quand `enabled` garantit la valeur (ex: `restaurantId!` quand `enabled: !!restaurantId`)
- **Pas de fichiers `.d.ts` manuels** — types dans `.ts` avec `type` keyword
- **Import type** : utiliser `import type { X }` quand seul le type est utilisé
- **Types domaine** : définis dans `src/components/{domaine}/types.ts`
- **Types API** : générés par Orval dans `src/api/generated/schemas/`, ou manuels dans les hooks quand le type Orval n'existe pas ou est insuffisant

---

## 14. Tests

### 14.1 Stack de test

| Outil | Usage |
|-------|-------|
| Vitest 4 | Runner + assertions |
| @testing-library/react | Rendu composants |
| @testing-library/user-event | Interactions utilisateur |
| MSW 2 | Mock des appels API (handlers) |

### 14.2 Configuration

```typescript
// vite.config.ts
test: {
  globals: true,           // describe, it, expect globaux
  environment: "jsdom",
  setupFiles: "./src/test/setup.ts",
  coverage: {
    provider: "v8",
    include: ["src/**"],
    exclude: ["src/api/generated/**", "src/test/**"],
  },
}
```

### 14.3 Setup test (`src/test/setup.ts`)

- Import `@testing-library/jest-dom/vitest` (matchers DOM)
- MSW server lifecycle : `beforeAll(listen)`, `afterEach(cleanup + resetHandlers)`, `afterAll(close)`
- `localStorage.clear()` après chaque test

### 14.4 Render helper (`src/test/render.tsx`)

```typescript
renderWithProviders(ui, { routerProps })
// Wrap avec : QueryClientProvider (retry: false, gcTime: 0) + ThemeProvider + MemoryRouter
```

### 14.5 Structure des tests

```
src/__tests__/
├── integration/              # Tests flux complets (hook + API + MSW)
│   ├── auth/                 # login, logout, guard
│   ├── stocks/               # stock-queries
│   ├── restaurants/          # restaurant-queries, orval-hooks
│   ├── carte/                # carte-queries
│   ├── commandes/            # commandes-queries
│   ├── planning/             # planning-queries
│   ├── reservations/         # reservation-queries
│   └── ...                   # + settings, factures, paiements, admin, etc.
├── copy/                     # Tests des textes UI
├── portion-utils.test.ts     # Tests utilitaires
├── use-*.test.ts             # Tests hooks utilitaires
└── ...

src/test/
├── setup.ts                  # Setup global
├── server.ts                 # MSW server avec tous les handlers
├── render.tsx                # Helper de rendu
└── handlers/                 # MSW handlers par domaine
```

### 14.6 Règles de test

1. **MSW obligatoire** pour mocker les appels API — ne pas mocker les modules `src/api/*` avec `vi.mock()`. `vi.mock()` reste acceptable pour des utilitaires non-API (ex: `Date.now()`, `window.matchMedia`).
2. **Comportement, pas implémentation** — tester ce que l'utilisateur voit/fait
3. **`userEvent`** plutôt que `fireEvent` — simule le comportement réel
4. **Chaque hook data** doit avoir un test d'intégration (MSW handler + renderHook)
5. **Pattern de test hook** :

```typescript
describe("Stock queries (API mode)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches stocks with camelized keys", async () => {
    const { result } = renderHook(
      () => useStocks(1),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(3)
  })
})
```

### 14.7 Commandes

```bash
pnpm test              # Run tous les tests une fois
pnpm test:watch        # Mode watch
pnpm test:cov          # Avec couverture
```

---

## 15. Accessibilité (a11y)

### 15.1 Obligations

Pour un SaaS B2B utilisé par des gérants de restaurants (profils variés, parfois sur tablette en conditions de luminosité difficiles), l'accessibilité est une obligation, pas un nice-to-have.

### 15.2 Règles

| Règle | Détail |
|-------|--------|
| Labels | Tout input interactif doit avoir un label associé (visible ou `aria-label`) |
| Contraste | Respecter WCAG AA minimum (ratio 4.5:1 pour le texte, 3:1 pour les grands titres) |
| Focus visible | Tout élément interactif doit avoir un focus ring visible (Tailwind `focus-visible:ring-*`) |
| Navigation clavier | Tab, Enter, Escape doivent fonctionner sur tous les dialogs, menus, popovers |
| Reduced motion | Toute animation respecte `prefers-reduced-motion: reduce` |
| Headings | Hiérarchie h1→h6 logique sur chaque page |
| Rôles ARIA | Utiliser les rôles sémantiques natifs (`button`, `nav`, `main`) en priorité sur les rôles ARIA |

### 15.3 Vérification

- **Statique** : `eslint-plugin-jsx-a11y` dans la config ESLint (à ajouter). Catch les erreurs évidentes (img sans alt, onClick sur div sans role).
- **Runtime en test** : `vitest-axe` ou `jest-axe` pour les tests de composants critiques (formulaires, dialogs). Pas sur tous les composants — cibler les flux utilisateur principaux.
- **Manuelle** : navigation clavier complète sur chaque nouveau formulaire/dialog avant merge.

### 15.4 Piège connu Base UI

Ne pas utiliser `Field`/`FieldLabel` de Base UI quand l'input a besoin d'un `aria-label` propre — le `aria-labelledby` généré par `Field` prend le dessus et écrase le `aria-label`.

---

## 16. Conventions de nommage

### 16.1 Fichiers

| Type | Convention | Exemple |
|------|-----------|---------|
| Composants UI | kebab-case | `button.tsx`, `alert-dialog.tsx` |
| Pages | kebab-case | `dashboard.tsx`, `etablissement-detail.tsx` |
| Hooks | `use-` + kebab-case | `use-articles.ts`, `use-stocks.ts` |
| Stores | kebab-case + `-store` | `auth-store.ts` |
| Types | kebab-case | `types.ts` dans le dossier domaine |
| Tests | suffixe `.test.ts(x)` | `login.test.tsx`, `stock-queries.test.ts` |
| Générés (Orval) | kebab-case par tag | `articles.ts`, `restaurants.ts` |

### 16.2 Code

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants React | PascalCase | `DashboardPage`, `StockCard` |
| Hooks | camelCase `use` prefix | `useArticles()`, `useCreateOrder()` |
| Types/Interfaces | PascalCase | `ApiArticle`, `Recipe`, `AuthUser` |
| Constantes | SCREAMING_SNAKE ou camelCase | `MOCK_RECIPES`, `keys` |
| Functions | camelCase | `apiArticleToRecipe()`, `fetchAllPages()` |
| Query keys | objet `keys` local | `keys.all()`, `keys.detail(id)` |
| Props type | inline ou `{Component}Props` | `CardProps` |

### 16.3 Langue — Ubiquitous Language

Les noms de dossiers domaine (`carte/`, `commandes/`, `salle/`, `planning/`, `reservations/`, `stock/`) sont en français car ils font partie du **langage métier partagé** (ubiquitous language au sens DDD) entre le frontend, le backend, et les utilisateurs. Ce sont les mêmes termes que dans l'UI, l'API (`/api/commandes/`, `/api/reservations/`), et les conversations avec les utilisateurs.

**Règle :** Les noms de domaine métier restent en français partout (dossiers, routes URL, tags API). Le reste du code (variables, fonctions, commentaires techniques) est en anglais.

```typescript
// ✅ Correct — domaine en français, code en anglais
src/components/carte/          // domaine métier
function apiArticleToRecipe()  // fonction en anglais

// ❌ Incorrect
src/components/menu/           // ne correspond pas au terme métier utilisé
const statutCommande = "en_attente"  // variable en français

// ⚠️ Valeurs de statut : utiliser les valeurs exactes du backend.
// Le backend Django renvoie status: "DRAFT", "SENT", "DELIVERED", etc.
// Le frontend les mappe vers des valeurs internes si besoin, mais les
// noms de variables restent en anglais.
const status = order.status           // ✅ "DRAFT" (valeur backend)
const mapped = STATUS_MAP[status]     // ✅ "pending" (valeur UI interne)
```

### 16.4 Imports

```typescript
// ✅ Toujours utiliser l'alias @/
import { Button } from "@/components/ui/button"
import { useArticles } from "@/hooks/use-articles"
import { cn } from "@/lib/utils"

// ❌ Jamais d'imports relatifs traversant les dossiers
import { Button } from "../../../components/ui/button"
```

---

## 17. Dev Mode — Architecture cible

### 17.1 Situation actuelle (legacy)

Le dev mode actuel utilise des mock stores Zustand (`inventory-store`, `recipe-store`, `admin-store`) + un branchement `if (isDevMode)` dans chaque hook. Ce système pose des problèmes :
- **Duplication** : chaque hook a 3 sources de vérité (code prod, mock Zustand, handler MSW pour les tests)
- **Coût runtime** : chaque hook lit `isDevMode` et un store Zustand même en production (early return mais le hook Zustand est quand même exécuté)
- **`source: "api" | "mock"`** dans le retour des hooks fait fuiter la logique dev jusque dans les composants

### 17.2 Architecture cible

**MSW browser worker pour le dev offline.** MSW tourne déjà pour les tests (setupServer). Il peut aussi tourner en dev dans le navigateur (setupWorker) avec les mêmes handlers.

```
Tests     : MSW setupServer (node)     → handlers de test
Dev local : MSW setupWorker (browser)  → mêmes handlers + données fixtures
Production : pas de MSW, pas de dev mode
```

**Bénéfices** : une seule source de mock data (handlers MSW), les hooks n'ont plus de branchement devMode, le code prod est identique en dev et en prod.

**Migration — Checklist (4 PRs) :**

1. **PR "msw-browser-setup"** — Configurer MSW `setupWorker` en dev (`src/mocks/browser.ts`). Réutiliser les handlers Orval générés (`*.msw.ts`) comme base, compléter avec des fixtures réalistes pour les endpoints non couverts. Les fixtures vivent dans `src/test/fixtures/` (partagées entre test et dev).
2. **PR "hooks-remove-devmode"** — Supprimer `isDevMode` / `useDevModeStore` / `source` de tous les hooks data (24 hooks). Les hooks appellent toujours l'API — MSW intercepte en dev.
3. **PR "delete-mock-stores"** — Supprimer `inventory-store.ts`, `recipe-store.ts`, `admin-store.ts` et toute la mock data qu'ils contiennent. Supprimer les imports correspondants.
4. **PR "devmode-toggle-msw"** — Le toggle `useDevModeStore` active/désactive le MSW worker. Il ne touche plus aux hooks.

### 17.3 Toggle dev mode

Le toggle `useDevModeStore` reste pour activer/désactiver le MSW worker en dev. Il ne doit plus être lu par les hooks data. Le guard auth est toujours bypassé en dev mode.

**Protection prod :** Le store `useDevModeStore` doit vérifier `import.meta.env.DEV` avant d'autoriser l'activation. Comme le store est persisté en localStorage, un toggle activé en dev puis un build prod réutiliserait le même localStorage. Le store DOIT ignorer la valeur persistée si `import.meta.env.DEV === false` :

```typescript
// Dans le store Zustand
isDevMode: import.meta.env.DEV ? persisted.isDevMode : false
```

---

## 18. Proxy & Backend

### 18.1 Proxy Vite (développement)

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
}
```

### 18.2 Backend Django

- **URL** : `http://localhost:8000/api/`
- **Swagger UI** : `http://localhost:8000/api/docs/`
- **Schema OpenAPI** : `http://localhost:8000/api/schema/?format=openapi-json`
- **Swagger JSON local** : `docs/api/swagger.json` (copie locale pour référence, distinct de `openapi.json` utilisé par Orval)
- **Auth** : JWT (access + refresh tokens)
- **Pagination** : `PageNumberPagination` — `PAGE_SIZE=20` (forcé côté serveur)
- **Réponses** : snake_case (transformé en camelCase par le client)

---

## 19. Observabilité & Monitoring

### 19.1 Situation actuelle

Aucun outil de monitoring frontend en place. Pour un SaaS B2B en production, c'est un trou à combler.

### 19.2 Cible minimum

- **Error tracking** : Sentry (ou équivalent) pour capturer les erreurs JS non gérées + les erreurs API 5xx. **À installer avant le premier client payant.** Quand Sentry sera en place, ajouter `Sentry.captureException(error)` dans le `RouteErrorBoundary` (§12.4).
- **Analytics basique** : pas nécessaire tant que le produit est en phase de lancement. À ajouter quand il y aura des utilisateurs réels à observer.
- **Feature flags** : pas nécessaire tant que l'équipe est petite (1-3 devs) et que le déploiement est continu. À reconsidérer si un besoin de rollback progressif ou de A/B test émerge.

---

## 20. Patterns d'import — Ordre

```typescript
// 1. React et React DOM
import { useState, useMemo } from "react"

// 2. Bibliothèques tierces
import { useQuery, useMutation } from "@tanstack/react-query"
import { z } from "zod"

// 3. Alias @/ — API, stores, hooks
import { apiGet } from "@/api/client"
import { useAuthStore } from "@/stores/auth-store"
import { useArticles } from "@/hooks/use-articles"

// 4. Alias @/ — Composants
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 5. Alias @/ — Types (import type)
import type { Recipe } from "@/components/carte/types"
import type { PaginatedResponse } from "@/api/types"

// 6. Relatifs (même dossier uniquement)
import { MOCK_DATA } from "./data"
import type { LocalType } from "./types"
```

---

## 21. Known Issues / Gotchas

| Gotcha | Détail | Réf. |
|--------|--------|------|
| Base UI `Field`/`FieldLabel` vs `aria-label` | Le `aria-labelledby` généré par `Field` écrase tout `aria-label` sur l'input. Utiliser un label visible ou `aria-label` directement sans `Field` wrapper. | §15.4 |
| `fetchAllPages` sur listes non bornées | La safety limit est à 50 pages (1000 items). Au-delà, les données sont silencieusement tronquées. Ne l'utiliser que pour les listes bornées. | §5.4 r.5 |
| Zustand `persist` + `import.meta.env.DEV` | Le store dev mode est persisté en localStorage. Un toggle activé en dev reste dans le storage après un build prod. Le store doit hardcoder `false` si `!import.meta.env.DEV`. | §17.3 |
| `camelizeKeys` sur les valeurs enum | Le case transform ne touche que les clés, pas les valeurs. Les statuts backend (`"DRAFT"`, `"DELIVERED"`) restent en majuscules. Ne pas s'attendre à du camelCase sur les valeurs. | §5.4 r.4 |
| Motion (Framer) `ease` typing | Le type `Easing` de Motion n'accepte pas `number[]` directement. Utiliser `ease: [0.4, 0, 0.2, 1] as const` ou un preset nommé. Bug TS actuel dans `configuration.tsx`. | — |

---

## 22. Sécurité — Règles pour les développeurs

> Pour le document complet à destination de l'équipe cyber (modèle de menaces, surface d'attaque, audit checklist), voir [`docs/SECURITY.md`](docs/SECURITY.md).

### 22.1 Règles impératives

| Règle | Détail |
|-------|--------|
| **Pas de `dangerouslySetInnerHTML`** | Interdit sauf cas exceptionnel documenté et revu. Si absolument nécessaire, sanitizer avec DOMPurify AVANT injection. Seule exception actuelle : `chart.tsx` (CSS variables, pas de user input). |
| **Pas de secrets côté client** | Les variables `VITE_*` sont injectées dans le bundle JS et visibles par tous. Ne JAMAIS mettre de clés privées, mots de passe, ou tokens serveur dans `.env`. Seules les clés publiques (Mapbox public token) sont acceptables. |
| **Pas de HTML dans les données utilisateur** | Les textes affichés (noms de restaurant, notes, descriptions) sont rendus comme texte brut par React. Ne jamais les passer par `innerHTML`, `dangerouslySetInnerHTML`, ou un parser HTML. |
| **Pas de `eval()`, `new Function()`, ou `document.write()`** | Jamais. Sans exception. |
| **URLs utilisateur : valider le protocole** | Si une URL vient de l'utilisateur (ex: site web du restaurant), vérifier qu'elle commence par `https://` ou `http://` avant de la mettre dans un `href`. Ne jamais permettre `javascript:`. |
| **Formulaires : validation Zod côté client + DRF côté serveur** | La validation Zod est un confort UX, pas une protection. Le backend DOIT toujours re-valider. Ne jamais faire confiance à une donnée venant du frontend. |

### 22.2 Authentification — Règles

- **Tokens JWT en `localStorage`** — Trade-off documenté (§5.6). La protection repose sur l'absence d'injection XSS.
- **Refresh token** — Rotation automatique sur 401. Si le refresh échoue, nettoyage complet (`clearTokens()` + `clearUser()`) et redirection `/login`.
- **CSRF** — Cookie `csrftoken` extrait et injecté comme header `X-CSRFToken` sur toutes les mutations (POST/PUT/PATCH/DELETE). Géré automatiquement par le client ky.
- **Dev mode** — Le toggle DOIT être gardé par `import.meta.env.DEV`. Le store Zustand DOIT ignorer la valeur persistée en production (§17.3).

### 22.3 CSP (Content Security Policy)

**Statut actuel : NON IMPLÉMENTÉE.** C'est la priorité sécurité n°1 à implémenter.

La CSP cible pour le déploiement (Vercel headers ou `<meta>` tag) :

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://*.mapbox.com;
connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://data.geopf.fr;
worker-src 'self' blob:;
frame-src 'none';
object-src 'none';
base-uri 'self';
```

**À configurer dans `vercel.json`** (headers) ou en `<meta http-equiv="Content-Security-Policy">` dans `index.html`.

### 22.4 Dépendances

- **Audit régulier** : exécuter `pnpm audit` avant chaque release. Zéro vulnérabilité `high` ou `critical` acceptée en prod.
- **Mise à jour** : les dépendances avec CVE connue doivent être mises à jour dans les 48h (critical) ou 1 semaine (high).
- **CI (quand en place)** : ajouter `pnpm audit --audit-level=high` comme étape bloquante.

### 22.5 Cookies

Le frontend ne set qu'un cookie non-sensible (`sidebar_state`). Règles pour tout futur cookie côté client :
- `SameSite=Strict` (ou `Lax` si cross-origin nécessaire)
- `Secure` (HTTPS uniquement en prod)
- Pas de données sensibles dans les cookies client — les tokens sont en localStorage (pas en cookie).

---

## 23. Règles d'or — Résumé

1. **Le backend est la source de vérité** — le frontend consomme, ne décide pas du format des données. Si un type Orval est faux, corriger le schema OpenAPI backend.
2. **Ne jamais modifier `src/api/generated/`** — régénérer avec `pnpm gen:api`.
3. **Un hook = un domaine** — pas de hooks fourre-tout. Critère hook custom vs Orval direct : §5.3.
4. **Zustand pour l'UI, TanStack Query pour les données serveur** — pas de mélange. Pas de mock data dans les stores.
5. **MSW comme source unique de mock** — en test (setupServer) et en dev (setupWorker). Pas de dual system mock stores + MSW.
6. **Composants shadcn (base-maia) pour les primitives** — ne pas réinventer la roue.
7. **TypeScript strict, pas de `any`, pas de `as` cast** — corriger la source plutôt que masquer.
8. **Tailwind uniquement pour le styling** — pas de CSS modules, pas de styled-components.
9. **Ubiquitous language** — domaines métier en français (carte, commandes, salle...) car c'est le langage partagé. Code technique en anglais.
10. **Tester le comportement, pas l'implémentation** — MSW pour l'API, `userEvent` pour les interactions.
11. **Error boundaries par route** — un crash dans `/salle` ne doit pas casser `/planning`.
12. **Lazy-loader les routes lourdes** — Konva, Mapbox, Recharts ne doivent pas être dans le bundle initial.
13. **`fetchAllPages` uniquement pour les listes bornées** (< 200 items en prod). Pagination UI pour le reste.
14. **Accessibilité** — labels, contraste WCAG AA, focus visible, navigation clavier.

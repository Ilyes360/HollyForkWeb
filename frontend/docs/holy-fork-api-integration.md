# Holy Fork — Méthodologie d'intégration de l'API Holly Pi

Ce document est la référence opérationnelle pour intégrer l'API Holly Pi (~150 endpoints, 28 tags) dans le dashboard React Holy Fork. Il s'utilise dans cet ordre : Phase 0 → Phase 6 d'abord, puis répétition de la Phase 6 pour chaque feature.

**Principe directeur** : on génère depuis la spec OpenAPI tout ce qui peut l'être, on ne réécrit à la main que ce qui apporte une vraie valeur (logique métier, edge cases). Zéro type API écrit à la main, zéro fonction `fetch`/`ky` directe dans un composant.

**Première feature pilote** : authentification (login + refresh + logout + profile). Si le pattern marche sur l'auth, il marche partout.

---

## Sommaire

1. [Stack finale et décisions](#stack-finale-et-décisions)
2. [Phase 0 — Préparation du repo](#phase-0--préparation-du-repo)
3. [Phase 1 — Configuration orval (génération depuis OpenAPI)](#phase-1--configuration-orval-génération-depuis-openapi)
4. [Phase 2 — Infrastructure API (mutator ky + erreurs + query client)](#phase-2--infrastructure-api-mutator-ky--erreurs--query-client)
5. [Phase 3 — Setup tests (Vitest + MSW)](#phase-3--setup-tests-vitest--msw)
6. [Phase 4 — Fichiers de cadrage pour Claude Code](#phase-4--fichiers-de-cadrage-pour-claude-code)
7. [Phase 5 — Implémentation auth (feature pilote)](#phase-5--implémentation-auth-feature-pilote)
8. [Phase 6 — Critères de validation avant de passer à la suite](#phase-6--critères-de-validation-avant-de-passer-à-la-suite)
9. [Phase 7 — Workflow récurrent pour les features suivantes](#phase-7--workflow-récurrent-pour-les-features-suivantes)
10. [Annexes](#annexes)

---

## Stack finale et décisions

| Couche | Outil | Décision |
|---|---|---|
| HTTP | `ky` | déjà installé, gardé |
| Génération API | `orval` | à installer — types + hooks TanStack Query + handlers MSW depuis `/api/schema/` |
| Validation runtime | `zod` v4 | déjà installé — utilisé **uniquement** sur les endpoints critiques (auth, paiements, factures), pas sur tous |
| Data fetching | `@tanstack/react-query` | déjà installé, hooks générés par orval |
| State client | `zustand` | déjà installé — auth (tokens en mémoire) + UI préférences uniquement |
| Forms | `react-hook-form` + `@hookform/resolvers` | déjà installés, validation via Zod |
| Tests unitaires/intégration | `vitest` + `@testing-library/react` | déjà installés |
| Mock API | `msw` | à installer |
| User events | `@testing-library/user-event` | à installer |

Décisions structurantes :

- **Tokens en mémoire (Zustand)** + refresh token dans **cookie httpOnly** côté backend si possible. Si le backend ne pose pas de cookie httpOnly, on accepte `localStorage` pour le refresh token uniquement, jamais l'access token. À clarifier avec le backend Django.
- **Pas d'E2E Playwright pour le moment.** On vise les tests d'intégration RTL + MSW. Playwright sera ajouté plus tard sur 4-5 parcours critiques uniquement.
- **Pas de TDD strict.** On écrit le code et les tests dans la même session, mais on ne fait pas RED→GREEN→REFACTOR sur chaque endpoint. Les tests d'intégration arrivent juste après le composant fonctionnel.
- **Coverage cible : 70% global, 90% sur `features/auth/` et `features/factures/`.** Les domaines purement CRUD sans logique métier n'ont pas besoin de 90%.

---

## Phase 0 — Préparation du repo

### 0.1 Installer les dépendances manquantes

```bash
pnpm add -D orval msw @testing-library/user-event @vitest/coverage-v8
```

### 0.2 Créer la structure de dossiers

```bash
mkdir -p src/api src/test src/features/auth/{components,hooks,pages} docs/api docs/pages
touch CLAUDE.md
```

### 0.3 Variables d'environnement

Créer `.env.local` (à mettre dans `.gitignore` s'il ne l'est pas déjà) :

```
VITE_API_URL=http://localhost:8000/api
VITE_API_OPENAPI_URL=http://localhost:8000/api/schema/?format=openapi-json
```

### 0.4 Vérifier l'accès à la spec OpenAPI

```bash
curl -s "$VITE_API_OPENAPI_URL" | head -c 200
```

Si la spec n'est pas accessible (auth requise, CORS, etc.), récupérer le JSON manuellement et le placer dans `docs/api/openapi.json`. orval pourra pointer vers ce fichier local.

---

## Phase 1 — Configuration orval (génération depuis OpenAPI)

### 1.1 `orval.config.ts` à la racine

```ts
import { defineConfig } from 'orval';

export default defineConfig({
  'holly-pi': {
    input: {
      target: process.env.VITE_API_OPENAPI_URL ?? './docs/api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/schemas',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: './src/api/mutator.ts',
          name: 'kyMutator',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: false,
          signal: true,
          options: {
            staleTime: 60_000,
          },
        },
      },
      mock: {
        type: 'msw',
        useExamples: true,
      },
      prettier: true,
      clean: true,
    },
  },
});
```

### 1.2 Ajouter le script de génération

Dans `package.json` :

```json
"scripts": {
  "gen:api": "orval --config ./orval.config.ts",
  "gen:api:watch": "orval --config ./orval.config.ts --watch"
}
```

### 1.3 Premier run et vérification

```bash
pnpm gen:api
```

Le dossier `src/api/generated/endpoints/` doit contenir un fichier par tag (`auth.ts`, `commandes.ts`, etc.) avec : un type pour chaque payload/réponse, une fonction fetch, un hook TanStack Query (`useGetAuthProfile`, `useLoginAuth`, etc.) et des handlers MSW (`getAuthMSW()`).

**Si la génération Zod runtime est nécessaire** (point ouvert : orval/zod et Zod 4 ne sont pas encore garantis compatibles selon la version d'orval), on commence sans et on ajoute des schémas Zod **à la main** dans Phase 5 uniquement pour les endpoints auth critiques. Si orval 7+ supporte Zod 4 au moment où tu lis, ajouter une seconde entrée `'holly-pi-zod'` dans `orval.config.ts` avec `client: 'zod'`.

### 1.4 Ajouter `src/api/generated/` à `.gitignore` ?

**Non.** On commit le code généré. Avantages :
- Diff visible dans les PR quand l'API change
- Pas besoin de regénérer après un `pnpm install`
- CI plus simple

Pour s'assurer qu'il est à jour, ajouter une étape CI :

```yaml
# .github/workflows/ci.yml (extrait)
- run: pnpm gen:api
- run: git diff --exit-code src/api/generated || (echo "Code généré obsolète, lance 'pnpm gen:api'" && exit 1)
```

---

## Phase 2 — Infrastructure API (mutator ky + erreurs + query client)

### 2.1 `src/api/errors.ts`

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${status}`);
    this.name = 'ApiError';
  }
}

export class BadRequestError extends ApiError {
  constructor(body: unknown) {
    super(400, body, 'Bad request');
    this.name = 'BadRequestError';
  }
}
export class UnauthorizedError extends ApiError {
  constructor(body: unknown) {
    super(401, body, 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}
export class ForbiddenError extends ApiError {
  constructor(body: unknown) {
    super(403, body, 'Forbidden');
    this.name = 'ForbiddenError';
  }
}
export class NotFoundError extends ApiError {
  constructor(body: unknown) {
    super(404, body, 'Not found');
    this.name = 'NotFoundError';
  }
}
export class ConflictError extends ApiError {
  constructor(body: unknown) {
    super(409, body, 'Conflict');
    this.name = 'ConflictError';
  }
}
export class ValidationError extends ApiError {
  constructor(body: unknown) {
    super(422, body, 'Validation error');
    this.name = 'ValidationError';
  }
}
export class ServerError extends ApiError {
  constructor(status: number, body: unknown) {
    super(status, body, 'Server error');
    this.name = 'ServerError';
  }
}

export function createApiError(status: number, body: unknown): ApiError {
  switch (status) {
    case 400: return new BadRequestError(body);
    case 401: return new UnauthorizedError(body);
    case 403: return new ForbiddenError(body);
    case 404: return new NotFoundError(body);
    case 409: return new ConflictError(body);
    case 422: return new ValidationError(body);
    default:
      if (status >= 500) return new ServerError(status, body);
      return new ApiError(status, body);
  }
}
```

### 2.2 `src/api/mutator.ts` (instance ky + adaptateur orval)

```ts
import ky, { HTTPError } from 'ky';
import { useAuthStore } from '@/features/auth/auth.store';
import { createApiError } from './errors';

const API_URL = import.meta.env.VITE_API_URL;

let refreshPromise: Promise<boolean> | null = null;

async function getOrRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = useAuthStore
    .getState()
    .refresh()
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export const kyClient = ky.create({
  prefixUrl: API_URL,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token && !request.headers.has('Authorization')) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return response;
        // Endpoint refresh lui-même : ne pas boucler
        if (request.url.includes('/auth/token/refresh')) return response;

        const refreshed = await getOrRefreshToken();
        if (!refreshed) {
          useAuthStore.getState().clear();
          return response;
        }
        const newToken = useAuthStore.getState().accessToken;
        if (!newToken) return response;
        request.headers.set('Authorization', `Bearer ${newToken}`);
        return ky(request);
      },
    ],
  },
});

type MutatorConfig = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, unknown>;
  data?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function kyMutator<T>(config: MutatorConfig): Promise<T> {
  const { url, method, params, data, signal, headers } = config;
  const cleanedUrl = url.replace(/^\//, '');

  try {
    const response = await kyClient(cleanedUrl, {
      method,
      searchParams: params as Record<string, string | number | boolean>,
      json: data,
      signal,
      headers,
    });
    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return undefined as T;
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof HTTPError) {
      let body: unknown = null;
      try {
        body = await err.response.json();
      } catch {
        body = await err.response.text().catch(() => null);
      }
      throw createApiError(err.response.status, body);
    }
    throw err;
  }
}
```

### 2.3 `src/api/query-client.ts`

```ts
import { QueryClient } from '@tanstack/react-query';
import { UnauthorizedError } from './errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof UnauthorizedError) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
```

### 2.4 Brancher dans `src/main.tsx`

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api/query-client';

const queryClient = createQueryClient();

// <QueryClientProvider client={queryClient}> autour de l'app
```

---

## Phase 3 — Setup tests (Vitest + MSW)

### 3.1 `vitest.config.ts` à la racine

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'src/api/generated/**',
        'src/test/**',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 70,
        branches: 65,
        functions: 70,
        statements: 70,
      },
    },
  },
});
```

### 3.2 `src/test/server.ts`

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 3.3 `src/test/handlers.ts`

```ts
import { getAuthMock } from '@/api/generated/endpoints/auth.msw';
// Au fur et à mesure :
// import { getCommandesMock } from '@/api/generated/endpoints/commandes.msw';

export const handlers = [
  ...getAuthMock(),
  // ...getCommandesMock(),
];
```

> Si orval n'est pas configuré pour générer les MSW mocks, créer des handlers manuels minimaux pour auth dans ce fichier (cf. Phase 5).

### 3.4 `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server';
import { useAuthStore } from '@/features/auth/auth.store';

// Polyfill matchMedia pour jsdom
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.getState().clear();
});

afterAll(() => server.close());
```

### 3.5 `src/test/test-wrapper.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

interface TestWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

export function TestWrapper({
  children,
  initialEntries = ['/'],
}: TestWrapperProps) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactNode,
  options?: { initialEntries?: string[] },
) {
  return <TestWrapper initialEntries={options?.initialEntries}>{ui}</TestWrapper>;
}
```

### 3.6 Ajouter scripts dans `package.json`

```json
"test": "vitest run",
"test:watch": "vitest",
"test:cov": "vitest run --coverage"
```

---

## Phase 4 — Fichiers de cadrage pour Claude Code

### 4.1 `CLAUDE.md` à la racine

```markdown
# Holy Fork — Conventions et règles strictes

Ce fichier est lu par Claude Code à chaque session. Toute violation est un bug.

## Architecture

- Stack : React 19 + Vite + TS strict + TanStack Query + ky + Zustand + Zod + Tailwind v4 + shadcn.
- Tout type/payload/réponse de l'API Holly Pi est importé depuis `@/api/generated`. Ne JAMAIS écrire un type qui décrit une route API à la main.
- Les composants n'appellent jamais `ky` ni `fetch` directement. Ils passent par un hook : soit un hook généré (`useGetXxx`, `usePostXxx`), soit un hook composé dans `features/DOMAIN/hooks/`.
- Aucun composant n'importe directement depuis `src/api/generated/endpoints/`. Il importe depuis `features/DOMAIN/hooks/index.ts` qui ré-exporte/compose.
- Tokens d'accès : en mémoire dans `useAuthStore` UNIQUEMENT. Jamais `localStorage` pour l'access token.

## Structure d'une feature

```
src/features/DOMAIN/
├── DOMAIN.store.ts           # Zustand si état client nécessaire (sinon omettre)
├── DOMAIN.schemas.ts         # Schémas Zod manuels SI domaine critique (auth, paiements, factures)
├── hooks/
│   ├── index.ts              # ré-exports
│   └── use-XXX.ts            # hooks composés à partir des hooks générés
├── components/               # composants spécifiques au domaine
├── pages/                    # composants de page (1 par route)
└── __tests__/
    └── DOMAIN.integration.test.tsx
```

## Tests

- Toute page nouvelle ou modifiée doit avoir un test d'intégration RTL + MSW couvrant : happy path, état loading, état erreur API (401 + 500), état empty si pertinent.
- `userEvent` exclusivement (pas `fireEvent`).
- Pas de mocks manuels de `ky` ou `fetch`. Utiliser MSW via `server.use(...)` pour overrider un handler dans un test.
- Avant de marquer une tâche comme terminée : `pnpm typecheck && pnpm lint && pnpm test` doivent passer.

## Nommage

- Hooks composés : `useLogin`, `useCurrentUser`, `useCommandes` (préfixe `use`, pas de suffixe `Mutation`/`Query` sauf si ambigu).
- Schémas Zod manuels : `loginRequestSchema`, `userProfileResponseSchema` (suffixe `Schema`).
- Types dérivés : `type LoginRequest = z.infer<typeof loginRequestSchema>`.
- Erreurs typées : utiliser les classes de `@/api/errors`. Ne jamais `throw new Error("...")` dans la couche API.

## Workflow par page

Pour chaque nouvelle page :

1. Lire `docs/pages/<page>.md` (spec courte de la page).
2. Identifier les hooks générés à utiliser (`grep -r "use[A-Z].*" src/api/generated/endpoints/`).
3. Implémenter d'abord les hooks composés dans `features/DOMAIN/hooks/`.
4. Implémenter la page.
5. Écrire les tests d'intégration.
6. Lancer `pnpm typecheck && pnpm lint && pnpm test -- features/DOMAIN`.
7. Si tout passe : commit. Sinon, itérer.

## Tâches interdites sans demande explicite

- Modifier `src/api/generated/**` à la main.
- Ajouter `localStorage.setItem(...)` n'importe où.
- Désactiver une règle ESLint avec `// eslint-disable-line` sans commentaire de justification.
- Ajouter une dépendance npm.
- Modifier `orval.config.ts`, `vitest.config.ts`, `CLAUDE.md`.
```

### 4.2 Template de spec de page : `docs/pages/_template.md`

```markdown
# Page <NomDeLaPage>

## Route
`/path/to/page`

## Endpoints API consommés
- `METHOD /api/...` — but
- `METHOD /api/...` — but

## Actions utilisateur
1. Action → mutation/query → feedback
2. ...

## États à gérer
- Loading initial
- Empty (si applicable)
- Erreur 401 / 403 / 500
- Erreur de validation 400 (si formulaire)
- Succès

## Composants utilisés
- shadcn : Button, Form, Input, ...
- Custom : ...

## Edge cases métier
- ...

## Tests d'intégration à écrire
- happy path
- erreur 500
- erreur 401 (déclenche logout/redirect)
- formulaire invalide → message d'erreur
- ...
```

---

## Phase 5 — Implémentation auth (feature pilote)

Cette phase est faite à la main par toi (ou en pair avec Claude Code en supervision serrée), parce qu'elle fixe le pattern. Les features suivantes pourront être déléguées plus largement à Claude Code une fois ce pattern validé.

### 5.1 Périmètre de la feature pilote

Endpoints intégrés dans cette première itération :

| Endpoint | Hook composé | Page concernée |
|---|---|---|
| `POST /api/auth/login/` | `useLogin` | `/login` |
| `POST /api/auth/token/refresh/` | (interne au store) | — |
| `POST /api/auth/logout/` | `useLogout` | bouton header |
| `GET /api/auth/profile/` | `useCurrentUser` | toutes les pages protégées |

Hors périmètre pilote (à ajouter ensuite, dans cet ordre) : register, MFA setup/verify/disable/confirm/status, quick-login, device-login, profile PATCH/DELETE, delete-account, restaurant-employees.

### 5.2 `docs/pages/login.md`

```markdown
# Page Login

## Route
`/login`

## Endpoints API consommés
- `POST /api/auth/login/` — authentifier l'utilisateur, recevoir `access` + `refresh` tokens
- `GET /api/auth/profile/` — chargé après login pour récupérer l'utilisateur et son restaurant

## Actions utilisateur
1. Saisir email + mot de passe
2. Soumettre le formulaire → `useLogin.mutateAsync({ email, password })`
3. Si succès : tokens stockés dans `useAuthStore`, navigate vers `/`
4. Si MFA requis (réponse 200 avec `mfa_required: true`) : navigate vers `/login/mfa` (hors pilote, garder un TODO)
5. Si erreur 400/401 : afficher le message d'erreur

## États à gérer
- Loading pendant la mutation (bouton disabled + spinner)
- Erreur 400 (validation) → mapper sur les champs si possible
- Erreur 401 (mauvais identifiants) → message global "Email ou mot de passe incorrect"
- Erreur 5xx → toast "Une erreur est survenue, réessayez"
- Succès → redirect vers `/`

## Composants utilisés
- shadcn : `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Button`, `Card`
- sonner : `toast.error()`

## Edge cases métier
- Utilisateur déjà connecté qui visite `/login` → redirect vers `/`
- Token refresh échoué pendant une session → clear store + redirect `/login` (géré par mutator ky)

## Tests d'intégration à écrire
- happy path : remplit formulaire → submit → tokens stockés → redirect `/`
- email vide → message "Email requis", pas d'appel API
- 401 backend → message "Email ou mot de passe incorrect", pas de redirect
- 500 backend → toast d'erreur, pas de redirect
- déjà loggé → redirect immédiat vers `/`
```

### 5.3 `src/features/auth/auth.store.ts`

```ts
import { create } from 'zustand';
import ky from 'ky';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
  refresh: () => Promise<boolean>;
}

const REFRESH_KEY = 'hf_refresh_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken:
    typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null,
  isHydrated: false,

  setTokens: (access, refresh) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_KEY, refresh);
    }
    set({ accessToken: access, refreshToken: refresh, isHydrated: true });
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_KEY);
    }
    set({ accessToken: null, refreshToken: null, isHydrated: true });
  },

  refresh: async () => {
    const refresh = get().refreshToken;
    if (!refresh) return false;
    try {
      const response = await ky
        .post(`${import.meta.env.VITE_API_URL}/auth/token/refresh/`, {
          json: { refresh },
          retry: 0,
        })
        .json<{ access: string; refresh?: string }>();
      set({
        accessToken: response.access,
        refreshToken: response.refresh ?? refresh,
      });
      if (response.refresh && typeof window !== 'undefined') {
        localStorage.setItem(REFRESH_KEY, response.refresh);
      }
      return true;
    } catch {
      get().clear();
      return false;
    }
  },
}));
```

> Note : le refresh token est dans `localStorage` ici (pas idéal en termes XSS). Si le backend Django peut poser un cookie httpOnly pour le refresh, supprimer toute référence à `localStorage` et faire `credentials: 'include'` sur ky. À traiter en Phase 6 ou plus tard.

### 5.4 `src/features/auth/auth.schemas.ts` (Zod manuel pour ce domaine critique)

```ts
import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  user: z
    .object({
      id: z.number(),
      email: z.string(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
    })
    .optional(),
  mfa_required: z.boolean().optional(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const userProfileSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  date_joined: z.string(),
  is_active: z.boolean(),
  mfa_enabled: z.boolean(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
```

### 5.5 `src/features/auth/hooks/use-login.ts`

```ts
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../auth.store';
import {
  loginRequestSchema,
  loginResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from '../auth.schemas';
import { kyMutator } from '@/api/mutator';

async function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  const validated = loginRequestSchema.parse(payload);
  const raw = await kyMutator<unknown>({
    url: '/auth/login/',
    method: 'POST',
    data: validated,
  });
  return loginResponseSchema.parse(raw);
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (!data.mfa_required) {
        setTokens(data.access, data.refresh);
      }
    },
  });
}
```

### 5.6 `src/features/auth/hooks/use-current-user.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { kyMutator } from '@/api/mutator';
import { userProfileSchema, type UserProfile } from '../auth.schemas';
import { useAuthStore } from '../auth.store';

const CURRENT_USER_KEY = ['auth', 'current-user'] as const;

async function fetchCurrentUser(): Promise<UserProfile> {
  const raw = await kyMutator<unknown>({
    url: '/auth/profile/',
    method: 'GET',
  });
  return userProfileSchema.parse(raw);
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
  });
}
```

### 5.7 `src/features/auth/hooks/use-logout.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { kyMutator } from '@/api/mutator';
import { useAuthStore } from '../auth.store';

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await kyMutator({ url: '/auth/logout/', method: 'POST' });
      } catch {
        // logout best-effort : on clear même si l'API a échoué
      }
    },
    onSettled: () => {
      clear();
      qc.clear();
    },
  });
}
```

### 5.8 `src/features/auth/hooks/index.ts`

```ts
export { useLogin } from './use-login';
export { useCurrentUser } from './use-current-user';
export { useLogout } from './use-logout';
```

### 5.9 Page de login : `src/features/auth/pages/login-page.tsx`

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '../hooks';
import { loginRequestSchema, type LoginRequest } from '../auth.schemas';
import { useAuthStore } from '../auth.store';
import { UnauthorizedError, BadRequestError } from '@/api/errors';

export function LoginPage() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const login = useLogin();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await login.mutateAsync(values);
      if (result.mfa_required) {
        navigate('/login/mfa');
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        form.setError('root', {
          message: 'Email ou mot de passe incorrect',
        });
        return;
      }
      if (err instanceof BadRequestError) {
        form.setError('root', { message: 'Données invalides' });
        return;
      }
      toast.error('Une erreur est survenue, réessayez');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending}
              >
                {login.isPending ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.10 Tests d'intégration : `src/features/auth/__tests__/login-page.integration.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { TestWrapper } from '@/test/test-wrapper';
import { server } from '@/test/server';
import { LoginPage } from '../pages/login-page';
import { useAuthStore } from '../auth.store';

const navigateMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>(
    'react-router',
  );
  return { ...actual, useNavigate: () => navigateMock };
});

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

function renderLogin() {
  return render(
    <TestWrapper>
      <LoginPage />
    </TestWrapper>,
  );
}

describe('LoginPage', () => {
  it('happy path : connecte et redirige', async () => {
    server.use(
      http.post(`${API_URL}/auth/login/`, () =>
        HttpResponse.json({
          access: 'access-123',
          refresh: 'refresh-456',
        }),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email/i),
      'antoine@example.com',
    );
    await user.type(screen.getByLabelText(/mot de passe/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('access-123');
    });
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('email vide : pas d\'appel API, message d\'erreur', async () => {
    const fetchSpy = vi.fn();
    server.use(
      http.post(`${API_URL}/auth/login/`, () => {
        fetchSpy();
        return HttpResponse.json({});
      }),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('401 backend : message "Email ou mot de passe incorrect"', async () => {
    server.use(
      http.post(`${API_URL}/auth/login/`, () =>
        HttpResponse.json({ detail: 'invalid' }, { status: 401 }),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'bad');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(
      await screen.findByText(/email ou mot de passe incorrect/i),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('500 backend : toast d\'erreur, pas de redirect', async () => {
    server.use(
      http.post(`${API_URL}/auth/login/`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'pwd');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('déjà connecté : redirige immédiatement', () => {
    useAuthStore.getState().setTokens('a', 'b');
    renderLogin();
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });
});
```

### 5.11 Tests du store : `src/features/auth/__tests__/auth-store.test.ts`

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { useAuthStore } from '../auth.store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
    localStorage.clear();
  });

  it('setTokens stocke access en mémoire et refresh dans localStorage', () => {
    useAuthStore.getState().setTokens('access', 'refresh');
    expect(useAuthStore.getState().accessToken).toBe('access');
    expect(localStorage.getItem('hf_refresh_token')).toBe('refresh');
  });

  it('clear vide tout', () => {
    useAuthStore.getState().setTokens('a', 'b');
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(localStorage.getItem('hf_refresh_token')).toBeNull();
  });

  it('refresh succeeds : met à jour access', async () => {
    useAuthStore.getState().setTokens('old-access', 'old-refresh');
    server.use(
      http.post(`${API_URL}/auth/token/refresh/`, () =>
        HttpResponse.json({ access: 'new-access' }),
      ),
    );

    const ok = await useAuthStore.getState().refresh();
    expect(ok).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(useAuthStore.getState().refreshToken).toBe('old-refresh');
  });

  it('refresh fails : clear store', async () => {
    useAuthStore.getState().setTokens('old-access', 'old-refresh');
    server.use(
      http.post(`${API_URL}/auth/token/refresh/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    const ok = await useAuthStore.getState().refresh();
    expect(ok).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('refresh sans refreshToken retourne false', async () => {
    const ok = await useAuthStore.getState().refresh();
    expect(ok).toBe(false);
  });
});
```

### 5.12 Test du mutator (interceptor 401 + refresh) : `src/api/__tests__/mutator.test.ts`

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { kyMutator } from '../mutator';
import { UnauthorizedError } from '../errors';
import { useAuthStore } from '@/features/auth/auth.store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

describe('kyMutator — interceptor 401', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it('retry après refresh sur 401', async () => {
    useAuthStore.getState().setTokens('old-access', 'refresh-token');
    let callCount = 0;
    server.use(
      http.get(`${API_URL}/auth/profile/`, ({ request }) => {
        callCount++;
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer old-access') {
          return HttpResponse.json({}, { status: 401 });
        }
        return HttpResponse.json({ id: 1, email: 'x@y.com' });
      }),
      http.post(`${API_URL}/auth/token/refresh/`, () =>
        HttpResponse.json({ access: 'new-access' }),
      ),
    );

    const result = await kyMutator<{ id: number }>({
      url: '/auth/profile/',
      method: 'GET',
    });
    expect(result.id).toBe(1);
    expect(callCount).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe('new-access');
  });

  it('clear store si refresh échoue', async () => {
    useAuthStore.getState().setTokens('old-access', 'refresh-token');
    server.use(
      http.get(`${API_URL}/auth/profile/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post(`${API_URL}/auth/token/refresh/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    await expect(
      kyMutator({ url: '/auth/profile/', method: 'GET' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
```

---

## Phase 6 — Critères de validation avant de passer à la suite

L'auth pilote est validée si TOUS ces points sont vrais :

1. `pnpm typecheck` passe sans erreur.
2. `pnpm lint` passe sans erreur ni warning bloquant.
3. `pnpm test` : tous les tests d'auth passent (10+ tests : 5 sur `LoginPage`, 5 sur `auth.store`, 2 sur `mutator`).
4. `pnpm test:cov` : coverage `features/auth/**` ≥ 90%, `src/api/**` ≥ 80%.
5. Manuellement dans le navigateur : login fonctionne contre le backend Django local, le bouton logout vide le store, un F5 sur une page protégée déclenche un refresh transparent.
6. Network tab : aucun appel `/api/...` ne part sans `Authorization: Bearer ...` (sauf `/auth/login/` et `/auth/token/refresh/`).
7. Aucun fichier de `src/features/auth/` n'importe `ky` directement (seul `mutator.ts` et `auth.store.ts` peuvent le faire).
8. `git grep -n "localStorage" src/features/auth/` ne montre que les références au refresh token (jamais à l'access token).

Si un seul de ces points échoue, on corrige avant de continuer. Pas de "on verra plus tard".

---

## Phase 7 — Workflow récurrent pour les features suivantes

Pour chaque nouvelle feature (commandes, factures, planning, etc.), répéter ce cycle :

### Étape 1 — Spec (5-15 min, fait par toi)

Écrire `docs/pages/<feature>.md` à partir du template, en moins d'une page. Identifier les 3-8 endpoints concernés.

### Étape 2 — Vérifier que la génération orval expose bien les hooks

```bash
pnpm gen:api
grep -E "use[A-Z]" src/api/generated/endpoints/<tag>.ts | head -20
```

Si l'API a évolué côté backend depuis le dernier `gen:api`, TypeScript va te le dire au prochain build.

### Étape 3 — Implémentation (Claude Code)

Prompt type pour Claude Code :

```
Implémente la feature `<feature>` selon `docs/pages/<feature>.md`.
Respecte strictement `CLAUDE.md`.
Utilise comme référence de pattern `features/auth/` (structure, conventions, tests).
Hooks générés à utiliser : <coller la sortie du grep ci-dessus>.
Je veux : la page, les hooks composés, les tests d'intégration.
Critères : `pnpm typecheck && pnpm lint && pnpm test -- features/<feature>` doit passer.
N'écris pas de schéma Zod runtime sauf si je te le dis explicitement (pas un domaine critique).
```

### Étape 4 — Review (toi)

Checklist rapide :
- [ ] Aucun `import ky` dans la feature
- [ ] Aucun `localStorage` ajouté
- [ ] Aucun type `interface XxxResponse {}` qui décrit une réponse API
- [ ] Tests couvrent : happy path, loading, erreur 500, erreur de validation si formulaire
- [ ] `userEvent` utilisé, pas `fireEvent`
- [ ] La page est accessible (labels, rôles ARIA)

### Étape 5 — Validation

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Si tout passe, commit. Sinon, retour étape 3 avec le message d'erreur.

### Ordre suggéré pour l'intégration des 28 tags

Phase A (foundations, à faire après auth) :
1. `restaurants` (lecture du restaurant courant, base pour tout le reste)
2. `settings` (préférences user, restaurant settings)
3. `staff` / `restaurant-employes` (permissions, base de la sécurité côté UI)

Phase B (cœur métier resto) :
4. `categories` + `articles` + `article-ingredients`
5. `tables` + `salles`
6. `commandes` + `lignes-commandes` (le plus gros morceau, prévoir du temps)
7. `factures` + `paiements` + `methodes-paiement`

Phase C (gestion) :
8. `reservations`
9. `ingredients` + `stocks` + `reapprovisionnements`
10. `suppliers`
11. `employes` + `type-employes` + `planning`
12. `notes`
13. `dashboard` + `reports`
14. `employees` (statut)

Phase D (auth avancée) :
15. MFA complet, register, quick-login, device-login, profile PATCH/DELETE, delete-account

---

## Annexes

### A. FAQ

**Q : Pourquoi pas Zod sur tous les endpoints ?**
Parce que TypeScript + types générés depuis OpenAPI capturent déjà les divergences au build. Zod runtime ne sert que si l'API peut renvoyer un payload divergent en prod sans que le build ait changé — typiquement les endpoints critiques (paiements, factures) où une réponse malformée doit faire crasher proprement plutôt que de polluer l'UI.

**Q : Pourquoi pas Playwright tout de suite ?**
Parce qu'un test E2E coûte 5-10× plus cher à maintenir qu'un test d'intégration. On l'ajoute quand on a un parcours stable et critique business. Pour l'instant, MSW + RTL couvre 90% des bugs.

**Q : Pourquoi commit le code généré ?**
Pour que les diffs orval apparaissent dans les PR (visibilité sur les changements d'API), pour éviter qu'un dev qui clone le repo doive lancer un backend Django avant de pouvoir builder, et pour rendre la CI simple.

**Q : Que faire si orval n'est pas compatible avec Zod 4 ?**
Option 1 : ne pas générer de Zod runtime, écrire les schémas Zod 4 à la main pour les domaines critiques uniquement (auth, paiements, factures). C'est la stratégie de Phase 5.
Option 2 : downgrader Zod en 3.23.x. `@hookform/resolvers` supporte les deux.
Option 3 : essayer `@hey-api/openapi-ts` à la place d'orval (plus moderne, mais pas de mocks MSW générés).

**Q : Comment gérer les permissions côté UI ?**
Une fois le tag `staff` intégré (`/api/staff/permissions/me/`), créer un hook `useHasPermission(permissionName)` qui lit la liste depuis le cache TanStack et un composant `<Can permission="manage_orders">{...}</Can>`. À voir au moment de l'intégration de ce tag.

### B. Erreurs typiques à éviter

- **Mettre `accessToken` dans `localStorage`** — XSS vector, ne jamais le faire.
- **Désactiver `onUnhandledRequest: 'error'` dans MSW** — masque les requêtes oubliées dans les tests, on perd la garantie que le test est isolé.
- **Importer un hook depuis `src/api/generated/endpoints/auth.ts` dans une page** — viole la convention, rend le code fragile aux régénérations.
- **Faire des tests qui ne testent que le rendu** (`expect(screen.getByText('Login')).toBeInTheDocument()` sans interaction) — ces tests ne valident rien d'utile, ils coûtent plus à maintenir qu'ils ne rapportent. Tester un comportement, pas un rendu.
- **Mocker `useNavigate` partout sans raison** — utiliser un vrai `MemoryRouter` quand c'est possible. Mocker uniquement quand on doit assert sur l'argument.
- **Lancer `pnpm test` sans avoir regénéré l'API** quand le backend a bougé — TypeScript ment alors avec des types périmés.

### C. Checklist d'onboarding pour un nouveau dev (ou pour Claude Code en début de session)

1. Lire ce fichier.
2. Lire `CLAUDE.md`.
3. Lire `src/features/auth/` en entier (le pattern de référence).
4. Lancer `pnpm install && pnpm gen:api && pnpm test` — tout doit passer.
5. Lire la spec OpenAPI dans `docs/api/holly-pi-api.md`.

---

**Version de ce document : 1.0 — créé pour démarrage Holy Fork. À mettre à jour si le pattern évolue après l'intégration de 2-3 features supplémentaires.**

# Audit Complet — iValid

> Audit approfondi de toutes les pratiques, consignes, conventions, règles de maintenabilité et standards intégrés au sein du logiciel iValid.
> Généré le 15 mai 2026.

---

## Table des matières

1. [Identité du projet](#1-identité-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Architecture globale](#3-architecture-globale)
4. [Structure des dossiers](#4-structure-des-dossiers)
5. [Configuration TypeScript](#5-configuration-typescript)
6. [Configuration ESLint](#6-configuration-eslint)
7. [Configuration Prettier](#7-configuration-prettier)
8. [Configuration Vite](#8-configuration-vite)
9. [Configuration Tailwind CSS v4](#9-configuration-tailwind-css-v4)
10. [Configuration Storybook](#10-configuration-storybook)
11. [Git Hooks & Lint-Staged](#11-git-hooks--lint-staged)
12. [CI/CD — GitHub Actions](#12-cicd--github-actions)
13. [Déploiement — Vercel](#13-déploiement--vercel)
14. [Méthodologie TDD strict](#14-méthodologie-tdd-strict)
15. [Tests unitaires — Vitest + RTL](#15-tests-unitaires--vitest--rtl)
16. [Tests d'intégration — Vitest + MSW](#16-tests-dintégration--vitest--msw)
17. [Tests E2E — Playwright](#17-tests-e2e--playwright)
18. [Configuration des tests](#18-configuration-des-tests)
19. [Architecture API](#19-architecture-api)
20. [Client HTTP — ky](#20-client-http--ky)
21. [Validation — Zod](#21-validation--zod)
22. [TanStack Query — Règles et patterns](#22-tanstack-query--règles-et-patterns)
23. [Zustand — Gestion d'état synchrone](#23-zustand--gestion-détat-synchrone)
24. [Gestion des erreurs](#24-gestion-des-erreurs)
25. [Routing — TanStack Router](#25-routing--tanstack-router)
26. [Composants UI — coss / Base UI](#26-composants-ui--coss--base-ui)
27. [Accessibilité (a11y)](#27-accessibilité-a11y)
28. [Conventions de nommage](#28-conventions-de-nommage)
29. [Patterns d'import](#29-patterns-dimport)
30. [Patterns de composants](#30-patterns-de-composants)
31. [Mobile-first & Performance](#31-mobile-first--performance)
32. [Variables d'environnement](#32-variables-denvironnement)
33. [Sécurité](#33-sécurité)
34. [Objectifs de couverture](#34-objectifs-de-couverture)
35. [Workflow de développement](#35-workflow-de-développement)
36. [Dépendances clés & versions](#36-dépendances-clés--versions)
37. [Règles d'or — Résumé](#37-règles-dor--résumé)

---

## 1. Identité du projet

| Champ | Valeur |
|-------|--------|
| **Nom** | iValid |
| **Type** | Application SaaS B2B |
| **Domaine** | Gestion de prise de rendez-vous et de tournées pour itinérants commerciaux |
| **Utilisateurs cibles** | Commerciaux terrain sur tablette/mobile |
| **Approche** | Mobile-first |

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | ≥ 24.0.0 |
| Package manager | pnpm | 10.9.0 (enforced) |
| Framework UI | React | 19.2 |
| Langage | TypeScript | 5.9.3 (strict) |
| Bundler | Vite | 7 |
| Routing | TanStack Router | 1.168 |
| Data fetching | TanStack Query | 5.99 |
| Client HTTP | ky | 2.0 |
| Validation | Zod | 4.3 |
| État synchrone | Zustand | 5.0 |
| UI primitives | Base UI (@base-ui-components/react) | 1.4 |
| Styling | Tailwind CSS | 4.2 |
| Tests unitaires | Vitest | 4.1 |
| Tests E2E | Playwright | 1.59 |
| Mocking API | MSW (Mock Service Worker) | 2.13 |
| Linting | ESLint | 9 (flat config) |
| Formatting | Prettier | 3.8 |
| Notifications | Sonner | 2.0 |
| Calendrier | FullCalendar | 6.1 |
| Graphiques | Recharts | 3.8 |
| Cartographie | Mapbox GL | 3.22 |
| Storybook | Storybook | 10 |
| Git hooks | Husky | 9.1 |
| Pre-commit | lint-staged | 16.4 |

---

## 3. Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                        COMPOSANTS UI                         │
│     (Routes / Pages → Components → Patterns → UI Primitives)│
│     Utilisent UNIQUEMENT les hooks Query/Mutation            │
├─────────────────────────────────────────────────────────────┤
│                     HOOKS TANSTACK QUERY                     │
│     useQuery, useMutation, invalidateQueries                 │
│     Définis dans features/{domain}/{domain}.queries.ts       │
├─────────────────────────────────────────────────────────────┤
│                     SERVICES API                             │
│     Fonctions pures appelant le client ky                    │
│     Valident TOUTES les réponses avec Zod                    │
│     Définis dans features/{domain}/{domain}.service.ts       │
├─────────────────────────────────────────────────────────────┤
│                     CLIENT HTTP (ky)                          │
│     Instance unique — lib/api/client.ts                      │
│     Interceptors : auth headers, refresh token, error mapping│
├─────────────────────────────────────────────────────────────┤
│                     ÉTAT SYNCHRONE (Zustand)                 │
│     Auth tokens (en mémoire), UI, préférences calendrier     │
│     JAMAIS de tokens en localStorage                         │
└─────────────────────────────────────────────────────────────┘
```

### Flux d'un appel API

```
Composant
  → useQuery/useMutation (features/{domain}/{domain}.queries.ts)
    → Service (features/{domain}/{domain}.service.ts)
      → Client ky (lib/api/client.ts) avec interceptors
        → Parsing Zod de la réponse
          → Retour typage fort OU throw ApiError typée
```

---

## 4. Structure des dossiers

```
software/
├── .github/workflows/ci.yml     # CI GitHub Actions
├── .husky/pre-commit             # Git hook pre-commit
├── .storybook/                   # Config Storybook
│   ├── main.ts
│   └── preview.ts
├── e2e/                          # Tests E2E Playwright
│   └── *.spec.ts
├── public/
│   └── mockServiceWorker.js      # MSW service worker (dev)
├── src/
│   ├── __tests__/                # Tests pages + intégration
│   │   ├── *.test.tsx            # Tests unitaires de pages
│   │   └── integration/          # Tests d'intégration
│   │       └── *.test.tsx
│   ├── assets/                   # Fichiers statiques (images, SVG)
│   ├── components/
│   │   ├── ui/                   # Primitives UI (Base UI / coss)
│   │   ├── patterns/             # Composants composés réutilisables
│   │   ├── layout/               # Layouts (AppLayout, Sidebar, PageHeader)
│   │   ├── auth/                 # Composants d'authentification
│   │   ├── charts/               # Composants graphiques
│   │   ├── skeletons/            # Loading skeletons
│   │   ├── icons/                # Icônes custom
│   │   ├── dev/                  # Outils dev-mode
│   │   └── theme-provider.tsx    # Provider thème
│   ├── config/                   # Configuration app
│   ├── constants/
│   │   └── form-options.ts       # 150+ options statiques pour selects
│   ├── features/                 # Domaines métier (21 domaines)
│   │   ├── auth/
│   │   ├── appointments/
│   │   ├── calendar/
│   │   ├── company/
│   │   ├── contacts/
│   │   ├── fleet/
│   │   ├── navigation/
│   │   ├── profile/
│   │   ├── settings/
│   │   ├── stats/
│   │   ├── subscription/
│   │   ├── onboarding/
│   │   ├── onboarding-tour/
│   │   ├── questionnaire/
│   │   ├── reservation/
│   │   ├── booking-a/
│   │   ├── booking-b/
│   │   ├── booking-c/
│   │   └── geo/
│   ├── hooks/                    # Hooks partagés
│   │   ├── use-clipboard.ts
│   │   ├── use-filtered-list.ts
│   │   ├── use-media-query.ts
│   │   ├── use-online-status.ts
│   │   ├── use-pagination.ts
│   │   └── use-unsaved-changes.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts         # Instance ky unique
│   │   │   ├── errors.ts         # Classes d'erreur typées
│   │   │   ├── types.ts          # Types API (ApiResponse, PaginatedResponse)
│   │   │   └── query-client.ts   # QueryClient config
│   │   ├── config.ts             # Config app (API URL, callbacks)
│   │   ├── auth-guard.ts         # Guard d'authentification
│   │   ├── utils.ts              # cn() (clsx + tailwind-merge)
│   │   ├── utils/                # Utilitaires métier
│   │   │   ├── get-error-message.ts
│   │   │   ├── password-strength.ts
│   │   │   ├── date-utils.ts
│   │   │   ├── status-utils.ts
│   │   │   ├── tree-utils.ts
│   │   │   └── user-utils.ts
│   │   ├── schemas/              # Schemas Zod partagés
│   │   └── tour/                 # Système de tours/onboarding
│   │       ├── tour-registry.ts
│   │       ├── tour.store.ts
│   │       └── use-tour.ts
│   ├── mocks/                    # MSW pour développement
│   │   ├── browser.ts            # setupWorker()
│   │   ├── handlers.ts           # Handlers dev (données réalistes)
│   │   ├── data/                 # Fixtures & factories
│   │   └── factories/            # Faker.js factories
│   ├── routes/                   # TanStack Router file-based routing
│   │   ├── __root.tsx            # Root layout
│   │   ├── _public.tsx           # Layout public (login, signup...)
│   │   ├── _authenticated.tsx    # Layout protégé (auth guard)
│   │   ├── _onboarding.tsx       # Flow d'onboarding
│   │   └── _authenticated/       # Pages protégées
│   ├── stores/                   # Zustand stores globaux
│   ├── test/                     # Utilitaires de test
│   │   ├── server.ts             # MSW setupServer()
│   │   ├── test-wrapper.tsx      # QueryClientProvider wrapper
│   │   └── msw-handlers.ts       # Handlers test (815 lignes)
│   ├── types/                    # Types globaux par domaine
│   │   ├── index.ts
│   │   ├── appointment.ts
│   │   ├── client.ts
│   │   ├── company.ts
│   │   ├── fleet.ts
│   │   ├── navigation.ts
│   │   ├── onboarding.ts
│   │   ├── profile.ts
│   │   ├── questionnaire.ts
│   │   ├── stats.ts
│   │   └── settings.ts
│   ├── index.css                 # Styles globaux + thème Tailwind v4
│   ├── main.tsx                  # Point d'entrée React
│   └── routeTree.gen.ts          # Auto-généré par TanStack Router
├── CLAUDE.md                     # Instructions projet
├── PROGRESS.md                   # Suivi d'avancement
├── REFACTORING-PLAN.md           # Plan de refactoring
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── vitest.setup.ts
├── eslint.config.js
├── .prettierrc
├── .prettierignore
├── .nvmrc                        # Node 24
├── .npmrc                        # Registry custom
├── .env.example
├── vercel.json
└── components.json               # Config coss/shadcn
```

### Structure d'un domaine métier (`features/{domain}/`)

```
features/{domain}/
├── {domain}.schemas.ts           # Schemas Zod (request + response)
├── {domain}.service.ts           # Fonctions API pures (appellent le client ky)
├── {domain}.service.test.ts      # Tests du service (MSW)
├── {domain}.queries.ts           # Hooks TanStack Query (useMutation, useQuery)
├── {domain}.keys.ts              # Query key factory
├── {domain}.store.ts             # Zustand store (si nécessaire)
├── {domain}.store.test.ts        # Tests du store
├── components/                   # Composants spécifiques au domaine
├── hooks/                        # Hooks spécifiques au domaine
└── index.ts                      # Barrel exports publics
```

---

## 5. Configuration TypeScript

### tsconfig.json (racine)

- **Projet composite** avec références vers `tsconfig.app.json` et `tsconfig.node.json`
- **Path alias** : `@/*` → `./src/*`

### tsconfig.app.json (code applicatif)

| Option | Valeur | Effet |
|--------|--------|-------|
| target | ES2022 | Code moderne |
| module | ESNext | Modules ES natifs |
| jsx | react-jsx | JSX automatique (pas de `import React`) |
| strict | true | **Typage strict activé** |
| noUnusedLocals | true | Erreur sur variables locales inutilisées |
| noUnusedParameters | true | Erreur sur paramètres inutilisés |
| moduleResolution | bundler | Résolution Vite-compatible |
| noEmit | true | TypeScript = vérification seule, Vite compile |

**Exclusions** : `src/**/*.test.ts`, `src/**/*.test.tsx`, `src/__tests__`

### tsconfig.node.json (scripts build)

- **target** : ES2023
- **strict** : true
- **Inclut** : `vite.config.ts`, `.storybook/main.ts`

### Règles TypeScript implicites

- **Pas de `any`** sauf cas exceptionnel documenté
- **Types inférés depuis Zod** : `z.infer<typeof schema>` pour request/response
- **Pas de fichiers `.d.ts` manuels** : types dans des `.ts` avec `type` keyword
- **Barrel exports typés** : `export type * from "./company"`

---

## 6. Configuration ESLint

**Version** : ESLint 9 — flat config (`eslint.config.js`)

### Extends

1. `@eslint/js` (recommandé)
2. `typescript-eslint` (strict TS)
3. `react-hooks/flat.recommended` (règles hooks React)

### Plugins

- `react-refresh` — validation Fast Refresh

### Règles actives

| Règle | Niveau | Configuration |
|-------|--------|---------------|
| `react-refresh/only-export-components` | warn | `allowConstantExport: true` |

### Ignores globaux

- `dist/`
- `src/routeTree.gen.ts` (auto-généré)
- `e2e/`
- `public/mockServiceWorker.js`

### Overrides par fichier

Les fichiers suivants **désactivent** `react-refresh/only-export-components` :
- `src/routes/**` (fichiers de route)
- `src/components/ui/**` (primitives UI)
- `src/components/layout/**` (layouts)
- `src/test/**` (test utils)
- `src/main.tsx`

---

## 7. Configuration Prettier

**Version** : Prettier 3.8

```json
{
  "endOfLine": "lf",
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "src/index.css",
  "tailwindFunctions": ["cn", "cva"]
}
```

### Règles de formatage

| Règle | Valeur | Signification |
|-------|--------|---------------|
| endOfLine | lf | Unix line endings |
| semi | false | **Pas de point-virgule** |
| singleQuote | false | **Double quotes** (`"..."`) |
| tabWidth | 2 | Indentation 2 espaces |
| trailingComma | es5 | Virgule trailing ES5-compatible |
| printWidth | 80 | Ligne max 80 caractères |

### Plugin Tailwind

- **Tri automatique des classes** Tailwind dans `className`, `cn()`, `cva()`
- **Référence** : `src/index.css` pour le thème

### .prettierignore

- `node_modules/`, `coverage/`, `.pnpm-store/`, `pnpm-lock.yaml`

---

## 8. Configuration Vite

**Fichier** : `vite.config.ts`

### Plugins

1. `@tanstack/router-plugin/vite` — génération automatique du routeTree
2. `@vitejs/plugin-react` — Fast Refresh React
3. `@tailwindcss/vite` — compilation Tailwind v4

### Proxy API (développement)

| Variable d'env | Cible |
|----------------|-------|
| `VITE_API_TARGET=azure` | `https://ivalidserver20240618121605-dev.azurewebsites.net` |
| `VITE_API_TARGET=local` | `http://localhost:5201` |
| (défaut) | Azure |

- **Route** : `/api` → target avec `changeOrigin: true`

### Code splitting

Chunks manuels pour les dépendances lourdes :

| Chunk | Packages |
|-------|----------|
| `vendor-calendar` | `@fullcalendar/*` |
| `vendor-charts` | `recharts`, `d3-*` |
| `vendor-map` | `mapbox-gl` |

---

## 9. Configuration Tailwind CSS v4

**Version** : Tailwind CSS 4.2 — configuration inline dans `src/index.css`

### Imports

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@coss/shadcn/tailwind.css";
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Sora:wght@100..800&display=swap");
```

### Thème custom (`@theme inline`)

**Polices** :
- `--font-heading` : Sora (titres)
- `--font-sans` : Inter Variable (corps)

**Tailles de texte custom** :
- `--text-fine` : 11px/16px
- `--text-body-sm` : 13px/20px

**Système de couleurs** : oklch (variables CSS)
- Mode clair (`:root`)
- Mode sombre (`.dark`)
- Custom variant : `@custom-variant dark (&:where(.dark, .dark *))`

**Radius scales** : sm, md, lg, xl, 2xl, 3xl, 4xl

**Animations custom** :
- `skeleton` — shimmer loading
- `toast-success-odd`, `toast-success-even` — animation toast succès
- `toast-error-odd`, `toast-error-even` — animation toast erreur

### Styles de base (`@layer base`)

- Reset border/outline
- Body : antialiased, min-height screen
- Titres h1-h6 : font-heading + tracking-tight
- `[data-auth]` : styles spécifiques formulaires auth (hauteur input, border, focus)
- **Reduced motion** : `@media (prefers-reduced-motion: reduce)` — désactive animations

---

## 10. Configuration Storybook

**Version** : Storybook 10

### .storybook/main.ts

- **Stories** : `../src/**/*.stories.@(ts|tsx)`
- **Addons** : `@storybook/addon-a11y` (vérification accessibilité dans Storybook)
- **Framework** : `@storybook/react-vite`
- **Vite** : Tailwind plugin + alias `@/` → `./src`

### .storybook/preview.ts

- Import `../src/index.css` (styles globaux)
- Matchers automatiques : color, date
- Layout : centered

---

## 11. Git Hooks & Lint-Staged

### Husky (`.husky/pre-commit`)

Exécuté avant chaque commit :
```bash
pnpm exec lint-staged
```

### lint-staged (dans `package.json`)

| Pattern | Actions |
|---------|---------|
| `*.{ts,tsx}` | `eslint --fix` → `prettier --write` |
| `*.css` | `prettier --write` |

**Effet** : Chaque commit est automatiquement :
1. Linté (ESLint avec auto-fix)
2. Formaté (Prettier)
3. Classes Tailwind triées

---

## 12. CI/CD — GitHub Actions

**Fichier** : `.github/workflows/ci.yml`

### Déclencheurs

- `pull_request` (toutes branches)
- `push` sur `main`

### Concurrence

- `cancel-in-progress: true` par ref git (un seul job par branche)

### Job : `quality`

| Étape | Commande | Timeout |
|-------|----------|---------|
| Setup Node | `.nvmrc` (Node 24) | — |
| Install | `pnpm install --frozen-lockfile` | — |
| Typecheck | `pnpm typecheck` | 10 min |
| Lint | `pnpm lint` | 10 min |
| Tests | `pnpm test` | 10 min |
| Build | `pnpm build` | 10 min |

**Règle** : Le merge est bloqué si l'un de ces checks échoue.

---

## 13. Déploiement — Vercel

**Fichier** : `vercel.json`

```json
{
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
}
```

- **SPA routing** : toutes les routes (sauf `/assets/`) redirigent vers `index.html`
- **TanStack Router** gère le routing côté client

---

## 14. Méthodologie TDD strict

### Principe fondamental

> **Aucune feature, aucun composant, aucun fix ne doit être codé sans test.**

### Cycle obligatoire

```
1. RED    — Écrire le(s) test(s) d'abord. Ils DOIVENT échouer.
2. GREEN  — Écrire le minimum de code pour faire passer les tests.
3. REFACTOR — Nettoyer le code sans casser les tests.
```

### Pyramide de tests

```
        ╱ E2E (Playwright) ╲               → Parcours utilisateurs critiques
       ╱  Intégration (Vitest + MSW) ╲     → Flux complets entre composants
      ╱   Unitaire (Vitest + RTL)     ╲    → Composants, hooks, utils, logique métier
```

### Colocalisation des tests

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx              ← test unitaire colocalisé
  hooks/
    useAppointments.ts
    useAppointments.test.ts        ← test unitaire colocalisé
  utils/
    route-optimizer.ts
    route-optimizer.test.ts        ← test unitaire colocalisé
  __tests__/
    integration/
      appointment-flow.test.tsx    ← tests d'intégration
e2e/
  appointment-booking.spec.ts      ← tests E2E Playwright
```

---

## 15. Tests unitaires — Vitest + RTL

### Règles

| Règle | Détail |
|-------|--------|
| Colocalisation | Chaque composant → `.test.tsx` à côté |
| Chaque hook | → `.test.ts` colocalisé |
| Chaque utilitaire | → `.test.ts` colocalisé |
| Comportement | Tester le **comportement**, pas l'implémentation |
| Events | Utiliser `userEvent` plutôt que `fireEvent` |

### Règles UI de pages

| À tester | Exemples |
|----------|----------|
| Validation | Champs requis, formats, messages d'erreur |
| Soumission | Submit → appel API → feedback |
| Navigation | Redirections après actions |
| Loading | Skeletons, spinners |
| Erreurs | Messages d'erreur, retry |

| À NE PAS tester | Exemples |
|------------------|----------|
| Présence visuelle | Logo affiché, icône présente, texte statique |

### Smoke test obligatoire

Chaque page exportée DOIT avoir un test de rendu sans crash :

```typescript
it("renders without crashing", () => {
  render(<LoginPage />, { wrapper: TestWrapper })
})
```

### Pattern type

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TestWrapper } from "@/test/test-wrapper"

describe("LoginPage", () => {
  it("shows validation error for empty email", async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper: TestWrapper })

    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    expect(screen.getByText(/email requis/i)).toBeInTheDocument()
  })
})
```

### Note a11y importante

> Ne pas utiliser `Field`/`FieldLabel` (base-ui) quand l'input a besoin d'un `aria-label` propre — le `aria-labelledby` généré par Field prend le dessus.

---

## 16. Tests d'intégration — Vitest + MSW

### Règles

| Règle | Détail |
|-------|--------|
| Mocking API | **MSW obligatoire** — jamais de mock manuels (`vi.mock`, `jest.mock`) |
| Flux complets | formulaire → validation → soumission → feedback |
| Erreurs | Tester les états d'erreur et cas limites |
| Localisation | `src/__tests__/integration/` |

### Pattern MSW handler

```typescript
import { http, HttpResponse } from "msw"
import { server } from "@/test/server"

// Override pour un test spécifique
server.use(
  http.post(`${API_URL}/auth/login`, () =>
    HttpResponse.json({ message: "Invalid credentials" }, { status: 401 })
  )
)
```

### Pattern test d'intégration

```typescript
describe("Login flow", () => {
  it("redirects to dashboard on successful login", async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper: TestWrapper })

    await user.type(screen.getByLabelText(/email/i), "test@example.com")
    await user.type(screen.getByLabelText(/mot de passe/i), "Password1!")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" })
    })
  })
})
```

---

## 17. Tests E2E — Playwright

### Règles

| Règle | Détail |
|-------|--------|
| Un fichier par parcours | `e2e/{parcours}.spec.ts` |
| Happy paths | Couverts à **100%** |
| Cas d'erreur principaux | Couverts |
| Sélecteurs | `data-testid`, rôles ARIA, texte visible |
| Pas de CSS fragile | Pas de `.my-class`, pas de `nth-child` |

### Configuration Playwright

| Option | Valeur |
|--------|--------|
| Test directory | `./e2e` |
| Parallel | `fullyParallel: true` |
| Retries (local) | 0 |
| Retries (CI) | 2 |
| Workers (CI) | 1 |
| Browser | Chromium uniquement |
| Base URL | `http://localhost:5173` |
| Trace | `on-first-retry` |
| Web server | `pnpm dev` |

---

## 18. Configuration des tests

### vitest.config.ts

```typescript
{
  environment: "jsdom",
  globals: true,           // pas besoin d'import describe, it, expect
  setupFiles: ["./vitest.setup.ts"],
  css: true,
  include: ["src/**/*.test.{ts,tsx}"],
  coverage: {
    provider: "v8",
    thresholds: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    exclude: ["main.tsx", "routeTree.gen.ts", "*.test.*", "*.d.ts"]
  }
}
```

### vitest.setup.ts

1. **Import** : `@testing-library/jest-dom` (matchers DOM)
2. **Mock** : `window.matchMedia` (jsdom ne le supporte pas)
3. **MSW** :
   - `beforeAll` → `server.listen()`
   - `afterEach` → `cleanup()` + `server.resetHandlers()`
4. **Auth store** : Reset à l'état initial entre chaque test

### Test wrapper (src/test/test-wrapper.tsx)

```typescript
// QueryClientProvider avec un QueryClient frais pour chaque test
function TestWrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## 19. Architecture API

### Structure par domaine

Chaque domaine métier suit le même pattern :

| Fichier | Responsabilité |
|---------|----------------|
| `{domain}.schemas.ts` | Schemas Zod (request + response) + types inférés |
| `{domain}.service.ts` | Fonctions API pures (appellent ky) |
| `{domain}.service.test.ts` | Tests service (MSW) |
| `{domain}.queries.ts` | Hooks TanStack Query |
| `{domain}.keys.ts` | Factory de query keys |
| `{domain}.store.ts` | Zustand store (si nécessaire) |
| `{domain}.store.test.ts` | Tests store |
| `index.ts` | Re-exports publics |

### 6 règles API strictes

1. **Client unique** : Tout appel API passe par `lib/api/client.ts` (instance ky). **JAMAIS** de `fetch` / `axios` direct.
2. **Validation Zod obligatoire** : Toute réponse API **DOIT** être parsée avec un schema Zod dans le service.
3. **Pas d'API dans les composants** : Les composants utilisent **uniquement** les hooks Query.
4. **Query keys centralisées** : Chaque domaine a un `*.keys.ts` avec factory typée.
5. **Tokens en mémoire** : Zustand store sans `persist`. Refresh via interceptor ky. **JAMAIS** de token en `localStorage`.
6. **Tests services** : MSW obligatoire. **JAMAIS** de mock manuel.
7. **Erreurs typées** : Utiliser les classes de `lib/api/errors.ts`. **JAMAIS** de `throw new Error()` générique.

---

## 20. Client HTTP — ky

### Instance unique (`lib/api/client.ts`)

| Hook | Action |
|------|--------|
| `beforeRequest` | Ajoute `Authorization: Bearer {token}` depuis le store auth |
| `afterResponse` (401) | Tente refresh token → retry. Si échec → logout + redirect login |
| `beforeError` | Parse le body d'erreur → throw `ApiError` typée avec status code |

### Retry par idempotence

| Verbe | Retry | Raison |
|-------|-------|--------|
| GET | Oui | Idempotent |
| PUT | Oui | Idempotent |
| DELETE | Oui | Idempotent |
| POST | **Non** | Sauf si le backend supporte `Idempotency-Key` |

**Codes retryés** (GET) : `408`, `429`, `500`, `502`, `503`, `504`

> **Ne jamais retry un paiement ou une action irréversible.**

---

## 21. Validation — Zod

### Pattern obligatoire

```typescript
// Dans {domain}.schemas.ts
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
```

```typescript
// Dans {domain}.service.ts
async login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post("auth/login", { json: data }).json()
  return loginResponseSchema.parse(response)  // ← OBLIGATOIRE
}
```

### Règles Zod

- **Toute réponse API** doit être parsée → sécurité runtime contre les changements backend
- **Types inférés** depuis les schemas → single source of truth
- **Erreurs Zod** sont attrapées et transformées par l'error handler

---

## 22. TanStack Query — Règles et patterns

### Principe d'escalade

**Baseline = `useQuery` + `useMutation` + `invalidateQueries`.**

Ne rien ajouter de plus tant qu'un problème concret n'est pas mesuré.

| Symptôme mesuré | Pattern à ajouter | Seuil |
|-----------------|-------------------|-------|
| Flash/skeleton visible entre navigations | Prefetching | Latence perçue > 200ms |
| UI lente après action utilisateur | Optimistic update | Latence mutation > 300ms |
| Liste trop longue, scroll rame | `useInfiniteQuery` | > 50 items |
| Recherche spam l'API | Debounce + `placeholderData: keepPreviousData` | Dès qu'il y a un champ recherche |
| Données stale après retour d'onglet | `refetchOnWindowFocus: true` | Données critiques temps réel |

### Patterns **interdits** préventivement

- Optimistic updates sur mutations < 300ms
- Prefetch systématique de toutes les pages
- Offline queue (= sous-projet avec spec dédiée)

### Query key factory pattern

```typescript
export const appointmentsKeys = {
  all: ["appointments"] as const,
  list: (filters?: Record<string, string>) =>
    [...appointmentsKeys.all, "list", filters] as const,
  detail: (id: string) =>
    [...appointmentsKeys.all, "detail", id] as const,
}
```

### staleTime par domaine

| Domaine | staleTime | Justification |
|---------|-----------|---------------|
| Auth / user | 5 min | Change rarement dans une session |
| Listes actives (RDV, tournées) | 1 min | Sujettes à modification |
| Détail d'une entité | 2 min | Stable une fois ouverte |
| Données référentielles (contacts, config) | 5 min | Évoluent lentement |
| Résultats de recherche | 5 min | Rarement volatiles |

> Ces valeurs sont des **hypothèses**. À ajuster avec des métriques réelles.

### QueryClient defaults

```typescript
{
  staleTime: 60_000,      // 1 min
  gcTime: 300_000,         // 5 min
  retry: 1,
}
```

### Invalidation après mutation

**Documenter explicitement** quelles query keys sont invalidées :

```
createAppointment  → appointmentKeys.list(), statsKeys.today()
updateRoute        → routeKeys.detail(id), routeKeys.list()
confirmAppointment → appointmentKeys.detail(id), appointmentKeys.list()
```

> **Ne pas utiliser d'invalidation wildcard** (`queryKey: ['appointments']`) sauf si TOUTES les sub-queries sont impactées.

---

## 23. Zustand — Gestion d'état synchrone

### Stores existants

| Store | Domaine | Persist |
|-------|---------|---------|
| `useAuthStore` | Tokens, isAuthenticated, login/logout | **Non** (mémoire seule) |
| `useCalendarStore` | Préférences calendrier | Oui (localStorage) |
| `useDevModeStore` | Toggle mode dev | Non |
| `useImpersonateStore` | Impersonation test | Non |
| `useTourStore` | État onboarding tours | Non |

### Règles Zustand

- **Tokens JAMAIS en localStorage** : `useAuthStore` sans middleware `persist`
- **Reset en tests** : `useAuthStore.setState(initialState)` dans `afterEach`
- **Pas de logique async** dans les stores : l'async est dans les services/queries
- **État minimal** : pas de duplication avec TanStack Query cache

---

## 24. Gestion des erreurs

### Classes d'erreur typées (`lib/api/errors.ts`)

| Classe | Status HTTP |
|--------|-------------|
| `ApiError` | Base (toutes) |
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `InternalServerError` | 500+ |

### Réaction par status HTTP

| Status | Réaction |
|--------|----------|
| 401 | Refresh token → retry → si échec : redirect `/login` |
| 403 | Toast "Accès refusé" — **NE PAS retry** |
| 404 | État "introuvable" dans le composant |
| 409 | Refetch données fraîches + toast "Données modifiées par un autre utilisateur" |
| 422 | Mapper les erreurs serveur sur les champs du formulaire |
| 429 | Retry avec backoff (géré par ky) |
| 500+ | Toast "Erreur serveur" + log |
| Network | Toast "Connexion perdue" + retry quand online |

### Règle fondamentale

> **JAMAIS** de `throw new Error("message")` générique. Toujours utiliser les classes typées.

### Utilitaire `getErrorMessage()`

```typescript
// lib/utils/get-error-message.ts
// Extrait un message humain depuis n'importe quel type d'erreur
// (ApiError, ZodError, Error, unknown)
```

---

## 25. Routing — TanStack Router

### Type : File-based routing

Le plugin `@tanstack/router-plugin/vite` génère automatiquement `routeTree.gen.ts`.

### Structure des layouts

```
__root.tsx                    → Root (OfflineBanner, Toaster, DevTools)
├── _public.tsx               → Layout public (pas d'auth requise)
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── _authenticated.tsx        → Layout protégé (auth guard)
│   ├── index.tsx             → Dashboard
│   ├── appointments.tsx
│   ├── calendar.tsx
│   ├── contacts.tsx
│   ├── company.tsx
│   │   ├── company.index.tsx
│   │   └── company.user.$userId.tsx
│   ├── fleet.tsx
│   ├── navigation.tsx
│   ├── profile.tsx
│   ├── settings.tsx
│   └── stats.tsx
├── _onboarding.tsx           → Flow onboarding
├── oauth-callback.$provider.tsx → OAuth redirect
└── subscription-required.tsx  → Gate abonnement
```

### Patterns de routing

| Pattern | Usage |
|---------|-------|
| `.tsx` + `.lazy.tsx` | Code-splitting (config dans `.tsx`, composant dans `.lazy.tsx`) |
| `beforeLoad` | Auth guard (redirect si non authentifié) |
| `pendingComponent` | Skeleton pendant le chargement |
| `errorComponent` | Gestion d'erreur avec bouton retry |
| `$paramName` | Paramètres dynamiques typés |

### RouterContext

```typescript
type RouterContext = {
  auth: {
    isAuthenticated: boolean
    token: string | null
    devMode: boolean
  }
}
```

### Auth guard

```typescript
// _authenticated.tsx
beforeLoad: ({ context }) => {
  if (!context.auth.isAuthenticated && !context.auth.devMode) {
    throw redirect({ to: "/login" })
  }
}
```

---

## 26. Composants UI — coss / Base UI

### Règle absolue

> **TOUJOURS** utiliser coss / Base UI. **JAMAIS** shadcn/Radix directement.

### Installation

```bash
npx shadcn@latest add @coss/<component>
```

### Workflow

1. Consulter `references/component-registry.md` pour trouver le bon primitif
2. Lire `references/primitives/<name>.md` pour le guide détaillé
3. Installer le composant
4. Suivre l'output checklist du skill

### Configuration (`components.json`)

```json
{
  "style": "base-vega",
  "rsc": false,
  "tsx": true,
  "tailwind": { "css": "src/index.css", "cssVariables": true },
  "iconLibrary": "hugeicons",
  "registries": {
    "@coss": { "url": "https://coss.com/ui/r/{name}.json" }
  }
}
```

### Composants disponibles (`components/ui/`)

68+ primitives incluant : card, button, input, field, label, dialog, popover, menu, select, checkbox, radio, tabs, tooltip, badge, avatar, separator, skeleton, scroll-area, collapsible, accordion, progress, switch, slider, textarea, alert, toast, etc.

### Composants patterns (`components/patterns/`)

33+ composants composés : form-field, pill-tabs, pagination-bar, error-boundary, stat-card, offline-banner, copy-button, confirm-dialog, etc.

---

## 27. Accessibilité (a11y)

### Obligation

> Vérifier l'accessibilité **systématiquement** pour tout composant interactif, formulaire, navigation.

### Règles

| Règle | Détail |
|-------|--------|
| Labels | Tout input doit avoir un label associé (visible ou `aria-label`) |
| Rôles ARIA | Utiliser les rôles sémantiques natifs en priorité |
| Focus | Navigation clavier fonctionnelle partout |
| Contraste | Respecter WCAG AA minimum |
| Storybook | Addon `@storybook/addon-a11y` activé |
| Sélecteurs E2E | `data-testid`, rôles ARIA, texte visible |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` implémenté |

### Piège connu

> Ne pas utiliser `Field`/`FieldLabel` (Base UI) quand l'input a besoin d'un `aria-label` propre — le `aria-labelledby` généré par `Field` prend le dessus et écrase le `aria-label`.

---

## 28. Conventions de nommage

### Fichiers

| Type | Convention | Exemple |
|------|-----------|---------|
| Composants | PascalCase | `Button.tsx`, `LoginPage.tsx` |
| Utilitaires/hooks | kebab-case | `use-clipboard.ts`, `get-error-message.ts` |
| Schemas | kebab-case domaine | `auth.schemas.ts` |
| Services | kebab-case domaine | `auth.service.ts` |
| Query keys | kebab-case domaine | `auth.keys.ts` |
| Tests | suffixe `.test.ts(x)` | `Button.test.tsx` |
| E2E | suffixe `.spec.ts` | `appointment-booking.spec.ts` |
| Stories | suffixe `.stories.tsx` | `Button.stories.tsx` |

### Code

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Schemas Zod | camelCase + Schema | `loginRequestSchema` |
| Services | camelCase + Service | `authService.login()` |
| Hooks Query | use + PascalCase | `useLoginMutation()` |
| Query keys | camelCase + Keys | `authKeys.me()` |
| Stores Zustand | use + PascalCase + Store | `useAuthStore` |
| Types Request | PascalCase + Request | `LoginRequest` |
| Types Response | PascalCase + Response | `LoginResponse` |
| Types Domain | PascalCase | `User`, `Appointment` |
| Composants | PascalCase | `FormField`, `PaginationBar` |
| Constantes | SCREAMING_SNAKE ou camelCase | `WEEKDAYS`, `statusFilter` |

---

## 29. Patterns d'import

### Alias obligatoire

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth"
import { cn } from "@/lib/utils"

// ❌ Interdit
import { Button } from "../../../components/ui/button"
import { useAuthStore } from "../../features/auth/auth.store"
```

### Règles

- **Toujours** utiliser l'alias `@/` (configuré dans Vite + TS)
- **Jamais** d'imports relatifs cross-features
- **Imports via barrel exports** pour les features (`features/auth` → `index.ts`)
- **Types** exportés avec `export type` pour le tree-shaking

### Barrel exports (`index.ts`)

```typescript
// features/auth/index.ts
export { useAuthStore } from "./auth.store"
export { authService } from "./auth.service"
export { authKeys } from "./auth.keys"
export { useMeQuery, useLoginMutation } from "./auth.queries"
export type { LoginRequest, User, ProfileResponse } from "./auth.schemas"
```

---

## 30. Patterns de composants

### Layout composant type

```typescript
// Composant fonctionnel React
function MyComponent({ title, onAction }: MyComponentProps) {
  // 1. Hooks (state, context, custom hooks)
  const [isOpen, setIsOpen] = useState(false)
  const { data } = useMyQuery()

  // 2. Derived state / computed values
  const filteredItems = useMemo(() => ..., [data])

  // 3. Event handlers
  const handleClick = useCallback(() => { ... }, [])

  // 4. Effects (si nécessaire)
  useEffect(() => { ... }, [dependency])

  // 5. Render
  return <div>...</div>
}
```

### Règles React

| Règle | Détail |
|-------|--------|
| Pas de `React.FC` | Typer les props directement |
| Pas d'API dans composants | Utiliser les hooks Query |
| Composition | Préférer composition à l'héritage |
| Keys | Utiliser des IDs stables, pas d'index |
| Conditional rendering | `&&` ou ternaire, pas de `if` dans JSX |
| State minimal | Dériver ce qui peut l'être |

---

## 31. Mobile-first & Performance

### Contexte

> iValid est utilisé sur tablette/mobile par des commerciaux terrain. **Pas de `hover`.**

### Prefetching — Triggers valides

| Trigger | Usage |
|---------|-------|
| Intersection Observer | Prefetch quand item entre dans le viewport |
| Mount du parent | Prefetch données de la prochaine vue probable |
| Navigation explicite | Prefetch dans le `loader` TanStack Router |

> **Pas de prefetch sur hover** (pas pertinent mobile).

### Code splitting

- Routes avec `.lazy.tsx` pour le code-splitting
- Chunks manuels : `vendor-calendar`, `vendor-charts`, `vendor-map`
- TanStack Router plugin gère le splitting automatique des routes

### Performance rendering

- `useMemo` / `useCallback` quand mesuré nécessaire
- Pas d'optimisation prématurée
- Virtualisation (`useInfiniteQuery`) uniquement si > 50 items

---

## 32. Variables d'environnement

| Variable | Usage | Défaut |
|----------|-------|--------|
| `VITE_API_URL` | URL base API | `/api` |
| `VITE_API_TARGET` | Cible proxy (`azure` / `local`) | `azure` |
| `VITE_SKIP_AUTH` | Bypass auth en dev | — |

### Fichiers

- `.env` — Configuration locale (gitignored)
- `.env.example` — Template versionné (`VITE_API_URL=/api`)

### Règle

> **Pas de secrets côté client.** `VITE_*` est exposé dans le bundle.

---

## 33. Sécurité

### Tokens

| Règle | Détail |
|-------|--------|
| Stockage | **Mémoire seule** (Zustand store, pas de persist) |
| localStorage | **INTERDIT** pour les tokens |
| Refresh | Automatique via interceptor ky sur 401 |
| Logout | Clear tokens + redirect `/login` |

### Interceptors de sécurité

1. **Bearer token** ajouté automatiquement à chaque requête
2. **401 → refresh** → si échec → logout automatique
3. **Erreurs parsées** → jamais de fuite d'info stack trace

### Bonnes pratiques

- Validation Zod côté client = protection contre les réponses API malformées
- Pas de `dangerouslySetInnerHTML` sans sanitization
- Pas d'évaluation dynamique (`eval`, `new Function`)
- CSP et headers de sécurité gérés côté serveur/Vercel

---

## 34. Objectifs de couverture

| Cible | Minimum |
|-------|---------|
| Logique métier (utils, hooks) | **≥ 90%** |
| Composants UI | **≥ 80%** |
| Couverture globale | **≥ 80%** |
| Parcours E2E critiques | **100% des happy paths** |

### Seuils enforced (`vitest.config.ts`)

```typescript
thresholds: {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
}
```

> Le build CI échoue si les seuils ne sont pas atteints.

### État actuel

- **469/469 tests passants**
- **0 erreurs TypeScript**
- **0 erreurs lint** (2 warnings légitimes)
- **Build production** : réussi

---

## 35. Workflow de développement

### Pour chaque feature/fix

```
1. Comprendre le besoin
      ↓
2. Écrire les tests (RED)
   • Tests unitaires pour logique métier et composants
   • Tests d'intégration pour les flux
   • Tests E2E si parcours utilisateur impacté
      ↓
3. Implémenter (GREEN)
   • Code minimal pour passer les tests
   • Utiliser les skills (coss, React best practices, a11y, Tailwind v4)
      ↓
4. Refactorer (REFACTOR)
   • Nettoyer sans casser les tests
      ↓
5. Vérifier
   • pnpm test         → tous les tests passent
   • pnpm typecheck    → pas d'erreur TS
   • pnpm lint         → pas de warning
   • pnpm build        → build réussi
```

### Scripts disponibles

| Commande | Action |
|----------|--------|
| `pnpm dev` | Serveur de développement (Vite) |
| `pnpm build` | Build production (typecheck + vite build) |
| `pnpm test` | Tous les tests Vitest |
| `pnpm test:watch` | Mode watch |
| `pnpm test:coverage` | Rapport de couverture |
| `pnpm test:e2e` | Tests E2E Playwright |
| `pnpm test:e2e:ui` | Playwright UI mode |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm storybook` | Storybook dev |
| `pnpm prepare` | Setup Husky hooks |

---

## 36. Dépendances clés & versions

### Production

| Package | Version | Rôle |
|---------|---------|------|
| react | 19.2 | Framework UI |
| react-dom | 19.2 | Rendering DOM |
| @tanstack/react-router | 1.168 | Routing type-safe |
| @tanstack/react-query | 5.99 | Data fetching & cache |
| ky | 2.0 | Client HTTP |
| zod | 4.3 | Validation runtime |
| zustand | 5.0 | État synchrone |
| @base-ui-components/react | 1.4 | UI primitives |
| tailwindcss | 4.2 | Styling utility-first |
| @fullcalendar/* | 6.1 | Composant calendrier |
| recharts | 3.8 | Graphiques |
| mapbox-gl | 3.22 | Cartes |
| sonner | 2.0 | Notifications toast |
| clsx | 2.1 | Gestion classes CSS |
| tailwind-merge | 3.3 | Merge classes Tailwind |
| react-hook-form | 7.57 | Gestion formulaires |
| @hookform/resolvers | 5.0 | Intégration Zod + RHF |

### Développement

| Package | Version | Rôle |
|---------|---------|------|
| typescript | 5.9.3 | Typage strict |
| vite | 7 | Bundler |
| vitest | 4.1 | Tests unitaires/intégration |
| @playwright/test | 1.59 | Tests E2E |
| msw | 2.13 | Mocking API |
| @testing-library/react | 16.3 | Testing utils React |
| @testing-library/user-event | 14.6 | Simulation interactions |
| @testing-library/jest-dom | 6.6 | Matchers DOM |
| eslint | 9 | Linting |
| prettier | 3.8 | Formatting |
| husky | 9.1 | Git hooks |
| lint-staged | 16.4 | Lint pre-commit |
| @storybook/react-vite | 10 | Storybook |
| @storybook/addon-a11y | 10 | Addon accessibilité |

---

## 37. Règles d'or — Résumé

### Architecture

1. **Feature-based** : chaque domaine métier isolé dans `features/`
2. **Barrel exports** : chaque feature expose via `index.ts`
3. **Pas d'API dans les composants** : uniquement via hooks Query
4. **Client HTTP unique** : ky instance dans `lib/api/client.ts`
5. **Validation Zod obligatoire** : toute réponse API parsée

### Code

6. **TypeScript strict** : `strict: true`, pas de `any`
7. **Double quotes**, pas de semicolons, indentation 2 espaces
8. **Alias `@/`** pour tous les imports
9. **Classes d'erreur typées** : jamais `throw new Error()` générique
10. **Tokens en mémoire** : jamais en localStorage

### Tests

11. **TDD obligatoire** : RED → GREEN → REFACTOR
12. **Colocalisation** : `.test.tsx` à côté du fichier testé
13. **MSW** pour les mocks API, jamais de mock manuel
14. **`userEvent`** pas `fireEvent`
15. **Couverture ≥ 80%** enforced en CI

### UI

16. **coss / Base UI** : jamais shadcn/Radix directement
17. **Tailwind v4** : configuration inline, plugin Prettier
18. **Accessibilité** : vérification systématique
19. **Mobile-first** : pas de hover, Intersection Observer pour prefetch

### Performance

20. **Code splitting** : `.lazy.tsx` pour les routes
21. **Pas d'optimisation prématurée** : escalade TanStack Query mesurée
22. **staleTime par domaine** : valeurs documentées et ajustables
23. **Chunks vendor** : calendar, charts, map séparés

### Qualité

24. **Pre-commit** : ESLint + Prettier automatiques
25. **CI** : typecheck + lint + test + build sur chaque PR
26. **Storybook** : composants documentés avec addon a11y
27. **Conventions nommage** : cohérentes et documentées

---

> **Ce document est un instantané.** Les conventions évoluent avec le projet.
> Source de vérité : `CLAUDE.md` + configurations dans le repository.

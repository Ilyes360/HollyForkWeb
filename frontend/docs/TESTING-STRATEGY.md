# Holy Fork — Testing Strategy (Feature-by-Feature, Risk-Based)

> Chaque feature est couverte integralement avant de passer a la suivante.
> On ne cherche pas un % de coverage global — on cherche a rendre chaque feature **incassable**.
> Les couches appliquees varient selon la **criticite** de la feature.
>
> Derniere mise a jour : 2026-07-20

---

## 1. Philosophie

**Le coverage ment.** Un fichier peut avoir 95% de coverage et laisser passer des regressions critiques.
Le mutation score est la metrique honnete : il prouve que les tests detectent les bugs, pas juste qu'ils executent le code.

**Risk-based, pas uniforme.** Appliquer 7 couches a toutes les features est insoutenable.
On module par criticite : les features "argent/donnees" meritent le maximum, les features d'affichage le minimum.

**Le schema OpenAPI est le point de pivot unique.** Si (a) les mocks MSW sont conformes au schema
et (b) le backend est conforme au schema, alors les mocks sont conformes au backend — par transitivite.
On ne teste JAMAIS le frontend contre le vrai Django pour verifier le contrat. MSW suffit,
a condition que le schema soit fort et verifie des deux cotes.

```
┌──────────────────────────────────────────────────────────────┐
│  Couche 7 — OBSERVABILITE (Sentry + Checkly)                │  Critique only
│  Couche 6 — MUTATION TESTING (Stryker incremental)          │  Critique only
│  Couche 5 — VISUAL REGRESSION (composant, pas full-page)    │  Critique only
│  Couche 4 — ACCESSIBILITY (axe-core + clavier)              │  Toutes
│  Couche 3 — E2E FLOW (Playwright, env ephemere)             │  Standard+
│  Couche 2 — COMPOSANT (Browser Mode + userEvent + MSW)      │  Toutes
│  Couche 1 — HOOK / LOGIQUE (renderHook + MSW)               │  Toutes
│  Couche 0 — STATIQUE (TS strict + ESLint + contract check)  │  Toutes (gratuit)
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Tiers de criticite

| Tier | Features | Couches appliquees |
|------|----------|-------------------|
| **Critique** (argent, donnees, securite) | Auth, Reservations, Stocks, Commandes fournisseurs, Device Login | 0 + 1 + 2 + 3 + 4 + 5 + 6 + 7 |
| **Standard** (coeur metier) | Carte/Menu, Planning, Admin (etablissements, employes) | 0 + 1 + 2 + 3 + 4 |
| **Affichage** (lecture seule) | Dashboard KPIs, Salle (canvas) | 0 + 1 + 2 + 4 |

---

## 3. Couche 0 — Statique (GRATUIT, toujours actif)

**Outils** : TypeScript strict, ESLint, Prettier, openapi-msw
**Cout** : zero runtime, quelques secondes en CI

- `tsc --noEmit` — zero erreur de type
- ESLint + jsx-a11y — erreurs evidentes
- **Contract check (anti-mock-drift)** : openapi-typescript + openapi-msw

### Contract testing — LA priorite #1 (schema OpenAPI = point de pivot unique)

Le plus gros trou de toute strategie MSW : **le mock drift**.
Les handlers MSW peuvent mentir : le backend change une reponse, les tests restent verts, la prod casse.

**Principe de transitivite :**
```
Mocks conformes au schema  +  Backend conforme au schema  =  Mocks conformes au backend
```
On ne fait PAS tourner le frontend contre le vrai Django. MSW suffit si le schema est fort.

**Le schema doit etre fort.** Un schema permissif rend la transitivite inutile :
- `SerializerMethodField` sans `@extend_schema_field` → type non contraint
- `to_representation` custom → invisible a l'introspection
- Reponses d'erreur non declarees → le frontend teste des 400 qui n'existent pas

**La vraie metrique : le nombre de warnings drf-spectacular.** Plus honnete que le coverage.
Ratchet-le vers zero : en CI backend, echouer si le compte augmente.

**Le dispositif complet (un gate de chaque cote du schema) :**

| Gate | Ou | Attrape | Cout |
|---|---|---|---|
| `spectacular --validate --fail-on-warn` | CI Django | Schema flou ou perime | ~0 |
| Publication schema (package npm ou PR auto) | CI Django, sur merge | Transport du contrat | une fois |
| `tsc` sur les handlers openapi-msw | CI front | Mocks ≠ schema | ~0 |
| oasdiff breaking | CI Django | Rupture non intentionnelle | ~0 |
| Schemathesis (cote BACKEND, pas front) | CI Django, nightly | Backend ≠ schema | moyen |
| Validation Zod → Sentry, endpoints critiques | Prod, continu | Realite ≠ schema | moyen |

Les 4 premiers sont quasi gratuits. Les 2 derniers sont les seuls vrais investissements.
**Schemathesis tourne cote backend** — c'est au backend de prouver qu'il honore son contrat.

**Comment le schema voyage (2 repos) :**
Option A : publier `@holyfork/api-contract` (schema.yml + types generes) comme package npm depuis la CI Django. Le frontend en depend, Renovate ouvre une PR au bump.
Option B : un job CI Django ouvre une PR sur le repo frontend avec le nouveau schema.yml. Moins propre mais zero infra.
Resultat : **une derive de contrat = une PR de dependance** avec un diff lisible et `tsc` qui explose.

**Ce qu'on abandonne :**
- **Pact / consumer-driven contract testing** — mauvais outil ici. Pact brille avec plusieurs consommateurs et pas de schema. On a un seul frontend et un schema OpenAPI : oasdiff + Schemathesis font deja le job.
- **Dual-run (tests front contre le vrai backend)** — subsume par la transitivite. MSW reste le seul outil pour injecter des 500, timeouts, JSON malformes, mode offline — impossible a provoquer sur un vrai backend sans polluer le code.

**Implementation frontend :**

```bash
pnpm add -D openapi-typescript openapi-msw
```

```typescript
// src/test/handlers/reservations.ts — AVANT (peut mentir)
http.get("/api/reservations/", () => HttpResponse.json({ results: [...] }))

// APRES (type-safe contre le schema OpenAPI)
import { createOpenApiHttp } from "openapi-msw"
import type { paths } from "@/types/api"
const http = createOpenApiHttp<paths>()
http.get("/api/reservations/", ({ response }) =>
  response(200).json({ results: [...] })  // TS echoue si la forme est fausse
)
```

---

## 4. Couche 1 — Hook / Logique metier

**Outil** : Vitest + renderHook + MSW (setupServer)
**Quand** : hooks a logique complexe (transformation, invalidation, pagination). Pas les hooks qui font juste un `useQuery` simple.

**Ce qu'on teste** :
- Donnees retournees (happy path)
- `isLoading`, `isError`, `enabled`
- Mutations : endpoint correct, invalidation cache
- Transformation API → domaine (camelCase, mapping)
- Cas limites : liste vide, donnees nulles

```typescript
it("stores device token on success", async () => {
  const { result } = renderHook(() => useDeviceLogin(), { wrapper })
  act(() => result.current.mutate({ restaurantId: 1, pinRestaurant: "123456" }))
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(getDeviceToken()).toBeTruthy()
})
```

---

## 5. Couche 2 — Composant (integration UI)

**Outil** : Vitest Browser Mode (Playwright) pour les composants DOM/CSS-dependants, jsdom pour la logique pure
**Quand** : chaque composant interactif (formulaire, dialog, liste avec actions)

**Browser Mode vs jsdom :**
- **jsdom** : hooks de transformation, utils, validations (rapide)
- **Browser Mode** : PIN pad tactile, dialogs focus trap, scroll/virtualisation, canvas Konva

```bash
pnpm add -D @vitest/browser @vitest/browser-playwright vitest-browser-react
```

**Convention** : `*.test.ts` (jsdom) vs `*.browser.test.tsx` (Browser Mode)

**Ce qu'on teste** :
- Rendu initial (textes, labels)
- Interactions (clic, saisie, submit, navigation)
- Etats d'erreur, loading, vide
- Navigation clavier (Tab, Enter, Escape)

**Selecteurs** : role > label > texte > testid. Si le test ne trouve pas l'element par son role, certains utilisateurs non plus.

---

## 6. Couche 3 — E2E Flow (parcours complet)

**Outil** : Playwright
**Quand** : tiers Standard et Critique (pas Affichage)

**Les E2E ne verifient PAS le contrat API** — c'est le role du contract testing (couche 0).
Les E2E verifient que le **frontend fonctionne de bout en bout** : routing, guards, state, navigation.
Ils tournent contre MSW (env ephemere), pas contre le vrai backend.

**IMPORTANT : NE PAS tester contre la prod.**
Donnees polluees, effets de bord, flakiness, pas de reset.

**Deux modes distincts :**

| | E2E pre-merge | Synthetic monitoring prod |
|---|---|---|
| **Quand** | Chaque PR | 24/7, toutes les 5-15 min |
| **Contre** | MSW (env ephemere seede) | Prod reelle |
| **But** | Valider le flow UI | Detecter les pannes |
| **Bloquant** | Oui (required check) | Non (alerte) |
| **Outil** | Playwright en CI | Checkly / Datadog Synthetics |
| **Donnees** | Fixtures MSW deterministes | Compte de test dedie |

```typescript
// e2e/device-login.spec.ts — contre env ephemere
test("full device login flow", async ({ page }) => {
  await page.goto("/device")
  await page.selectOption("select", "1")
  await tapPin(page, "123456")
  await expect(page.getByRole("heading", { name: /qui/i })).toBeVisible()
  await page.getByText("Jean Dupont").click()
  await tapPin(page, "1234")
  await expect(page).toHaveURL("/")
})
```

---

## 7. Couche 4 — Accessibilite (a11y)

**Outil** : vitest-axe (tests composant) + @axe-core/playwright (E2E)
**Quand** : TOUTES les features, sur chaque composant interactif

```typescript
it("has no accessibility violations", async () => {
  const { container } = render(<PinPad length={4} value="" onChange={vi.fn()} onComplete={vi.fn()} />)
  expect(await axe(container)).toHaveNoViolations()
})
```

- Violations WCAG AA
- Navigation clavier (Tab, Enter, Escape)
- Labels et aria corrects
- Contraste suffisant

---

## 8. Couche 5 — Regression visuelle

**Outil** : Vitest Browser Mode `toMatchScreenshot()` ou Storybook 9 + addon-vitest
**Quand** : tier Critique uniquement, au niveau **composant** (PAS full-page)

**Pas de screenshots full-page × 10 features** — cout de maintenance enorme et flakiness cross-OS.

**Perimetre** : composants du design system (PIN pad, boutons, dialogs, cards) + 2-3 ecrans critiques (plan de salle, gantt).

**Baselines** : generes en CI (Linux) uniquement, jamais en local macOS.

---

## 9. Couche 6 — Mutation testing

**Outil** : Stryker Mutator + Vitest runner
**Quand** : tier Critique uniquement, sur la **logique metier** (pas les composants UI)

**Mode incremental** : ne mute que le code change (`--since main --incremental`)
- PR : incremental (1-5 min)
- Nightly : full run sur la logique critique
- Seuil : mutation score > 80% (mutants survivants documentes)

```bash
# Sur PR (rapide)
npx stryker run --incremental --since main

# Nightly (complet)
npx stryker run --mutate "src/hooks/use-*.ts"
```

**Combine avec fast-check** (property-based testing) : les property tests tuent les mutants que les tests par l'exemple laissent survivre.

```bash
pnpm add -D fast-check
```

```typescript
import fc from "fast-check"
test("camelizeKeys est l'inverse de snakifyKeys", () => {
  fc.assert(fc.property(
    fc.dictionary(fc.stringMatching(/^[a-z][a-z_]{0,10}$/), fc.anything()),
    (obj) => {
      expect(snakifyKeys(camelizeKeys(obj))).toEqual(obj)
    }
  ))
})
```

---

## 10. Couche 7 — Observabilite (derniere ligne)

**Quand** : tier Critique uniquement
La prod est la derniere couche de test.

- **Sentry** : error monitoring + session replay (deja installe)
- **Checkly** : synthetic monitoring, reutilise les specs Playwright comme monitors
- **Feature flags** : rollout progressif, rollback instantane

---

## 11. Tests supplementaires par domaine

### Resilience reseau (critique pour un POS restaurant)
- Retry logic TanStack Query
- Optimistic updates rollback (onMutate → echec → onError rollback)
- Race conditions (double-clic submit, mutations concurrentes)
- Offline / slow 3G (`context.setOffline(true)` dans Playwright)

### Securite applicative
- Guards de routes : un employe ne peut pas atteindre `/admin`
- RBAC : le PIN d'un serveur ne debloque pas les fonctions manager
- Token expire → refresh → retry transparent
- Fuite inter-utilisateurs : apres logout, `queryClient.clear()` purge tout

### Securite supply chain npm
- `pnpm audit --audit-level=high` en CI (bloquant)
- Socket for GitHub (analyse comportementale, pas juste CVE)
- Lockfile committe et verifie
- 2FA npm, provenance attestation

### Canvas Konva (plan de salle)
- Logique de state en unit (positions, collisions, assignations)
- Interactions via API react-konva
- Regression visuelle du canvas via Playwright `toHaveScreenshot`

---

## 12. Ordre des features a couvrir

| # | Feature | Tier | Couches |
|---|---------|------|---------|
| 1 | **Device Login** | Critique | 0-1-2-3-4-5-6-7 |
| 2 | **Auth** (login, register, logout, guards) | Critique | 0-1-2-3-4-5-6-7 |
| 3 | **Reservations** (CRUD, filtres, gantt) | Critique | 0-1-2-3-4-5-6-7 |
| 4 | **Stocks** (CRUD, alertes, reappro) | Critique | 0-1-2-3-4-5-6-7 |
| 5 | **Commandes fournisseurs** (CRUD, statuts) | Critique | 0-1-2-3-4-5-6-7 |
| 6 | **Carte/Menu** (articles, recettes) | Standard | 0-1-2-3-4 |
| 7 | **Planning** (shifts, gantt) | Standard | 0-1-2-3-4 |
| 8 | **Admin** (etablissements, employes) | Standard | 0-1-2-3-4 |
| 9 | **Dashboard** (KPIs, charts, carte) | Affichage | 0-1-2-4 |
| 10 | **Salle** (plan Konva, tables) | Affichage | 0-1-2-4 |

---

## 13. Definition of Done par tier

### Toutes les features (base)
- [ ] TS strict passant, ESLint clean
- [ ] Handlers MSW type-safe (openapi-msw, `tsc` vert = pas de mock drift)
- [ ] Tests composant : rendu, interactions, erreurs, etats vides, loading
- [ ] Tests hook pour la logique non triviale
- [ ] Zero violation a11y (axe-core), navigation clavier, roles accessibles

### Standard (+ base)
- [ ] E2E happy path + 1 cas d'erreur (env ephemere, pas la prod)
- [ ] Tests de resilience si applicable (retry, rollback)

### Critique (+ standard)
- [ ] Mutation score > 80% sur la logique critique (Stryker incremental)
- [ ] Property-based tests (fast-check) sur les calculs/transformations
- [ ] Tests de securite : RBAC, guards, token refresh, purge cache logout
- [ ] Tests de concurrence (double-submit, mutations concurrentes)
- [ ] Regression visuelle au niveau composant (baselines Linux CI)
- [ ] Monitor Checkly en prod (synthetic monitoring)

---

## 14. Structure des fichiers

```
src/
├── components/carte/
│   ├── recipe-card.tsx
│   ├── recipe-card.test.tsx          # Colocated : test a cote du composant
│   └── recipe-card.browser.test.tsx  # Browser Mode si DOM/CSS-dependant
├── hooks/
│   ├── use-articles.ts
│   └── use-articles.test.ts          # Colocated
├── test/
│   ├── setup.ts                      # MSW lifecycle
│   ├── render.tsx                    # Helper renderWithProviders
│   ├── server.ts                     # MSW server
│   ├── handlers/                     # MSW handlers (openapi-msw)
│   └── mocks/                        # Fixtures par domaine
└── types/
    └── api.d.ts                      # Genere par openapi-typescript

e2e/                                  # Playwright E2E (env ephemere)
├── device-login.spec.ts
├── auth.spec.ts
└── fixtures/                         # Playwright fixtures (auth, seeding)
```

**Colocalisation** : les tests composant/hook vivent a cote du code.
Les E2E Playwright et les handlers MSW globaux restent dans des dossiers dedies.

---

## 15. Pipeline CI (fail fast)

**Sur chaque PR (bloquant) :**
1. Statique : `tsc --noEmit` + ESLint + Prettier (secondes)
2. Contract : regenere schema + oasdiff breaking + `tsc` handlers openapi-msw
3. Unit + hook (jsdom) : `vitest run --changed`
4. Composant (Browser Mode) : `vitest run --project=browser`
5. a11y : inclus dans les tests composant
6. E2E critiques : Playwright contre env ephemere seede
7. Security : `pnpm audit --audit-level=high`
8. Bundle size : `size-limit`

**Nightly (non-bloquant) :**
- Mutation testing full (Stryker)
- Suite E2E complete (tous parcours, desktop + tablette)
- Regression visuelle complete
- Lighthouse CI
- Schemathesis fuzz backend

---

## 16. Anti-patterns

| Anti-pattern | Pourquoi | Faire plutot |
|---|---|---|
| Tester l'implementation | Fragile, casse au refactor | Tester le comportement visible |
| `vi.mock()` sur les modules API | Decouple du reseau reel | MSW (intercepte le reseau) |
| 100% coverage comme objectif | Encourage les tests faibles | Mutation score > 80% sur le critique |
| Un mega test E2E pour tout | Lent, flaky | 1 E2E par flow critique |
| E2E contre la prod | Pollution donnees, flakiness | Env ephemere seede |
| Screenshots full-page × 10 features | Cout maintenance enorme | Composant-level, baselines Linux CI |
| `data-testid` par defaut | a11y smell | role > label > texte > testid |
| Handlers MSW non types | Mock drift invisible | openapi-msw type-safe |
| Mutation testing sur tout | Trop lent | Incremental sur le diff, logique metier only |
| 6 couches uniformes | Insoutenable | Risk-based par tier de feature |

---

## 17. Prompt d'audit futur

Pour verifier que cette strategie est a jour, utiliser ce prompt :

```
Recherche les pratiques de testing frontend les plus avancees et rigoureuses
en [ANNEE COURANTE] pour une SPA React (Vite + Vitest + Playwright + MSW).

Compare avec cette strategie risk-based en 8 couches (0-7) :
0. Statique (TS strict + ESLint + contract check openapi-msw)
1. Hook testing (renderHook + MSW)
2. Component testing (Vitest Browser Mode + jsdom)
3. E2E flow (Playwright, env ephemere)
4. Accessibility (axe-core)
5. Visual regression (composant-level, pas full-page)
6. Mutation testing (Stryker incremental + fast-check)
7. Observabilite (Sentry + Checkly synthetic monitoring)

+ Tests supplementaires : resilience reseau, securite RBAC, supply chain npm

Questions :
- Y a-t-il des couches manquantes ?
- Vitest Browser Mode est-il toujours le standard pour les tests composant ?
- Stryker + Vitest est-il toujours la reference pour le mutation testing ?
- openapi-msw est-il toujours maintenu et la meilleure option pour le contract testing MSW ?
- Quels nouveaux outils ou pratiques ont emerge depuis la derniere mise a jour ?
```

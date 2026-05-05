# Plan d'intégration API Holly Pi — Connexion complète

## État actuel (après Parties 1-2)

- ✅ Orval configuré, code généré pour ~150 endpoints
- ✅ MSW + tests d'intégration (auth, dashboard, restaurants, admin)
- ✅ Mode Dev/User toggle (runtime, pill en bas à droite)
- ✅ Auth connectée à l'API réelle
- ✅ Hooks admin créés (establishments, employees, roles) avec dual mode
- ✅ Hooks planning créés (weekly schedule, shifts) avec dual mode
- ✅ Hooks réservations créés (reservations, salles, tables) avec dual mode
- ✅ Hooks carte créés (articles, categories, ingredients) avec dual mode
- ✅ Hooks stocks créés (stocks, reappro) avec dual mode
- ✅ Hooks commandes créés (orders, suppliers) avec dual mode
- ✅ Hooks dashboard wrapper (KPIs, map) avec dev mode fallback
- ✅ Hooks settings créés (settings, payment methods, notes) avec dual mode
- ✅ MSW handlers pour TOUS les domaines (201 tests passent)
- ⬜ Pages pas encore branchées sur les hooks (lisent encore les stores directement)

## Pattern par domaine

Chaque domaine suit le même workflow :

1. **Créer MSW handlers** (`src/test/handlers/<domain>.ts`) — snake_case
2. **Créer fixtures** (`src/test/mocks/<domain>.ts`) — snake_case
3. **Créer hooks wrapper** (`src/hooks/use-<domain>.ts`) — dev mode → store mock, user mode → React Query + API
4. **Ajouter handlers au serveur** (`src/test/server.ts`)
5. **Tests d'intégration** (`src/__tests__/integration/<domain>/`)
6. **Modifier les pages** — remplacer les lectures directes du store par les hooks
7. `pnpm typecheck && pnpm test` → tout passe

## Parties restantes

### Partie 3 — Planning

**Endpoints :**
- `GET /api/planning/emploi-du-temps/` — emplois du temps par restaurant/semaine
- `POST /api/planning/emploi-du-temps/` — créer/modifier créneaux

**Fichiers à créer :**
- `src/hooks/use-planning.ts`
- `src/test/handlers/planning.ts`
- `src/test/mocks/planning.ts`
- `src/__tests__/integration/planning/planning-queries.test.ts`

**Pages à modifier :**
- `src/pages/planning.tsx` — remplacer `initialShifts`/`mockEmployees` par hook API en user mode

---

### Partie 4 — Réservations

**Endpoints :**
- `GET/POST/PUT/DELETE /api/reservations/` + `/{id}/`
- `GET /api/salles/` — salles par restaurant
- `GET /api/tables/` — tables par salle

**Fichiers à créer :**
- `src/hooks/use-reservations.ts`
- `src/hooks/use-rooms.ts`
- `src/test/handlers/reservations.ts`
- `src/test/mocks/reservations.ts`
- `src/__tests__/integration/reservations/`

**Pages à modifier :**
- `src/pages/reservations.tsx` — remplacer `MOCK_RESERVATIONS`

**Mock data existante :** `src/components/reservations/data.ts` (MOCK_RESERVATIONS, RESTAURANT_TABLES)

---

### Partie 5 — Carte & Recettes

**Endpoints :**
- `GET/POST/PUT/DELETE /api/articles/` + `/{id}/`
- `GET/POST /api/categories/`
- `GET/POST /api/ingredients/`
- `GET/POST/DELETE /api/article-ingredients/`

**Fichiers à créer :**
- `src/hooks/use-articles.ts`
- `src/hooks/use-ingredients.ts`
- `src/hooks/use-categories.ts`
- `src/test/handlers/articles.ts`
- `src/test/mocks/articles.ts`
- `src/__tests__/integration/carte/`

**Stores impactés :** `src/stores/recipe-store.ts` (MOCK_RECIPES)
**Pages à modifier :** `src/pages/carte.tsx`, `src/pages/cuisine-recipe.tsx`

---

### Partie 6 — Stocks

**Endpoints :**
- `GET/POST/PUT /api/stocks/`
- `GET /api/ingredients/` (réutilisé)
- `GET/POST /api/reapprovisionnements/`

**Fichiers à créer :**
- `src/hooks/use-stocks.ts`
- `src/test/handlers/stocks.ts`
- `src/test/mocks/stocks.ts`
- `src/__tests__/integration/stocks/`

**Stores impactés :** `src/stores/inventory-store.ts` (MOCK_PRODUCTS)
**Pages à modifier :** `src/pages/stocks.tsx`

---

### Partie 7 — Commandes & Fournisseurs

**Endpoints :**
- `GET/POST/PUT/DELETE /api/commandes/` + `/{id}/`
- `GET/POST/PUT/DELETE /api/lignes-commandes/`
- `GET/POST/PUT/DELETE /api/suppliers/` + `/{id}/`
- `GET/POST /api/factures/` + `/{id}/`

**Fichiers à créer :**
- `src/hooks/use-orders.ts`
- `src/hooks/use-suppliers.ts`
- `src/hooks/use-invoices.ts`
- `src/test/handlers/commandes.ts`
- `src/test/mocks/commandes.ts`
- `src/__tests__/integration/commandes/`

**Stores impactés :** `src/stores/inventory-store.ts` (MOCK_ORDERS, MOCK_SUPPLIERS_FULL)
**Pages à modifier :** `src/pages/commandes.tsx`

---

### Partie 8 — Dashboard (compléter)

**Endpoints déjà branchés :**
- `GET /api/dashboard/kpis/` ✅
- `GET /api/dashboard/map/` ✅

**Reste à faire :**
- Retirer les fallbacks mock (MOCK_KPIS, MOCK_VENTES, MOCK_COVERS_HISTORY, MOCK_FOODCOST_HISTORY)
- Garder en dev mode via le hook pattern
- Ajouter `GET /api/reports/` si disponible

**Pages à modifier :** `src/pages/dashboard.tsx`

---

### Partie 9 — Settings & Finitions

**Endpoints :**
- `GET/PUT /api/settings/`
- `GET/POST /api/methodes-paiement/`
- `GET/POST /api/paiements/`
- `GET/POST /api/notes/`

**Fichiers à créer :**
- `src/hooks/use-settings.ts`
- `src/test/handlers/settings.ts`
- `src/__tests__/integration/settings/`

**Pages à modifier :** `src/pages/parametres/general-form.tsx`

**Finitions :**
- Vérifier coverage ≥ 70%
- Brancher les pages admin sur les hooks (store → hooks)
- Retirer les imports dead de mock data dans les pages branchées

---

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `src/stores/dev-mode-store.ts` | Toggle dev/user + constantes mock |
| `src/components/dev-mode-toggle.tsx` | UI toggle (bottom-right) |
| `src/api/mutator.ts` | Pont orval → ky |
| `src/api/client.ts` | Client ky avec URLs absolues |
| `src/test/server.ts` | MSW server avec tous les handlers |
| `src/test/render.tsx` | Custom render pour tests |
| `orval.config.ts` | Config génération API |
| `docs/api/openapi.json` | Spec OpenAPI (commité) |

## Commandes utiles

```bash
pnpm gen:api          # Regénérer le code orval
pnpm typecheck        # Vérifier les types
pnpm test             # Lancer tous les tests
pnpm test:cov         # Tests avec coverage
pnpm dev              # Dev server (toggle dev/user dispo)
```

# Systeme de copie contextuelle "Voix Holy Fork"

## Principes de ton

1. **Parler comme un second de cuisine** — direct, metier, pas un logiciel
2. **Contextualiser chaque chiffre** — un % sans contexte est mort
3. **Etre utile, pas bavard** — chaque mot aide a decider ou rassure
4. **Valoriser le metier** — "ta salle", "ta brigade", "ta carte"
5. **Tutoyer** — "tes clients sont conquis", pas "vos clients"

## Structure

```
src/lib/copy/
  types.ts          — Types partages (CopyInsight, EmptyStateCopy, PageMeta)
  index.ts          — Barrel re-export
  dashboard.ts      — getGreeting(), getDashboardKpiInsight()
  stock.ts          — getStockStatusInsight(), getStockEmptyState()
  carte.ts          — getCarteKpiInsight(), getFeasibilityInsight(), getCarteEmptyState()
  commandes.ts      — getCommandeEmptyState()
  reservations.ts   — getReservationInsight(), getReservationEmptyState()
  planning.ts       — getPlanningEmptyState()
  toasts.ts         — TOAST: messages centralises
  validation.ts     — getValidationMessage() pour formulaires
  pages.ts          — PAGE_META: titre et sous-titre par page
```

## Types

```typescript
type CopyVariant = "info" | "success" | "warning" | "danger" | "neutral"

interface CopyInsight {
  text: string
  variant: CopyVariant
}

interface EmptyStateCopy {
  title: string
  description: string
  actionLabel?: string
}
```

## Composants partages

### `<InsightText insight={...} />`

Affiche un `CopyInsight` avec la couleur correspondant au variant. Retourne `null` si insight est `null`.

### `<EmptyState title description actionLabel onAction icon />`

Bloc centre avec bordure pointillee, titre, description et bouton optionnel.

## Ajouter un nouveau message contextuel

1. **Creer une fonction pure** dans le fichier domaine correspondant (`src/lib/copy/{domaine}.ts`)
   - Signature : `(data) => CopyInsight | null` ou `(data) => EmptyStateCopy`
   - Pas de React, pas de store, pas de side effects
2. **Exporter** via `src/lib/copy/index.ts`
3. **Utiliser** dans le composant avec `<InsightText>` ou `<EmptyState>`
4. **Tester** dans `src/__tests__/copy/{domaine}-copy.test.ts`

## Conventions

- Les fonctions de copie sont **pures** : testables, reutilisables, adoptables graduellement
- Chaque composant migre a son rythme — pas de big bang necessaire
- Les toasts sont centralises dans `TOAST` — pas de string inline
- Les messages de validation passent par `getValidationMessage(field, rule)`
- Les sous-titres de page passent par `PAGE_META[pageId]`

## Hook `useGreeting()`

Connecte le store auth (prenom) et l'heure courante a `getGreeting()`. Retourne `{ title, subtitle }`.

## Tests

```bash
npx vitest run src/__tests__/copy/
```

5 fichiers de test couvrent toutes les fonctions de copie :
- `dashboard-copy.test.ts` — greeting + KPI insights
- `stock-copy.test.ts` — statuts enrichis + empty states
- `carte-copy.test.ts` — faisabilite + KPI insights + empty states
- `toasts.test.ts` — snapshot de toutes les strings
- `validation.test.ts` — toutes les combinaisons champ x regle

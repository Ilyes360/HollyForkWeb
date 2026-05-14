# Bug Planning : la sauvegarde n'appelle aucun endpoint API

> Date : 2026-05-14
> Severité : **Majeure** — les modifications du planning ne sont jamais persistées en base

---

## Symptôme

- Le GET fonctionne : les shifts se chargent depuis `GET /api/planning/shifts/`
- L'éditeur s'ouvre, on peut modifier les shifts
- On clique "Enregistrer" → toast "Planning enregistré" ✓
- **Aucun POST/PUT/DELETE n'est envoyé** → les changements sont perdus au rechargement

---

## Trace du flux (bouton → code)

### 1. Clic sur "Enregistrer"

**Fichier :** `components/planning/edition-toolbar.tsx` (ligne ~28)

```tsx
<Button onClick={onSave}>Enregistrer</Button>
```

### 2. Le handler remonte via `root-layout.tsx`

**Fichier :** `layouts/root-layout.tsx` (lignes 56-59)

```tsx
const handlePlanningSave = React.useCallback(() => {
  planning.onSaveRef.current?.(planning.state.shifts)  // appelle onSave avec les shifts
  planning.onCloseRef.current?.()                       // ferme l'éditeur
}, [planning.state.shifts, planning.onSaveRef, planning.onCloseRef])
```

### 3. `onSaveRef` pointe vers `handleSave` dans `planning.tsx`

**Fichier :** `pages/planning.tsx` (lignes 63-75)

```tsx
// Stable save handler via ref
const saveHandler = useRef<(newShifts: Shift[]) => void>(() => {})
saveHandler.current = (newShifts: Shift[]) => {
  setShifts(newShifts)              // ← Met à jour le state React local
  if (newShifts.length > 0) {
    completeTask("first-service")   // ← Marque le getting-started
  }
  toast.success("Planning enregistré")  // ← Affiche le toast
}

const handleSave = useCallback((newShifts: Shift[]) => {
  saveHandler.current(newShifts)
}, [])
```

### Le problème est ici ↑

`handleSave` fait **3 choses** :
1. `setShifts(newShifts)` — met à jour le state local (variable module-level `persistedShifts`)
2. `completeTask("first-service")` — getting-started
3. `toast.success(...)` — feedback visuel

**Il ne fait PAS :**
- Appeler `useCreateShift().mutate()`
- Appeler `useUpdateShift().mutate()`
- Appeler `useDeleteShift().mutate()`
- Aucun appel API de quelque nature que ce soit

---

## Les mutations existent mais ne sont pas utilisées

**Fichier :** `hooks/use-planning.ts` (lignes 170-206)

```tsx
// Ces 3 hooks sont définis et fonctionnels :
export function useCreateShift()  // → POST   /api/planning/shifts/
export function useUpdateShift()  // → PUT    /api/planning/shifts/:id/
export function useDeleteShift()  // → DELETE /api/planning/shifts/:id/
```

**Mais `planning.tsx` ne les importe jamais** — il importe seulement `useShifts` (lecture).

---

## Pourquoi ça "marchait chez d'autres"

Si d'autres utilisateurs voyaient un planning fonctionnel, c'est parce que :
- Ils utilisaient le **dev mode** (données mock en mémoire, pas besoin d'API)
- Ou les shifts étaient créés **directement en base** (admin Django, script, autre outil)
- Ou le `persistedShifts` module-level gardait les données **dans le même onglet** tant qu'on ne rechargeait pas la page

---

## Ce qu'il faut faire (côté frontend)

Dans `pages/planning.tsx`, le `handleSave` doit :

1. **Comparer** `initialShifts` (avant édition) avec `newShifts` (après édition)
2. **Identifier** les shifts ajoutés, modifiés et supprimés
3. **Appeler** les mutations correspondantes :
   - Shifts **ajoutés** (id temporaire, pas dans initialShifts) → `POST /api/planning/shifts/`
   - Shifts **modifiés** (même id, contenu différent) → `PUT /api/planning/shifts/:id/`
   - Shifts **supprimés** (dans initialShifts, absent de newShifts) → `DELETE /api/planning/shifts/:id/`
4. Garder le local-first (mettre à jour le state immédiatement, API en background)

---

## Attention : bug serializer aussi côté backend

Même quand le frontend appellera l'API, le `ShiftSerializer` dans `holly_pi` a le même bug `validated_data` :

| Méthode    | Clé utilisée (faux)            | Clé correcte (source)          |
|------------|-------------------------------|-------------------------------|
| `create()` | `validated_data['start_date']` | `validated_data['date_debut']` |
| `create()` | `validated_data['end_date']`   | `validated_data['date_fin']`   |
| `create()` | `validated_data.get('shift_type')` | `validated_data.get('type_shift')` |
| `update()` | `validated_data.get('start_date')` | `validated_data.get('date_debut')` |
| `update()` | `validated_data.get('end_date')`   | `validated_data.get('date_fin')`   |
| `update()` | `validated_data.get('shift_type')` | `validated_data.get('type_shift')` |

→ Les POST/PUT retourneront un **500 KeyError** tant que le backend n'est pas corrigé.

Voir : `docs/api-integration/bug-serializers-validated-data.md`

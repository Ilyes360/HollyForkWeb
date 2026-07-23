# Reservations — Detail couverture

> Sous-features : 3a (CRUD), 3b (Gantt)

## 3a. Reservations CRUD (Critique)

### Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useReservations() | ✅ | 3 | features/reservations/hooks.test.tsx |
| useCreateReservation() | ✅ | 1 | features/reservations/hooks.test.tsx |
| useUpdateReservation() | ✅ | 1 | features/reservations/hooks.test.tsx |
| useDeleteReservation() | ✅ | 1 | features/reservations/hooks.test.tsx |
| useSalles() | ❌ | — | — |
| useTables() | ❌ | — | — |

### Mapping

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| mapApiReservation() | ✅ | 19 | features/reservations/mapping.test.ts |

### Composants

| Composant | C2 | C4 a11y | Tests | Fichier test |
|-----------|:--:|:-------:|-------|-------------|
| NewReservationDialog | ✅ | ✅ | 11 | features/reservations/new-reservation-dialog.test.tsx |
| ReservationDetail | ✅ | ✅ | 18 | features/reservations/reservation-detail.test.tsx |
| ReservationsTable | ✅ | ✅ | 15 | features/reservations/reservations-table.test.tsx |
| ReservationsHeader | ❌ | ❌ | — | — |
| ReservationsKpis | ❌ | ❌ | — | Lecture seule, basse priorite |
| ReservationsRecap | ❌ | ❌ | — | Lecture seule, basse priorite |
| LiveSidePanel | ❌ | ❌ | — | Lecture seule, basse priorite |
| PipelineStepper | ❌ | ❌ | — | Lecture seule, basse priorite |

### Hooks utilitaires

| Hook | Teste | Tests | Fichier test |
|------|:-----:|-------|-------------|
| useTableAvailability() | ✅ | — | use-table-availability.test.ts |
| useDayNavigation() | ❌ | — | — |

### A11y findings

- `ActionIcon` : icon-only buttons sans aria-label (Moyenne)
- `<TableHead>` : colonne actions vide (Basse)
- `AlertDialogTrigger` : double-button dans le DOM (Basse)

---

## 3b. Reservations Gantt (Critique)

> Necessite Browser Mode (Vitest). Reporte en passe C.

### Composants Gantt (9 fichiers)

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| GanttTimeline | ❌ | ❌ | Conteneur principal |
| GanttHeader | ❌ | ❌ | Entetes heures |
| GanttRow | ❌ | ❌ | Ligne par table |
| GanttBlock | ❌ | ❌ | Bloc reservation |
| GanttPipelineBar | ❌ | ❌ | Barre pipeline |
| GanttTooltip | ❌ | ❌ | Tooltip hover |
| GanttEmptySlot | ❌ | ❌ | Slot vide |
| GanttNowCursor | ❌ | ❌ | Curseur heure actuelle |
| GanttRescheduleDialog | ❌ | ❌ | Dialog replanification |

### Hooks Gantt

| Hook | Teste | Tests | Fichier test |
|------|:-----:|-------|-------------|
| useGanttZoom | ❌ | — | — |
| useGanttDensity | ✅ | — | use-gantt-density.test.ts |
| useGanttLayout | ✅ | — | use-gantt-layout.test.ts |
| autoViewMode | ✅ | — | auto-view-mode.test.ts |

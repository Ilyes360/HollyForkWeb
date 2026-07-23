# Planning — Detail couverture

> Sous-features : 7a (Editeur), 7b (Gantt), 7c (Consultation)

## Hooks partages

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useShifts() | ❌ | — | — |
| useCreateShift() | ❌ | — | — |
| useUpdateShift() | ❌ | — | — |
| useDeleteShift() | ❌ | — | — |
| useEmployees() | ❌ | — | — |
| useEmployeeTypes() | ❌ | — | — |
| useCreateEmployee() | ❌ | — | — |
| useDayNavigation() | ❌ | — | — |
| useWeekNavigation() | ❌ | — | — |
| useEmployeesStatus() | ❌ | — | — |

## Utils (components/planning/utils.ts)

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| getInitials() | ❌ | — | pure function |
| calculateHours() | ❌ | — | pure function |
| getWeeklyHours() | ❌ | — | pure function |
| getShiftsForDayAndService() | ❌ | — | pure function |
| getEmployeeById() | ❌ | — | pure function |
| getMondayOfWeek() | ❌ | — | pure function |
| addDays() | ❌ | — | pure function |
| formatDateShort() | ❌ | — | pure function |
| formatWeekLabel() | ❌ | — | pure function |
| getDayDate() | ❌ | — | pure function |
| isToday() | ❌ | — | pure function |
| isPast() | ❌ | — | pure function |
| getDayRecap() | ❌ | — | pure function |

---

## 7a. Planning Editeur (Standard)

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| EditionGrid | ❌ | ❌ | Grille drag-drop |
| EditionToolbar | ❌ | ❌ | Toolbar edition |
| EditionOverlay | ❌ | ❌ | Overlay edition |
| DroppableCell | ❌ | ❌ | Cellule droppable |
| DropZone | ❌ | ❌ | Zone de drop |
| ShiftPopover | ❌ | ❌ | Popover shift |
| ShiftMiniCard | ❌ | ❌ | Card shift |
| ServiceConfigPopover | ❌ | ❌ | Config service |
| UnsavedDialog | ❌ | ❌ | Dialog modifications non sauvees |
| WeekNavigator | ❌ | ❌ | Navigation semaine |
| EmployeeCard | ❌ | ❌ | Card employe |
| EmployeePanel | ❌ | ❌ | Panel employes |
| PlanningEditionProvider | ❌ | ❌ | Context provider |

---

## 7b. Planning Gantt (Standard)

> Meme problematique que Reservations Gantt — potentiellement Browser Mode.

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| (aucun composant Gantt separe) | — | — | Le planning utilise les composants Gantt des reservations ou ses propres vues |

### Hooks

| Hook | Teste | Tests | Fichier test |
|------|:-----:|-------|-------------|
| useGanttDensity | ✅ | — | use-gantt-density.test.ts |
| useGanttLayout | ✅ | — | use-gantt-layout.test.ts |

---

## 7c. Planning Consultation (Standard)

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| ConsultationView | ❌ | ❌ | Vue lecture seule |
| ConsultationGrid | ❌ | ❌ | Grille read-only |
| ConsultationCell | ❌ | ❌ | Cellule read-only |
| DayRecap | ❌ | ❌ | Resume jour |
| StaffingIndicator | ❌ | ❌ | Indicateur effectif |
| DesktopGate | ❌ | ❌ | Gate mobile → desktop |

# Dashboard — Detail couverture

> Sous-feature : 9 (Dashboard)

## Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useDashboard() | ❌ | — | — |
| useDashboardMapData() | ❌ | — | — |
| useRevenueByCategory() | ❌ | — | — |
| useGreeting() | ❌ | — | — |

## Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| MapCard | ❌ | ❌ | Mapbox GL — lazy loaded |
| PeriodPicker | ❌ | ❌ | Selecteur de periode |

## Pages

| Page | Testee | Notes |
|------|:------:|-------|
| DashboardPage | ❌ | KPIs + charts + map (Recharts + Mapbox) |

## Tests existants (hors feature)

| Fichier test | Type | Tests |
|-------------|------|-------|
| copy/dashboard-copy.test.ts | Copy | Textes UI dashboard |

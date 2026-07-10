# Plan d'implémentation — Réservations v2 (révisé)

## Architecture cible

```
┌─────────────────────────────────────────────────────────────┐
│                    reservations.tsx (page)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ReservationsHeader (inchangé + toggle vue)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ viewMode === "table" ─────────────────────────────┐    │
│  │                                                     │    │
│  │  ┌──────────────────────┬──────────────────────┐   │    │
│  │  │                      │                      │   │    │
│  │  │  ReservationsTable   │  LiveSidePanel       │   │    │
│  │  │  (refactoré)         │  (NOUVEAU)           │   │    │
│  │  │  - sans col Canal    │  - prochaines arriv. │   │    │
│  │  │  - search table/nom  │  - tables libres     │   │    │
│  │  │  - KPIs inline       │  - résumé statuts    │   │    │
│  │  │                      │  - alerte en attente │   │    │
│  │  └──────────────────────┴──────────────────────┘   │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ viewMode === "gantt" ─────────────────────────────┐    │
│  │                                                     │    │
│  │  GanttTimeline (NOUVEAU)                           │    │
│  │  - grille horaire horizontale                      │    │
│  │  - lignes par table                                │    │
│  │  - blocs résa avec pipeline                        │    │
│  │  - curseur NOW                                     │    │
│  │  - densité auto (viewport-based)                   │    │
│  │  - clic bloc → detail sheet                        │    │
│  │  - clic cellule vide → new reservation dialog      │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ReservationDetail (sheet, partagé)                         │
│  NewReservationDialog (dialog, partagé)                     │
│  ReservationsRecap (barre bas, partagé)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 1 — Tableau Augmenté (~3-4 jours)

### 1.1 Refactoring des types et données

**Fichier : `src/components/reservations/types.ts`**

Ajouts :

```ts
// Mode de vue
type ReservationViewMode = "table" | "gantt"

// Pipeline configurable — les étapes ne sont PAS un enum fixe.
// Chaque restaurant définit ses propres étapes dans sa config.
// On fournit des templates par défaut.
interface PipelineStageDefinition {
  id: string                 // identifiant unique (ex: "plat_servi")
  label: string              // "Plat servi"
  shortLabel: string         // "PLT" (2-3 chars pour mode compact)
  color: string              // token CSS (ex: "var(--success)")
  avgDurationMinutes: number // durée moyenne pour estimation
  order: number              // position dans la séquence
}

// Un template de pipeline = un set d'étapes pré-configuré
interface PipelineTemplate {
  id: string
  name: string               // "Bistrot", "Brasserie", "Gastronomique"
  stages: PipelineStageDefinition[]
}

// Les templates par défaut :
// - "bistrot" : installé → commande_passée → plat_servi → addition (4 étapes)
// - "brasserie" : installé → commande → entrée → plat → dessert → addition (6 étapes)
// - "gastronomique" : installé → commande → amuse-bouche → entrée → poisson → viande → fromage → dessert → mignardises → addition (10 étapes)
// - "bar" : installé → commande → servi → addition (4 étapes)
// Le restaurant choisit un template puis peut le personnaliser.

// État pipeline d'une réservation en cours
interface ReservationPipelineState {
  currentStageId: string           // id de l'étape actuelle
  history: {
    stageId: string
    enteredAt: string              // ISO timestamp
  }[]
}

// Extension de Reservation
interface Reservation {
  // ... champs existants inchangés ...
  pipeline?: ReservationPipelineState  // null si pas encore arrivé
  estimatedDurationMinutes?: number    // durée totale estimée du repas
}

// Table avec disponibilité calculée
interface TableAvailability {
  table: RestaurantTable
  currentReservation: Reservation | null
  nextReservation: Reservation | null
  isFree: boolean
  freeUntil: string | null           // HH:MM — heure de la prochaine résa
  freedAt: string | null             // HH:MM — estimé de libération (basé sur pipeline)
}

// Densité du Gantt
type GanttDensity = "normal" | "compact" | "ultra"
```

**Fichier : `src/components/reservations/pipeline-templates.ts`** (NOUVEAU)

Contient les templates de pipeline par défaut. Séparé de types.ts pour ne pas alourdir les types avec de la donnée.

```ts
const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "brasserie",
    name: "Brasserie",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "INS", color: "var(--info)", avgDurationMinutes: 5, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "CMD", color: "var(--primary)", avgDurationMinutes: 15, order: 1 },
      { id: "entree_servie", label: "Entrée servie", shortLabel: "ENT", color: "var(--success)", avgDurationMinutes: 20, order: 2 },
      { id: "plat_servi", label: "Plat servi", shortLabel: "PLT", color: "var(--success)", avgDurationMinutes: 30, order: 3 },
      { id: "dessert_servi", label: "Dessert servi", shortLabel: "DST", color: "var(--success)", avgDurationMinutes: 15, order: 4 },
      { id: "addition_demandee", label: "Addition demandée", shortLabel: "ADD", color: "var(--warning)", avgDurationMinutes: 10, order: 5 },
    ]
  },
  {
    id: "bistrot",
    name: "Bistrot",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "INS", color: "var(--info)", avgDurationMinutes: 5, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "CMD", color: "var(--primary)", avgDurationMinutes: 15, order: 1 },
      { id: "plat_servi", label: "Plat servi", shortLabel: "PLT", color: "var(--success)", avgDurationMinutes: 35, order: 2 },
      { id: "addition_demandee", label: "Addition", shortLabel: "ADD", color: "var(--warning)", avgDurationMinutes: 10, order: 3 },
    ]
  },
  {
    id: "gastronomique",
    name: "Gastronomique",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "INS", color: "var(--info)", avgDurationMinutes: 5, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "CMD", color: "var(--primary)", avgDurationMinutes: 20, order: 1 },
      { id: "amuse_bouche", label: "Amuse-bouche", shortLabel: "AMB", color: "var(--success)", avgDurationMinutes: 10, order: 2 },
      { id: "entree_servie", label: "Entrée", shortLabel: "ENT", color: "var(--success)", avgDurationMinutes: 20, order: 3 },
      { id: "poisson", label: "Poisson", shortLabel: "PSN", color: "var(--success)", avgDurationMinutes: 25, order: 4 },
      { id: "viande", label: "Viande", shortLabel: "VND", color: "var(--success)", avgDurationMinutes: 25, order: 5 },
      { id: "fromage", label: "Fromage", shortLabel: "FRM", color: "var(--success)", avgDurationMinutes: 15, order: 6 },
      { id: "dessert_servi", label: "Dessert", shortLabel: "DST", color: "var(--success)", avgDurationMinutes: 15, order: 7 },
      { id: "mignardises", label: "Mignardises", shortLabel: "MIG", color: "var(--success)", avgDurationMinutes: 10, order: 8 },
      { id: "addition_demandee", label: "Addition", shortLabel: "ADD", color: "var(--warning)", avgDurationMinutes: 10, order: 9 },
    ]
  },
  {
    id: "bar",
    name: "Bar / Tapas",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "INS", color: "var(--info)", avgDurationMinutes: 5, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "CMD", color: "var(--primary)", avgDurationMinutes: 10, order: 1 },
      { id: "servi", label: "Servi", shortLabel: "SRV", color: "var(--success)", avgDurationMinutes: 30, order: 2 },
      { id: "addition_demandee", label: "Addition", shortLabel: "ADD", color: "var(--warning)", avgDurationMinutes: 5, order: 3 },
    ]
  }
]

// Le pipeline actif du restaurant vient de adminStore.getActiveEstablishment().pipelineTemplate
// Par défaut : "brasserie"
```

**Fichier : `src/components/reservations/data.ts`** — enrichir le mock

Ajouter `pipeline` aux résas avec statut "arrivee" :
- Martin Dupont (arrivée 12:00) → `pipeline: { currentStageId: "plat_servi", history: [...] }`
- Isabelle Roux (arrivée 13:00) → `pipeline: { currentStageId: "commande_passee", history: [...] }`
- Jean-Marc Vidal (arrivée 13:00) → `pipeline: { currentStageId: "installe", history: [...] }`
- Ajouter `estimatedDurationMinutes: 75` par défaut (1h15 pour un midi)

**Fichier : `src/stores/admin-store.ts`** — ajout config pipeline

Ajouter à l'interface Establishment :
```ts
pipelineTemplateId: string  // "brasserie" par défaut
pipelineStages: PipelineStageDefinition[]  // copie personnalisable du template
```

Ajouter un selector :
```ts
getPipelineStages: () => PipelineStageDefinition[]
```

---

### 1.2 Hook de calcul des tables libres

**Nouveau fichier : `src/hooks/use-table-availability.ts`**

```ts
function useTableAvailability(
  tables: RestaurantTable[],
  reservations: Reservation[],
  pipelineStages: PipelineStageDefinition[],
  currentTime: Date
): TableAvailability[]
```

Logique :
- Pour chaque table, trouver la résa en cours (statut "arrivee" + pipeline actif)
- Pour chaque table, trouver la prochaine résa (heure > now, statut confirmee ou en_attente)
- Calculer `isFree` : pas de résa en cours ET (pas de prochaine OU prochaine dans > 30min)
- Calculer `freeUntil` : heure de la prochaine résa si la table est libre
- Calculer `freedAt` : basé sur `pipeline.currentStageId` + somme des `avgDurationMinutes` des étapes restantes

**Edge cases à gérer :**
- Table réservée à 13h, client de 12h pas encore parti → `isFree: false`, `freedAt` basé sur le pipeline, `nextReservation` affichée avec un warning "chevauchement possible"
- Table avec résa annulée/no-show → considérée libre
- Table sans résa du tout → `isFree: true`, `freeUntil: null` (libre indéfiniment sur ce service)

**Tests unitaires** (voir section 4.1) : ce hook est une fonction pure, chaque edge case ci-dessus doit avoir un test.

---

### 1.3 Hook de temps réel

**Nouveau fichier : `src/hooks/use-current-time.ts`**

```ts
function useCurrentTime(intervalMs = 60_000): Date
```

- Retourne la date/heure actuelle, mise à jour toutes les `intervalMs` ms
- Utilisé pour le curseur NOW du Gantt et le calcul "arrive dans X min" du panel
- Cleanup avec `clearInterval` sur unmount

---

### 1.4 LiveSidePanel (nouveau composant)

**Nouveau fichier : `src/components/reservations/live-side-panel.tsx`**

Props :
```ts
interface LiveSidePanelProps {
  reservations: Reservation[]
  tables: RestaurantTable[]
  pipelineStages: PipelineStageDefinition[]
  currentTime: Date
  onSelectReservation: (id: string) => void
  onNewReservation: (prefill: { tableNumber: number; time: string }) => void
}
```

**Structure JSX du panel :**

```
┌──────────────────────────┐
│  MAINTENANT  12:28       │  ← useCurrentTime, gros texte, font-display
│                          │
│  Prochaines arrivées     │  ← section, max 3 affichées
│                          │
│  Sophie Laurent          │  ← nom
│  T1 · 4 cvts · dans 12m │  ← table + couverts + countdown dynamique
│  Confirmée         [→]   │  ← statut badge + bouton détail
│  ─────────────────────── │
│  Claire Petit            │
│  T6 · 2 cvts · dans 32m │
│  En attente   [✓]  [→]  │  ← action confirmer + détail
│  ─────────────────────── │
│  Pierre Moreau           │
│  T4 · 6 cvts · dans 32m │
│  Confirmée         [→]   │
│                          │
├──────────────────────────┤
│                          │
│  Attention requise       │  ← section conditionnelle (si en_attente > 0 ou no_show récent)
│                          │
│  1 résa en attente       │  ← lien cliquable → filtre tableau
│  Claire Petit — T6 12:30 │
│  → pas de confirmation   │
│                          │
├──────────────────────────┤
│                          │
│  Tables libres (4)       │  ← section, depuis useTableAvailability
│                          │
│  T5  (4p)  libre         │  ← clic → pré-remplit new reservation
│  T10 (8p)  libre         │
│  T11 (6p)  libre > 14h   │  ← "libre jusqu'à 14h" si prochaine résa
│  Bar (6p)  libre         │
│                          │
├──────────────────────────┤
│                          │
│  Résumé                  │  ← reprend les données du recap
│                          │
│  3 arrivées              │
│  2 confirmées            │
│  1 en attente            │
│  1 no-show               │
│  ─────────────────────── │
│  21 / 48 couverts        │  ← remplace la barre de remplissage
│                          │
└──────────────────────────┘
```

Détails d'implémentation :
- Le countdown "dans X min" est calculé en temps réel via `useCurrentTime(60_000)`
- Les prochaines arrivées sont les résas dont `time > now` triées par heure, top 3, statut confirmee ou en_attente
- "Attention requise" n'apparaît que si `en_attente` > 0 ou `no_show` récent
- Clic sur une table libre → `onNewReservation({ tableNumber, time })` avec la prochaine demi-heure
- Clic sur une résa → `onSelectReservation(id)` → ouvre le sheet de détail
- Le panel utilise `ScrollArea` pour être scrollable si le contenu dépasse
- Sur écran < 1280px (`hidden xl:block`), le panel est masqué — les infos restent accessibles via le recap en bas

---

### 1.5 Refactoring du ReservationsTable

**Fichier : `src/components/reservations/reservations-table.tsx`**

Modifications :
1. **Supprimer la colonne "Canal"** — la donnée est dans le detail sheet, pas utile en opérationnel
2. **Améliorer la recherche** : filtre sur `clientName` ET `table.label` (taper "T4" ou "t4" matche)
3. **Ajouter un indicateur pipeline** : pour les résas "arrivee" avec un `pipeline`, afficher le shortLabel de l'étape actuelle en badge coloré à côté du statut (ex: "Arrivée · PLT")
4. **Augmenter le padding vertical** des lignes pour le tactile (ajouter `py-1` aux cellules)
5. **Placeholder de recherche** : "Rechercher nom ou table..."

Détails de la recherche améliorée :
```ts
const filtered = useMemo(() => {
  if (!search.trim()) return statusFiltered
  const q = search.trim().toLowerCase()
  return statusFiltered.filter(r => {
    const nameMatch = r.clientName.toLowerCase().includes(q)
    const tableLabel = r.tableNumber
      ? tables.find(t => t.number === r.tableNumber)?.label ?? ""
      : ""
    const tableMatch = tableLabel.toLowerCase().includes(q)
      || `t${r.tableNumber}`.includes(q)
    return nameMatch || tableMatch
  })
}, [statusFiltered, search, tables])
```

---

### 1.6 Refactoring des KPIs

**Fichier : `src/components/reservations/reservations-kpis.tsx`**

Modifications :
1. **Remplacer "Taux de remplissage 44%"** avec barre animée par **"Couverts attendus 21 / 48"** — affichage fraction clair, pas de barre de progression
2. **Réorganiser les 4 cards** :
   - Card 1 : Réservations du service (inchangé)
   - Card 2 : Couverts attendus — `{totalCovers} / {totalCapacity}` au lieu du pourcentage
   - Card 3 : Arrivées — nombre de clients arrivés (nouveau, remplace le taux)
   - Card 4 : Résas en attente (inchangé, avec bordure amber si > 0)

---

### 1.7 Refactoring du header

**Fichier : `src/components/reservations/reservations-header.tsx`**

Ajouts :
1. **Toggle de vue** entre "table" et "gantt" — deux boutons icône groupés dans un div `inline-flex rounded-lg border`
   - Icône liste pour tableau, icône timeline pour Gantt
   - Le bouton actif a `bg-muted`
   - Sur mobile < 1024px, le toggle est masqué (`hidden lg:inline-flex`)
2. Le toggle émet un `onViewChange(mode: ReservationViewMode)`

```
Réservations  < > Aujourd'hui  Samedi 21 Mars    [≡] [▥]    [+ Nouvelle réservation]
                                                   ↑   ↑
                                              tableau  gantt
```

---

### 1.8 Refactoring de la page container

**Fichier : `src/pages/reservations.tsx`**

Modifications :

1. Ajouter `viewMode` state avec switch automatique :
```ts
const [viewModeOverride, setViewModeOverride] = useState<ReservationViewMode | null>(null)

const autoViewMode = useMemo<ReservationViewMode>(() => {
  const now = currentTime
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Plages de service (depuis adminStore)
  const serviceWindows = {
    midi: { start: 11 * 60 + 30, end: 15 * 60 },
    soir: { start: 18 * 60 + 30, end: 23 * 60 + 30 }
  }

  const window = serviceWindows[service]
  const preServiceStart = window.start - 30

  const inServiceWindow = currentMinutes >= preServiceStart && currentMinutes <= window.end
  const hasArrivedGuests = filtered.some(r => r.status === "arrivee")

  return (inServiceWindow || hasArrivedGuests) ? "gantt" : "table"
}, [currentTime, service, filtered])

const viewMode = viewModeOverride ?? autoViewMode
```

2. Layout conditionnel :
```tsx
{viewMode === "table" ? (
  <div className="flex gap-6">
    <div className="flex-1 min-w-0">
      <ReservationsKpis ... />
      <ReservationsTable ... />
    </div>
    <aside className="hidden xl:block w-[280px] shrink-0">
      <LiveSidePanel ... />
    </aside>
  </div>
) : (
  <GanttTimeline ... />
)}
```

3. Le `ReservationsRecap` reste en bas dans les deux modes
4. Reset `viewModeOverride` à `null` quand on change de service ou de date

---

### 1.9 Amélioration du ReservationDetail

**Fichier : `src/components/reservations/reservation-detail.tsx`**

Ajouts :

1. **Section Pipeline** (visible si `pipeline` existe) :
   - Afficher l'étape actuelle avec badge coloré
   - Afficher l'heure estimée de fin : "Table libre vers ~13:15"
   - Stepper visuel horizontal des étapes franchies (cercles reliés par des lignes)
   - Le stepper s'adapte dynamiquement au nombre d'étapes du pipeline du restaurant (4 ou 10, même composant)

Stepper pipeline visuel :
```
●───●───●───◉───○───○
INS  CMD  ENT  PLT  DST  ADD
              ↑ actuellement
```

- `●` = étape passée (couleur pleine)
- `◉` = étape actuelle (couleur + anneau pulsant)
- `○` = étape future (gris)
- Les labels courts (shortLabel) sous chaque cercle
- Taille compacte : cercles de 8px, espacement flexible (`flex gap-2`)

2. **Bouton "Voir la table sur le plan"** — lien vers `/salle?highlight=T3` (côté salle, à brancher plus tard)

3. **Actions no-show** : pour un no-show, ajouter :
   - "Relancer par SMS" (désactivé, tooltip "Bientôt disponible")
   - "Marquer comme récurrent" (toggle flag sur la résa)

---

## PHASE 2 — Gantt Timeline (~8-12 jours)

### 2.1 Architecture du composant Gantt

**Nouveau dossier : `src/components/reservations/gantt/`**

```
src/components/reservations/gantt/
├── gantt-timeline.tsx          // orchestrateur principal
├── gantt-header.tsx            // en-tête avec axe horaire
├── gantt-row.tsx               // ligne d'une table
├── gantt-block.tsx             // bloc d'une réservation
├── gantt-now-cursor.tsx        // ligne verticale "maintenant"
├── gantt-empty-slot.tsx        // zone cliquable vide
├── gantt-tooltip.tsx           // tooltip au hover d'un bloc
├── use-gantt-layout.ts         // hook de calcul des positions
├── use-gantt-zoom.ts           // hook de zoom/pan
├── use-gantt-density.ts        // hook de densité viewport-based
└── gantt-constants.ts          // constantes layout
```

---

### 2.2 Constantes du Gantt

**Fichier : `gantt-constants.ts`**

```ts
// Dimensions par mode de densité
const GANTT_DENSITY_CONFIG = {
  normal: {
    rowHeight: 56,
    blockPadding: 4,
    fontSize: 13,
    showClientName: true,    // nom complet
    showCovers: true,        // "4 cvts"
    showStatus: true,        // badge statut
    showPipeline: true,      // barre de progression
    minBlockWidth: 80,
  },
  compact: {
    rowHeight: 28,
    blockPadding: 2,
    fontSize: 11,
    showClientName: false,   // initiales seulement (ex: "SL")
    showCovers: true,        // juste le chiffre "4"
    showStatus: false,
    showPipeline: true,      // barre 2px en bas
    minBlockWidth: 40,
  },
  ultra: {
    rowHeight: 16,
    blockPadding: 1,
    fontSize: 0,             // pas de texte
    showClientName: false,
    showCovers: false,
    showStatus: false,
    showPipeline: false,     // juste couleur bloc
    minBlockWidth: 20,
  }
} as const

// Grille temporelle
const TIME_SLOT_MINUTES = 15
const PIXELS_PER_MINUTE = 4        // 1 heure = 240px en zoom 1x
const ZOOM_RANGE = { min: 0.5, max: 3 }
const TABLE_LABEL_WIDTH = 64
const HEADER_HEIGHT = 40

// Durées estimées par défaut (si pas de pipeline actif)
const DEFAULT_MEAL_DURATION = {
  midi: 75,     // minutes
  soir: 105,    // minutes
}
```

---

### 2.3 Hook de densité viewport-based (NOUVEAU)

**Fichier : `use-gantt-density.ts`**

```ts
function useGanttDensity(
  containerRef: RefObject<HTMLDivElement>,
  tableCount: number
): { density: GanttDensity; override: GanttDensity | null; setOverride: (d: GanttDensity | null) => void }
```

Logique :
- Mesure la hauteur disponible du container via `ResizeObserver`
- Calcule combien de lignes tiennent sans scroll pour chaque mode :
  - `fitsNormal = Math.floor((containerHeight - HEADER_HEIGHT) / GANTT_DENSITY_CONFIG.normal.rowHeight)`
  - `fitsCompact = Math.floor((containerHeight - HEADER_HEIGHT) / GANTT_DENSITY_CONFIG.compact.rowHeight)`
- Si `tableCount <= fitsNormal` → "normal"
- Si `tableCount <= fitsCompact` → "compact"
- Sinon → "ultra"
- L'override manuel (`setOverride`) prend le dessus si défini
- Recalcule quand le container resize (debounce 200ms)

---

### 2.4 Hook de calcul du layout

**Fichier : `use-gantt-layout.ts`**

```ts
interface GanttBlock {
  reservationId: string
  tableNumber: number
  startMinute: number        // minutes depuis minuit (ex: 720 = 12:00)
  endMinute: number          // estimé ou réel
  isEstimated: boolean       // true si endMinute est une estimation
  x: number                  // position px
  width: number              // largeur px
  color: string              // basé sur statut ou pipeline
  reservation: Reservation
}

interface GanttLayout {
  blocks: GanttBlock[]
  timeRange: { startMinute: number; endMinute: number }
  totalWidth: number
  totalHeight: number
  rows: { table: RestaurantTable; y: number }[]
}

function useGanttLayout(
  reservations: Reservation[],
  tables: RestaurantTable[],
  pipelineStages: PipelineStageDefinition[],
  service: ServiceType,
  density: GanttDensity,
  zoom: number
): GanttLayout
```

Logique :
1. **timeRange** : midi = 11:00-15:30, soir = 18:00-23:30. Élargi si des résas sont en dehors.
2. **startMinute** : `hours * 60 + minutes` depuis le champ `time`
3. **endMinute** :
   - Si `pipeline` et dernière étape franchie → `lastHistory.enteredAt + avgDuration` des étapes restantes. `isEstimated = true`
   - Si statut "annulee" ou "no_show" → `startMinute + 15` (bloc court). `isEstimated = false`
   - Si statut "arrivee" sans pipeline → `startMinute + DEFAULT_MEAL_DURATION[service]`. `isEstimated = true`
   - Si pas encore arrivé → `startMinute + estimatedDurationMinutes || DEFAULT_MEAL_DURATION[service]`. `isEstimated = true`
4. **x et width** : `(minute - timeRange.startMinute) * PIXELS_PER_MINUTE * zoom`
5. **Tables triées** par numéro
6. **y** : `index * density.rowHeight`

**Performance** : ce hook est mémoïsé. Les blocs ne sont recalculés que si `reservations`, `zoom`, ou `density` changent. Le `useCurrentTime` ne déclenche PAS un recalcul complet — seule la position du curseur NOW et la largeur des blocs en cours changent (voir 2.12).

---

### 2.5 Hook de zoom et pan

**Fichier : `use-gantt-zoom.ts`**

```ts
interface UseGanttZoomReturn {
  zoom: number
  containerRef: RefObject<HTMLDivElement>
  handleWheel: (e: WheelEvent) => void
  scrollToNow: () => void
  scrollToTime: (minutes: number) => void
}

function useGanttZoom(
  timeRange: { startMinute: number; endMinute: number },
  currentTime: Date
): UseGanttZoomReturn
```

Logique :
- **Ctrl+Wheel** : zoom centré sur la position du curseur
- **Wheel sans Ctrl** : scroll horizontal natif (pas d'interception)
- **scrollToNow()** : scroll fluide pour centrer l'heure actuelle. Appelé au mount si pendant le service.
- **scrollToTime(m)** : scroll fluide vers une heure donnée
- Zoom clamped entre `ZOOM_RANGE.min` et `ZOOM_RANGE.max`

---

### 2.6 Composant GanttTimeline (orchestrateur)

**Fichier : `gantt-timeline.tsx`**

Props :
```ts
interface GanttTimelineProps {
  reservations: Reservation[]
  tables: RestaurantTable[]
  pipelineStages: PipelineStageDefinition[]
  service: ServiceType
  currentTime: Date
  onSelectReservation: (id: string) => void
  onNewReservation: (prefill: { tableNumber: number; time: string }) => void
  selectedReservationId: string | null
}
```

**Structure JSX :**

```
┌─────────────────────────────────────────────────────┐
│  KPI bar compacte (inline)                          │
│  7 résas · 21/48 cvts · 1 en attente               │
├────┬────────────────────────────────────────────────┤
│    │  GanttHeader (axe horaire)                     │
│    │  11:00  11:30  12:00  12:30  13:00  13:30 ...  │
├────┼────────────────────────────────────────────────┤  ← overflow-x: auto
│ T1 │  [  bloc résa  ]                               │     overflow-y: auto
│ T2 │        [  bloc résa  ]                          │
│ T3 │  [bloc]                                         │
│ T4 │      [ bloc résa large ]                        │
│ T5 │                                                 │  ← table vide
│ T6 │        [bloc]                                   │
│ T7 │              [  bloc  ]                         │
│ T8 │  [!no-show]                                     │
│ T9 │              [  bloc  ]                         │
│T10 │                                                 │
│T11 │                                                 │
│Bar │                                                 │
│    │         ▼ NOW                                   │
├────┴────────────────────────────────────────────────┤
│  Densité: [Normal] [Compact] [Ultra]    Ctrl+Scroll │
└─────────────────────────────────────────────────────┘
```

Détails :
- Colonne labels tables : `sticky left` avec z-index, bg opaque
- Header horaire : `sticky top` avec z-index
- Container principal : `overflow: auto` dans les deux axes
- Curseur NOW : `div absolute`, `pointer-events: none`, z-20
- Zones vides entre blocs : cliquables → `onNewReservation({ tableNumber, time })` arrondie au quart d'heure
- Densité : calculée par `useGanttDensity` (viewport-based), override manuel via boutons en bas

---

### 2.7 Composant GanttHeader

**Fichier : `gantt-header.tsx`**

- Largeur = `totalWidth`
- Marqueurs toutes les 30 min (trait + label "12:00")
- Traits légers toutes les 15 min (sans label)
- Heure pleine = trait plus épais
- Labels : `text-muted-foreground text-xs`

---

### 2.8 Composant GanttRow

**Fichier : `gantt-row.tsx`**

- Hauteur = `density.rowHeight`, position relative
- Background alternée pair/impair (`bg-muted/30` pour impair)
- GanttBlocks positionnés en absolute
- Les espaces entre blocs sont couverts par `GanttEmptySlot` (hover = `bg-primary/5` + icône `+`)
- Ligne sélectionnée (via bloc sélectionné) : `bg-primary/5`
- Bordure basse : `border-b border-border/50`

---

### 2.9 Composant GanttBlock

**Fichier : `gantt-block.tsx`**

**Mode Normal (56px)** :
```
┌────────────────────────────────────┐
│ Sophie Laurent · 4 cvts            │
│ Confirmée    ████░░░░░  ~13:30     │
└────────────────────────────────────┘
```

- Background : couleur statut à 10% d'opacité
- Bordure gauche : 3px solid couleur statut
- Si sélectionné : `ring-2 ring-primary`
- Si no-show ou annulée : hachures diagonales CSS + texte barré
- Barre pipeline (4px bas) : segments proportionnels aux `avgDurationMinutes` de chaque étape
- "~13:30" = heure fin estimée, `text-xs text-muted-foreground` aligné droite
- Partie estimée du bloc (après NOW) : opacité réduite (30%) + bord droit pointillé

**Mode Compact (28px)** :
```
┌──────────────────┐
│ SL · 4  ██░░     │
└──────────────────┘
```

- Initiales + couverts + mini barre pipeline 2px
- Hover → GanttTooltip

**Mode Ultra (16px)** :
```
┌──────────────────┐
│████████░░░░░░░░░░│
└──────────────────┘
```

- Couleur seule, pas de texte
- Hover → GanttTooltip
- Clic → detail sheet

**Tous les modes :**
- Le composant est wrappé dans `React.memo` avec un comparateur custom qui ignore les props qui n'ont pas changé (voir section Performance)

---

### 2.10 Composant GanttTooltip

**Fichier : `gantt-tooltip.tsx`**

Hover d'un bloc → tooltip avec :
- Nom complet, table, couverts
- Heure début → heure fin estimée
- Statut
- Étape pipeline actuelle (si applicable)
- Notes (si existantes)
- Délai d'apparition : 300ms
- En mode normal, montre seulement ce qui n'est pas déjà visible dans le bloc

---

### 2.11 Composant GanttNowCursor

**Fichier : `gantt-now-cursor.tsx`**

- `div absolute` avec `left` calculé depuis `currentMinute`
- 2px de large, couleur `bg-destructive` (rouge)
- Label heure en haut : `bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs font-medium`
- `pointer-events: none`, `z-index: 20`
- `transition-[left] duration-1000` pour mouvement fluide

---

### 2.12 Intégration du pipeline dans les blocs Gantt

Le pipeline se manifeste visuellement de deux façons :

**1. Barre de progression interne** (bas du bloc) :
- Divisée en segments proportionnels aux `avgDurationMinutes` de chaque étape (du pipeline configurable du restaurant)
- Segments passés = couleur de l'étape
- Segment actuel = partiellement rempli
- Segments futurs = gris
- S'adapte automatiquement au nombre d'étapes (4 pour un bistrot, 10 pour un gastro)

**2. Durée dynamique du bloc** :
- La partie "temps écoulé" (avant NOW) est à opacité pleine
- La partie "temps estimé" (après NOW) est à opacité 30% + bord droit pointillé
- La largeur totale du bloc est recalculée chaque minute pour les résas en cours
- **Performance** : seuls les blocs dont `reservation.status === "arrivee"` recalculent leur largeur. Les blocs terminés/futurs sont stables.

---

### 2.13 Composant GanttEmptySlot

**Fichier : `gantt-empty-slot.tsx`**

- Couvre les espaces entre les blocs d'une ligne
- Hover : `bg-primary/5` + petit `+` centré en `text-muted-foreground`
- Clic : calcule la minute depuis la position du clic, arrondit au quart d'heure, appelle `onNewReservation({ tableNumber, time })`
- Calcul : `(offsetX / PIXELS_PER_MINUTE / zoom) + timeRange.startMinute`, arrondi à 15

---

## PHASE 3 — Polish et robustesse (~2-3 jours)

### 3.1 Animations

- **Transition entre vues** : `AnimatePresence` de Framer Motion, crossfade 200ms
- **Blocs Gantt** : apparition `opacity 0→1` + `scale 0.97→1`, stagger 20ms
- **Curseur NOW** : `transition-[left] duration-[60000ms] linear`
- **Barre pipeline** : `transition-[width] duration-500 ease-out` au changement d'étape

### 3.2 Raccourcis clavier (minimal)

Uniquement :
- `N` → nouvelle réservation (les deux vues)
- `Escape` → fermer detail sheet / déselectionner

C'est tout. Pas de raccourcis de zoom, densité, ou navigation.

### 3.3 Responsive

| Breakpoint | Tableau Augmenté | Gantt |
|---|---|---|
| `>= 1280px` | Tableau + LiveSidePanel | Gantt complet |
| `1024-1279px` | Tableau seul (panel masqué) | Gantt compact forcé |
| `< 1024px` | Tableau simplifié (colonnes réduites) | Non disponible, toggle masqué |

Sur écran < 1024px :
- Le toggle Gantt est masqué (`hidden lg:inline-flex`)
- Le switch automatique ne bascule jamais sur Gantt
- Le tableau reste la seule vue, en version simplifiée
- L'app mobile native gèrera l'expérience tactile dédiée à terme

### 3.4 Accessibilité

- Gantt : `role="grid"`, lignes `role="row"`, blocs `role="gridcell"` avec `aria-label` descriptif
- Navigation clavier : Tab entre blocs, Enter pour ouvrir le detail
- Contraste WCAG AA sur tous les statuts
- Hachures no-show/annulé ne reposent pas uniquement sur la couleur (texte barré + pattern)
- Tooltips accessibles au focus

### 3.5 États vides et edge cases

- **Aucune résa** : message centré + bouton "Nouvelle réservation"
- **Table sans résa** : ligne vide visible (confirme qu'elle est libre)
- **Résa sans table** : ligne spéciale "Sans table" en bas, fond `bg-warning/5`
- **Chevauchement sur même table** : blocs superposés avec offset vertical 4px + bordure rouge = signal d'erreur de planning
- **Résa hors plage** : bloc tronqué avec indicateur `→` au bord
- **No-show** : bloc avec hachures + animation pulse pendant 30s après marquage

---

## PHASE 4 — Performance et tests

### 4.1 Tests unitaires

**Fichiers de test à créer :**

- `use-table-availability.test.ts` :
  - Table libre sans aucune résa → `isFree: true, freeUntil: null`
  - Table avec résa en cours (arrivée, pipeline actif) → `isFree: false, freedAt` calculé
  - Table avec client de 12h pas parti + résa 13h → chevauchement détecté
  - Table avec résa annulée → considérée libre
  - Table avec prochaine résa dans 20 min → `isFree: false` (seuil 30 min)
  - Table avec prochaine résa dans 45 min → `isFree: true, freeUntil: "13:00"`

- `use-gantt-layout.test.ts` :
  - Calcul correct de startMinute/endMinute
  - timeRange élargi si résa hors plage par défaut
  - endMinute basé sur pipeline actif (somme des étapes restantes)
  - endMinute fallback sur DEFAULT_MEAL_DURATION si pas de pipeline
  - Blocs no-show/annulée = 15 min de large
  - x et width cohérents avec zoom

- `use-gantt-density.test.ts` :
  - 10 tables, viewport 700px → normal
  - 20 tables, viewport 700px → compact
  - 50 tables, viewport 700px → ultra
  - Resize du container → recalcul

- `auto-view-mode.test.ts` (logique extraite dans une fonction pure) :
  - Hors fenêtre de service, aucune arrivée → "table"
  - Dans la fenêtre de service → "gantt"
  - Hors fenêtre mais client arrivé → "gantt"
  - 30 min avant le service → "gantt"

### 4.2 Performance

**Stratégie de rendu du Gantt :**

1. **Mémoïsation des blocs** : chaque `GanttBlock` est wrappé dans `React.memo` avec un comparateur custom :
```ts
const areEqual = (prev: GanttBlockProps, next: GanttBlockProps) =>
  prev.block.reservationId === next.block.reservationId &&
  prev.block.x === next.block.x &&
  prev.block.width === next.block.width &&
  prev.block.color === next.block.color &&
  prev.isSelected === next.isSelected &&
  prev.density === next.density
```

2. **Séparation des blocs stables et dynamiques** :
   - Les blocs futurs (pas encore arrivés) et terminés sont stables — pas de recalcul.
   - Seuls les blocs avec `status === "arrivee"` recalculent leur `width` via `useCurrentTime`.
   - Le recalcul est dans le `GanttBlock` lui-même (pas dans le layout global) pour isoler les re-renders.

3. **Virtualisation conditionnelle** :
   - Pour < 30 lignes : pas de virtualisation, le `memo` suffit.
   - Pour >= 30 lignes : virtualisation verticale des lignes avec une lib légère (`@tanstack/react-virtual` — déjà dans l'écosystème React). Seules les lignes visibles dans le viewport sont rendues.
   - La colonne sticky des labels est hors du container virtualisé (rendue séparément, synchronisée via scroll event).

4. **`useCurrentTime` throttlé** : mise à jour toutes les 60s, pas toutes les secondes. Le curseur NOW utilise une transition CSS de 60s pour le mouvement continu entre les mises à jour JS.

### 4.3 Note sur la source de données

Le plan implémente tout en mock local (état React). La structure est conçue pour être branchée sur une API sans refactoring :

- Les `Reservation[]` et `PipelineStageDefinition[]` sont des interfaces — quand l'API existe, on remplace `useState(MOCK)` par un `useQuery()` (React Query / SWR).
- Le `pipeline.history[].enteredAt` viendra du système qui alimente le pipeline :
  - **Option A** : POS (caisse) qui pousse les changements d'étape
  - **Option B** : Boutons dans l'interface Holy Fork (le serveur clique "Plat servi")
  - **Option C** : Intégration KDS (Kitchen Display System)
- Le choix de la source n'impacte pas le frontend — l'interface consomme un array d'étapes avec timestamps, quelle que soit l'origine.
- Pour le MVP : on utilise l'option B (boutons dans le detail sheet). Les boutons d'avancement pipeline sont déjà prévus dans le `ReservationDetail` via le stepper interactif.

---

## Arbre de fichiers final

```
src/components/reservations/
├── types.ts                    // MODIFIÉ — PipelineStageDefinition configurable, ViewMode, TableAvailability
├── pipeline-templates.ts       // NOUVEAU — templates bistrot/brasserie/gastro/bar
├── data.ts                     // MODIFIÉ — mock enrichi avec pipeline
├── reservations-header.tsx     // MODIFIÉ — ajout toggle vue
├── reservations-kpis.tsx       // MODIFIÉ — couverts X/Y, arrivées, suppression barre
├── reservations-table.tsx      // MODIFIÉ — suppression col Canal, search étendue, padding+, badge pipeline
├── reservations-recap.tsx      // INCHANGÉ
├── reservation-detail.tsx      // MODIFIÉ — section pipeline stepper, bouton plan, actions no-show
├── new-reservation-dialog.tsx  // INCHANGÉ
├── live-side-panel.tsx         // NOUVEAU — panel latéral temps réel
└── gantt/
    ├── gantt-timeline.tsx      // NOUVEAU — orchestrateur
    ├── gantt-header.tsx        // NOUVEAU — axe horaire
    ├── gantt-row.tsx           // NOUVEAU — ligne par table
    ├── gantt-block.tsx         // NOUVEAU — bloc réservation (memo'd)
    ├── gantt-now-cursor.tsx    // NOUVEAU — curseur temps réel
    ├── gantt-empty-slot.tsx    // NOUVEAU — zone cliquable vide
    ├── gantt-tooltip.tsx       // NOUVEAU — tooltip hover
    ├── use-gantt-layout.ts     // NOUVEAU — calcul positions
    ├── use-gantt-zoom.ts       // NOUVEAU — zoom/pan
    ├── use-gantt-density.ts    // NOUVEAU — densité viewport-based
    └── gantt-constants.ts      // NOUVEAU — constantes layout

src/hooks/
├── use-day-navigation.ts       // INCHANGÉ
├── use-table-sort.ts           // INCHANGÉ
├── use-current-time.ts         // NOUVEAU — horloge temps réel
└── use-table-availability.ts   // NOUVEAU — calcul tables libres

src/stores/
└── admin-store.ts              // MODIFIÉ — ajout pipelineTemplateId + pipelineStages sur Establishment

src/pages/
└── reservations.tsx            // MODIFIÉ — viewMode, switch auto, layout conditionnel

tests/
├── use-table-availability.test.ts
├── use-gantt-layout.test.ts
├── use-gantt-density.test.ts
└── auto-view-mode.test.ts
```

**8 fichiers modifiés, 17 fichiers créés (dont 4 tests), 0 fichier supprimé.**

---

## Résumé des estimations réalistes

| Phase | Contenu | Durée |
|---|---|---|
| Phase 1 | Tableau augmenté + LiveSidePanel + KPIs + search + pipeline types | 3-4 jours |
| Phase 2 | Gantt complet (layout, zoom, 3 densités, blocs pipeline, empty slots) | 8-12 jours |
| Phase 3 | Animations, responsive, accessibilité, edge cases | 2-3 jours |
| Phase 4 | Tests unitaires, performance (memo, virtualisation), intégration | 2-3 jours |
| **Total** | | **15-22 jours** |

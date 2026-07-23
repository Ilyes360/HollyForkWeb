# Salle — Detail couverture

> Sous-features : 10a (Consultation), 10b (Editeur)
>
> Konva + react-konva : necessite Browser Mode pour les tests composants.

## Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useSalles() | ❌ | — | — |
| useCreateSalle() | ❌ | — | — |
| useCreateTable() | ❌ | — | — |
| useDeleteTable() | ❌ | — | — |

## Stores

| Store | Teste | Tests | Fichier test |
|-------|:-----:|-------|-------------|
| useFloorPlanStore | ❌ | — | UI state (Zustand) |

## Utils (components/salle/utils.ts)

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| snapToGrid() | ❌ | — | pure function |
| genId() | ❌ | — | pure function |
| getNextTableNumber() | ❌ | — | pure function |
| snapAngle() | ❌ | — | pure function |
| segmentLength() | ❌ | — | pure function |
| pointInPolygon() | ❌ | — | pure function |
| findRoomForPoint() | ❌ | — | pure function |

---

## 10a. Salle Consultation (Affichage)

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| ConsultationView | ❌ | ❌ | Vue lecture seule |
| ReadOnlyCanvas | ❌ | ❌ | Canvas Konva read-only |
| RoomSection | ❌ | ❌ | Section par salle |
| RoomTableCard | ❌ | ❌ | Card table |
| PlanCardView | ❌ | ❌ | Card vue plan |
| RoomMiniMap | ❌ | ❌ | Minimap |
| DesktopGate | ❌ | ❌ | Gate mobile → desktop |

---

## 10b. Salle Editeur (Affichage)

> Forte dependance Konva — tous les composants canvas necessitent Browser Mode.

### Composants Canvas

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| FloorCanvas | ❌ | ❌ | Canvas principal Konva |
| TableShape | ❌ | ❌ | Forme table |
| WallShape | ❌ | ❌ | Forme mur |
| ZoneShape | ❌ | ❌ | Forme zone |
| DecorationShape | ❌ | ❌ | Forme decoration |
| SelectionTransformer | ❌ | ❌ | Selection/resize |
| SnapGuides | ❌ | ❌ | Guides d'alignement |
| WallDrawingLayer | ❌ | ❌ | Dessin murs |
| CanvasGrid | ❌ | ❌ | Grille fond |
| CanvasRulers | ❌ | ❌ | Regles |

### Composants UI (testables en jsdom)

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| EditorStepper | ❌ | ❌ | Stepper etapes |
| ObjectPalette | ❌ | ❌ | Palette objets |
| PaletteItem | ❌ | ❌ | Item palette |
| PropertiesPanel | ❌ | ❌ | Panel proprietes |
| EditionOverlay | ❌ | ❌ | Overlay edition |
| SalleToolbar | ❌ | ❌ | Toolbar |
| UnsavedDialog | ❌ | ❌ | Dialog modifs non sauvees |
| SalleEditionProvider | ❌ | ❌ | Context provider |

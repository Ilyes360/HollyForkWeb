# Audit Salle (Plan de salle) — Architecture & Gaps

> Date : 2026-05-14
> Statut : Partiellement connecté à l'API
> Priorité : Moyenne (fonctionne en session, mais aucune persistance du plan visuel)

---

## Résumé

Le plan de salle est un éditeur visuel qui permet de placer des zones, tables, murs et décorations. Les données riches (polygones, couleurs, dimensions) existent **uniquement en mémoire** (Zustand store sans persistance). Seule une projection minimale (nom de salle + position des tables) est envoyée à l'API.

**Conséquence** : quand l'utilisateur recharge la page, tout le plan visuel disparaît.

---

## 1. Ce que le frontend stocke en mémoire

```typescript
FloorPlan {
  id: string
  name: string
  gridSize: number        // Taille de la grille (ex: 20px)
  elements: FloorElement[]
}

// 4 types d'éléments :
ZoneShape {
  kind: "zone"
  id: string
  x: number, y: number        // Position absolue
  name: string                 // Nom de la zone/salle
  points: number[]             // Coordonnées du polygone [x1,y1,x2,y2,...]
  color: string                // Couleur de fond (hex)
  opacity: number              // Opacité (0-1)
}

TableShape {
  kind: "table"
  id: string
  x: number, y: number        // Position absolue
  type: "round"|"square"|"rectangle"|"bar"
  width: number, height: number
  seats: number                // Nombre de places
  number: number               // Numéro de table
  label: string                // Étiquette optionnelle
  rotation: number             // Rotation en degrés
}

WallShape {
  kind: "wall"
  id: string
  x: number, y: number
  points: number[]             // Points du mur [x1,y1,x2,y2,...]
  thickness: number            // Épaisseur du mur
}

DecorationShape {
  kind: "decoration"
  id: string
  x: number, y: number
  decorationType: string       // "plant", "counter", "stairs", etc.
  category: string
  shapeType: "rect"|"circle"|"line"
  width?: number, height?: number
  radius?: number
  points?: number[]
  thickness?: number
}
```

---

## 2. Ce que l'API reçoit actuellement

### POST /api/salles/

```json
{
  "name": "Terrasse",           // ← zone.name
  "restaurant_id": 7,
  "capacity": 24,               // ← somme des seats des tables dans la zone
  "floor": 0,
  "description": null
}
```

**Réponse** : `{ "id": 42, "name": "Terrasse", ... }`

### POST /api/tables/

```json
{
  "numero": 5,                  // ← table.number
  "capacity": 4,                // ← table.seats
  "position_x": 340,            // ← Math.round(table.x)
  "position_y": 180,            // ← Math.round(table.y)
  "salle_id": 42                // ← id retourné par POST /api/salles/
}
```

---

## 3. Ce qui est PERDU (pas envoyé à l'API)

| Donnée | Type | Impact |
|---|---|---|
| **Polygone de zone** (points, couleur, opacité) | `ZoneShape` | La forme visuelle de chaque salle est perdue. L'API ne stocke que le nom et la capacité. |
| **Murs** (points, épaisseur) | `WallShape` | Aucun mur n'est envoyé. Le plan structural disparaît au rechargement. |
| **Décorations** (plantes, comptoirs, escaliers) | `DecorationShape` | Aucune décoration n'est envoyée. |
| **Type de table** (rond, carré, rectangle, bar) | `TableShape.type` | L'API ne stocke pas le type de table, seulement sa position et capacité. |
| **Dimensions de table** (width, height) | `TableShape` | Perdues. |
| **Rotation de table** | `TableShape.rotation` | Perdue. |
| **Label de table** | `TableShape.label` | Perdu. |
| **Taille de grille** | `FloorPlan.gridSize` | Perdu. |
| **ID frontend** | Tous les éléments | Les IDs frontend (UUID) sont écrasés par les IDs API (numériques). |

---

## 4. Bugs dans le flux actuel

### Bug 1 : Chaque save crée des DOUBLONS

Le `syncPlanToApi()` fait toujours `POST` (création), jamais `PUT` (mise à jour) ni `DELETE` (nettoyage).

**Scénario** :
1. L'utilisateur crée une salle "Terrasse" avec 6 tables → POST salle + 6 POST tables
2. Il modifie le plan et resauvegarde → POST **nouvelle** salle "Terrasse" + 6 **nouvelles** tables
3. En base : 2 salles "Terrasse", 12 tables

**Impact** : Les données en base grossissent à chaque save. Les réservations et commandes qui référencent les anciennes salles/tables deviennent incohérentes.

### Bug 2 : Aucun chargement depuis l'API

Au chargement de la page, le plan est initialisé depuis `useFloorPlanStore` (Zustand en mémoire, pas persisté). Le hook `useSalles()` charge les salles depuis l'API, mais elles ne sont **jamais** utilisées pour reconstruire le plan visuel.

**Conséquence** : même si des salles et tables existent en base, le plan de salle est toujours vide au rechargement.

### Bug 3 : Tables hors zone ignorées

Le sync ne crée des entrées API que pour les tables qui sont **spatialement** à l'intérieur d'une zone (vérification par bounding box). Les tables placées en dehors d'une zone sont silencieusement ignorées.

### Bug 4 : Pas de `employee_in_charge_id`

L'API `POST /api/tables/` accepte un champ `employee_in_charge_id` (employé responsable de la table), mais le frontend ne l'envoie jamais.

---

## 5. Endpoints API disponibles (swagger)

### Salles

| Méthode | Endpoint | Params/Body | Usage actuel |
|---|---|---|---|
| `GET` | `/api/salles/` | `?restaurant_id=X&page=N` | Utilisé par `useSalles()` pour les réservations |
| `POST` | `/api/salles/` | `{name, restaurant_id, capacity, floor, description}` | Utilisé par le save du plan |
| `GET` | `/api/salles/{id}/` | — | Non utilisé |
| `PUT` | `/api/salles/{id}/` | Tous les champs | **Non utilisé** (devrait être utilisé pour update) |
| `PATCH` | `/api/salles/{id}/` | Champs partiels | **Non utilisé** |
| `DELETE` | `/api/salles/{id}/` | — | **Non utilisé** (devrait nettoyer avant re-création) |

### Tables

| Méthode | Endpoint | Params/Body | Usage actuel |
|---|---|---|---|
| `GET` | `/api/tables/` | `?salle_id=X&employee_in_charge_id=Y&page=N` | Utilisé par `useTables()` |
| `POST` | `/api/tables/` | `{numero, capacity, salle_id, position_x, position_y, employee_in_charge_id}` | Utilisé par le save du plan |
| `GET` | `/api/tables/{id}/` | — | Non utilisé |
| `PUT` | `/api/tables/{id}/` | Tous les champs | **Non utilisé** |
| `PATCH` | `/api/tables/{id}/` | Champs partiels | **Non utilisé** |
| `DELETE` | `/api/tables/{id}/` | — | **Non utilisé** |

---

## 6. Solutions possibles

### Option A : Stocker le plan complet en JSON (recommandée)

Ajouter un champ `plan_data` (JSONField) au modèle `Restaurant` ou créer un modèle `FloorPlanData` :

```python
class FloorPlanData(models.Model):
    restaurant = models.OneToOneField(Restaurant, on_delete=models.CASCADE)
    plan_json = models.JSONField(default=dict)  # Stocke le FloorPlan complet
    updated_at = models.DateTimeField(auto_now=True)
```

**Endpoint** :
```
GET  /api/floor-plan/?restaurant_id=X   → retourne le JSON complet
PUT  /api/floor-plan/{id}/              → sauvegarde le JSON complet
```

**Avantages** :
- Le plan visuel complet est persisté (zones, murs, déco, dimensions, couleurs)
- Le frontend envoie le JSON tel quel, pas de mapping complexe
- Rechargement de page = plan restauré exactement comme avant

**Inconvénients** :
- Pas de requêtes SQL sur les éléments individuels
- Le JSON peut devenir gros si beaucoup d'éléments

### Option B : Enrichir les modèles existants

Ajouter les champs manquants aux modèles `Salle` et `Table` :

```python
# Salle — ajouter les champs de zone visuelle
class Salle(models.Model):
    # ... champs existants ...
    polygon_points = models.JSONField(default=list)  # [x1,y1,x2,y2,...]
    color = models.CharField(max_length=20, default="#3b82f6")
    opacity = models.FloatField(default=0.15)
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)

# Table — ajouter type, dimensions, rotation
class Table(models.Model):
    # ... champs existants ...
    table_type = models.CharField(max_length=20, default="square")  # round/square/rectangle/bar
    width = models.IntegerField(default=60)
    height = models.IntegerField(default=60)
    rotation = models.FloatField(default=0)
    label = models.CharField(max_length=50, blank=True, default="")
```

Et créer de nouveaux modèles pour murs et décorations :

```python
class Wall(models.Model):
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name="walls")
    points = models.JSONField(default=list)
    thickness = models.IntegerField(default=8)

class Decoration(models.Model):
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name="decorations")
    decoration_type = models.CharField(max_length=50)
    position_x = models.IntegerField()
    position_y = models.IntegerField()
    width = models.IntegerField(null=True)
    height = models.IntegerField(null=True)
```

**Avantages** :
- Données relationnelles normalisées
- Requêtes SQL possibles sur chaque élément

**Inconvénients** :
- Beaucoup de migrations et d'endpoints à créer
- Mapping complexe entre frontend et backend
- Sync plus fragile (N requêtes par save au lieu d'1)

### Option C (minimum viable) : localStorage + Zustand persist

Ajouter `persist` au store Zustand pour sauvegarder dans le navigateur :

```typescript
export const useFloorPlanStore = create<FloorPlanStore>()(
  persist(
    (set) => ({ ... }),
    { name: "holly-fork-floor-plan" }
  )
)
```

**Avantages** :
- Zéro changement backend
- Le plan survit au rechargement de page

**Inconvénients** :
- Données par navigateur, pas partagées entre utilisateurs/appareils
- Risque de données stale en localStorage

---

## 7. Corrections frontend nécessaires (indépendamment du backend)

### Fix 1 : Supprimer les doublons au save

Avant de créer de nouvelles salles/tables, supprimer les anciennes :

```typescript
// Avant de sync :
// 1. GET /api/salles/?restaurant_id=X → récupérer les salles existantes
// 2. Pour chaque salle existante : DELETE /api/tables/?salle_id=Y puis DELETE /api/salles/Y/
// 3. Ensuite POST les nouvelles salles et tables
```

### Fix 2 : Utiliser PUT pour les salles existantes

Si la salle existe déjà en base (a un id API), utiliser PUT au lieu de POST :

```typescript
if (existingSalleId) {
  await apiPut(`salles/${existingSalleId}/`, payload)
} else {
  await apiPost("salles/", payload)
}
```

### Fix 3 : Charger le plan depuis l'API au démarrage

Au chargement de la page, si pas de plan en mémoire, tenter de reconstruire depuis l'API :

```typescript
// 1. GET /api/salles/?restaurant_id=X
// 2. Pour chaque salle : GET /api/tables/?salle_id=Y
// 3. Reconstruire les zones et tables (sans murs/déco — perdus)
```

### Fix 4 : Ajouter persist au store Zustand

En attendant une solution backend, ajouter `persist` pour survivre aux rechargements :

```typescript
import { persist } from "zustand/middleware"
// ... persist({ name: "holly-fork-floor-plan" })
```

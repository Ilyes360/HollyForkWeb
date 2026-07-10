# Spec Backend — Persistance Plan de Salle & Liaison Reservations

> Document de spec pour le dev backend.
> Objectif : permettre au frontend de sauvegarder, charger et modifier un plan de salle complet (zones, tables, murs, decorations) et le lier aux reservations.

---

## 1. Situation actuelle

### Ce qui existe (backend)

| Modele | Endpoint | Champs |
|--------|----------|--------|
| **Salle** | CRUD `/api/salles/` | `id`, `name`, `restaurant_id`, `capacity`, `floor`, `description` |
| **Table** | CRUD `/api/tables/` | `id`, `numero`, `capacity`, `reserved_seats`, `is_occupied`, `salle_id`, `employee_in_charge_id`, `position_x`, `position_y` |
| **Reservation** | CRUD `/api/reservations/` | `id`, `client_name`, `party_size`, `datetime`, `phone_number`, `salle_id`, `table_id`, `note_serveur`, `note_client`, `allergie`, `allergy_ids`, `diet_type_ids` |
| **Table Status** | GET `/api/tables/status/` | `table_id`, `numero`, `salle`, `capacity`, `is_occupied`, `employee_in_charge`, `reservations_count`, `commandes_count` |

### Ce qui manque

Le frontend a un editeur de plan de salle (Konva) qui gere 4 types d'elements : **zones** (salles), **tables**, **murs**, **decorations**. Actuellement :

- Le plan complet n'est **jamais sauvegarde** — il vit en memoire (Zustand) et repart d'un plan de demo au refresh
- Les **murs et decorations** ne sont jamais envoyes a l'API
- Les **tables** sont creees (POST) mais il manque des champs : `type`, `width`, `height`, `label`, `rotation`
- Les **zones** sont creees comme des `Salle` mais sans leur geometrie (polygone, couleur)
- Il n'y a **aucun moyen de recharger** un plan sauvegarde

---

## 2. Approche recommandee — FloorPlan JSON

### Principe

Stocker le plan de salle complet comme un document JSON unique sur le modele `Salle`. C'est l'approche la plus simple car :
- Le plan est un document visuel (coordonnees, styles, formes) — pas des donnees relationnelles
- Un plan appartient a une salle/restaurant, pas a plusieurs
- Le frontend manipule deja un objet `FloorPlan` complet

### Alternative rejetee

Creer des modeles Django separes pour `Wall`, `Zone`, `Decoration` etc. C'est trop lourd pour des donnees visuelles — ca creerait des dizaines de lignes par plan pour des coordonnees de pixels.

---

## 3. Changements sur le modele Table

### Champs a ajouter

```python
# T_HOLLY_PI_TABLES
type = models.CharField(max_length=20, choices=[
    ('round', 'Ronde'),
    ('square', 'Carree'),
    ('rectangle', 'Rectangulaire'),
    ('bar', 'Bar/Comptoir'),
], default='round')
width = models.IntegerField(default=80, help_text="Largeur en pixels sur le plan")
height = models.IntegerField(default=80, help_text="Hauteur en pixels sur le plan")
label = models.CharField(max_length=20, default='', help_text="Label affiche (T1, Bar 1, etc.)")
rotation = models.IntegerField(default=0, help_text="Rotation en degres (0-359)")
```

### Impact API

Le serializer `TableSerializer` doit exposer ces nouveaux champs en lecture ET ecriture :

```
POST /api/tables/
{
  "numero": 1,
  "capacity": 4,
  "salle_id": 1,
  "position_x": 150,
  "position_y": 200,
  "type": "round",
  "width": 80,
  "height": 80,
  "label": "T1",
  "rotation": 0
}
```

---

## 4. Nouveau endpoint : Floor Plan (JSON blob)

### Modele

Ajouter un champ `JSONField` sur `Salle` :

```python
# T_HOLLY_PI_SALLES
floor_plan_data = models.JSONField(
    null=True, blank=True,
    help_text="Donnees visuelles du plan de salle (murs, decorations, grille)"
)
```

Ce champ stocke **uniquement les elements non-relationnels** : murs, decorations, metadata du plan (gridSize, nom). Les tables et la zone elle-meme restent dans les modeles relationnels.

### Contenu du JSON

```json
{
  "grid_size": 20,
  "walls": [
    {
      "id": "wall-1",
      "x": 0, "y": 0, "rotation": 0,
      "points": [0, 0, 580, 0],
      "thickness": 10
    }
  ],
  "decorations": [
    {
      "id": "deco-1",
      "x": 100, "y": 100, "rotation": 45,
      "decoration_type": "column_round",
      "category": "structural",
      "shape_type": "circle",
      "label": "Colonne",
      "radius": 15
    }
  ],
  "zone_visual": {
    "points": [0, 0, 580, 0, 580, 440, 0, 440],
    "color": "#3b82f6",
    "opacity": 0.15
  }
}
```

### Endpoints

**Pas de nouvel endpoint** — utiliser le PATCH existant sur Salle :

```
PATCH /api/salles/{id}/
{
  "floor_plan_data": { ... }
}
```

```
GET /api/salles/{id}/
→ retourne la salle avec floor_plan_data inclus
```

### Avantage

- Pas de nouveau modele, pas de migration complexe
- Le frontend reconstruit le `FloorPlan` complet a partir de : `salle` (zone) + `tables` (relationnelles) + `floor_plan_data` (visuels)
- Compatible avec le CRUD existant

---

## 5. Flow complet : Sauvegarder un plan

### Frontend → Backend

```
1. User sauvegarde dans l'editeur
2. Frontend extrait de FloorPlan :
   a. Zone (nom, capacity) → PATCH /api/salles/{id}/ (ou POST si nouvelle)
   b. Tables → POST/PUT/DELETE /api/tables/ (sync des tables)
   c. Murs + decorations + metadata → PATCH /api/salles/{id}/ { floor_plan_data: {...} }
3. Backend persiste tout
```

### Backend → Frontend (chargement)

```
1. GET /api/salles/?restaurant_id=X
   → retourne les salles avec floor_plan_data
2. GET /api/tables/?salle_id=Y (pour chaque salle)
   → retourne les tables avec position, type, dimensions
3. Frontend reconstruit FloorPlan :
   - Zone = salle.name + salle.floor_plan_data.zone_visual
   - Tables = tables API mappees en TableShape
   - Murs = salle.floor_plan_data.walls
   - Decorations = salle.floor_plan_data.decorations
```

---

## 6. Liaison Reservations ↔ Tables ↔ Salles

### Schema relationnel existant

```
Restaurant (1) ──→ (N) Salle
Salle (1) ──→ (N) Table
Reservation ──→ Salle (obligatoire, salle_id)
Reservation ──→ Table (optionnel, table_id)
```

### Ce qui marche deja

- Une reservation est liee a une salle (`salle_id` required)
- Une reservation peut etre liee a une table (`table_id` nullable)
- `GET /api/tables/status/?date=X&service=Y` retourne l'etat des tables (libre/occupee)

### Ce qu'il faut valider/implementer

#### A. Validation a la creation de reservation

Quand `table_id` est fourni dans `POST /api/reservations/` :

1. Verifier que la table appartient a la salle (`table.salle_id == reservation.salle_id`)
2. Verifier que la table est libre au creneau demande (pas d'autre reservation avec statut != annulee/no_show au meme datetime ± duree)
3. Verifier que `party_size <= table.capacity`
4. Retourner 400 si conflit

**Le backend semble deja le faire** (description swagger : "la table doit appartenir a la salle et etre libre au creneau") — a confirmer dans le code.

#### B. Statut des tables en temps reel

L'endpoint `GET /api/tables/status/` existe et retourne :
```json
{
  "table_id": 1,
  "is_occupied": false,
  "reservations_count": 2,
  "commandes_count": 0
}
```

**Le frontend ne l'utilise pas encore** — il calcule le statut localement a partir des reservations. Il faudrait que le frontend appelle cet endpoint pour la vue "Service" de la page Salle.

#### C. Champ `status` sur Reservation

Le schema backend n'a **pas de champ `status`** explicite dans le swagger. Le frontend envoie `status: "confirmee"` via PATCH mais ce champ n'est pas documente dans le schema `PatchedReservationRequest`.

**Question pour le backend** : le champ `status` existe-t-il sur le modele `Reservation` ? Si oui, quelles sont les valeurs possibles ? Le frontend utilise :
- `confirmee`
- `en_attente`
- `arrivee`
- `annulee`
- `no_show`

#### D. Champs manquants sur Reservation

Le backend a des champs que le frontend n'utilise pas encore :
- `note_serveur` / `note_client` — le frontend envoie `notes` (un seul champ) au lieu de distinguer
- `allergie` — texte libre
- `allergy_ids` / `diet_type_ids` — liaison allergenes/regimes alimentaires
- `allergies` / `diet_types` — lecture seule, objets avec `code` + `label`

**Recommandation** : le frontend devrait mapper `notes` → `note_serveur` pour la persistence. Les allergenes/regimes sont a integrer dans le formulaire de reservation.

---

## 7. Champs a ajouter/modifier — Resume

### Modele Table (existant)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | CharField(20) | `'round'` | Type de table : round, square, rectangle, bar |
| `width` | IntegerField | `80` | Largeur en pixels |
| `height` | IntegerField | `80` | Hauteur en pixels |
| `label` | CharField(20) | `''` | Label affiche (T1, Bar 1) |
| `rotation` | IntegerField | `0` | Rotation en degres |

### Modele Salle (existant)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| `floor_plan_data` | JSONField | `null` | Donnees visuelles : murs, decorations, zone_visual |

### Modele Reservation — Clarification

Confirmer l'existence du champ `status` avec les valeurs :
- `confirmee`, `en_attente`, `arrivee`, `annulee`, `no_show`

Si absent, l'ajouter :
```python
status = models.CharField(max_length=20, choices=[
    ('en_attente', 'En attente'),
    ('confirmee', 'Confirmee'),
    ('arrivee', 'Arrivee'),
    ('annulee', 'Annulee'),
    ('no_show', 'No-show'),
], default='en_attente')
```

---

## 8. Migration — Ordre d'execution

```
1. Migration: ajouter type/width/height/label/rotation sur Table
2. Migration: ajouter floor_plan_data (JSONField) sur Salle
3. Migration: confirmer/ajouter status sur Reservation
4. Mettre a jour les serializers (exposer les nouveaux champs)
5. Regenerer le schema OpenAPI
6. Frontend: pnpm gen:api → regenerer les types/hooks Orval
7. Frontend: implementer le chargement du plan depuis l'API
8. Frontend: implementer la sauvegarde complete (tables + floor_plan_data)
```

---

## 9. Estimation d'effort

| Tache | Effort |
|-------|--------|
| Migration Table (5 champs) | ~30min |
| Migration Salle (1 JSONField) | ~15min |
| Serializer updates | ~30min |
| Validation reservation (table libre au creneau) | ~1h (si pas deja fait) |
| Regeneration OpenAPI | ~5min |
| **Total backend** | **~2-3h** |
| Frontend : chargement plan depuis API | ~2h |
| Frontend : sauvegarde complete | ~2h |
| Frontend : tests MSW | ~1h |
| **Total frontend** | **~5h** |

---

## 10. Questions ouvertes pour le backend

1. Le champ `status` existe-t-il sur le modele `Reservation` ? Quelles valeurs ?
2. La validation "table libre au creneau" est-elle implementee dans `ReservationViewSet.create()` ?
3. Le `party_size <= table.capacity` est-il verifie ?
4. Faut-il un endpoint `DELETE /api/salles/{id}/` qui cascade-delete les tables associees ?
5. Y a-t-il une notion de "plan actif" vs "brouillon" ? Ou une seule version par salle ?
6. Le `floor_plan_data` doit-il etre valide (schema JSON) cote backend ou est-ce un blob opaque ?

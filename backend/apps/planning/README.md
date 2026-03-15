# App Planning

## Description
Gestion du planning et des créneaux horaires (shifts) des employés pour chaque restaurant.

## Modèle de données

### Shift (Créneau horaire)
```python
{
    "id": Integer (auto-généré),
    "employe": ForeignKey(Employe),
    "restaurant": ForeignKey(Restaurant),
    "date_debut": DateTime,
    "date_fin": DateTime,
    "type_shift": String (MORNING, AFTERNOON, EVENING, NIGHT),
    "notes": Text (optionnel)
}
```

## Types de shifts

- **MORNING** : Matin (généralement 8h-14h)
- **AFTERNOON** : Après-midi (généralement 14h-18h)
- **EVENING** : Soir (généralement 18h-23h)
- **NIGHT** : Nuit (généralement 23h-6h)

## Endpoints API

### GET /api/planning/shifts/
Liste des créneaux horaires.

**Paramètres de requête:**
- `week` (optionnel) - Format YYYY-Www (ex: 2025-W04)
- `restaurant_id` (optionnel) - Filtrer par restaurant
- `employe_id` (optionnel) - Filtrer par employé
- `type_shift` (optionnel) - MORNING, AFTERNOON, EVENING, NIGHT

**Exemple:**
```bash
GET /api/planning/shifts/?week=2025-W04&restaurant_id=1
```

### GET /api/planning/shifts/{id}/
Détails d'un créneau horaire.

### POST /api/planning/shifts/
Créer un nouveau créneau horaire.

**Body (JSON):**
```json
{
    "employe_id": 1,
    "restaurant_id": 1,
    "date_debut": "2025-01-20T08:00:00Z",
    "date_fin": "2025-01-20T14:00:00Z",
    "type_shift": "MORNING",
    "notes": "Service du matin"
}
```

### PATCH /api/planning/shifts/{id}/
Modifier un créneau horaire.

### DELETE /api/planning/shifts/{id}/
Supprimer un créneau horaire.

### GET /api/planning/stats/
Statistiques du planning pour une semaine.

**Paramètres de requête:**
- `week` (requis) - Format YYYY-Www
- `restaurant_id` (requis) - ID du restaurant

**Exemple de réponse:**
```json
{
    "week": "2025-W04",
    "restaurant_id": 1,
    "total_shifts": 25,
    "total_hours": 150.5,
    "shifts_by_type": {
        "MORNING": 8,
        "AFTERNOON": 6,
        "EVENING": 9,
        "NIGHT": 2
    },
    "shifts_by_employe": [
        {
            "employe_id": 1,
            "nom": "Dupont",
            "prenom": "Jean",
            "total_shifts": 5,
            "total_hours": 30.0
        }
    ]
}
```

## Notes
- Tous les endpoints nécessitent une authentification Bearer token
- Les créneaux sont indexés par restaurant et date pour des requêtes rapides
- Un employé ne peut pas avoir deux créneaux qui se chevauchent le même jour


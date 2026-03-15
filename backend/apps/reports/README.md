# App Reports (Rapports)

## Description
Génération et gestion des rapports pour les restaurants (ventes, stocks, personnel, financier).

## Modèle de données

### Report
```python
{
    "id": Integer (auto-généré),
    "restaurant": ForeignKey(Restaurant),
    "type_report": String (SALES, STOCK, STAFF, FINANCIAL, CUSTOM),
    "periode_debut": Date,
    "periode_fin": Date,
    "fichier": FileField (optionnel),
    "fichier_url": URL (optionnel, généré automatiquement),
    "generated_at": DateTime (auto-généré),
    "created_by": ForeignKey(User, optionnel)
}
```

## Types de rapports

- **SALES** : Rapport de ventes
- **STOCK** : Rapport de stock/inventaire
- **STAFF** : Rapport de personnel
- **FINANCIAL** : Rapport financier
- **CUSTOM** : Rapport personnalisé

## Endpoints API

### GET /api/reports/
Liste des rapports.

**Paramètres de requête:**
- `restaurant_id` (optionnel) - Filtrer par restaurant
- `type_report` (optionnel) - SALES, STOCK, STAFF, FINANCIAL, CUSTOM
- `period` (optionnel) - day, week, month, year

**Exemple:**
```bash
GET /api/reports/?restaurant_id=1&type_report=SALES&period=month
```

### GET /api/reports/{id}/
Détails d'un rapport.

**Exemple de réponse:**
```json
{
    "id": 1,
    "restaurant": {
        "id_restaurant": 1,
        "nom_restaurant": "Les Ombres et Bar"
    },
    "type_report": "SALES",
    "periode_debut": "2025-01-01",
    "periode_fin": "2025-01-31",
    "fichier_url": "http://localhost:8000/media/reports/report_2025_01.pdf",
    "generated_at": "2025-02-01T10:00:00Z",
    "created_by": {
        "id": 1,
        "username": "admin"
    }
}
```

### POST /api/reports/
Créer un rapport.

**Body (JSON):**
```json
{
    "restaurant_id": 1,
    "type_report": "SALES",
    "periode_debut": "2025-01-01",
    "periode_fin": "2025-01-31"
}
```

### PATCH /api/reports/{id}/
Modifier un rapport.

### DELETE /api/reports/{id}/
Supprimer un rapport.

### GET /api/reports/{id}/download/
Télécharger le fichier d'un rapport.

**Réponse:**
- `200 OK` avec le fichier en téléchargement
- `404 Not Found` si le rapport ou le fichier n'existe pas

### GET /api/employees/status
Statut des employés (présence/congés) pour une date donnée.

**Paramètres de requête:**
- `restaurant_id` (requis) - ID du restaurant
- `date` (requis) - Format YYYY-MM-DD

**Exemple de réponse:**
```json
{
    "restaurant_id": 1,
    "date": "2025-01-20",
    "employees": [
        {
            "employe_id": 1,
            "nom": "Dupont",
            "prenom": "Jean",
            "type_employe": "Serveur",
            "status": "PRESENT",
            "shift": {
                "id": 1,
                "date_debut": "2025-01-20T08:00:00Z",
                "date_fin": "2025-01-20T14:00:00Z",
                "type_shift": "MORNING"
            }
        }
    ]
}
```

## Notes
- Tous les endpoints nécessitent une authentification Bearer token
- Les rapports sont générés de manière asynchrone pour les grandes périodes
- Les fichiers de rapports sont stockés dans le répertoire `media/reports/`
- L'URL du fichier est générée automatiquement lors de la création du rapport


# App Dashboard

## Description
Application de tableau de bord pour l'administration web. Fournit des KPIs et une carte géographique des restaurants et fournisseurs.

## Endpoints API

### GET /api/dashboard/kpis
Récupère les KPIs (indicateurs clés de performance) pour un restaurant.

**Paramètres de requête:**
- `restaurant_id` (requis) - ID du restaurant
- `date` (optionnel) - Format YYYY-MM-DD (par défaut: aujourd'hui)

**Exemple de réponse:**
```json
{
    "restaurant_id": 1,
    "restaurant_name": "Les Ombres et Bar",
    "date": "2025-01-20",
    "kpis": {
        "ca_jour": 1250.50,
        "ca_mois": 35000.00,
        "remplissage": 75.5,
        "couverts": 120,
        "food_cost": 32.5,
        "satisfaction": null
    }
}
```

### GET /api/dashboard/map
Récupère les données pour afficher une carte avec restaurants et fournisseurs.

**Paramètres de requête:**
- `restaurant_id` (requis) - ID du restaurant

**Exemple de réponse:**
```json
{
    "restaurant": {
        "id": 1,
        "nom": "Les Ombres et Bar",
        "latitude": "48.856614",
        "longitude": "2.352222",
        "adresse": "27 quai Jacques Chirac, 75007 Paris"
    },
    "fournisseurs": [
        {
            "id": 1,
            "nom": "Fournisseur ABC",
            "latitude": "48.8606",
            "longitude": "2.3376",
            "adresse": "123 Rue Example, 75001 Paris"
        }
    ]
}
```

## Notes
- Tous les endpoints nécessitent une authentification Bearer token
- Les KPIs sont calculés en temps réel à partir des données de commandes, réservations et stocks


# App Settings (Paramètres)

## Description
Gestion des paramètres de configuration pour les restaurants, notifications, facturation et utilisateurs.

## Modèles de données

### NotificationSettings
```python
{
    "id": Integer (auto-généré),
    "restaurant": OneToOneField(Restaurant),
    "email_notifications": Boolean (défaut: True),
    "sms_notifications": Boolean (défaut: False),
    "stock_alerts": Boolean (défaut: True),
    "reservation_alerts": Boolean (défaut: True),
    "command_alerts": Boolean (défaut: True)
}
```

### BillingSettings
```python
{
    "id": Integer (auto-généré),
    "restaurant": OneToOneField(Restaurant),
    "tva_par_defaut": Decimal (max 5 chiffres, 2 décimales, défaut: 20.00),
    "devise": String (défaut: 'EUR'),
    "facture_auto": Boolean (défaut: True)
}
```

## Endpoints API

### GET /api/settings/restaurant
Récupère les paramètres d'un restaurant.

**Paramètres de requête:**
- `restaurant_id` (requis) - ID du restaurant

**Exemple de réponse:**
```json
{
    "restaurant_id": 1,
    "notification_settings": {
        "email_notifications": true,
        "sms_notifications": false,
        "stock_alerts": true,
        "reservation_alerts": true,
        "command_alerts": true
    },
    "billing_settings": {
        "tva_par_defaut": 20.00,
        "devise": "EUR",
        "facture_auto": true
    }
}
```

### PATCH /api/settings/restaurant
Modifie les paramètres d'un restaurant.

**Paramètres de requête:**
- `restaurant_id` (requis) - ID du restaurant

**Body (JSON):**
```json
{
    "notification_settings": {
        "email_notifications": false,
        "stock_alerts": true
    },
    "billing_settings": {
        "tva_par_defaut": 10.00
    }
}
```

### GET /api/settings/notifications/
Liste des paramètres de notifications.

**Paramètres de requête:**
- `restaurant_id` (optionnel) - Filtrer par restaurant

### GET /api/settings/notifications/{id}/
Détails des paramètres de notifications.

### POST /api/settings/notifications/
Créer des paramètres de notifications.

### PATCH /api/settings/notifications/{id}/
Modifier les paramètres de notifications.

### GET /api/settings/billing/
Liste des paramètres de facturation.

**Paramètres de requête:**
- `restaurant_id` (optionnel) - Filtrer par restaurant

### GET /api/settings/billing/{id}/
Détails des paramètres de facturation.

### POST /api/settings/billing/
Créer des paramètres de facturation.

### PATCH /api/settings/billing/{id}/
Modifier les paramètres de facturation.

### GET /api/settings/users/
Liste des utilisateurs (pour l'administration).

### POST /api/settings/users/
Créer un utilisateur.

### PATCH /api/settings/users/{id}/
Modifier un utilisateur.

## Notes
- Tous les endpoints nécessitent une authentification Bearer token
- Les paramètres sont liés à un restaurant via une relation OneToOne
- Les paramètres de notifications et de facturation sont créés automatiquement lors de la création d'un restaurant


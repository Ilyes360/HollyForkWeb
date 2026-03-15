# App Suppliers (Fournisseurs)

## Description
Gestion des fournisseurs, de leurs jours de livraison et des commandes fournisseurs.

## Modèles de données

### Fournisseur
```python
{
    "id": Integer (auto-généré),
    "nom": String (max 200 caractères),
    "contact_nom": String (max 100, optionnel),
    "email": Email (optionnel),
    "telephone": String (max 20, optionnel),
    "adresse": Text (optionnel),
    "ville": String (max 100, optionnel),
    "code_postal": String (max 10, optionnel),
    "latitude": Decimal (9 chiffres, 6 décimales, optionnel),
    "longitude": Decimal (9 chiffres, 6 décimales, optionnel),
    "notes": Text (optionnel),
    "actif": Boolean (défaut: True)
}
```

### JourLivraison
```python
{
    "id": Integer (auto-généré),
    "fournisseur": ForeignKey(Fournisseur),
    "jour": String (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY),
    "heure_livraison": Time (optionnel)
}
```

### CommandeFournisseur
```python
{
    "id": Integer (auto-généré),
    "fournisseur": ForeignKey(Fournisseur),
    "restaurant": ForeignKey(Restaurant),
    "numero_commande": String (max 100),
    "date_commande": Date,
    "date_livraison_prevue": Date (optionnel),
    "statut": String (DRAFT, SENT, CONFIRMED, DELIVERED, CANCELLED),
    "montant_total": Decimal (max 10 chiffres, 2 décimales)
}
```

## Statuts de commande fournisseur

- **DRAFT** : Brouillon
- **SENT** : Envoyée au fournisseur
- **CONFIRMED** : Confirmée par le fournisseur
- **DELIVERED** : Livrée
- **CANCELLED** : Annulée

## Endpoints API

### GET /api/suppliers/
Liste des fournisseurs.

**Paramètres de requête:**
- `actif` (optionnel) - true/false pour filtrer par statut actif

### GET /api/suppliers/{id}/
Détails d'un fournisseur.

### POST /api/suppliers/
Créer un fournisseur.

**Body (JSON):**
```json
{
    "nom": "Fournisseur ABC",
    "contact_nom": "Jean Dupont",
    "email": "contact@fournisseur-abc.fr",
    "telephone": "+33 1 23 45 67 89",
    "adresse": "123 Rue Example",
    "ville": "Paris",
    "code_postal": "75001",
    "latitude": "48.856614",
    "longitude": "2.352222",
    "actif": true
}
```

### PATCH /api/suppliers/{id}/
Modifier un fournisseur.

### DELETE /api/suppliers/{id}/
Supprimer un fournisseur.

### GET /api/suppliers/{id}/delivery-days/
Jours de livraison d'un fournisseur.

**Exemple de réponse:**
```json
[
    {
        "id": 1,
        "jour": "MONDAY",
        "heure_livraison": "08:00:00"
    },
    {
        "id": 2,
        "jour": "WEDNESDAY",
        "heure_livraison": "09:00:00"
    }
]
```

### GET /api/suppliers/orders/
Liste des commandes fournisseurs.

**Paramètres de requête:**
- `restaurant_id` (optionnel) - Filtrer par restaurant
- `fournisseur_id` (optionnel) - Filtrer par fournisseur
- `statut` (optionnel) - DRAFT, SENT, CONFIRMED, DELIVERED, CANCELLED

### POST /api/suppliers/orders/
Créer une commande fournisseur.

**Body (JSON):**
```json
{
    "fournisseur_id": 1,
    "restaurant_id": 1,
    "numero_commande": "CMD-2025-001",
    "date_commande": "2025-01-15",
    "date_livraison_prevue": "2025-01-20",
    "statut": "DRAFT",
    "montant_total": 500.00
}
```

### PATCH /api/suppliers/orders/{id}/
Modifier une commande fournisseur.

## Notes
- Tous les endpoints nécessitent une authentification Bearer token
- Les fournisseurs peuvent être associés à plusieurs restaurants
- Les jours de livraison sont uniques par combinaison fournisseur/restaurant/jour


# App Restaurant - Documentation Frontend

## 📚 Documentation complète
Pour la documentation complète de l'API, voir [README_API.md](./README_API.md)

## Description
Gestion des restaurants dans le système Holly PI. Cette application permet de créer, gérer et récupérer les informations des restaurants.

## Modèle de données

### Restaurant
```python
{
    "id_restaurant": Integer (auto-généré),
    "nom_restaurant": String (max 100 caractères),
    "adresse_restaurant": String (max 255 caractères),
    "code_postal": String (max 10 caractères),
    "ville": String (max 100 caractères),
    "numero_telephone": String (max 20 caractères),
    "numero_siret": String (14 chiffres, unique),
    "code_naf": String (max 5 caractères, optionnel),
    "pin_restaurant": String (6 chiffres, unique, requis),
    "logo_url": String (URL, max 500 caractères, optionnel),
    "latitude": Decimal (9 chiffres, 6 décimales, optionnel),
    "longitude": Decimal (9 chiffres, 6 décimales, optionnel)
}
```

## Endpoints API

### 1. Liste des restaurants
**GET** `/restaurants/`

Récupère la liste de tous les restaurants.

**Headers requis:**
```json
{
    "Authorization": "Bearer <token>"
}
```

**Paramètres de requête (optionnels):**
- `id_restaurant` : Filtrer par ID de restaurant
- `user_id` : Récupérer uniquement les restaurants où l'utilisateur est employé

**Exemple de requête:**
```bash
GET /restaurants/
GET /restaurants/?id_restaurant=1
GET /restaurants/?user_id=5
```

**Réponse (200 OK):**
```json
[
    {
        "id_restaurant": 1,
        "nom_restaurant": "Le Gourmet",
        "adresse_restaurant": "123 Rue de la Paix",
        "code_postal": "75001",
        "ville": "Paris",
        "numero_telephone": "0123456789",
        "numero_siret": "12345678901234",
        "code_naf": "56.10",
        "pin_restaurant": "123456",
        "logo_url": "https://example.com/logos/restaurant1.png",
        "latitude": "48.856614",
        "longitude": "2.352222"
    }
]
```

---

### 2. Détails d'un restaurant
**GET** `/restaurants/{id}/`

Récupère les détails complets d'un restaurant spécifique.

**Headers requis:**
```json
{
    "Authorization": "Bearer <token>"
}
```

**Paramètres d'URL:**
- `id` : ID du restaurant

**Exemple de requête:**
```bash
GET /restaurants/1/
```

**Réponse (200 OK):**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet",
    "adresse_restaurant": "123 Rue de la Paix",
    "code_postal": "75001",
    "ville": "Paris",
    "numero_telephone": "0123456789",
    "numero_siret": "12345678901234",
    "code_naf": "56.10",
    "pin_restaurant": "123456",
    "logo_url": "https://example.com/logos/restaurant1.png",
    "latitude": "48.856614",
    "longitude": "2.352222"
}
```
```

**Erreurs possibles:**
- `404 Not Found` : Restaurant non trouvé

---

### 3. Créer un restaurant
**POST** `/restaurants/`

Crée un nouveau restaurant et associe automatiquement l'utilisateur connecté comme manager.

**Headers requis:**
```json
{
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
    "nom_restaurant": "Le Nouveau Restaurant",
    "adresse_restaurant": "456 Avenue des Champs",
    "code_postal": "75008",
    "ville": "Paris",
    "numero_telephone": "0987654321",
    "numero_siret": "98765432109876",
    "code_naf": "56.10",
    "pin_restaurant": "654321",
    "logo_url": "https://example.com/logos/nouveau.png"
}
```

**Champs obligatoires:**
- `nom_restaurant`
- `adresse_restaurant`
- `code_postal`
- `ville`
- `numero_telephone`
- `numero_siret` (14 chiffres)
- `pin_restaurant` (6 chiffres)

**Champs optionnels:**
- `code_naf`
- `logo_url`
- `latitude` (coordonnée géographique)
- `longitude` (coordonnée géographique)

**Réponse (201 Created):**
```json
{
    "id_restaurant": 2,
    "nom_restaurant": "Le Nouveau Restaurant",
    "adresse_restaurant": "456 Avenue des Champs",
    "code_postal": "75008",
    "ville": "Paris",
    "numero_telephone": "0987654321",
    "numero_siret": "98765432109876",
    "code_naf": "56.10",
    "pin_restaurant": "654321",
    "logo_url": "https://example.com/logos/nouveau.png"
}
```

**Erreurs possibles:**
- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Non authentifié

---

### 4. Modifier un restaurant
**PUT** `/restaurants/{id}/` (modification complète)  
**PATCH** `/restaurants/{id}/` (modification partielle)

Met à jour les informations d'un restaurant existant.

**Headers requis:**
```json
{
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
```

**Paramètres d'URL:**
- `id` : ID du restaurant

**Body (JSON) - PUT (tous les champs requis):**
```json
{
    "nom_restaurant": "Le Gourmet Modifié",
    "adresse_restaurant": "123 Rue de la Paix",
    "code_postal": "75001",
    "ville": "Paris",
    "numero_telephone": "0123456789",
    "numero_siret": "12345678901234",
    "code_naf": "56.10",
    "pin_restaurant": "123456",
    "logo_url": "https://example.com/logos/nouveau-logo.png"
}
```

**Body (JSON) - PATCH (seulement les champs à modifier):**
```json
{
    "logo_url": "https://example.com/logos/nouveau-logo.png",
    "numero_telephone": "0111111111"
}
```

**Réponse (200 OK):**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet Modifié",
    "adresse_restaurant": "123 Rue de la Paix",
    "code_postal": "75001",
    "ville": "Paris",
    "numero_telephone": "0111111111",
    "numero_siret": "12345678901234",
    "code_naf": "56.10",
    "pin_restaurant": "123456",
    "logo_url": "https://example.com/logos/nouveau-logo.png"
}
```

**Erreurs possibles:**
- `400 Bad Request` : Données invalides
- `404 Not Found` : Restaurant non trouvé

---

### 5. Supprimer un restaurant
**DELETE** `/restaurants/{id}/`

Supprime un restaurant existant.

**Headers requis:**
```json
{
    "Authorization": "Bearer <token>"
}
```

**Paramètres d'URL:**
- `id` : ID du restaurant

**Exemple de requête:**
```bash
DELETE /restaurants/1/
```

**Réponse (204 No Content):**
Aucun contenu retourné.

**Erreurs possibles:**
- `404 Not Found` : Restaurant non trouvé

---

### 6. Récupérer le logo d'un restaurant
**GET** `/restaurants/logo/{id_restaurant}/`

Endpoint spécifique pour récupérer uniquement l'URL du logo d'un restaurant.

**Headers requis:**
```json
{
    "Authorization": "Bearer <token>"
}
```

**Paramètres d'URL:**
- `id_restaurant` : ID du restaurant

**Exemple de requête:**
```bash
GET /restaurants/logo/1/
```

**Réponse (200 OK):**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet",
    "logo_url": "https://example.com/logos/restaurant1.png"
}
```

**Réponse si pas de logo:**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet",
    "logo_url": null
}
```

**Erreurs possibles:**
- `404 Not Found` : Restaurant non trouvé

---

## Règles de validation

### numero_siret
- Doit contenir exactement 14 chiffres
- Doit être unique dans la base de données

### pin_restaurant
- Doit contenir exactement 6 chiffres
- Doit être unique dans la base de données
- Champ obligatoire

### logo_url
- Doit être une URL valide
- Longueur maximale : 500 caractères
- Champ optionnel

## Exemple d'utilisation avec cURL

```bash
# Liste des restaurants
curl -X GET "http://localhost:8000/restaurants/" \
  -H "Authorization: Bearer votre_token"

# Créer un restaurant
curl -X POST "http://localhost:8000/restaurants/" \
  -H "Authorization: Bearer votre_token" \
  -H "Content-Type: application/json" \
  -d '{
    "nom_restaurant": "Mon Restaurant",
    "adresse_restaurant": "123 Rue Test",
    "code_postal": "75001",
    "ville": "Paris",
    "numero_telephone": "0123456789",
    "numero_siret": "12345678901234",
    "pin_restaurant": "123456",
    "logo_url": "https://example.com/logo.png"
  }'

# Récupérer le logo
curl -X GET "http://localhost:8000/restaurants/logo/1/" \
  -H "Authorization: Bearer votre_token"

# Modifier le logo
curl -X PATCH "http://localhost:8000/restaurants/1/" \
  -H "Authorization: Bearer votre_token" \
  -H "Content-Type: application/json" \
  -d '{
    "logo_url": "https://example.com/nouveau-logo.png"
  }'
```

## Codes de statut HTTP

- `200 OK` : Requête réussie
- `201 Created` : Ressource créée avec succès
- `204 No Content` : Suppression réussie
- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Non authentifié
- `404 Not Found` : Ressource non trouvée
- `500 Internal Server Error` : Erreur serveur

## Notes importantes

1. **Authentification** : Tous les endpoints nécessitent une authentification Bearer token
2. **Association automatique** : Lors de la création d'un restaurant, l'utilisateur connecté est automatiquement associé comme manager
3. **Filtrage** : Les utilisateurs ne voient que les restaurants où ils sont employés (sauf si admin)
4. **PIN unique** : Le PIN restaurant doit être unique et est obligatoire


# API Restaurant - Documentation Frontend

## Base URL
```
/restaurants/
```

## Authentification
Tous les endpoints nécessitent un token Bearer dans le header.

```javascript
headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}
```

---

## 📋 Liste des endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/restaurants/` | Liste tous les restaurants |
| GET | `/restaurants/{id}/` | Détails d'un restaurant |
| GET | `/restaurants/logo/{id}/` | Récupère uniquement le logo |
| POST | `/restaurants/` | Créer un restaurant |
| PUT | `/restaurants/{id}/` | Modifier un restaurant (complet) |
| PATCH | `/restaurants/{id}/` | Modifier un restaurant (partiel) |
| DELETE | `/restaurants/{id}/` | Supprimer un restaurant |

---

## 1. GET /restaurants/

### Récupérer la liste des restaurants

**Query Parameters (optionnels) :**
- `id_restaurant` : Filtrer par ID
- `user_id` : Restaurants où l'utilisateur est employé

**Exemple JavaScript :**
```javascript
// Tous les restaurants
const response = await fetch('/restaurants/', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const restaurants = await response.json();

// Filtrer par restaurant
const response = await fetch('/restaurants/?id_restaurant=1', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

// Restaurants d'un utilisateur
const response = await fetch('/restaurants/?user_id=5', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

**Réponse (200 OK) :**
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

## 2. GET /restaurants/{id}/

### Récupérer les détails d'un restaurant

**Exemple JavaScript :**
```javascript
const restaurantId = 1;
const response = await fetch(`/restaurants/${restaurantId}/`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const restaurant = await response.json();
```

**Réponse (200 OK) :**
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

**Erreur (404 Not Found) :**
```json
{
    "detail": "Not found."
}
```

---

## 3. GET /restaurants/logo/{id}/

### Récupérer uniquement le logo d'un restaurant

**Exemple JavaScript :**
```javascript
const restaurantId = 1;
const response = await fetch(`/restaurants/logo/${restaurantId}/`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const data = await response.json();
console.log(data.logo_url); // URL du logo
```

**Réponse (200 OK) :**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet",
    "logo_url": "https://example.com/logos/restaurant1.png"
}
```

**Si pas de logo :**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet",
    "logo_url": null
}
```

---

## 4. POST /restaurants/

### Créer un nouveau restaurant

**Body (JSON) :**
```json
{
    "nom_restaurant": "Mon Nouveau Restaurant",
    "adresse_restaurant": "456 Avenue Test",
    "code_postal": "75008",
    "ville": "Paris",
    "numero_telephone": "0987654321",
    "numero_siret": "98765432109876",
    "code_naf": "56.10",
    "pin_restaurant": "654321",
    "logo_url": "https://example.com/logos/nouveau.png"
}
```

**Champs obligatoires :**
- `nom_restaurant`
- `adresse_restaurant`
- `code_postal`
- `ville`
- `numero_telephone`
- `numero_siret` (14 chiffres exactement)
- `pin_restaurant` (6 chiffres exactement)

**Champs optionnels :**
- `code_naf`
- `logo_url`
- `latitude` (coordonnée géographique, format: 9 chiffres, 6 décimales)
- `longitude` (coordonnée géographique, format: 9 chiffres, 6 décimales)

**Exemple JavaScript :**
```javascript
const newRestaurant = {
    nom_restaurant: "Mon Restaurant",
    adresse_restaurant: "123 Rue Test",
    code_postal: "75001",
    ville: "Paris",
    numero_telephone: "0123456789",
    numero_siret: "12345678901234",
    pin_restaurant: "123456",
    logo_url: "https://example.com/logo.png",
    latitude: "48.856614",
    longitude: "2.352222"
};

const response = await fetch('/restaurants/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(newRestaurant)
});

const restaurant = await response.json();
```

**Réponse (201 Created) :**
```json
{
    "id_restaurant": 2,
    "nom_restaurant": "Mon Restaurant",
    "adresse_restaurant": "123 Rue Test",
    "code_postal": "75001",
    "ville": "Paris",
    "numero_telephone": "0123456789",
    "numero_siret": "12345678901234",
    "code_naf": null,
    "pin_restaurant": "123456",
    "logo_url": "https://example.com/logo.png"
}
```

**Erreurs possibles :**
```json
// 400 Bad Request - SIRET invalide
{
    "numero_siret": ["Le SIRET doit contenir 14 chiffres."]
}

// 400 Bad Request - PIN invalide
{
    "pin_restaurant": ["Le PIN restaurant doit contenir exactement 6 chiffres."]
}

// 400 Bad Request - SIRET déjà existant
{
    "numero_siret": ["restaurant with this numero siret already exists."]
}
```

---

## 5. PATCH /restaurants/{id}/

### Modifier partiellement un restaurant

**Body (JSON) - Seulement les champs à modifier :**
```json
{
    "logo_url": "https://example.com/nouveau-logo.png",
    "numero_telephone": "0111111111"
}
```

**Exemple JavaScript :**
```javascript
const restaurantId = 1;
const updates = {
    logo_url: "https://example.com/nouveau-logo.png",
    numero_telephone: "0111111111"
};

const response = await fetch(`/restaurants/${restaurantId}/`, {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
});

const restaurant = await response.json();
```

**Réponse (200 OK) :**
```json
{
    "id_restaurant": 1,
    "nom_restaurant": "Le Gourmet",
    "adresse_restaurant": "123 Rue de la Paix",
    "code_postal": "75001",
    "ville": "Paris",
    "numero_telephone": "0111111111",
    "numero_siret": "12345678901234",
    "code_naf": "56.10",
    "pin_restaurant": "123456",
    "logo_url": "https://example.com/nouveau-logo.png"
}
```

---

## 6. PUT /restaurants/{id}/

### Modifier complètement un restaurant

**Tous les champs obligatoires doivent être envoyés**

**Body (JSON) :**
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
    "logo_url": "https://example.com/logo.png"
}
```

**Exemple JavaScript :**
```javascript
const restaurantId = 1;
const restaurantData = {
    nom_restaurant: "Le Gourmet Modifié",
    adresse_restaurant: "123 Rue de la Paix",
    code_postal: "75001",
    ville: "Paris",
    numero_telephone: "0123456789",
    numero_siret: "12345678901234",
    code_naf: "56.10",
    pin_restaurant: "123456",
    logo_url: "https://example.com/logo.png"
};

const response = await fetch(`/restaurants/${restaurantId}/`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(restaurantData)
});

const restaurant = await response.json();
```

---

## 7. DELETE /restaurants/{id}/

### Supprimer un restaurant

**Exemple JavaScript :**
```javascript
const restaurantId = 1;
const response = await fetch(`/restaurants/${restaurantId}/`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

if (response.status === 204) {
    console.log('Restaurant supprimé avec succès');
}
```

**Réponse (204 No Content) :**
Aucun contenu retourné

---

## 🎨 Composant React exemple

```javascript
import React, { useState, useEffect } from 'react';

function RestaurantList() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await fetch('/restaurants/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setRestaurants(data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateLogo = async (restaurantId, newLogoUrl) => {
        try {
            const response = await fetch(`/restaurants/${restaurantId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ logo_url: newLogoUrl })
            });
            
            if (response.ok) {
                // Rafraîchir la liste
                fetchRestaurants();
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            {restaurants.map(restaurant => (
                <div key={restaurant.id_restaurant}>
                    {restaurant.logo_url && (
                        <img src={restaurant.logo_url} alt={restaurant.nom_restaurant} />
                    )}
                    <h2>{restaurant.nom_restaurant}</h2>
                    <p>{restaurant.ville}</p>
                </div>
            ))}
        </div>
    );
}
```

---

## 📝 Codes de statut HTTP

| Code | Description |
|------|-------------|
| 200 | OK - Requête réussie |
| 201 | Created - Ressource créée |
| 204 | No Content - Suppression réussie |
| 400 | Bad Request - Données invalides |
| 401 | Unauthorized - Token manquant/invalide |
| 404 | Not Found - Ressource non trouvée |
| 500 | Internal Server Error - Erreur serveur |

---

## ⚠️ Points d'attention

1. **Token obligatoire** : Tous les appels nécessitent l'authentification
2. **SIRET unique** : Vérifier côté frontend avant d'envoyer
3. **PIN unique** : Chaque restaurant doit avoir un PIN unique
4. **Format SIRET** : Exactement 14 chiffres
5. **Format PIN** : Exactement 6 chiffres
6. **Logo optionnel** : Le champ `logo_url` peut être `null`


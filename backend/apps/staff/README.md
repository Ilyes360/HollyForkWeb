# App Staff - Documentation Frontend

## Description
Gestion des employés et authentification par PIN code.

## 📦 Structures de données

### TypeEmploye
```json
{
    "id": 1,
    "nom_type": "Serveur",
    "description": "Personnel de service"
}
```

**Types courants :**
- Manager
- Serveur
- Cuisinier
- Barman
- Pâtissier

### Employe
```json
{
    "id": 1,
    "user_id": 5,
    "username": "jdupont",
    "nom": "Dupont",
    "prenom": "Jean",
    "pin_code": "1234",
    "type_employe": {
        "id": 2,
        "nom_type": "Serveur"
    },
    "salaire": "2500.00",
    "date_embauche": "2024-01-15",
    "numero_telephone": "0612345678"
}
```

### RestaurantEmploye (Association)
```json
{
    "id": 1,
    "restaurant": {
        "id_restaurant": 1,
        "nom_restaurant": "Le Gourmet"
    },
    "employe": {
        "id": 1,
        "nom": "Dupont",
        "prenom": "Jean"
    }
}
```

## ✅ Validation des données

### À envoyer lors de la création d'un employé
```json
{
    "nom": "Dupont",
    "prenom": "Jean",
    "type_employe_id": 2,
    "salaire": "2500.00",
    "date_embauche": "2024-01-15",
    "numero_telephone": "0612345678",
    "pin_code": "1234"
}
```

## 🔒 Règles de validation

### nom et prenom
- Doivent contenir uniquement des lettres, espaces ou tirets
- Obligatoires

### salaire
- Doit être >= 0
- Format : Decimal avec 2 décimales

### numero_telephone
- Validation : Format international (+33123456789 ou 0123456789)
- Optionnel

### pin_code
- Doit contenir exactement 4 chiffres
- Doit être unique par restaurant
- Optionnel

### Contraintes
- Un employé ne peut être associé qu'une seule fois à un restaurant (unique_together)
- Le PIN code doit être unique au sein d'un même restaurant

## 🎯 Cas d'usage frontend

### Authentification par PIN
```javascript
// Vérifier le PIN d'un employé
const checkPin = async (pinCode, restaurantId) => {
    const response = await fetch(`/staff/check-pin/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pin_code: pinCode,
            restaurant_id: restaurantId
        })
    });
    
    if (response.ok) {
        const employe = await response.json();
        return employe;
    }
    return null;
};
```

### Liste des employés d'un restaurant
```javascript
const getEmployes = async (restaurantId) => {
    const response = await fetch(`/staff/?restaurant_id=${restaurantId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
};
```

## ⚠️ Points d'attention frontend

1. **PIN unique par restaurant** : Vérifier l'unicité côté frontend avant soumission
2. **Format PIN** : 4 chiffres exactement (interface de saisie numérique recommandée)
3. **Masquage PIN** : Ne jamais afficher le PIN en clair dans l'interface
4. **Validation téléphone** : Format international (+33... ou 06...)


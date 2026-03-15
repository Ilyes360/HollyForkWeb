# App Shared - Documentation Frontend

## Description
Modèle partagé pour les taux de TVA utilisés dans toute l'application.

## Modèle TauxTVA

### Structure de données
```json
{
    "id": 1,
    "taux": 20.00,
    "description": "Taux normal",
    "actif": true
}
```

## Notes pour le frontend

- Les taux de TVA sont gérés côté backend
- Le taux par défaut est 20% (taux normal en France)
- Utilisé dans les articles et les factures
- Calcul automatique du TTC : `prix_ttc = prix_ht * (1 + taux/100)`

### Taux courants en France
- **20%** : Taux normal (boissons alcoolisées, etc.)
- **10%** : Taux intermédiaire (restauration sur place)
- **5.5%** : Taux réduit (produits alimentaires à emporter)
- **2.1%** : Taux super réduit (médicaments)


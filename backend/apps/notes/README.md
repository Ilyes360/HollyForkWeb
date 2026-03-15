# App Notes

## Description
Système de notes et commentaires pour les restaurants dans Holly PI. Permet aux employés de laisser des messages, remarques ou informations importantes pour l'équipe.

## Modèle de données

### Note
```python
{
    "id": Integer (auto-généré),
    "created_by": ForeignKey(Employe),
    "restaurant": ForeignKey(Restaurant),
    "created_at": DateTime (auto-généré),
    "message": String (max 500 caractères)
}
```

## Champs

### created_by
- **Type** : ForeignKey vers Employe
- **Obligatoire** : Oui
- **Suppression** : CASCADE
- Identifie l'employé qui a créé la note

### restaurant
- **Type** : ForeignKey vers Restaurant
- **Obligatoire** : Oui
- **Suppression** : CASCADE
- Restaurant concerné par la note

### created_at
- **Type** : DateTime
- **Auto-généré** : Oui
- Date et heure de création de la note

### message
- **Type** : String
- **Max** : 500 caractères
- **Défaut** : "Vide"
- **Obligatoire** : Oui
- Contenu de la note

## Méthode to_dict()

```python
{
    "id": 1,
    "created_by": {
        "id": 5,
        "nom": "Dupont",
        "prenom": "Jean",
        ...
    },
    "created_at": "2025-01-15T10:30:00",
    "restaurant": {
        "id_restaurant": 1,
        "nom_restaurant": "Le Gourmet",
        ...
    },
    "message": "Attention, problème avec le frigo n°2"
}
```

## Cas d'usage

### 1. Notes de service
```
"Livraison de fromages prévue demain matin"
"Réserver la salle du fond pour l'anniversaire à 20h"
"Client allergique aux arachides à la table 5"
```

### 2. Alertes techniques
```
"Cafetière en panne, technicien appelé"
"Fuite d'eau dans les toilettes hommes"
"Ampoule grillée dans la salle principale"
```

### 3. Remarques cuisine
```
"Plus de saumon, retiré de la carte du jour"
"Nouvelle recette de tarte tatin testée avec succès"
"Prévoir plus de baguettes pour demain"
```

### 4. Communication équipe
```
"Anniversaire de Marie vendredi, prévoir un gâteau"
"Réunion d'équipe lundi 10h"
"Nouveau menu validé, formation mardi"
```

## Exemples d'utilisation

### Créer une note
```python
from apps.notes.models import Note

note = Note.objects.create(
    created_by=employe,
    restaurant=restaurant,
    message="N'oubliez pas de vérifier les stocks de vin"
)
```

### Récupérer les notes d'un restaurant
```python
# Notes récentes (7 derniers jours)
from django.utils import timezone
from datetime import timedelta

date_limite = timezone.now() - timedelta(days=7)
notes = Note.objects.filter(
    restaurant_id=restaurant_id,
    created_at__gte=date_limite
).order_by('-created_at')
```

### Récupérer les notes d'un employé
```python
notes = Note.objects.filter(
    created_by_id=employe_id
).order_by('-created_at')
```

### Notes du jour
```python
from django.utils import timezone

today = timezone.now().date()
notes_today = Note.objects.filter(
    restaurant_id=restaurant_id,
    created_at__date=today
).order_by('-created_at')
```

## Bonnes pratiques

### Messages clairs et concis
✅ Bon : "Frigo n°2 en panne - Technicien appelé"  
❌ Mauvais : "Il y a un problème"

### Informations utiles
✅ Bon : "Table 12 : anniversaire à 20h, prévoir bougie"  
❌ Mauvais : "Y'a un truc ce soir"

### Contexte suffisant
✅ Bon : "Nouvelle recette : tarte citron meringuée validée, peut être proposée dès demain"  
❌ Mauvais : "C'est bon pour la tarte"

## Extensions possibles

### Catégories de notes
```python
CATEGORIE_CHOICES = [
    ('service', 'Service'),
    ('cuisine', 'Cuisine'),
    ('technique', 'Technique'),
    ('admin', 'Administratif'),
    ('urgent', 'Urgent'),
]
```

### Priorité
```python
PRIORITE_CHOICES = [
    ('basse', 'Basse'),
    ('normale', 'Normale'),
    ('haute', 'Haute'),
    ('urgente', 'Urgente'),
]
```

### Statut
```python
STATUT_CHOICES = [
    ('ouverte', 'Ouverte'),
    ('en_cours', 'En cours'),
    ('resolue', 'Résolue'),
]
```

### Destinataire
```python
destinataire = ForeignKey(Employe, null=True, blank=True)
# Pour adresser une note à un employé spécifique
```

## Intégration avec d'autres apps

### Staff
- Créateur de la note (`created_by`)
- Employés mentionnés dans le message

### Restaurant
- Restaurant concerné par la note
- Affichage dans le dashboard du restaurant

### Commandes
- Notes liées à des problèmes de commande
- Remarques sur le service

## Statistiques et rapports

### Notes par période
```python
def notes_par_periode(restaurant_id, date_debut, date_fin):
    return Note.objects.filter(
        restaurant_id=restaurant_id,
        created_at__range=(date_debut, date_fin)
    ).count()
```

### Employés les plus actifs
```python
def employes_actifs(restaurant_id):
    from django.db.models import Count
    
    return Note.objects.filter(
        restaurant__id=restaurant_id
    ).values(
        'created_by__nom',
        'created_by__prenom'
    ).annotate(
        nb_notes=Count('id')
    ).order_by('-nb_notes')
```

## Notes importantes

1. **Limite de caractères** : 500 caractères max pour garder les messages concis
2. **Suppression en cascade** : Si un restaurant ou employé est supprimé, les notes associées sont supprimées
3. **Pas de modification** : Les notes ne sont pas modifiables après création (historique)
4. **Horodatage automatique** : La date/heure est enregistrée automatiquement
5. **Tri chronologique** : Les notes les plus récentes en premier

## Sécurité et permissions

### Lecture
- Tous les employés du restaurant peuvent lire les notes

### Création
- Tous les employés authentifiés peuvent créer des notes

### Modification
- Non implémenté (historique immuable)

### Suppression
- Réservé aux managers et administrateurs

## API REST (si implémentée)

### Endpoints suggérés
```
GET    /notes/                    # Liste des notes
GET    /notes/{id}/              # Détail d'une note
POST   /notes/                    # Créer une note
DELETE /notes/{id}/              # Supprimer une note

GET    /notes/?restaurant_id=1    # Notes d'un restaurant
GET    /notes/?date=2025-01-15    # Notes d'une date
GET    /notes/?employe_id=5       # Notes d'un employé
```


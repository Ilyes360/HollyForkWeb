# App Reservations

## Description
Gestion des réservations de tables dans les restaurants du système Holly PI. Permet aux clients de réserver une salle pour un nombre de personnes à une date et heure spécifiques.

## Modèle de données

### Reservation
```python
{
    "id": Integer (auto-généré),
    "nom_client": String (max 100 caractères),
    "nombre_personnes": Integer (positif),
    "date_heure": DateTime,
    "telephone": String (max 20 caractères),
    "salle": ForeignKey(Salle)
}
```

## Champs

### nom_client
- **Type** : String
- **Max** : 100 caractères
- **Obligatoire** : Oui
- Nom complet du client qui réserve

### nombre_personnes
- **Type** : Integer (PositiveIntegerField)
- **Minimum** : 1
- **Obligatoire** : Oui
- Nombre de convives attendus

### date_heure
- **Type** : DateTime
- **Obligatoire** : Oui
- Date et heure de la réservation

### telephone
- **Type** : String
- **Max** : 20 caractères
- **Obligatoire** : Oui
- Numéro de téléphone pour contacter le client

### salle
- **Type** : ForeignKey vers Salle
- **Obligatoire** : Oui
- **Suppression** : CASCADE
- Salle réservée dans le restaurant

## Méthode __str__()

```python
"Jean Dupont - 2025-01-15 20:00:00 - Le Gourmet"
```

Format : `{nom_client} - {date_heure} - {nom_restaurant}`

## Validation des réservations

### Vérifications recommandées

#### 1. Capacité de la salle
```python
def verifier_capacite(reservation):
    salle = reservation.salle
    capacite_disponible = salle.tables.filter(
        is_occupied=False
    ).aggregate(Sum('capacity'))['capacity__sum'] or 0
    
    return capacite_disponible >= reservation.nombre_personnes
```

#### 2. Disponibilité horaire
```python
def verifier_disponibilite(reservation):
    # Vérifier les réservations existantes dans un créneau de 2h
    from datetime import timedelta
    
    debut = reservation.date_heure - timedelta(hours=1)
    fin = reservation.date_heure + timedelta(hours=1)
    
    reservations_existantes = Reservation.objects.filter(
        salle=reservation.salle,
        date_heure__range=(debut, fin)
    ).exclude(id=reservation.id)
    
    places_reservees = reservations_existantes.aggregate(
        total=Sum('nombre_personnes')
    )['total'] or 0
    
    capacite_totale = reservation.salle.tables.aggregate(
        Sum('capacity')
    )['capacity__sum'] or 0
    
    return (places_reservees + reservation.nombre_personnes) <= capacite_totale
```

#### 3. Date dans le futur
```python
def valider_date(reservation):
    from django.utils import timezone
    return reservation.date_heure > timezone.now()
```

## Cas d'usage

### 1. Créer une réservation
```python
from apps.reservations.models import Reservation
from apps.salles.models import Salle
from datetime import datetime, timedelta

# Réservation pour 4 personnes demain à 20h
tomorrow = datetime.now() + timedelta(days=1)
date_reservation = tomorrow.replace(hour=20, minute=0, second=0)

salle = Salle.objects.get(id=1)

reservation = Reservation.objects.create(
    nom_client="Jean Dupont",
    nombre_personnes=4,
    date_heure=date_reservation,
    telephone="0612345678",
    salle=salle
)
```

### 2. Réservations du jour
```python
from django.utils import timezone

today = timezone.now().date()
reservations_today = Reservation.objects.filter(
    salle__restaurant_id=restaurant_id,
    date_heure__date=today
).order_by('date_heure')
```

### 3. Réservations à venir
```python
from django.utils import timezone

reservations_futures = Reservation.objects.filter(
    salle__restaurant_id=restaurant_id,
    date_heure__gte=timezone.now()
).order_by('date_heure')
```

### 4. Rechercher une réservation
```python
# Par nom de client
reservations = Reservation.objects.filter(
    nom_client__icontains="Dupont"
)

# Par téléphone
reservation = Reservation.objects.filter(
    telephone="0612345678"
).first()

# Par date
from datetime import date
reservations = Reservation.objects.filter(
    date_heure__date=date(2025, 1, 15)
)
```

## Workflow de réservation

### 1. Demande de réservation
```python
def demander_reservation(data):
    # Vérifier la capacité
    salle = Salle.objects.get(id=data['salle_id'])
    
    if salle.capacite < data['nombre_personnes']:
        return {"erreur": "Capacité insuffisante"}
    
    # Vérifier la disponibilité
    # ... (voir fonction verifier_disponibilite)
    
    # Créer la réservation
    reservation = Reservation.objects.create(**data)
    
    return {"success": True, "reservation": reservation}
```

### 2. Confirmation
```python
def confirmer_reservation(reservation_id):
    reservation = Reservation.objects.get(id=reservation_id)
    
    # Envoyer un SMS/email de confirmation
    message = f"""
    Réservation confirmée !
    Restaurant : {reservation.salle.restaurant.nom_restaurant}
    Salle : {reservation.salle.nom_salle}
    Date : {reservation.date_heure.strftime('%d/%m/%Y à %H:%M')}
    Nombre de personnes : {reservation.nombre_personnes}
    """
    
    envoyer_confirmation(reservation.telephone, message)
```

### 3. Rappel
```python
def envoyer_rappels():
    from django.utils import timezone
    from datetime import timedelta
    
    # Rappel 24h avant
    demain = timezone.now() + timedelta(days=1)
    debut = demain.replace(hour=0, minute=0, second=0)
    fin = demain.replace(hour=23, minute=59, second=59)
    
    reservations = Reservation.objects.filter(
        date_heure__range=(debut, fin)
    )
    
    for reservation in reservations:
        message = f"Rappel : votre réservation demain à {reservation.date_heure.strftime('%H:%M')}"
        envoyer_sms(reservation.telephone, message)
```

### 4. Arrivée du client
```python
def traiter_arrivee(reservation_id):
    reservation = Reservation.objects.get(id=reservation_id)
    
    # Trouver une table disponible
    table = Table.objects.filter(
        salle=reservation.salle,
        is_occupied=False,
        capacity__gte=reservation.nombre_personnes
    ).order_by('capacity').first()
    
    if table:
        # Créer la commande
        commande = Commande.objects.create(
            restaurant=reservation.salle.restaurant,
            table=table,
            created_by=employe,
            statut='EN_COURS'
        )
        
        # Supprimer ou marquer la réservation comme honorée
        reservation.delete()
        
        return {"success": True, "table": table.numero}
    
    return {"erreur": "Aucune table disponible"}
```

## Statistiques

### Taux d'occupation
```python
def taux_occupation(restaurant_id, date):
    reservations = Reservation.objects.filter(
        salle__restaurant_id=restaurant_id,
        date_heure__date=date
    )
    
    couverts_reserves = reservations.aggregate(
        Sum('nombre_personnes')
    )['nombre_personnes__sum'] or 0
    
    capacite_totale = Salle.objects.filter(
        restaurant_id=restaurant_id
    ).aggregate(Sum('capacite'))['capacite__sum'] or 0
    
    if capacite_totale > 0:
        return (couverts_reserves / capacite_totale) * 100
    return 0
```

### Réservations par créneau
```python
def reservations_par_creneau(restaurant_id, date):
    creneaux = {
        'midi': (11, 15),
        'soir': (18, 23)
    }
    
    resultats = {}
    for nom, (heure_debut, heure_fin) in creneaux.items():
        count = Reservation.objects.filter(
            salle__restaurant_id=restaurant_id,
            date_heure__date=date,
            date_heure__hour__gte=heure_debut,
            date_heure__hour__lt=heure_fin
        ).count()
        resultats[nom] = count
    
    return resultats
```

## Extensions possibles

### Statut de réservation
```python
STATUT_CHOICES = [
    ('en_attente', 'En attente'),
    ('confirmee', 'Confirmée'),
    ('arrivee', 'Client arrivé'),
    ('annulee', 'Annulée'),
    ('no_show', 'Client absent'),
]
```

### Type de réservation
```python
TYPE_CHOICES = [
    ('standard', 'Standard'),
    ('anniversaire', 'Anniversaire'),
    ('affaires', 'Repas d'affaires'),
    ('groupe', 'Groupe'),
]
```

### Commentaires
```python
commentaires = TextField(blank=True, null=True)
# Pour des demandes spéciales : allergies, menu végétarien, etc.
```

### Email du client
```python
email = EmailField(max_length=255, blank=True, null=True)
# Pour envoyer des confirmations par email
```

## Intégration avec d'autres apps

### Salles
- Lien direct avec une salle spécifique
- Vérification de la capacité

### Commandes
- Conversion d'une réservation en commande à l'arrivée du client

### Restaurant
- Accès au restaurant via `reservation.salle.restaurant`

## Notes importantes

1. **Vérification de capacité** : Toujours vérifier avant de créer une réservation
2. **Gestion des créneaux** : Prévoir des intervalles entre réservations (1-2h)
3. **No-show** : Prévoir une gestion des clients qui ne se présentent pas
4. **Confirmation** : Envoyer des confirmations par SMS/email
5. **Rappels** : Système de rappel 24h avant
6. **Annulation** : Permettre l'annulation avec un délai raisonnable

## API REST (si implémentée)

### Endpoints suggérés
```
GET    /reservations/                        # Liste des réservations
GET    /reservations/{id}/                   # Détail d'une réservation
POST   /reservations/                        # Créer une réservation
PUT    /reservations/{id}/                   # Modifier une réservation
DELETE /reservations/{id}/                   # Annuler une réservation

GET    /reservations/?restaurant_id=1        # Réservations d'un restaurant
GET    /reservations/?date=2025-01-15        # Réservations d'une date
GET    /reservations/?salle_id=1             # Réservations d'une salle
```


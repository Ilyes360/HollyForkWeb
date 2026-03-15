# App Salles

## Description
Gestion des salles et des tables dans les restaurants du système Holly PI. Permet d'organiser l'espace de restauration et de suivre l'occupation des tables.

## Modèles de données

### Salle
```python
{
    "id": Integer (auto-généré),
    "nom_salle": String (max 100 caractères),
    "restaurant": ForeignKey(Restaurant),
    "capacite": Integer (nombre de couverts),
    "etage": Integer (défaut: 0),
    "description": String (optionnel)
}
```

### Table
```python
{
    "id": Integer (auto-généré),
    "numero": Integer (numéro de la table),
    "capacity": Integer (nombre de places),
    "reserved_seats": Integer (places réservées),
    "salle": ForeignKey(Salle),
    "employee_in_charge": ForeignKey(Employe),
    "is_occupied": Boolean (défaut: False),
    "position_x": Integer (position X dans le plan, défaut: 0),
    "position_y": Integer (position Y dans le plan, défaut: 0)
}
```

## Contraintes

### Salle
- **unique_together** : `(restaurant, nom_salle)`
  - Un nom de salle est unique par restaurant
  - Permet d'avoir "Terrasse" dans plusieurs restaurants

### Table
- **unique_together** : `(salle, numero)`
  - Un numéro de table est unique par salle
  - Permet d'avoir "Table 1" dans chaque salle

## Gestion de l'occupation

### État d'une table
```python
is_occupied = True   # Table occupée (commande en cours)
is_occupied = False  # Table disponible
```

### Mise à jour automatique
L'occupation est gérée automatiquement par l'app `commandes` :

```python
# Lors de la création d'une commande
commande = Commande(table=table, ...)
commande.save()
# → table.is_occupied = True

# Lors de la validation/annulation
commande.statut = 'VALIDEE'
commande.save()
# → table.is_occupied = False
```

## Gestion des réservations

### Places réservées
Le champ `reserved_seats` permet de gérer les réservations :
```python
# Réserver 4 places sur une table de 6
table.reserved_seats = 4
table.save()

# Places disponibles
places_disponibles = table.capacity - table.reserved_seats
```

### Vérifier la disponibilité
```python
def is_available(nb_personnes):
    return (
        not table.is_occupied and 
        (table.capacity - table.reserved_seats) >= nb_personnes
    )
```

## Positionnement des tables

### Système de coordonnées
Les champs `position_x` et `position_y` permettent de créer un plan de salle :

```
      0   100  200  300  400
    +----+----+----+----+----+
  0 |    | T1 |    | T2 |    |
    +----+----+----+----+----+
100 |    |    |    |    |    |
    +----+----+----+----+----+
200 | T3 |    |    |    | T4 |
    +----+----+----+----+----+
```

### Exemple
```python
# Table 1 : Haut gauche
Table(numero=1, position_x=100, position_y=0)

# Table 2 : Haut droite
Table(numero=2, position_x=300, position_y=0)

# Table 3 : Bas gauche
Table(numero=3, position_x=0, position_y=200)

# Table 4 : Bas droite
Table(numero=4, position_x=400, position_y=200)
```

## Assignation des employés

### Responsable de table
Chaque table est assignée à un employé (`employee_in_charge`) :
- Serveur principal pour cette table
- Responsable de la prise de commande
- Contact pour le suivi de la table

### Rotation des assignations
```python
def reassign_tables(salle_id, employe_id):
    """Réassigner toutes les tables d'une salle à un employé"""
    Table.objects.filter(salle_id=salle_id).update(
        employee_in_charge_id=employe_id
    )
```

## Calcul de capacité

### Capacité d'une salle
```python
@property
def capacite_totale(self):
    """Capacité totale calculée à partir des tables"""
    return self.tables.aggregate(
        total=Sum('capacity')
    )['total'] or 0
```

### Tables disponibles
```python
def tables_disponibles(self):
    """Nombre de tables disponibles dans la salle"""
    return self.tables.filter(is_occupied=False).count()
```

### Places disponibles
```python
def places_disponibles(self):
    """Nombre de places disponibles dans la salle"""
    return self.tables.filter(is_occupied=False).aggregate(
        total=Sum('capacity')
    )['total'] or 0
```

## Étages

Le champ `etage` permet d'organiser les salles sur plusieurs niveaux :
- **0** : Rez-de-chaussée
- **1** : Premier étage
- **-1** : Sous-sol

### Exemple
```python
Salle(nom_salle="Salle principale", etage=0)
Salle(nom_salle="Terrasse", etage=0)
Salle(nom_salle="Salon privé", etage=1)
Salle(nom_salle="Cave", etage=-1)
```

## Méthode to_dict()

### Salle
```python
{
    "id": 1,
    "nom": "Salle principale",
    "restaurant": {...},
    "capacite": 40,
    "etage": 0,
    "description": "Grande salle avec vue"
}
```

## Cas d'usage

### 1. Créer un restaurant avec salles et tables
```python
# Créer le restaurant
restaurant = Restaurant.objects.create(...)

# Créer une salle
salle = Salle.objects.create(
    nom_salle="Salle principale",
    restaurant=restaurant,
    capacite=40,
    etage=0
)

# Créer les tables
for i in range(1, 11):
    Table.objects.create(
        numero=i,
        capacity=4,
        salle=salle,
        employee_in_charge=employe,
        position_x=(i % 5) * 100,
        position_y=(i // 5) * 100
    )
```

### 2. Trouver une table disponible
```python
def trouver_table_disponible(salle_id, nb_personnes):
    return Table.objects.filter(
        salle_id=salle_id,
        is_occupied=False,
        capacity__gte=nb_personnes
    ).order_by('capacity').first()
```

### 3. État des tables d'une salle
```python
def etat_salle(salle_id):
    tables = Table.objects.filter(salle_id=salle_id)
    return {
        'total': tables.count(),
        'occupees': tables.filter(is_occupied=True).count(),
        'disponibles': tables.filter(is_occupied=False).count(),
        'capacite_totale': tables.aggregate(Sum('capacity'))['capacity__sum']
    }
```

### 4. Plan de salle interactif
```python
def get_plan_salle(salle_id):
    tables = Table.objects.filter(salle_id=salle_id).select_related(
        'employee_in_charge'
    )
    
    return [{
        'numero': t.numero,
        'x': t.position_x,
        'y': t.position_y,
        'capacity': t.capacity,
        'is_occupied': t.is_occupied,
        'serveur': t.employee_in_charge.prenom
    } for t in tables]
```

## Relations avec d'autres apps

### Commandes
- Une `Commande` peut être liée à une `Table`
- Gestion automatique de `is_occupied`

### Reservations
- Une `Reservation` est liée à une `Salle`
- Permet de bloquer des places (`reserved_seats`)

### Staff
- Chaque `Table` est assignée à un `Employe`
- Permet de répartir le service

## Notes importantes

1. **Contraintes uniques** : Attention aux noms de salle et numéros de table
2. **Occupation automatique** : Géré par l'app commandes, ne pas modifier manuellement
3. **Positions** : Utilisez des coordonnées cohérentes pour le plan de salle
4. **Capacité** : La capacité de la salle est informative, les tables font autorité
5. **Étages** : Utilisez des valeurs cohérentes (0, 1, 2, -1, etc.)


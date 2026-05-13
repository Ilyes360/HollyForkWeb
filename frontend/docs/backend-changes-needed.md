# Modifications backend nécessaires

## 1. Table : `employee_in_charge_id` optionnel

**Fichier** : `apps/salles/serializers.py` (ou équivalent)

**Modif** : rendre `employee_in_charge_id` nullable et non-requis dans le serializer de création de table.

```python
# Avant
employee_in_charge_id = serializers.PrimaryKeyRelatedField(queryset=Employe.objects.all())

# Après
employee_in_charge_id = serializers.PrimaryKeyRelatedField(
    queryset=Employe.objects.all(),
    required=False,
    allow_null=True
)
```

Et dans le modèle si pas déjà fait :
```python
employee_in_charge = models.ForeignKey(Employe, null=True, blank=True, on_delete=models.SET_NULL)
```

**Raison** : l'éditeur de plan de salle crée des tables sans assignation de serveur. L'assignation se fait au moment du service, pas à la création du plan.

---

## 2. Salle : ajouter un champ `metadata` (optionnel, pour plus tard)

**Fichier** : `apps/salles/models.py`

```python
metadata = models.JSONField(default=dict, blank=True)
```

**Raison** : stocker les données visuelles du plan Konva (points des polygones, couleurs, opacité, positions des murs/décorations). Sans ça, le plan 2D est perdu au reload — seules les tables et salles sont persistées, pas le dessin.

**Pas bloquant** pour le branchement initial — c'est un nice-to-have pour persister le plan complet.

---

## 3. Restaurant : PUT/PATCH ne sauvegarde pas les modifications (BUG)

**Fichier** : `apps/restaurant/views.py` (ou le ViewSet restaurants)

**Symptôme** : `PATCH /api/restaurants/1/ {"name": "Nouveau nom"}` retourne 200 mais le GET suivant retourne l'ancien nom. Idem avec PUT.

**Cause probable** : le serializer ou la vue n'appelle pas `serializer.save()`, ou le `perform_update` est overridé sans appeler `super()`.

**Vérification** :
```python
# Dans le ViewSet, s'assurer que update/partial_update appellent save :
class RestaurantViewSet(ModelViewSet):
    def perform_update(self, serializer):
        serializer.save()  # ← doit être présent
```

**Impact** : la modification d'établissement depuis le front ne persiste pas. Création et suppression fonctionnent.

---

## 4. Restaurant : ajouter des champs manquants (optionnel)

Les champs suivants n'existent pas dans l'API mais sont utiles côté front :
- `is_active` (boolean) — statut ouvert/fermé
- `capacity` (integer) — nombre de couverts total
- `tva_number` (string) — numéro de TVA
- `email` (string) — email de contact
- `opening_days` (JSON array) — jours d'ouverture
- `services` (JSON array) — créneaux midi/soir avec horaires

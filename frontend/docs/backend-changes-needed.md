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

---

## 5. Planning shifts : POST crash avec `KeyError: 'start_date'` (BUG)

**Fichier** : `apps/planning/views.py` (ou le ViewSet shifts)

**Symptôme** : `POST /api/planning/shifts/` avec body `{"employe_id":1,"restaurant_id":10,"start_date":"...","end_date":"..."}` retourne 500 avec `KeyError: 'start_date'`.

**Cause** : la vue accède directement à `request.data['start_date']` au lieu d'utiliser le serializer validé (`serializer.validated_data`).

**Fix** :
```python
# Avant (bugué)
def create(self, request):
    start = request.data['start_date']  # ← KeyError si le champ est dans validated_data

# Après
def create(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    self.perform_create(serializer)
    return Response(serializer.data, status=201)
```

**Impact** : impossible de créer des shifts depuis le front. Le drag & drop dans l'éditeur de planning ne persiste pas.

---

## 6. Ingredients : POST crash avec `KeyError: 'name'` (BUG)

**Fichier** : `apps/inventory/views.py` (ou le ViewSet ingredients)

**Symptôme** : `POST /api/ingredients/` avec body `{"name":"...","unit":"kg","unit_price":"5.00"}` retourne 500 avec `KeyError: 'name'`.

**Cause** : même pattern que le bug #5 — la vue accède à `request.data['name']` au lieu de `serializer.validated_data`.

**Impact** : impossible de créer des ingrédients/produits depuis le front.

---

## 7. Restaurant : champs supplémentaires (optionnel)

Les champs suivants n'existent pas dans l'API mais sont utiles côté front :
- `is_active` (boolean) — statut ouvert/fermé
- `capacity` (integer) — nombre de couverts total
- `tva_number` (string) — numéro de TVA
- `email` (string) — email de contact
- `opening_days` (JSON array) — jours d'ouverture
- `services` (JSON array) — créneaux midi/soir avec horaires

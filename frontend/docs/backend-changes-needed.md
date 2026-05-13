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

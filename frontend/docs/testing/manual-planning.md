# Test manuel — Planning

> URL : `app.hollyfork.fr/planning` | Connecte requis | Desktop uniquement

## 1. Affichage

- Aller sur `/planning`
- → Grille planning de la semaine visible
- Naviguer semaine precedente / suivante
- Verifier les noms des employes a gauche
- Verifier les creneaux midi / soir

## 2. Creer un shift

- Cliquer sur une cellule vide
- → Popover ou dialog de creation
- Selectionner employe, horaires, service
- → Shift apparait dans la grille

## 3. Modifier un shift

- Cliquer sur un shift existant
- → Popover avec details
- Modifier les horaires
- → Mise a jour visuelle

## 4. Drag & drop (si disponible)

- Deplacer un shift d'une cellule a une autre
- → Shift se repositionne
- Verifier le dialog "Modifications non sauvegardees" si on quitte sans sauver

## 5. Vue consultation

- Passer en mode lecture seule (si toggle disponible)
- → Grille non editable, pas de drag & drop
- Resume du jour visible

## Verification visuelle

- [ ] Heures affichees correctement
- [ ] Indicateur effectif par service
- [ ] Jour actuel mis en evidence
- [ ] Gate mobile → message "Desktop uniquement" sur petit ecran

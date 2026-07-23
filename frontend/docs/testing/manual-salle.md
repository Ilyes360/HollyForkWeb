# Test manuel — Plan de salle

> URL : `app.hollyfork.fr/salle` | Connecte requis | Desktop uniquement

## 1. Vue consultation

- Aller sur `/salle`
- → Plan de salle visible (canvas)
- Verifier les tables, murs, zones affichees
- Cliquer sur une table → popover avec infos (numero, places)

## 2. Mode edition

- Passer en mode edition (si bouton disponible)
- Ajouter une table depuis la palette
- Deplacer une table (drag)
- Redimensionner une table
- Sauvegarder → persiste apres refresh

## 3. Gestion des salles

- Verifier la liste des salles (si multi-salles)
- Changer de salle → le plan se met a jour

## 4. Modifications non sauvegardees

- Modifier le plan (ajouter/deplacer une table)
- Quitter la page sans sauver
- → Dialog "Modifications non sauvegardees"

## Verification visuelle

- [ ] Canvas Konva charge sans erreur
- [ ] Grille de fond visible en edition
- [ ] Snap/alignement fonctionne (guides)
- [ ] Minimap visible (si disponible)
- [ ] Gate mobile → message "Desktop uniquement"

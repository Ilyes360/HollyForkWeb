# Test manuel — Carte / Menu

> URL : `app.hollyfork.fr/cuisine` | Connecte requis

## 1. Affichage

- Aller sur `/cuisine`
- → Articles/recettes groupes par categorie
- Verifier les filtres (categorie, recherche)
- Verifier les KPIs (nombre d'articles, cout matiere moyen)

## 2. Creer un article

- Cliquer "Ajouter une recette"
- → Dialog de creation
- Remplir : nom, categorie, prix de vente
- Ajouter des ingredients (combobox recherche)
- → Article apparait dans la liste

## 3. Detail article

- Cliquer sur une carte recette
- → Modale detail avec ingredients, cout matiere, marge
- Modifier les ingredients → recalcul du cout

## 4. Vue operationnelle (si disponible)

- Passer en vue operationnelle (mode POS)
- → Navigation par categorie, cards produit simplifiees
- Breadcrumb fonctionnel

## Verification visuelle

- [ ] Prix en euros format francais
- [ ] Couleur food cost (vert < 30%, orange 30-40%, rouge > 40%)
- [ ] Images recettes affichees (si presentes)

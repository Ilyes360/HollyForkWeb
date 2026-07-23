# Test manuel — Stocks

> URL : `app.hollyfork.fr/stocks` | Connecte requis

## 1. Affichage et filtres

- Aller sur `/stocks`
- → Liste des produits en stock visible
- Filtrer par statut (Rupture, Stock faible, Stock OK, Surstock) → tableau filtre
- Filtrer par categorie → tableau filtre
- Rechercher par nom de produit → lignes filtrees
- Verifier les badges statut (couleurs correctes)

## 2. Ajuster un stock

- Cliquer sur un produit → detail
- Ajuster la quantite (ajout ou retrait)
- → Quantite mise a jour
- Rafraichir la page → quantite persistee

## 3. Creer un stock

- Cliquer "Ajouter un produit" (si bouton disponible)
- Remplir le formulaire (ingredient, quantite, seuil alerte)
- → Produit apparait dans la liste

## 4. Alertes stock

- Verifier qu'un produit en rupture ou stock faible affiche une alerte visuelle
- Verifier le compteur d'alertes (si present dans le header)

## Verification visuelle

- [ ] Barres de progression stock coherentes (0% = rupture, 100% = max)
- [ ] Prix affiches en euros avec format francais
- [ ] Vue par zone / par urgence fonctionnelle (si toggle disponible)

# Test manuel — Commandes fournisseurs

> URL : `app.hollyfork.fr/commandes` | Connecte requis

## 1. Affichage

- Aller sur `/commandes`
- → Liste des commandes fournisseurs visible
- Verifier les badges statut (En cours, Livree, Annulee)
- Verifier le resume (total commandes, montant)

## 2. Creer une commande

- Cliquer "Nouvelle commande"
- → Dialog de creation
- Selectionner un fournisseur
- Ajouter des lignes (produit, quantite, prix)
- Valider → commande apparait dans la liste

## 3. Recevoir une commande

- Cliquer sur une commande en cours
- Marquer comme recue / livree
- → Statut passe a "Livree"

## 4. Fournisseurs

- Verifier la liste des fournisseurs
- Creer un nouveau fournisseur (nom, contact, email, telephone)
- → Fournisseur disponible dans le select de creation commande

## Verification visuelle

- [ ] Montants en euros format francais
- [ ] Statuts colores (orange en cours, vert livree, rouge annulee)
- [ ] Historique des commandes lisible

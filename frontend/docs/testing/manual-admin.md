# Test manuel — Administration

> URL : `app.hollyfork.fr/admin` | Connecte requis | Permissions admin

## 1. Etablissements

- Aller sur `/admin/etablissements`
- → Liste des etablissements
- Cliquer sur un etablissement → page detail avec infos (nom, adresse, SIRET)
- Modifier un champ, sauvegarder → persiste apres refresh
- Creer un nouvel etablissement → apparait dans la liste

## 2. Employes

- Aller sur `/admin/employes`
- → Tableau des employes avec type, etablissement
- Cliquer sur un employe → fiche detail
- Creer un employe avec compte utilisateur → credentials affiches (email, mot de passe, PIN)
- Creer un employe sans compte → pas de PIN genere

## 3. Roles

- Aller sur `/admin/roles`
- → Liste des roles avec permissions
- Verifier la hierarchie des roles

## Verification visuelle

- [ ] SIRET formate (14 chiffres)
- [ ] Adresses completes (rue, CP, ville)
- [ ] Types employes affiches

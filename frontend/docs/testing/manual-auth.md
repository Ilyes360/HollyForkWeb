# Test manuel — Auth

> URL : `app.hollyfork.fr/login`

## 1. Login classique

- Aller sur `/login`
- Saisir email + mot de passe valides
- → Redirection dashboard
- Rafraichir la page → reste connecte

## 2. Identifiants invalides

- Saisir email valide + mauvais mot de passe → message d'erreur, pas de redirection
- Saisir email inexistant → message d'erreur generique (pas "utilisateur introuvable")

## 3. Logout

- Connecte sur le dashboard
- Menu utilisateur > Deconnexion
- → Redirection `/login`
- Bouton retour navigateur → ne revient PAS sur le dashboard

## 4. Token expire

- Connecte sur le dashboard
- DevTools > Application > Local Storage > supprimer `holy_access_token`
- Naviguer vers une autre page
- → Refresh token auto OU redirection login si refresh echoue

## Verification visuelle

- [ ] Formulaire en francais
- [ ] Champ mot de passe masque
- [ ] Bouton submit desactive pendant le chargement
- [ ] Lien vers `/device` visible ("Connexion tablette")

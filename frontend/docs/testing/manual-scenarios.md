# Scenarios de test manuel

> Complement aux tests automatises. A executer apres chaque mise en prod d'une feature concernee.
>
> Derniere execution : —
>
> Donnees de test VPS (app.hollyfork.fr) :
> - Restaurant ID `2` — "LOMB", PIN resto `951001`
> - Employe : Nicolas ROUVROY, PIN employe `1031`

---

## 1. Device Login

> Tests auto : 34 (couches 0-1-2-4) — voir [auth.md](auth.md)
>
> Les tests auto couvrent le rendu des composants, la validation Zod, les appels API via MSW.
> Les tests manuels ci-dessous verifient le **flow reel de bout en bout** contre le backend.

### 1.1 Happy path complet

| # | Action | Attendu |
|---|--------|---------|
| 1 | Ouvrir `app.hollyfork.fr/device` (sans etre connecte) | Ecran "Configurer l'appareil" visible, champ Restaurant + PIN pad 6 chiffres |
| 2 | Saisir `2` dans le champ Restaurant | Champ accepte la valeur |
| 3 | Taper `9` `5` `1` `0` `0` `1` sur le PIN pad | Spinner "Verification..." puis transition vers ecran suivant |
| 4 | Verifier l'ecran selection employe | Titre "Qui etes-vous ?", sous-titre "LOMB", au moins Nicolas ROUVROY visible |
| 5 | Cliquer sur Nicolas ROUVROY | Transition vers ecran PIN employe (4 chiffres), avatar + nom affiches |
| 6 | Taper `1` `0` `3` `1` | Redirection vers le dashboard, utilisateur connecte |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.2 PIN restaurant invalide

| # | Action | Attendu |
|---|--------|---------|
| 1 | Aller sur `/device`, saisir ID `2` | — |
| 2 | Taper `0` `0` `0` `0` `0` `0` | Message "Restaurant ou PIN incorrect", PIN se vide, on reste sur le meme ecran |
| 3 | Retaper un PIN valide `9` `5` `1` `0` `0` `1` | Fonctionne normalement, passage a la selection employe |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.3 PIN employe invalide

| # | Action | Attendu |
|---|--------|---------|
| 1 | Arriver a l'ecran PIN employe (apres selection Nicolas) | — |
| 2 | Taper `0` `0` `0` `0` | Message "PIN incorrect", PIN se vide, on reste sur l'ecran PIN |
| 3 | Taper le bon PIN `1` `0` `3` `1` | Connexion reussie |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.4 Restaurant ID invalide

| # | Action | Attendu |
|---|--------|---------|
| 1 | Aller sur `/device`, saisir ID `99999` | — |
| 2 | Taper n'importe quel PIN 6 chiffres | Message d'erreur (400), pas de crash |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.5 Navigation retour

| # | Action | Attendu |
|---|--------|---------|
| 1 | Arriver a l'ecran selection employe | — |
| 2 | Cliquer "Changer d'etablissement" | Retour ecran setup, champ ID vide |
| 3 | Refaire le setup, arriver a l'ecran PIN employe | — |
| 4 | Cliquer "Retour" | Retour a la liste employes |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.6 Persistance device token (refresh page)

| # | Action | Attendu |
|---|--------|---------|
| 1 | Faire le setup restaurant (etape 1 OK) | Arrive sur la selection employe |
| 2 | Rafraichir la page (F5 / Cmd+R) | On revient directement sur la selection employe (pas l'ecran setup) car le deviceToken est en localStorage |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.7 Acces depuis un compte connecte

| # | Action | Attendu |
|---|--------|---------|
| 1 | Se connecter via `/login` avec un compte classique | Dashboard visible |
| 2 | Aller manuellement sur `/device` | La page device login s'affiche (route hors guards) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.8 Employe sans PIN

| # | Action | Attendu |
|---|--------|---------|
| 1 | Arriver a la selection employe | — |
| 2 | Chercher un employe sans PIN (si il en existe un) | Le bouton est grise, tooltip "Cet employe n'a pas de PIN configure" |
| 3 | Cliquer dessus | Rien ne se passe (disabled) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 1.9 Verification visuelle

- [ ] Labels en francais partout
- [ ] Boutons du PIN pad assez gros pour une tablette (tactile)
- [ ] Focus ring visible au clavier (Tab entre les boutons)
- [ ] Pas de layout shift / flash entre les etapes
- [ ] Lien "Connexion classique" en bas redirige vers `/login`
- [ ] Theme switch (soleil/lune) fonctionne en haut a droite
- [ ] Image decorative visible sur desktop (panneau gauche)

---

## 2. Auth Login/Register

> Tests auto : 8 (hooks + store) — voir [auth.md](auth.md)
>
> Tests auto a venir : composants login/register (passe B)

### 2.1 Login classique

| # | Action | Attendu |
|---|--------|---------|
| 1 | Aller sur `/login` | Formulaire email + mot de passe |
| 2 | Saisir des identifiants valides | Redirection vers le dashboard |
| 3 | Rafraichir la page | On reste connecte (tokens en localStorage) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 2.2 Login — identifiants invalides

| # | Action | Attendu |
|---|--------|---------|
| 1 | Saisir un email valide + mauvais mot de passe | Message d'erreur, pas de redirection |
| 2 | Saisir un email inexistant | Message d'erreur generique (pas "utilisateur introuvable") |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 2.3 Logout

| # | Action | Attendu |
|---|--------|---------|
| 1 | Etre connecte sur le dashboard | — |
| 2 | Cliquer sur le menu utilisateur > Deconnexion | Redirection vers `/login`, tokens supprimes |
| 3 | Appuyer sur retour navigateur | On ne revient PAS sur le dashboard (guard redirige vers login) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 2.4 Token expire

| # | Action | Attendu |
|---|--------|---------|
| 1 | Etre connecte | — |
| 2 | Dans les DevTools > Application > Local Storage, supprimer `holy_access_token` | — |
| 3 | Naviguer vers une autre page | Refresh token automatique OU redirection vers login si refresh echoue |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

---

## 3. Reservations

> Tests auto : 69 (mapping 19 + hooks 6 + composants 44) — voir [reservations.md](reservations.md)
>
> Les composants NewReservationDialog, ReservationDetail, ReservationsTable sont testes.
> Le test manuel verifie le flow complet avec le vrai backend.

### 3.1 Affichage des reservations

| # | Action | Attendu |
|---|--------|---------|
| 1 | Aller sur `/reservations` | Tableau des reservations du jour visible |
| 2 | Verifier les onglets Midi / Soir | Le contenu change selon le service |
| 3 | Verifier les filtres de statut (Tous, Confirmees, En attente, Arrivees) | Le tableau se filtre |
| 4 | Taper un nom dans la recherche | Seules les reservations correspondantes apparaissent |
| 5 | Cliquer sur un en-tete de colonne (Client, Heure, Couverts) | Le tri change (asc/desc) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 3.2 Creer une reservation

| # | Action | Attendu |
|---|--------|---------|
| 1 | Cliquer "Nouvelle reservation" | Dialog avec formulaire |
| 2 | Remplir : nom (2+ chars), telephone (10+ chars), couverts, date, heure | Champs valides |
| 3 | Cliquer "Creer la reservation" | Dialog se ferme, la reservation apparait dans le tableau |
| 4 | Soumettre avec nom vide | Message "Le nom est requis" |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 3.3 Detail reservation

| # | Action | Attendu |
|---|--------|---------|
| 1 | Cliquer sur une ligne du tableau | Sheet lateral s'ouvre avec les details |
| 2 | Verifier infos : nom, telephone, email, couverts, table, canal, heure | Toutes les infos presentes |
| 3 | Modifier les notes, cliquer "Enregistrer les notes" | Notes sauvegardees (verifier apres refresh) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 3.4 Supprimer une reservation

| # | Action | Attendu |
|---|--------|---------|
| 1 | Ouvrir le detail d'une reservation | — |
| 2 | Cliquer "Supprimer la reservation" | Dialog de confirmation |
| 3 | Cliquer "Supprimer" | Reservation disparait du tableau |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 3.5 Bug connu — Statut non persiste

| # | Action | Attendu (bug actuel) |
|---|--------|---------|
| 1 | Changer le statut d'une reservation (Confirmer, Arrivee, Annuler) | Le badge change visuellement |
| 2 | Rafraichir la page | **Le statut revient a sa valeur d'avant** — c'est le bug documente (localOverrides, pas de champ statut backend) |

**Resultat** : [ ] Bug confirme  [ ] Bug corrige — Notes : ___

---

## 4. Stocks

> Tests auto : 46 (mapping 22 + hooks 24) — voir [stocks.md](stocks.md)
>
> Composants et utils non testes pour l'instant.

### 4.1 Affichage des stocks

| # | Action | Attendu |
|---|--------|---------|
| 1 | Aller sur `/stocks` | Liste des produits en stock visible |
| 2 | Verifier les filtres (statut, categorie) | Le contenu se filtre |
| 3 | Verifier la recherche | Filtrage par nom de produit |
| 4 | Verifier les badges de statut (Rupture, Stock faible, Stock OK, Surstock) | Couleurs correctes |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 4.2 Ajuster un stock

| # | Action | Attendu |
|---|--------|---------|
| 1 | Cliquer sur un produit | Detail du produit |
| 2 | Ajuster la quantite (ajout ou retrait) | La quantite se met a jour |
| 3 | Rafraichir la page | La nouvelle quantite est persistee |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

---

## 5. Commandes

> Tests auto : 0 — voir [commandes.md](commandes.md)
>
> Feature entierement non testee. Test manuel essentiel.

### 5.1 Affichage

| # | Action | Attendu |
|---|--------|---------|
| 1 | Aller sur `/commandes` | Liste des commandes fournisseurs visible |
| 2 | Verifier les statuts | Badges corrects (En cours, Livree, Annulee) |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

### 5.2 Creer une commande

| # | Action | Attendu |
|---|--------|---------|
| 1 | Cliquer "Nouvelle commande" | Dialog de creation |
| 2 | Selectionner un fournisseur, ajouter des lignes | Formulaire fonctionnel |
| 3 | Valider | La commande apparait dans la liste |

**Resultat** : [ ] OK  [ ] KO — Notes : ___

---

## Grille de synthese

| Feature | Tests auto | Scenarios manuels | Derniere exec | Resultat |
|---------|-----------|-------------------|---------------|----------|
| Device Login | 34 | 1.1 → 1.9 | — | — |
| Auth | 8 | 2.1 → 2.4 | — | — |
| Reservations | 69 | 3.1 → 3.5 | — | — |
| Stocks | 46 | 4.1 → 4.2 | — | — |
| Commandes | 0 | 5.1 → 5.2 | — | — |
| Carte | 0 | a rediger | — | — |
| Planning | 0 | a rediger | — | — |
| Admin | 0 | a rediger | — | — |
| Dashboard | 0 | a rediger | — | — |
| Salle | 0 | a rediger | — | — |

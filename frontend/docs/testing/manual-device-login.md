# Test manuel — Device Login

> URL : `app.hollyfork.fr/device` | Pas besoin d'etre connecte
>
> Donnees test : Restaurant ID `2`, PIN resto `951001`, Employe Nicolas ROUVROY, PIN employe `1031`

## 1. Connexion complete

- Ouvrir `/device`
- Saisir ID `2`, taper PIN `951001`
- → Ecran selection employe, "LOMB" affiche
- Cliquer Nicolas ROUVROY
- → Ecran PIN employe 4 chiffres
- Taper `1031`
- → Redirection dashboard, connecte

## 2. Mauvais PIN restaurant

- Saisir ID `2`, taper `000000`
- → Message "Restaurant ou PIN incorrect", PIN se vide, reste sur l'ecran

## 3. Mauvais PIN employe

- Arriver a l'ecran PIN employe (apres etapes 1-5 du flow 1)
- Taper `0000`
- → Message "PIN incorrect", PIN se vide, reste sur l'ecran

## 4. Restaurant inexistant

- Saisir ID `99999`, taper n'importe quel PIN
- → Message d'erreur, pas de crash

## 5. Retour arriere

- Sur l'ecran selection employe → cliquer "Changer d'etablissement" → retour ecran setup
- Sur l'ecran PIN employe → cliquer "Retour" → retour liste employes

## 6. Persistance apres refresh

- Faire le setup restaurant (ID + PIN OK)
- Rafraichir la page (F5)
- → On revient sur la selection employe (pas l'ecran setup)

## 7. Employe sans PIN

- Sur la selection employe, chercher un employe grise
- → Tooltip "Cet employe n'a pas de PIN configure", clic impossible

## 8. Acces depuis un compte connecte

- Se connecter via `/login`
- Aller sur `/device`
- → La page s'affiche quand meme

## Verification visuelle

- [ ] Labels en francais
- [ ] PIN pad tactile (taille suffisante tablette)
- [ ] Focus ring visible au Tab
- [ ] Pas de flash entre les etapes
- [ ] Lien "Connexion classique" → `/login`

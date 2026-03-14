# Documentation des routes API – Backend HollyFork

Toutes les routes sont préfixées par `/api/` (sauf indication contraire). L’authentification se fait par token : header `Authorization: Token <token>`.

---

## 1. Racine et tableau de bord

- **GET** `/api/` — Racine de l’API : message de bienvenue et version.

- **GET** `/api/dashboard/` — Données du tableau de bord : KPIs, réservations, commandes fournisseur, équipe, ventes par catégorie, etc. (réservations et commandes fournisseur depuis la BDD si présentes, sinon valeurs par défaut).

---

## 2. Authentification et profil

- **POST** `/api/auth/register/` — Inscription : email + mot de passe. Crée l’utilisateur et le profil, retourne un token et l’email.

- **POST** `/api/auth/login/` — Connexion : email + mot de passe. Retourne un token et les infos utilisateur ; si MFA activé, retourne `requires_mfa`, `temp_token` et email (il faut ensuite appeler `verify-mfa`).

- **POST** `/api/auth/logout/` — Déconnexion : supprime le token (session invalidée).

- **GET** `/api/auth/me/` — Utilisateur courant : email, prénom, nom, `role_id`, `salle_id` (depuis le profil).

- **GET** `/api/auth/profile/` — Récupère le profil (role, salle, etc.) + email, first_name, last_name.

- **PATCH** `/api/auth/profile/` — Met à jour le profil (role, salle).

- **POST** `/api/auth/delete-account/` — Suppression définitive du compte de l’utilisateur connecté.

- **POST** `/api/auth/verify-mfa/` — Vérification du code TOTP après login MFA. Corps : `temp_token`, `code`. Retourne le token d’auth et les infos utilisateur.

- **POST** `/api/auth/mfa/setup/` — Génère un secret TOTP et l’URL otpauth (QR). N’active pas le MFA tant que `mfa/confirm` n’est pas appelé.

- **POST** `/api/auth/mfa/confirm/` — Vérifie le code TOTP et active le MFA pour l’utilisateur. Corps : `code`.

- **POST** `/api/auth/mfa/disable/` — Désactive le MFA. Corps : `password` pour confirmer.

- **GET** `/api/auth/mfa/status/` — Indique si le MFA est activé pour l’utilisateur courant.

---

## 3. Planning (semaine)

- **GET** `/api/planning/week/` — Récupère la semaine de planning. Query : `?date=YYYY-MM-DD` (optionnel), `?salle=<id>` (optionnel). Retourne employés, créneaux (shifts) par jour, capacités (midi/soir), alertes de sous-effectifs.

- **POST** `/api/planning/week/` — Enregistre les créneaux de la semaine. Corps : `weekStart` (YYYY-MM-DD), `salle_id` (optionnel), `shifts: [{ employee_id, day, type, start, end }]`. Remplace les shifts existants pour la semaine.

- **POST** `/api/planning/week/copy/` — Copie le planning d’une semaine vers une autre. Corps : `source_date` et `target_date` (ou `weekStart` et `target_week_start`) au format YYYY-MM-DD. Même salle/employés.

---

## 4. Cartes de salle (Maps)

- **GET** `/api/maps/` — Liste des cartes de salle de l’utilisateur connecté.

- **POST** `/api/maps/` — Création d’une carte (liée à l’utilisateur et éventuellement à sa salle du profil).

- **GET** `/api/maps/<id>/` — Détail d’une carte (si elle appartient à l’utilisateur).

- **PUT** / **PATCH** `/api/maps/<id>/` — Mise à jour d’une carte.

- **DELETE** `/api/maps/<id>/` — Suppression d’une carte.

---

## 5. Ressources CRUD (ViewSets)

Chaque ressource expose les actions REST standard : **GET** liste, **POST** création, **GET** détail, **PUT** / **PATCH** mise à jour, **DELETE** suppression (sauf si indiqué autrement). Filtrage optionnel par `?salle=<id>` ou par salle du profil selon les endpoints.

### Salles, rôles, tables, clients

- `/api/salles/` — Salles : lieux/établissements. CRUD complet.

- `/api/roles/` — Rôles : rôles métier (ex. serveur, chef). CRUD complet.

- `/api/tables/` — Tables : tables d’un établissement. CRUD complet.

- `/api/clients/` — Clients : nom, prénom, salle, etc. CRUD complet.

### Réservations

- `/api/reservations/` — Réservations. CRUD. Champs : client, date_reservation, heure_reservation, nombre_personnes, statut_reservation, **canal** (site, telephone, thefork, autre), notes, salle. **Détail** inclut la liste **tables** (id, numero_table, capacite_table). **Filtres** : `?salle=`, `?statut=`, `?client=`, `?date_from=YYYY-MM-DD`, `?date_to=YYYY-MM-DD`. Validation : le client doit être de la même salle que la réservation.

- **GET** `/api/reservations/today/` — Réservations du jour (optionnel `?salle=<id>`).

- **GET** `/api/reservations/by-date/` — Réservations à une date donnée. Query obligatoire : `?date=YYYY-MM-DD` (et optionnel `?salle=<id>`).

- **POST** `/api/reservations/<id>/confirmer/` — Met le statut à « Confirmée ». Refus si déjà annulée.

- **POST** `/api/reservations/<id>/annuler/` — Met le statut à « Annulée ».

- **POST** `/api/reservations/<id>/marquer-arrivee/` — Met le statut à « Arrivée ». Refus si annulée.

- **GET** `/api/reservations/<id>/tables/` — Liste des tables assignées à la réservation.

- **POST** `/api/reservations/<id>/tables/` — Ajouter une table. Corps : `{ "table": <id> }`. Même salle, capacité suffisante pour les couverts, pas de chevauchement (même table, même jour, créneau 2 h).

- **DELETE** `/api/reservations/<id>/tables/?table=<id>` — Retirer une table de la réservation.

- **GET** `/api/reservations/creneaux-disponibles/?date=YYYY-MM-DD&salle=<id>&couverts=<n>` — Créneaux avec tables disponibles (pas de résa sur la plage 2 h). Optionnel `couverts` : ne garde que les tables de capacité ≥ n.

### Menus, plats, formules

- `/api/menus/` — Menus (carte). CRUD complet. **GET détail** inclut la liste `plats` (id, nom_plat, prix_plat).

- **GET** `/api/menus/<id>/plats/` — Liste des plats du menu.

- **POST** `/api/menus/<id>/plats/` — Ajouter un plat au menu. Corps : `{ "plat": <id> }`. Le plat doit être de la même salle que le menu.

- **DELETE** `/api/menus/<id>/plats/?plat=<id>` — Retirer un plat du menu.

- `/api/groupes-menu/` — Groupes de menus (ex. entrées, plats). CRUD complet.

- `/api/plats/` — Plats. CRUD complet.

- `/api/formules/` — Formules (menu à prix fixe). CRUD complet.

### Stock ingrédients

- `/api/stock/` — Ingrédients (stock). CRUD. Filtrage par `?salle=<id>` ou salle du profil.

- **PATCH** `/api/stock/<id>/stock/` — Ajuster le stock d’un ingrédient. Corps : `quantity` (valeur absolue) ou `delta` (variation). Retourne `stock_actuel`.

- `/api/stock-movements/` — Mouvements de stock (ingrédients). Liste / création. Filtrage par `?ingredient=<id>`. Pas de update/delete. La création peut mettre à jour le stock selon la logique métier.

### Fournisseurs et commandes fournisseur

- `/api/fournisseurs/` — Fournisseurs par salle. CRUD. Filtrage par `?salle=<id>` ou salle du profil.

- `/api/commandes-fournisseur/` — Commandes fournisseur (fournisseur, salle, statut). CRUD. À la création, la salle peut être déduite du fournisseur. Si statut passé à `livree`, application de la livraison (mouvements de stock).

- **POST** `/api/commandes-fournisseur/<id>/marquer-comme-livree/` — Marquer la commande comme livrée : crée les mouvements de stock ingrédients et met le statut à `livree`. Refus si déjà livrée ou annulée.

- `/api/lignes-commande-fournisseur/` — Lignes commande fournisseur (ingrédient, quantité, etc.). CRUD. Filtrage par salle (via la commande).

### Produits et stock produit

- `/api/categories-produit/` — Catégories de produit (ex. boissons). CRUD complet.

- `/api/produits/` — Produits vendus (catégorie, salle, stock). CRUD. Filtrage par `?salle=<id>` ou salle du profil.

- **PATCH** `/api/produits/<id>/stock/` — Ajuster le stock d’un produit. Corps : `quantity` ou `delta` (entiers). Retourne `stock_produit`.

- `/api/product-stock-movements/` — Mouvements de stock (produits). Liste / création. Filtrage par `?produit=<id>`. Pas de update/delete.

### Commandes client, historique et facturation

- `/api/commandes/` — Commandes (historique). **Liste et détail** : chaque commande inclut `lignes` et `facture` (résumé : id, date_facture, montant_total, montant_paye, reste_a_payer, statut_facture). CRUD complet. **Filtres** : `?salle=`, `?date_from=YYYY-MM-DD`, `?date_to=YYYY-MM-DD`, `?statut=` ou `?statut_commande=` (open/paid/cancelled), `?has_facture=true|false`, `?statut_facture=` (paid/unpaid/overdue).

- **GET** `/api/commandes/historique/` — Alias de la liste avec les mêmes filtres (historique des commandes avec factures).

- **GET** `/api/commandes/stats/` — Agrégats sur l’historique : `total_commandes`, `total_ca`, `par_statut_commande`, `avec_facture`, `facture_payee`, `facture_impayee`. Filtres : `date_from`, `date_to`, `salle`.

- **POST** `/api/commandes/<id>/creer-facture/` — Créer une facture pour la commande. Montant = somme des `total_ligne` des lignes, ou `total_commande` si pas de lignes. Refus si facture déjà existante ou commande annulée.

- `/api/lignes-commande/` — Lignes de commande (plat, produit, formule, quantité, prix_unitaire, total_ligne). CRUD. À chaque création/modification/suppression, recalcul de `commande.total_commande` (somme des `total_ligne`).

- `/api/factures/` — Factures (commande, client, salle, montant_total, statut). CRUD. Champs calculés en lecture : `montant_paye`, `reste_a_payer`.

- **POST** `/api/factures/<id>/recalculer-montant/` — Recalcule le `montant_total` de la facture à partir de la somme des `total_ligne` de la commande associée.

- `/api/paiements/` — Paiements liés à une facture (montant, mode, statut). CRUD. Après chaque create/update/delete, recalcul du statut de la facture (`paid`/`unpaid`) ; si facture passée à `paid`, la commande est mise à jour en `statut_commande = paid`.

### Apports (entrées / dépenses)

- `/api/types-apport/` — Types d’apport (entrée/dépense). CRUD complet.

- `/api/apports/` — Apports (entrées/dépenses). CRUD complet.

### Employés et planning (ressources)

- `/api/employees/` — Employés (nom, rôle, salle, heures, couleur). CRUD. Filtrage par `?salle=<id>` ou salle du profil.

- `/api/planning-shifts/` — Créneaux planning (employé, date, type Midi/Soir/Journée, heures). CRUD. Filtrage par salle (employés de la salle).

- `/api/planning-capacities/` — Capacités planning : effectifs requis par jour et type (Midi/Soir). CRUD. Utilisé pour les alertes du planning hebdo.

### Commandes fournisseur / équipe (modèles alternatifs)

- `/api/supplier-orders/` — Supplier orders (modèle alternatif « commande fournisseur »). CRUD.

- `/api/team-shifts/` — Team shifts (modèle alternatif « créneaux équipe »). CRUD.

---

## 6. Récapitulatif des actions personnalisées (hors CRUD)

- **GET** `/api/reservations/today/` — Réservations du jour.

- **GET** `/api/reservations/by-date/` — Réservations à une date (query `date=YYYY-MM-DD`).

- **POST** `/api/reservations/<id>/confirmer/` — Confirmer la réservation.

- **POST** `/api/reservations/<id>/annuler/` — Annuler la réservation.

- **POST** `/api/reservations/<id>/marquer-arrivee/` — Marquer comme arrivée.

- **GET** `/api/reservations/<id>/tables/` — Tables assignées.

- **POST** `/api/reservations/<id>/tables/` — Ajouter une table (body : `{ "table": <id> }`).

- **DELETE** `/api/reservations/<id>/tables/?table=<id>` — Retirer une table.

- **GET** `/api/reservations/creneaux-disponibles/?date= &salle= &couverts=` — Créneaux disponibles.

- **PATCH** `/api/stock/<id>/stock/` — Ajuster stock ingrédient (`quantity` ou `delta`).

- **POST** `/api/commandes-fournisseur/<id>/marquer-comme-livree/` — Marquer commande fournisseur comme livrée (mouvements de stock).

- **PATCH** `/api/produits/<id>/stock/` — Ajuster stock produit (`quantity` ou `delta`).

- **GET** `/api/commandes/historique/` — Liste des commandes avec lignes et facture (historique). Filtres : date_from, date_to, statut, has_facture, statut_facture, salle.

- **GET** `/api/commandes/stats/` — Statistiques sur les commandes (CA, effectifs par statut, factures payées/impayées).

- **POST** `/api/commandes/<id>/creer-facture/` — Créer une facture pour la commande.

- **GET** `/api/menus/<id>/plats/` — Liste des plats du menu.

- **POST** `/api/menus/<id>/plats/` — Ajouter un plat au menu (body : `{ "plat": <id> }`).

- **DELETE** `/api/menus/<id>/plats/` — Retirer un plat du menu (query : `?plat=<id>`).

- **POST** `/api/factures/<id>/recalculer-montant/` — Recalculer le montant total de la facture depuis les lignes de commande.

---

## 7. Comportements métier importants

- **Historique des commandes** : `GET /api/commandes/` et `GET /api/commandes/historique/` renvoient chaque commande avec ses lignes et un résumé de la facture (si elle existe) : id, date_facture, montant_total, montant_paye, reste_a_payer, statut_facture. Les filtres (date, statut, salle, has_facture, statut_facture) s’appliquent sur la base de données.

- **Lignes de commande** : à chaque création/modification/suppression, `Commande.total_commande` est recalculé (somme des `total_ligne`).

- **Création de facture** : le `montant_total` est la somme des `total_ligne` de la commande (ou `total_commande` si aucune ligne).

- **Paiements** : après chaque création/modification/suppression de paiement, la facture est recalculée (`recalculer_statut`) ; si la facture passe en « payée », la commande associée passe en `statut_commande = paid`.

- **Commande fournisseur** : « Marquer comme livrée » crée les mouvements de stock ingrédients et met la commande à `livree`.

- **Planning** : les endpoints `/api/planning/week/` et `/api/planning/week/copy/` gèrent la semaine (lundi–dimanche) et les capacités (alertes sous-effectifs).

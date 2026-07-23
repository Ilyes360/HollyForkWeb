# Test manuel — Reservations

> URL : `app.hollyfork.fr/reservations` | Connecte requis

## 1. Affichage et filtres

- Aller sur `/reservations`
- → Tableau des reservations du jour visible
- Cliquer onglet Midi / Soir → contenu change
- Cliquer filtre statut (Tous, Confirmees, En attente, Arrivees) → tableau filtre
- Taper un nom dans la recherche → seules les lignes correspondantes
- Cliquer un en-tete de colonne → tri asc/desc

## 2. Creer une reservation

- Cliquer "Nouvelle reservation"
- → Dialog formulaire
- Remplir : nom (2+ chars), telephone (10+ chars), couverts, date, heure
- Cliquer "Creer la reservation"
- → Dialog se ferme, reservation dans le tableau
- Soumettre avec nom vide → message "Le nom est requis"

## 3. Detail et notes

- Cliquer sur une ligne du tableau
- → Sheet lateral avec details (nom, telephone, couverts, table, canal, heure)
- Modifier les notes, cliquer "Enregistrer les notes"
- Rafraichir la page → notes persistees

## 4. Supprimer

- Ouvrir le detail d'une reservation
- Cliquer "Supprimer la reservation" → dialog confirmation
- Cliquer "Supprimer"
- → Reservation disparait du tableau

## 5. Bug connu — Statut non persiste

- Changer le statut (Confirmer, Arrivee, Annuler) → badge change visuellement
- Rafraichir la page → **le statut revient a sa valeur d'avant**
- C'est le bug documente (pas de champ statut backend)

## Verification visuelle

- [ ] Badges statut colores (vert confirmee, orange en attente, rouge annulee)
- [ ] Icone note visible sur les lignes avec notes
- [ ] Ligne selectionnee surlignee
- [ ] Quick actions (icones confirmer/arrivee/annuler) sur les lignes en attente/confirmees

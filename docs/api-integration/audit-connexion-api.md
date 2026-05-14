# Audit connexion API — Page par page

> Dernière mise à jour : 2026-05-14

## Legend

- **API** = connecté au backend Django, données réelles
- **Local** = mock data / Zustand store uniquement
- **Optimistic** = cache local mis à jour immédiatement, appel API best-effort en background

---

## 1. Dashboard (`/`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| KPIs (CA, couverts, occupation…) | **API** | `GET /api/dashboard/kpis/` |
| Carte restaurants | **API** | `GET /api/dashboard/map/` |
| CA par catégorie | **Local** | Endpoint inexistant → affiche données mock ou "N/A" |

---

## 2. Carte / Cuisine (`/cuisine`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste recettes | **API** | `GET /api/articles/` |
| Créer recette | **API** | `POST /api/articles/` |
| Modifier recette | **API** | `PATCH /api/articles/:id/` |
| Supprimer recette | **API** | `DELETE /api/articles/:id/` |
| Dupliquer recette | **Local** | Store uniquement |
| Toggle actif/inactif | **Local** | Champ read-only côté backend |

---

## 3. Stocks (`/stocks`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste produits | **API** | `GET /api/stocks/` |
| Créer produit | **API** | `POST /api/stocks/` (background) |
| Ajustement stock | **API** | `POST /api/stocks/:id/adjust/` |
| Supprimer produit | **API** | `DELETE /api/stocks/:id/` |
| Mode inventaire | **Local** | Capture locale uniquement |
| Gestionnaire de zones | **Local** | Store uniquement |

---

## 4. Commandes fournisseurs (`/commandes`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste commandes | **API** | `GET /api/suppliers/orders/` |
| Créer commande | **API** | `POST /api/suppliers/orders/` |
| Mettre à jour statut | **API** | `PATCH /api/suppliers/orders/:id/` |
| Liste fournisseurs | **API** | `GET /api/suppliers/` |
| Créer fournisseur | **API** | `POST /api/suppliers/` |
| Modifier fournisseur | **API** | `PATCH /api/suppliers/:id/` |
| Supprimer fournisseur | **API** | `DELETE /api/suppliers/:id/` |

---

## 5. Planning (`/planning`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Lire shifts | **API** | `GET /api/planning/shifts/` |
| Lire employés | **API** | `GET /api/restaurant-employes/` |
| Créer shift | **Optimistic** | Local first → `POST /api/planning/shifts/` |
| Modifier shift | **Optimistic** | Local first → `PUT /api/planning/shifts/:id/` |
| Supprimer shift | **Optimistic** | Local first → `DELETE /api/planning/shifts/:id/` |

---

## 6. Réservations (`/reservations`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste réservations | **API** | `GET /api/reservations/` |
| Créer réservation | **API** | `POST /api/reservations/` |
| Modifier date/heure | **API** | `PATCH /api/reservations/:id/` |
| Supprimer réservation | **API** | `DELETE /api/reservations/:id/` |
| Statut (confirmé, arrivé…) | **Local** | Pas dans le schéma API |
| Notes | **Local** | Pas dans le schéma API |
| Durée | **Local** | Pas dans le schéma API |

---

## 7. Salle (`/salle`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Lire salles | **API** | `GET /api/salles/` |
| Lire tables | **API** | `GET /api/tables/` |
| Sauvegarder plan | **Optimistic** | Local → `POST /api/salles/` + `POST /api/tables/` |
| Édition du plan (zones, déco, murs) | **Local** | Store uniquement |

---

## 8. Admin — Établissements (`/admin`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste établissements | **API** | `GET /api/restaurants/` |
| Créer établissement | **API** | `POST /api/restaurants/` |
| Modifier établissement | **Optimistic** | Cache local → `PUT /api/restaurants/:id/` |
| Supprimer établissement | **Optimistic** | Cache local → `DELETE /api/restaurants/:id/` |
| Toggle actif/inactif | **Local** | Pas de champ `isActive` dans l'API |

---

## 9. Admin — Employés (`/admin/employes`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste employés | **API** | `GET /api/employes/` |
| Types d'employés | **API** | `GET /api/type-employes/` |
| Créer employé | **API** | `POST /api/employes/` |
| Modifier employé | **API** | `PUT /api/employes/:id/` |
| Supprimer employé | **API** | `DELETE /api/employes/:id/` |
| Statut compte (actif/désactivé) | **Local** | Pas dans le schéma API |

---

## 10. Admin — Rôles (`/admin/roles`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Liste rôles | **API** | `GET /api/staff/roles/all/` |
| Hiérarchie permissions | **API** | `GET /api/staff/permissions/hierarchy/` |
| Matrice permissions | **API** | `GET /api/staff/permissions/matrix/` |
| Modifier permissions | **Aucun** | Read-only, pas de mutation |

---

## 11. Paramètres (`/settings`)

| Fonctionnalité | Source | Endpoint |
|---|---|---|
| Lire paramètres | **API** | `GET /api/settings/` |
| Modifier paramètres | **API** | `PUT /api/settings/` |
| Méthodes de paiement | **API** | `GET /api/methodes-paiement/` |
| Notes | **API** | `POST /api/notes/` (création) |
| Notifications, facturation | **Local** | UI sans backend |

---

## Résumé des gaps (champs/features sans backend)

| Champ / Feature | Pages concernées | Problème |
|---|---|---|
| `status` réservation | Réservations | Local uniquement, pas dans l'API |
| `notes` réservation | Réservations | Local uniquement |
| `duration` réservation | Réservations | Local uniquement |
| `isActive` établissement | Admin | Pas dans le modèle Restaurant backend |
| `accountStatus` employé | Admin Employés | Pas dans le modèle Employé backend |
| CA par catégorie | Dashboard | Endpoint inexistant |
| Permissions rôles | Admin Rôles | Read-only, pas de CRUD |
| Notifications/facturation | Paramètres | UI sans backend |
| Zones de stockage | Stocks | Gestion locale uniquement |
| Dupliquer recette | Carte | Local uniquement |

---

## Hooks — Résumé

| Hook | Dev Mode | User Mode | CRUD |
|---|---|---|---|
| `useArticles()` | MOCK_RECIPES | `GET /api/articles/` | C/R/U/D |
| `useCategories()` | `[]` | `GET /api/categories/` | C/U/D |
| `useIngredients()` | `[]` | `GET /api/ingredients/` | C/U/D |
| `useStocks()` | MOCK_PRODUCTS | `GET /api/stocks/` | R/U |
| `useSuppliers()` | inventory-store | `GET /api/suppliers/` | C/U/D |
| `useOrders()` | inventory-store | `GET /api/suppliers/orders/` | C/U/D |
| `useReservations()` | MOCK_RESERVATIONS | `GET /api/reservations/` | C/U/D |
| `useSalles()` | `[]` | `GET /api/salles/` | R |
| `useTables()` | RESTAURANT_TABLES | `GET /api/tables/` | R |
| `useShifts()` | initialShifts + mock | `GET /api/planning/shifts/` | C/U/D |
| `useEmployees()` | admin-store | `GET /api/employes/` | C/U/D |
| `useEstablishments()` | admin-store | `GET /api/restaurants/` | C/U/D |
| `useRoles()` | admin-store | `GET /api/staff/roles/all/` | R |
| `useSettings()` | `null` | `GET/PUT /api/settings/` | R/U |
| `usePaymentMethods()` | `[]` | `GET /api/methodes-paiement/` | R |
| `useDashboard()` | MOCK_KPIS | `GET /api/dashboard/kpis/` | R |
| `useDashboardMapData()` | MOCK_MAP | `GET /api/dashboard/map/` | R |
| `useRevenueByCategory()` | MOCK_REVENUE | `GET /api/lignes-commandes/` (agrégé) | R |
| `useNotes()` | `[]` | `GET /api/notes/` | R/C |

---

## Bug serializers corrigé (2026-05-14)

**Cause racine** : quand DRF a un champ avec `source='nom'`, `validated_data` utilise la clé `'nom'` (source), pas `'name'` (nom API). Tous les `create()`/`update()` custom utilisaient les noms API → `KeyError`.

**Fichiers corrigés** :

| Fichier | Serializers |
|---|---|
| `apps/menu/serializers.py` | `CategorieArticleSerializer`, `ArticleSerializer`, `ArticleDetailSerializer`, `ArticleIngredientSerializer` |
| `apps/inventory/serializers.py` | `IngredientSerializer`, `StockSerializer`, `ReapprovisionnementSerializer` |
| `apps/restaurant/serializers.py` | `RestaurantSerializer` |
| `apps/salles/serializers.py` | `SalleSerializer` |
| `apps/suppliers/serializers.py` | `CommandeFournisseurSerializer` |
| `apps/billing/serializers.py` | `PaiementSerializer`, `FactureSerializer` |
| `apps/reports/serializers.py` | `ReportSerializer` |

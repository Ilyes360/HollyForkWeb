# Admin — Detail couverture

> Sous-features : 8a (Etablissements), 8b (Employes), 8c (Roles)

## Hooks partages

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useEstablishments() | ❌ | — | — |
| useEstablishment() | ❌ | — | — |
| useCreateEstablishment() | ❌ | — | — |
| useEmployees() | ❌ | — | Partage avec Planning |
| useEmployeeTypes() | ❌ | — | — |
| useCreateEmployee() | ❌ | — | — |
| useRestaurantEmployees() | ❌ | — | Partage avec Device Login |
| useAllRestaurantAssignments() | ❌ | — | — |
| useAssignEmployee() | ❌ | — | — |
| useRoles() | ❌ | — | — |
| useRoleHierarchy() | ❌ | — | — |

## Utils (components/administration/utils.ts)

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| getEmployeeCount() | ❌ | — | pure function |
| formatAddress() | ❌ | — | pure function |
| formatServiceTime() | ❌ | — | pure function |
| getInitials() | ❌ | — | pure function |

---

## 8a. Admin Etablissements (Standard)

### Pages

| Page | Testee | Notes |
|------|:------:|-------|
| EtablissementsPage | ❌ | Liste etablissements |
| EtablissementDetailPage | ❌ | Detail + edition |

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| AdminHeader | ❌ | ❌ | Header admin |
| (composants inline dans pages) | ❌ | ❌ | Pas extraits en composants |

---

## 8b. Admin Employes (Standard)

### Pages

| Page | Testee | Notes |
|------|:------:|-------|
| EmployesPage | ❌ | Liste employes |
| EmployeDetailPage | ❌ | Detail + edition |

---

## 8c. Admin Roles (Standard)

### Pages

| Page | Testee | Notes |
|------|:------:|-------|
| RolesPage | ❌ | Definition roles + permissions |

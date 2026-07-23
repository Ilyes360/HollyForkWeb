# Commandes — Detail couverture

> Sous-feature : 5 (Commandes Fournisseurs)

## Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useOrders() | ❌ | — | — |
| useOrdersPendingCount() | ❌ | — | — |
| useCreateOrder() | ❌ | — | — |
| useUpdateOrder() | ❌ | — | — |
| useDeleteOrder() | ❌ | — | — |
| useOrderLines() | ❌ | — | — |
| useCreateOrderLine() | ❌ | — | — |
| useUpdateOrderLine() | ❌ | — | — |
| useDeleteOrderLine() | ❌ | — | — |
| useCommandesActives() | ❌ | — | Commandes clients (cuisine) |
| useCreateCommande() | ❌ | — | — |
| useUpdateCommande() | ❌ | — | — |
| useInvoices() | ❌ | — | — |
| useCreateInvoice() | ❌ | — | — |
| usePayments() | ❌ | — | — |
| useCreatePayment() | ❌ | — | — |

## Utils (components/commandes/utils.ts)

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| getSupplierProductCount() | ❌ | — | pure function |
| getSupplierTotalSpend() | ❌ | — | pure function |
| getSupplierMonthlySpend() | ❌ | — | pure function |
| getSupplierLastOrderDate() | ❌ | — | pure function |
| getTotalMonthlySpend() | ❌ | — | pure function |
| getPendingOrderCount() | ❌ | — | pure function |
| getGlobalAvgDeliveryDays() | ❌ | — | pure function |
| getSupplierProducts() | ❌ | — | pure function |
| getSupplierOrders() | ❌ | — | pure function |

## Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| OrderDialog | ❌ | ❌ | Formulaire creation commande |
| ReceiveOrderDialog | ❌ | ❌ | Formulaire reception |
| SupplierDialog | ❌ | ❌ | CRUD fournisseur |
| OrderHistoryTable | ❌ | ❌ | Tableau historique |
| OrderSummaryBar | ❌ | ❌ | Barre resume |
| PendingOrders | ❌ | ❌ | Liste commandes en attente |
| CommandesHeader | ❌ | ❌ | Header + actions |

## Pages

| Page | Testee | Notes |
|------|:------:|-------|
| FournisseursPage (commandes.tsx) | ❌ | Commandes fournisseurs |
| CommandesClientsPage | ❌ | Kitchen display system |

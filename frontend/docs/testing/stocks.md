# Stocks — Detail couverture

> Sous-feature : 4 (Stocks)

## Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useStocks() | ✅ | 4 | features/stocks/hooks.test.tsx |
| useCreateStock() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useUpdateStock() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useAdjustStock() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useDeleteStock() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useStockAlerts() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useIngredients() | ✅ | 2 | features/stocks/hooks.test.tsx |
| useCreateIngredient() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useUpdateIngredient() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useDeleteIngredient() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useSuppliers() | ✅ | 3 | features/stocks/hooks.test.tsx |
| useCreateSupplier() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useUpdateSupplier() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useDeleteSupplier() | ✅ | 1 | features/stocks/hooks.test.tsx |
| useReapprovisionnements() | ❌ | — | — |
| useArticleIngredients() | ❌ | — | — |

## Mapping

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| apiStockToProduct() | ✅ | 10 | features/stocks/mapping.test.ts |
| toProductUnit() | ✅ | 12 | features/stocks/mapping.test.ts |

## Utils (components/stock/utils.ts)

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| getProductStatus() | ❌ | — | pure function — priorite haute |
| getStockPercentage() | ❌ | — | pure function |
| getProductValue() | ❌ | — | pure function |
| getSupplierName() | ❌ | — | pure function |
| formatCurrency() | ❌ | — | pure function |
| getUrgencyCategory() | ❌ | — | pure function |
| getZoneHealth() | ❌ | — | pure function |
| getZoneFillPercent() | ❌ | — | pure function |
| sortProductsByUrgency() | ❌ | — | pure function |
| getTotalStockValue() | ❌ | — | pure function |
| getDaysUntilExpiration() | ❌ | — | pure function |

## Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| StockTable | ❌ | ❌ | Filtres, tri, search — priorite haute |
| StockProductCard | ❌ | ❌ | Lecture seule |
| AddProductDialog | ❌ | ❌ | Formulaire Zod |
| ProductDetailModal | ❌ | ❌ | Modale detail |
| StockFilters | ❌ | ❌ | Filtres status/categorie |
| StockHeader | ❌ | ❌ | Header + actions |
| StockInventoryBanner | ❌ | ❌ | Alerte inventaire |
| StockUrgencySection | ❌ | ❌ | Section par urgence |
| StockZoneSection | ❌ | ❌ | Section par zone |
| StorageZones | ❌ | ❌ | Config zones |
| ZoneManagerPanel | ❌ | ❌ | Panel gestion zones |
| ProductFlowGraph | ❌ | ❌ | Recharts — lazy |

## Hooks utilitaires

| Hook | Teste | Tests | Fichier test |
|------|:-----:|-------|-------------|
| usePortionCalculator() | ✅ | — | use-portion-calculator.test.ts |

## Pages

| Page | Testee | Notes |
|------|:------:|-------|
| StocksPage | ❌ | Page principale |
| StocksProductPage | ❌ | Detail produit |
| StocksConfigurationPage | ❌ | Config zones de stockage |

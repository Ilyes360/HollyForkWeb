/**
 * Shared MSW handlers — single source of truth for both tests and browser dev mode.
 * Re-exports the same handlers used in src/test/server.ts.
 */
import { authHandlers } from "@/test/handlers/auth"
import { dashboardHandlers } from "@/test/handlers/dashboard"
import { restaurantHandlers } from "@/test/handlers/restaurants"
import { adminHandlers } from "@/test/handlers/admin"
import { planningHandlers } from "@/test/handlers/planning"
import { reservationHandlers } from "@/test/handlers/reservations"
import { articleHandlers } from "@/test/handlers/articles"
import { stockHandlers } from "@/test/handlers/stocks"
import { commandeHandlers } from "@/test/handlers/commandes"
import { settingsHandlers } from "@/test/handlers/settings"
import { factureHandlers } from "@/test/handlers/factures"
import { ligneCommandeHandlers } from "@/test/handlers/lignes-commandes"
import { paiementHandlers } from "@/test/handlers/paiements"
import { reportHandlers } from "@/test/handlers/reports"
import { employeesStatusHandlers } from "@/test/handlers/employees-status"
import { restaurantEmployeHandlers } from "@/test/handlers/restaurant-employes"

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...restaurantHandlers,
  ...adminHandlers,
  ...planningHandlers,
  ...reservationHandlers,
  ...articleHandlers,
  ...stockHandlers,
  ...commandeHandlers,
  ...settingsHandlers,
  ...factureHandlers,
  ...ligneCommandeHandlers,
  ...paiementHandlers,
  ...reportHandlers,
  ...employeesStatusHandlers,
  ...restaurantEmployeHandlers,
]

import { setupServer } from "msw/node"
import { authHandlers } from "./handlers/auth"
import { dashboardHandlers } from "./handlers/dashboard"
import { restaurantHandlers } from "./handlers/restaurants"
import { adminHandlers } from "./handlers/admin"
import { planningHandlers } from "./handlers/planning"
import { reservationHandlers } from "./handlers/reservations"
import { articleHandlers } from "./handlers/articles"
import { stockHandlers } from "./handlers/stocks"
import { commandeHandlers } from "./handlers/commandes"
import { settingsHandlers } from "./handlers/settings"
import { factureHandlers } from "./handlers/factures"
import { ligneCommandeHandlers } from "./handlers/lignes-commandes"
import { paiementHandlers } from "./handlers/paiements"
import { reportHandlers } from "./handlers/reports"
import { employeesStatusHandlers } from "./handlers/employees-status"
import { restaurantEmployeHandlers } from "./handlers/restaurant-employes"

export const server = setupServer(
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
)

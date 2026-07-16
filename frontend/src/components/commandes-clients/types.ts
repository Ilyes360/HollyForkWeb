export type CommandeStatus = "EN_COURS" | "VALIDEE" | "ANNULEE"
export type KitchenStatus = "PENDING" | "IN_PROGRESS" | "READY"

export interface CommandeLine {
  id: number
  articleId: number
  articleName: string
  quantity: number
  unitPrice: number
  costOfGoodsSold: number
  awaitingService: boolean
}

export interface Commande {
  id: number
  status: CommandeStatus
  kitchenStatus: KitchenStatus
  priority: string
  restaurantId: number
  tableId: number | null
  createdById: number
  createdAt: string
  itemsCount: number
  amount: number
  totalCostOfGoodsSold: number
  isInProgress: boolean
  lines: CommandeLine[]
}

export const KITCHEN_STATUS_CONFIG: Record<
  KitchenStatus,
  { label: string; color: string; dot: string }
> = {
  PENDING: {
    label: "Envoyé",
    color: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  IN_PROGRESS: {
    label: "En préparation",
    color: "text-amber-600",
    dot: "bg-amber-500",
  },
  READY: { label: "Prêt à servir", color: "text-red-600", dot: "bg-red-500" },
}

export const COMMANDE_STATUS_CONFIG: Record<
  CommandeStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "outline" }
> = {
  EN_COURS: { label: "En cours", variant: "warning" },
  VALIDEE: { label: "Validée", variant: "success" },
  ANNULEE: { label: "Annulée", variant: "destructive" },
}

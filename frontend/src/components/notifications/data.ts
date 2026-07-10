import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  Package01Icon,
  Clock01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"

// ── Types ──

export type NotificationCategory =
  | "reservations"
  | "stocks"
  | "planning"
  | "system"

export type NotificationAction = {
  label: string
  actionType: string
  variant: "default" | "outline" | "ghost" | "destructive"
}

export type ReservationContent = {
  type: "reservation"
  clientName: string
  covers: number
  time: string
  tableNumber?: string
  eventType?: "new" | "cancel" | "modify" | "arrival"
}

export type StockContent = {
  type: "stock"
  ingredientName: string
  currentLevel: number
  threshold: number
  unit: string
  severity: "warning" | "critical"
}

export type PlanningContent = {
  type: "planning"
  day: string
  service: "Midi" | "Soir"
  missingStaff: number
}

export type SystemContent = {
  type: "system"
}

export type NotificationRichContent =
  | ReservationContent
  | StockContent
  | PlanningContent
  | SystemContent

export type Notification = {
  id: string
  category: NotificationCategory
  title: string
  description: string
  richContent: NotificationRichContent
  time: string
  timestamp: number
  read: boolean
  actions: NotificationAction[]
}

// ── Category metadata ──

export const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: IconSvgElement }
> = {
  reservations: { label: "Reservations", icon: Calendar03Icon },
  stocks: { label: "Stocks", icon: Package01Icon },
  planning: { label: "Planning", icon: Clock01Icon },
  system: { label: "Systeme", icon: Settings01Icon },
}

export const CATEGORY_ORDER: NotificationCategory[] = [
  "reservations",
  "stocks",
  "planning",
  "system",
]

// ── Mock data ──

const now = Date.now()
const min = (m: number) => now - m * 60_000
const hr = (h: number) => now - h * 3_600_000

export const MOCK_NOTIFICATIONS: Notification[] = [
  // ── Reservations ──
  {
    id: "n1",
    category: "reservations",
    title: "Nouvelle reservation",
    description:
      "M. Laurent souhaite reserver une table pour 4 personnes ce soir a 20h00.",
    richContent: {
      type: "reservation",
      clientName: "M. Laurent",
      covers: 4,
      time: "20:00",
      tableNumber: "T2",
      eventType: "new",
    },
    time: "Il y a 5 min",
    timestamp: min(5),
    read: false,
    actions: [
      { label: "Confirmer", actionType: "confirm", variant: "default" },
      { label: "Refuser", actionType: "refuse", variant: "outline" },
    ],
  },
  {
    id: "n2",
    category: "reservations",
    title: "Reservation VIP",
    description:
      "Mme Delacroix — cliente fidele — souhaite sa table habituelle (T1) pour 2 personnes.",
    richContent: {
      type: "reservation",
      clientName: "Mme Delacroix",
      covers: 2,
      time: "19:30",
      tableNumber: "T1",
      eventType: "new",
    },
    time: "Il y a 20 min",
    timestamp: min(20),
    read: false,
    actions: [
      { label: "Confirmer", actionType: "confirm", variant: "default" },
      {
        label: "Voir fiche client",
        actionType: "view-client",
        variant: "outline",
      },
    ],
  },
  {
    id: "n3",
    category: "reservations",
    title: "Annulation",
    description:
      "M. Dupont a annule sa reservation de ce soir (table T3, 19h30, 2 couverts).",
    richContent: {
      type: "reservation",
      clientName: "M. Dupont",
      covers: 2,
      time: "19:30",
      tableNumber: "T3",
      eventType: "cancel",
    },
    time: "Il y a 1h",
    timestamp: hr(1),
    read: true,
    actions: [
      { label: "Voir reservation", actionType: "view", variant: "outline" },
    ],
  },
  {
    id: "n4",
    category: "reservations",
    title: "Modification de reservation",
    description:
      "M. Moreau a modifie sa reservation : passage de 4 a 6 couverts pour demain midi.",
    richContent: {
      type: "reservation",
      clientName: "M. Moreau",
      covers: 6,
      time: "12:30",
      tableNumber: "T4",
      eventType: "modify",
    },
    time: "Il y a 2h",
    timestamp: hr(2),
    read: true,
    actions: [
      { label: "Voir reservation", actionType: "view", variant: "outline" },
    ],
  },

  // ── Stocks ──
  {
    id: "n5",
    category: "stocks",
    title: "Stock critique — Tomates",
    description:
      "Le stock de tomates est passe en dessous du seuil critique. 1.2 kg restants sur un seuil de 5 kg.",
    richContent: {
      type: "stock",
      ingredientName: "Tomates",
      currentLevel: 24,
      threshold: 100,
      unit: "kg",
      severity: "critical",
    },
    time: "Il y a 30 min",
    timestamp: min(30),
    read: false,
    actions: [
      { label: "Commander", actionType: "order", variant: "default" },
      { label: "Voir stock", actionType: "view-stock", variant: "outline" },
    ],
  },
  {
    id: "n6",
    category: "stocks",
    title: "Stock faible — Farine T55",
    description:
      "Le stock de farine T55 approche le seuil minimum. 3 kg restants sur un seuil de 10 kg.",
    richContent: {
      type: "stock",
      ingredientName: "Farine T55",
      currentLevel: 30,
      threshold: 100,
      unit: "kg",
      severity: "warning",
    },
    time: "Il y a 45 min",
    timestamp: min(45),
    read: false,
    actions: [{ label: "Commander", actionType: "order", variant: "default" }],
  },
  {
    id: "n7",
    category: "stocks",
    title: "Livraison confirmee",
    description:
      "La commande chez Metro est confirmee. Livraison prevue demain entre 7h et 9h.",
    richContent: {
      type: "stock",
      ingredientName: "Commande Metro",
      currentLevel: 100,
      threshold: 100,
      unit: "",
      severity: "warning",
    },
    time: "Il y a 3h",
    timestamp: hr(3),
    read: true,
    actions: [
      { label: "Voir commande", actionType: "view-order", variant: "outline" },
    ],
  },

  // ── Planning ──
  {
    id: "n8",
    category: "planning",
    title: "Service non couvert",
    description:
      "Le service du vendredi soir a 2 postes non pourvus. Il manque du personnel en salle.",
    richContent: {
      type: "planning",
      day: "Vendredi",
      service: "Soir",
      missingStaff: 2,
    },
    time: "Il y a 1h",
    timestamp: hr(1),
    read: false,
    actions: [
      {
        label: "Voir planning",
        actionType: "view-planning",
        variant: "default",
      },
    ],
  },
  {
    id: "n9",
    category: "planning",
    title: "Demande de conge",
    description:
      "Julie Martin demande un conge le samedi 29 mars (service midi et soir).",
    richContent: {
      type: "planning",
      day: "Samedi 29 mars",
      service: "Midi",
      missingStaff: 1,
    },
    time: "Il y a 4h",
    timestamp: hr(4),
    read: true,
    actions: [
      { label: "Approuver", actionType: "approve", variant: "default" },
      { label: "Refuser", actionType: "refuse", variant: "outline" },
    ],
  },

  // ── Systeme ──
  {
    id: "n10",
    category: "system",
    title: "Mise a jour disponible",
    description:
      "Une nouvelle version de Holy Fork est disponible (v2.4.0). Nouvelles fonctionnalites : export PDF des plannings, amelioration des performances.",
    richContent: { type: "system" },
    time: "Il y a 6h",
    timestamp: hr(6),
    read: true,
    actions: [
      {
        label: "Voir les nouveautes",
        actionType: "view-changelog",
        variant: "outline",
      },
    ],
  },
  {
    id: "n11",
    category: "system",
    title: "Sauvegarde automatique",
    description:
      "La sauvegarde quotidienne de vos donnees a ete effectuee avec succes.",
    richContent: { type: "system" },
    time: "Hier, 03:00",
    timestamp: hr(24),
    read: true,
    actions: [],
  },
]

import type { EmptyStateCopy } from "./types"

type NotificationFilter = "all" | "unread" | "reservations" | "stocks" | "planning" | "system"

export const NOTIFICATION_FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "reservations", label: "Reservations" },
  { value: "stocks", label: "Stocks" },
  { value: "planning", label: "Planning" },
]

export const NOTIFICATION_LABELS = {
  title: "Notifications",
  unreadCount: (count: number) => `${count} non lue${count > 1 ? "s" : ""}`,
  markAllRead: "Tout marquer comme lu",
  emptySubtitle: "Les nouvelles notifications apparaitront ici",
} as const

const NOTIFICATION_EMPTY: Record<NotificationFilter, string> = {
  all: "Aucune notification",
  unread: "Aucune notification non lue",
  reservations: "Aucune notification de reservation",
  stocks: "Aucune notification de stock",
  planning: "Aucune notification de planning",
  system: "Aucune notification systeme",
}

export function getNotificationEmptyState(filter: string): EmptyStateCopy {
  const title = NOTIFICATION_EMPTY[filter as NotificationFilter] ?? NOTIFICATION_EMPTY.all
  return {
    title,
    description: NOTIFICATION_LABELS.emptySubtitle,
  }
}

export const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
  new: "Nouvelle",
  cancel: "Annulee",
  modify: "Modifiee",
  arrival: "Arrivee",
}

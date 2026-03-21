export type CopyVariant = "info" | "success" | "warning" | "danger" | "neutral"

export interface CopyInsight {
  text: string
  variant: CopyVariant
}

export interface EmptyStateCopy {
  title: string
  description: string
  actionLabel?: string
}

export type PageId =
  | "dashboard"
  | "reservations"
  | "salle"
  | "planning"
  | "carte"
  | "stocks"
  | "commandes"

export interface PageMeta {
  title: string
  subtitle: string
}

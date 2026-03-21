export type ReservationStatus = "confirmee" | "en_attente" | "arrivee" | "annulee" | "no_show"
export type ReservationCanal = "site" | "telephone" | "thefork" | "walk_in"
export type ServiceType = "midi" | "soir"
export type ReservationViewMode = "table" | "gantt"

export interface RestaurantTable {
  number: number
  label: string
  seats: number
}

export interface Reservation {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: string              // "YYYY-MM-DD"
  time: string              // "HH:MM"
  service: ServiceType
  covers: number
  tableNumber: number | null
  canal: ReservationCanal
  status: ReservationStatus
  notes: string
  pipeline?: ReservationPipelineState
  estimatedDurationMinutes?: number
  createdAt: string
}

export const TOTAL_CAPACITY = 48

export const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "outline" | "secondary" | "info" }
> = {
  confirmee: { label: "Confirmée", variant: "info" },
  en_attente: { label: "En attente", variant: "warning" },
  arrivee: { label: "Arrivée", variant: "success" },
  annulee: { label: "Annulée", variant: "destructive" },
  no_show: { label: "No-show", variant: "destructive" },
}

export const CANAL_LABELS: Record<ReservationCanal, string> = {
  site: "Site web",
  telephone: "Téléphone",
  thefork: "TheFork",
  walk_in: "Walk-in",
}

export const STATUS_FILTER_OPTIONS = [
  { value: "tous", label: "Tous" },
  { value: "confirmee", label: "Confirmées" },
  { value: "en_attente", label: "En attente" },
  { value: "arrivee", label: "Arrivées" },
] as const

// --- Pipeline configurable ---

export interface PipelineStageDefinition {
  id: string
  label: string
  shortLabel: string
  color: string
  avgDurationMinutes: number
  order: number
}

export interface PipelineTemplate {
  id: string
  name: string
  stages: PipelineStageDefinition[]
}

export interface ReservationPipelineState {
  currentStageId: string
  history: { stageId: string; enteredAt: string }[]
}

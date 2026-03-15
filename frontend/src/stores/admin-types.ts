import type { LocationData } from "@/types/location"
import type { DayOfWeek, Department } from "@/components/planning/types"

// --- Service & Storage ---

export interface ServiceConfig {
  id: string
  name: string
  startTime: string
  endTime: string
}

export type StorageZoneType = "cold" | "dry" | "cellar"

export interface StorageZone {
  id: string
  name: string
  slug: string
  type: StorageZoneType
  targetTemperature?: number
}

// --- Legal ---

export interface LegalInfo {
  licenseType: string
  licenseNumber: string
  insurance: string
  erpCapacity: number
  notes: string
}

// --- Establishment ---

export interface Establishment {
  id: string
  name: string
  address: LocationData | null
  phone: string
  email: string
  siret: string
  tvaNumber: string
  legalForm: string
  totalCapacity: number
  openingDays: DayOfWeek[]
  services: ServiceConfig[]
  storageZones: StorageZone[]
  isActive: boolean
  legalInfo: LegalInfo
  createdAt: string
  updatedAt: string
}

// --- Position & Employee ---

export type PositionType =
  | "chef_de_rang"
  | "serveur"
  | "chef_cuisinier"
  | "second_de_cuisine"
  | "commis"
  | "barman"
  | "plongeur"
  | "responsable_salle"
  | "gerant"

export type ContractType = "cdi" | "cdd" | "extra" | "apprenti" | "stage"

export type AccountStatus = "active" | "disabled"

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  position: PositionType
  department: Department
  establishmentId: string
  contractType: ContractType
  hireDate: string
  endDate?: string
  weeklyHours: number
  hourlyRate: number
  roleId: string
  loginEmail: string
  accountStatus: AccountStatus
  avatarColor: string
  createdAt: string
  updatedAt: string
}

// --- Roles ---

export type RoleType = "gerant" | "chef" | "responsable_salle" | "serveur"

export interface RolePermission {
  read: boolean
  write: boolean
}

export interface Role {
  id: string
  name: RoleType
  label: string
  description: string
  permissions: Record<string, RolePermission>
}

// --- Label maps ---

export const POSITION_LABELS: Record<PositionType, string> = {
  chef_de_rang: "Chef de rang",
  serveur: "Serveur",
  chef_cuisinier: "Chef cuisinier",
  second_de_cuisine: "Second de cuisine",
  commis: "Commis",
  barman: "Barman",
  plongeur: "Plongeur",
  responsable_salle: "Responsable salle",
  gerant: "Gérant",
}

/** Maps admin PositionType → display strings used by planning (free-form strings) */
export const POSITION_DISPLAY_MAP: Record<PositionType, string> = {
  chef_de_rang: "Chef de rang",
  serveur: "Serveur",
  chef_cuisinier: "Chef cuisinier",
  second_de_cuisine: "Second de cuisine",
  commis: "Commis",
  barman: "Barman",
  plongeur: "Plongeur",
  responsable_salle: "Responsable salle",
  gerant: "Gérant",
}

export const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  extra: "Extra",
  apprenti: "Apprenti",
  stage: "Stage",
}

export const LEGAL_FORM_OPTIONS = [
  { value: "sarl", label: "SARL" },
  { value: "sas", label: "SAS" },
  { value: "eurl", label: "EURL" },
  { value: "sa", label: "SA" },
  { value: "ei", label: "Entreprise individuelle" },
  { value: "micro", label: "Micro-entreprise" },
] as const

export const DAY_LABELS: Record<DayOfWeek, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
}

export const ZONE_TYPE_LABELS: Record<StorageZoneType, string> = {
  cold: "Froid",
  dry: "Sec",
  cellar: "Cave",
}

export const ROLE_LABELS: Record<RoleType, string> = {
  gerant: "Gérant",
  chef: "Chef",
  responsable_salle: "Responsable salle",
  serveur: "Serveur",
}

export const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reservations: "Réservations",
  salle: "Salle",
  planning: "Planning",
  cuisine: "Cuisine",
  stocks: "Stocks",
  fournisseurs: "Fournisseurs",
  admin: "Administration",
}

export const ACCOUNT_STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; variant: "success" | "outline" }
> = {
  active: { label: "Actif", variant: "success" },
  disabled: { label: "Désactivé", variant: "outline" },
}

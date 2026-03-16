import type {
  Employee,
  Shift,
  ServiceConfig,
  StaffingRequirement,
} from "./types"

export const employees: Employee[] = [
  {
    id: "emp-1",
    firstName: "Lucas",
    lastName: "Martin",
    role: "Chef de rang",
    department: "salle",
    contractHours: 35,
    avatarColor: "bg-blue-500",
  },
  {
    id: "emp-2",
    firstName: "Emma",
    lastName: "Dubois",
    role: "Serveur",
    department: "salle",
    contractHours: 35,
    avatarColor: "bg-pink-500",
  },
  {
    id: "emp-3",
    firstName: "Hugo",
    lastName: "Bernard",
    role: "Chef cuisinier",
    department: "cuisine",
    contractHours: 39,
    avatarColor: "bg-orange-500",
  },
  {
    id: "emp-4",
    firstName: "Chloé",
    lastName: "Petit",
    role: "Commis",
    department: "cuisine",
    contractHours: 35,
    avatarColor: "bg-emerald-500",
  },
  {
    id: "emp-5",
    firstName: "Nathan",
    lastName: "Leroy",
    role: "Barman",
    department: "bar",
    contractHours: 35,
    avatarColor: "bg-purple-500",
  },
  {
    id: "emp-6",
    firstName: "Léa",
    lastName: "Moreau",
    role: "Serveur",
    department: "salle",
    contractHours: 24,
    avatarColor: "bg-rose-500",
  },
  {
    id: "emp-7",
    firstName: "Thomas",
    lastName: "Simon",
    role: "Second de cuisine",
    department: "cuisine",
    contractHours: 39,
    avatarColor: "bg-amber-500",
  },
  {
    id: "emp-8",
    firstName: "Julie",
    lastName: "Laurent",
    role: "Plongeur",
    department: "plonge",
    contractHours: 35,
    avatarColor: "bg-teal-500",
  },
  {
    id: "emp-9",
    firstName: "Antoine",
    lastName: "Garcia",
    role: "Serveur",
    department: "salle",
    contractHours: 35,
    avatarColor: "bg-indigo-500",
  },
  {
    id: "emp-10",
    firstName: "Marie",
    lastName: "Roux",
    role: "Barman",
    department: "bar",
    contractHours: 28,
    avatarColor: "bg-violet-500",
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Shifts — designed so that:
//   • Every day meets staffingRequirements (≥3 midi, ≥3 soir; more Fri/Sat)
//   • Each employee's weekly total ≈ contractHours
//   • Kitchen staff (emp-3, emp-4, emp-7) start 1h earlier for prep
//   • Bar staff (emp-5, emp-10) work soir only, ending at 23:30 (cleanup)
//
// Weekly hours:
//   emp-1  Lucas    35h = 5×5 midi + 2×5 soir
//   emp-2  Emma     35h = 3×5 midi + 4×5 soir
//   emp-3  Hugo     39h = 3×6.5 midi + 3×6.5 soir (09:00–15:00 / 17:00–23:30)
//   emp-4  Chloé    35h = 3×6 midi + 2×6 soir + 1×5 soir (09:00–15:00 / 17:00–23:00)
//   emp-5  Nathan   35h = 5×5.5 soir + 1×5 soir + 1 (18:00–23:30)
//   emp-6  Léa      24h = 2×5 midi + 2×5 soir + 1×4 (partial)
//   emp-7  Thomas   39h = 3×6.5 midi + 3×6.5 soir
//   emp-8  Julie    35h = 5×5 midi + 2×5 soir (plonge both services)
//   emp-9  Antoine  35h = 3×5 midi + 4×5 soir
//   emp-10 Marie    28h = 4×5.5 soir + 1×5 soir + 0.5 (18:00–23:30)
// ────────────────────────────────────────────────────────────────────────────
export const initialShifts: Shift[] = [
  // ── Lundi ──────────────────────────────────────────────────────────────
  // Midi (3 salle/bar + 1 cuisine + 1 plonge = 5)
  { id: "shift-1",  employeeId: "emp-1",  day: "lundi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-2",  employeeId: "emp-9",  day: "lundi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-3",  employeeId: "emp-3",  day: "lundi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  { id: "shift-4",  employeeId: "emp-8",  day: "lundi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  // Soir (3 salle/bar + 1 cuisine + 1 plonge = 5)
  { id: "shift-5",  employeeId: "emp-2",  day: "lundi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-6",  employeeId: "emp-9",  day: "lundi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-7",  employeeId: "emp-5",  day: "lundi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-8",  employeeId: "emp-3",  day: "lundi", service: "soir", startTime: "17:00", endTime: "23:30", isFullDay: false },

  // ── Mardi ──────────────────────────────────────────────────────────────
  // Midi
  { id: "shift-9",  employeeId: "emp-1",  day: "mardi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-10", employeeId: "emp-6",  day: "mardi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-11", employeeId: "emp-4",  day: "mardi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  { id: "shift-12", employeeId: "emp-8",  day: "mardi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  // Soir
  { id: "shift-13", employeeId: "emp-2",  day: "mardi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-14", employeeId: "emp-9",  day: "mardi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-15", employeeId: "emp-10", day: "mardi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-16", employeeId: "emp-4",  day: "mardi", service: "soir", startTime: "17:00", endTime: "23:00", isFullDay: false },

  // ── Mercredi ───────────────────────────────────────────────────────────
  // Midi
  { id: "shift-17", employeeId: "emp-1",  day: "mercredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-18", employeeId: "emp-2",  day: "mercredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-19", employeeId: "emp-7",  day: "mercredi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  { id: "shift-20", employeeId: "emp-8",  day: "mercredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  // Soir
  { id: "shift-21", employeeId: "emp-6",  day: "mercredi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-22", employeeId: "emp-9",  day: "mercredi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-23", employeeId: "emp-5",  day: "mercredi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-24", employeeId: "emp-7",  day: "mercredi", service: "soir", startTime: "17:00", endTime: "23:30", isFullDay: false },

  // ── Jeudi ──────────────────────────────────────────────────────────────
  // Midi
  { id: "shift-25", employeeId: "emp-1",  day: "jeudi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-26", employeeId: "emp-2",  day: "jeudi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-27", employeeId: "emp-3",  day: "jeudi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  { id: "shift-28", employeeId: "emp-8",  day: "jeudi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  // Soir
  { id: "shift-29", employeeId: "emp-2",  day: "jeudi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-30", employeeId: "emp-6",  day: "jeudi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-31", employeeId: "emp-10", day: "jeudi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-32", employeeId: "emp-3",  day: "jeudi", service: "soir", startTime: "17:00", endTime: "23:30", isFullDay: false },

  // ── Vendredi (renforcé : 4 midi, 4 soir) ──────────────────────────────
  // Midi
  { id: "shift-33", employeeId: "emp-1",  day: "vendredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-34", employeeId: "emp-2",  day: "vendredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-35", employeeId: "emp-9",  day: "vendredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-36", employeeId: "emp-7",  day: "vendredi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  { id: "shift-37", employeeId: "emp-8",  day: "vendredi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  // Soir
  { id: "shift-38", employeeId: "emp-9",  day: "vendredi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-39", employeeId: "emp-6",  day: "vendredi", service: "soir", startTime: "18:00", endTime: "22:00", isFullDay: false },
  { id: "shift-40", employeeId: "emp-5",  day: "vendredi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-41", employeeId: "emp-10", day: "vendredi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-42", employeeId: "emp-7",  day: "vendredi", service: "soir", startTime: "17:00", endTime: "23:30", isFullDay: false },
  { id: "shift-43", employeeId: "emp-4",  day: "vendredi", service: "soir", startTime: "17:00", endTime: "23:00", isFullDay: false },

  // ── Samedi (renforcé : 4 midi, 5 soir) ────────────────────────────────
  // Midi
  { id: "shift-44", employeeId: "emp-9",  day: "samedi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-45", employeeId: "emp-6",  day: "samedi", service: "midi", startTime: "10:00", endTime: "15:00", isFullDay: false },
  { id: "shift-46", employeeId: "emp-4",  day: "samedi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  { id: "shift-47", employeeId: "emp-7",  day: "samedi", service: "midi", startTime: "09:00", endTime: "15:00", isFullDay: false },
  // Soir
  { id: "shift-48", employeeId: "emp-2",  day: "samedi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-49", employeeId: "emp-9",  day: "samedi", service: "soir", startTime: "18:00", endTime: "23:00", isFullDay: false },
  { id: "shift-50", employeeId: "emp-5",  day: "samedi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-51", employeeId: "emp-10", day: "samedi", service: "soir", startTime: "18:00", endTime: "23:30", isFullDay: false },
  { id: "shift-52", employeeId: "emp-4",  day: "samedi", service: "soir", startTime: "17:00", endTime: "23:00", isFullDay: false },
  { id: "shift-53", employeeId: "emp-7",  day: "samedi", service: "soir", startTime: "17:00", endTime: "23:30", isFullDay: false },
]

export const serviceConfig: ServiceConfig = {
  midi: { start: "10:00", end: "15:00" },
  soir: { start: "18:00", end: "23:00" },
  journee: { start: "10:00", end: "23:00" },
}

export const DAILY_BUDGET = 400 // €/jour cible

// Restaurant fermé le dimanche (openingDays dans admin-mock-data)
export const staffingRequirements: StaffingRequirement = {
  lundi: { midi: 3, soir: 3 },
  mardi: { midi: 3, soir: 3 },
  mercredi: { midi: 3, soir: 3 },
  jeudi: { midi: 3, soir: 3 },
  vendredi: { midi: 4, soir: 4 },
  samedi: { midi: 4, soir: 5 },
}

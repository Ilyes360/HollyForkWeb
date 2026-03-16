// Clients currently seated (status: arrivée in reservations/data.ts — midi service)
export const MOCK_CLIENTS: Record<
  number,
  { name: string; time: string; covers: number; notes?: string }
> = {
  3: { name: "M. Dupont", time: "12:00", covers: 2, notes: "Anniversaire de mariage" },
  7: { name: "M. Vidal", time: "13:00", covers: 3, notes: "VIP — habitué" },
  9: { name: "Mme Roux", time: "13:00", covers: 2 },
}

// Upcoming reservations (status: confirmée / en_attente — midi service)
export const MOCK_RESERVATIONS: Record<
  number,
  { name: string; time: string; covers: number }
> = {
  1: { name: "Mme Laurent", time: "12:15", covers: 4 },
  4: { name: "M. Moreau", time: "12:30", covers: 6 },
  6: { name: "Mme Petit", time: "12:30", covers: 2 },
}

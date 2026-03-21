import type { CopyInsight, EmptyStateCopy } from "./types"

export function getReservationInsight(
  confirmedCount: number,
  totalCovers: number,
  capacity: number,
): CopyInsight | null {
  if (capacity === 0) return null
  const pct = (totalCovers / capacity) * 100
  if (pct > 90) return { text: "Quasi complet \u2014 anticipe le walk-in", variant: "success" }
  if (pct > 60) return { text: `${confirmedCount} resas confirmees, bonne dynamique`, variant: "info" }
  if (pct < 30) return { text: "Service calme \u2014 mise en place legere possible", variant: "neutral" }
  return null
}

export function getReservationEmptyState(): EmptyStateCopy {
  return {
    title: "Aucune reservation pour ce service.",
    description: "Les nouvelles resas apparaitront ici en temps reel.",
  }
}

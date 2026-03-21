import type { CopyInsight } from "./types"

interface GreetingData {
  reservationCount?: number
  covers?: number
  activeTables?: number
  revenue?: number
  eveningReservations?: number
  eveningBusy?: boolean
}

export function getGreeting(
  hour: number,
  firstName?: string | null,
  data?: GreetingData,
): { title: string; subtitle: string } {
  const name = firstName ?? ""
  const title = hour < 12
    ? `Bonjour${name ? ` ${name}` : ""}`
    : hour < 18
      ? `Bon apres-midi${name ? ` ${name}` : ""}`
      : `Bonsoir${name ? ` ${name}` : ""}`

  if (!data) {
    return { title, subtitle: "Pilote ta journee, tout est la." }
  }

  let subtitle: string

  if (hour >= 9 && hour < 11) {
    const parts: string[] = []
    if (data.reservationCount != null) parts.push(`${data.reservationCount} resas`)
    if (data.covers != null) parts.push(`${data.covers} couverts attendus`)
    subtitle = parts.length > 0
      ? `Le midi se prepare. ${parts.join(", ")}.`
      : "Le midi se prepare."
  } else if (hour >= 11 && hour < 15) {
    subtitle = data.activeTables != null
      ? `Service en cours \u2014 ${data.activeTables} tables actives.`
      : "Service en cours."
  } else if (hour >= 15 && hour < 18) {
    const parts: string[] = []
    if (data.covers != null) parts.push(`${data.covers} couverts servis`)
    const charge = data.eveningBusy ? "charge" : "calme"
    if (data.eveningReservations != null) {
      parts.push(`le soir s'annonce ${charge}`)
    }
    subtitle = parts.length > 0
      ? `Le midi est boucle. ${parts.join(". ")}.`
      : "Le midi est boucle."
  } else if (hour >= 18 && hour < 19) {
    subtitle = data.eveningReservations != null
      ? `Le soir se prepare \u2014 ${data.eveningReservations} resas confirmees.`
      : "Le soir se prepare."
  } else if (hour >= 19 && hour < 23) {
    subtitle = data.activeTables != null
      ? `Service du soir en cours. ${data.activeTables} tables actives.`
      : "Service du soir en cours."
  } else if (hour >= 23) {
    const parts: string[] = []
    if (data.covers != null) parts.push(`${data.covers} couverts`)
    if (data.revenue != null) parts.push(`${data.revenue}\u00a0\u20ac de CA`)
    subtitle = parts.length > 0
      ? `Belle journee. ${parts.join(", ")}.`
      : "Belle journee."
  } else {
    subtitle = "Pilote ta journee, tout est la."
  }

  return { title, subtitle }
}

type DashboardKpiKey = "occupancyRate" | "covers" | "foodCost" | "satisfaction"

export function getDashboardKpiInsight(
  kpiKey: DashboardKpiKey,
  value: number | null,
  change?: number | null,
): CopyInsight | null {
  if (value === null) return null

  switch (kpiKey) {
    case "occupancyRate":
      if (value > 85) return { text: "Quasi complet \u2014 pense au walk-in", variant: "success" }
      if (value >= 60) return { text: "Bonne dynamique, de la place en reserve", variant: "info" }
      if (value < 40) return { text: "Salle calme \u2014 bon moment pour briefer l'equipe", variant: "neutral" }
      return null

    case "covers":
      if (change != null && change > 15) return { text: "Nette progression vs semaine derniere", variant: "success" }
      if (change != null && change < -10) return { text: "En baisse \u2014 verifie les resas cette semaine", variant: "warning" }
      return null

    case "foodCost":
      if (value < 28) return { text: "Maitrise \u2014 en dessous des 28%", variant: "success" }
      if (value <= 32) return { text: "Dans les clous", variant: "info" }
      if (value <= 35) return { text: "Ca monte \u2014 verifie les portions", variant: "warning" }
      return { text: "A creuser \u2014 commande ou gaspillage ?", variant: "danger" }

    case "satisfaction":
      if (value > 4.5) return { text: "Tes clients sont conquis", variant: "success" }
      if (value >= 4.0) return { text: "Solide, quelques details a peaufiner", variant: "info" }
      if (value < 3.5) return { text: "Attention \u2014 regarde les retours recents", variant: "danger" }
      return null

    default:
      return null
  }
}

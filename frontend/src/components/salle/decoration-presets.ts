import type { DecorationShape, DecorationCategory } from "./types"

type OmitPosition<T> = Omit<T, "id" | "x" | "y" | "rotation">

export interface DecorationPresetDef {
  preset: OmitPosition<DecorationShape>
  label: string
  description: string
}

export const DECORATION_CATEGORY_LABELS: Record<DecorationCategory, string> = {
  "structure": "Structure",
  "service-furniture": "Mobilier de service",
  "fixed-seating": "Assises fixes",
  "partitions": "Cloisons",
  "counters": "Comptoirs",
  "signage": "Signalétique",
  "plants": "Plantes",
  "kitchen-service": "Cuisine / Service",
  "terrace": "Terrasse",
  "safety": "Sécurité",
  "comfort": "Confort",
}

export const DECORATION_PRESETS: DecorationPresetDef[] = [
  // ── Structure ──
  { preset: { kind: "decoration", decorationType: "column-round", category: "structure", shapeType: "circle", label: "Colonne", radius: 15 }, label: "Colonne ronde", description: "Ø30" },
  { preset: { kind: "decoration", decorationType: "column-square", category: "structure", shapeType: "rect", label: "Colonne", width: 30, height: 30 }, label: "Colonne carrée", description: "30×30" },
  { preset: { kind: "decoration", decorationType: "stairs", category: "structure", shapeType: "rect", label: "Escalier", width: 100, height: 60 }, label: "Escalier", description: "100×60" },
  { preset: { kind: "decoration", decorationType: "ramp", category: "structure", shapeType: "rect", label: "Rampe", width: 120, height: 40 }, label: "Rampe d'accès", description: "120×40" },

  // ── Service furniture ──
  { preset: { kind: "decoration", decorationType: "hostess-stand", category: "service-furniture", shapeType: "rect", label: "Accueil", width: 60, height: 40 }, label: "Pupitre d'accueil", description: "60×40" },
  { preset: { kind: "decoration", decorationType: "server-station", category: "service-furniture", shapeType: "rect", label: "Office", width: 80, height: 50 }, label: "Office serveur", description: "80×50" },
  { preset: { kind: "decoration", decorationType: "pos-terminal", category: "service-furniture", shapeType: "rect", label: "Caisse", width: 40, height: 30 }, label: "Terminal de caisse", description: "40×30" },

  // ── Fixed seating ──
  { preset: { kind: "decoration", decorationType: "banquette-straight", category: "fixed-seating", shapeType: "line", label: "Banquette", points: [0, 0, 160, 0], thickness: 20 }, label: "Banquette droite", description: "160 cm" },
  { preset: { kind: "decoration", decorationType: "banquette-l", category: "fixed-seating", shapeType: "line", label: "Banquette L", points: [0, 0, 120, 0, 120, 80], thickness: 20 }, label: "Banquette en L", description: "120×80" },
  { preset: { kind: "decoration", decorationType: "banquette-u", category: "fixed-seating", shapeType: "line", label: "Banquette U", points: [0, 0, 0, 80, 120, 80, 120, 0], thickness: 20 }, label: "Banquette en U", description: "120×80" },
  { preset: { kind: "decoration", decorationType: "bar-stool", category: "fixed-seating", shapeType: "circle", label: "Tabouret", radius: 15 }, label: "Tabouret de bar", description: "Ø30" },

  // ── Partitions ──
  { preset: { kind: "decoration", decorationType: "partition-solid", category: "partitions", shapeType: "line", label: "Cloison", points: [0, 0, 120, 0], thickness: 8 }, label: "Cloison pleine", description: "120 cm" },
  { preset: { kind: "decoration", decorationType: "partition-glass", category: "partitions", shapeType: "line", label: "Vitrage", points: [0, 0, 120, 0], thickness: 4 }, label: "Cloison vitrée", description: "120 cm" },
  { preset: { kind: "decoration", decorationType: "partition-lattice", category: "partitions", shapeType: "line", label: "Claustra", points: [0, 0, 100, 0], thickness: 6 }, label: "Claustra", description: "100 cm" },
  { preset: { kind: "decoration", decorationType: "rope-barrier", category: "partitions", shapeType: "line", label: "Cordon", points: [0, 0, 100, 0], thickness: 3 }, label: "Poteau à cordon", description: "100 cm" },

  // ── Counters ──
  { preset: { kind: "decoration", decorationType: "bar-counter-straight", category: "counters", shapeType: "line", label: "Comptoir", points: [0, 0, 200, 0], thickness: 30 }, label: "Comptoir droit", description: "200 cm" },
  { preset: { kind: "decoration", decorationType: "bar-counter-l", category: "counters", shapeType: "line", label: "Comptoir L", points: [0, 0, 160, 0, 160, 100], thickness: 30 }, label: "Comptoir en L", description: "160×100" },
  { preset: { kind: "decoration", decorationType: "bar-counter-curved", category: "counters", shapeType: "rect", label: "Comptoir", width: 160, height: 60 }, label: "Comptoir courbe", description: "160×60" },

  // ── Signage ──
  { preset: { kind: "decoration", decorationType: "sign-restroom-m", category: "signage", shapeType: "rect", label: "WC H", width: 24, height: 24 }, label: "WC Hommes", description: "24×24" },
  { preset: { kind: "decoration", decorationType: "sign-restroom-f", category: "signage", shapeType: "rect", label: "WC F", width: 24, height: 24 }, label: "WC Femmes", description: "24×24" },
  { preset: { kind: "decoration", decorationType: "sign-restroom-pmr", category: "signage", shapeType: "rect", label: "PMR", width: 24, height: 24 }, label: "WC PMR", description: "24×24" },
  { preset: { kind: "decoration", decorationType: "sign-emergency-exit", category: "signage", shapeType: "rect", label: "Sortie", width: 30, height: 20 }, label: "Sortie de secours", description: "30×20" },

  // ── Plants ──
  { preset: { kind: "decoration", decorationType: "plant-pot-s", category: "plants", shapeType: "circle", label: "Plante", radius: 12 }, label: "Pot S", description: "Ø24" },
  { preset: { kind: "decoration", decorationType: "plant-pot-m", category: "plants", shapeType: "circle", label: "Plante", radius: 20 }, label: "Pot M", description: "Ø40" },
  { preset: { kind: "decoration", decorationType: "plant-pot-l", category: "plants", shapeType: "circle", label: "Plante", radius: 30 }, label: "Pot L", description: "Ø60" },
  { preset: { kind: "decoration", decorationType: "planter-rect", category: "plants", shapeType: "rect", label: "Jardinière", width: 80, height: 25 }, label: "Jardinière", description: "80×25" },
  { preset: { kind: "decoration", decorationType: "plant-hanging", category: "plants", shapeType: "circle", label: "Suspendu", radius: 15 }, label: "Plante suspendue", description: "Ø30" },

  // ── Kitchen/service ──
  { preset: { kind: "decoration", decorationType: "service-window", category: "kitchen-service", shapeType: "rect", label: "Passe", width: 80, height: 20 }, label: "Passe-plat", description: "80×20" },
  { preset: { kind: "decoration", decorationType: "buffet", category: "kitchen-service", shapeType: "rect", label: "Buffet", width: 160, height: 60 }, label: "Buffet", description: "160×60" },
  { preset: { kind: "decoration", decorationType: "coffee-station", category: "kitchen-service", shapeType: "rect", label: "Café", width: 60, height: 50 }, label: "Station café", description: "60×50" },
  { preset: { kind: "decoration", decorationType: "dessert-display", category: "kitchen-service", shapeType: "rect", label: "Desserts", width: 80, height: 50 }, label: "Vitrine desserts", description: "80×50" },
  { preset: { kind: "decoration", decorationType: "wine-rack", category: "kitchen-service", shapeType: "rect", label: "Vins", width: 60, height: 100 }, label: "Casier à vins", description: "60×100" },

  // ── Terrace ──
  { preset: { kind: "decoration", decorationType: "parasol", category: "terrace", shapeType: "circle", label: "Parasol", radius: 60 }, label: "Parasol", description: "Ø120" },
  { preset: { kind: "decoration", decorationType: "patio-heater", category: "terrace", shapeType: "circle", label: "Chauffage", radius: 15 }, label: "Chauffage terrasse", description: "Ø30" },
  { preset: { kind: "decoration", decorationType: "windscreen", category: "terrace", shapeType: "line", label: "Brise-vent", points: [0, 0, 150, 0], thickness: 4 }, label: "Brise-vent", description: "150 cm" },
  { preset: { kind: "decoration", decorationType: "terrace-planter", category: "terrace", shapeType: "rect", label: "Bac", width: 100, height: 30 }, label: "Bac à plantes", description: "100×30" },

  // ── Safety ──
  { preset: { kind: "decoration", decorationType: "fire-extinguisher", category: "safety", shapeType: "rect", label: "Ext.", width: 16, height: 16 }, label: "Extincteur", description: "16×16" },
  { preset: { kind: "decoration", decorationType: "emergency-exit-sign", category: "safety", shapeType: "rect", label: "Sortie", width: 30, height: 20 }, label: "Panneau sortie", description: "30×20" },
  { preset: { kind: "decoration", decorationType: "smoke-detector", category: "safety", shapeType: "circle", label: "Détecteur", radius: 8 }, label: "Détecteur fumée", description: "Ø16" },

  // ── Comfort ──
  { preset: { kind: "decoration", decorationType: "fireplace", category: "comfort", shapeType: "rect", label: "Cheminée", width: 100, height: 40 }, label: "Cheminée", description: "100×40" },
  { preset: { kind: "decoration", decorationType: "coat-rack", category: "comfort", shapeType: "rect", label: "Vestiaire", width: 60, height: 30 }, label: "Vestiaire", description: "60×30" },
  { preset: { kind: "decoration", decorationType: "umbrella-stand", category: "comfort", shapeType: "circle", label: "Parapluies", radius: 12 }, label: "Porte-parapluies", description: "Ø24" },
]

export const DECORATION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DECORATION_PRESETS.map((d) => [d.preset.decorationType, d.label])
)

export function getDecorationsByCategory(): { category: DecorationCategory; label: string; items: DecorationPresetDef[] }[] {
  const seen = new Set<DecorationCategory>()
  const result: { category: DecorationCategory; label: string; items: DecorationPresetDef[] }[] = []
  for (const d of DECORATION_PRESETS) {
    if (!seen.has(d.preset.category)) {
      seen.add(d.preset.category)
      result.push({
        category: d.preset.category,
        label: DECORATION_CATEGORY_LABELS[d.preset.category],
        items: DECORATION_PRESETS.filter((p) => p.preset.category === d.preset.category),
      })
    }
  }
  return result
}

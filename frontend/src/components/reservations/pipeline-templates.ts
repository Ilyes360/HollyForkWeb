import type { PipelineTemplate } from "./types"

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "bistrot",
    name: "Bistrot",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "Inst.", color: "text-blue-500", avgDurationMinutes: 0, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "Cmd", color: "text-amber-500", avgDurationMinutes: 8, order: 1 },
      { id: "plat_servi", label: "Plat servi", shortLabel: "Plat", color: "text-orange-500", avgDurationMinutes: 20, order: 2 },
      { id: "addition", label: "Addition", shortLabel: "Add.", color: "text-emerald-500", avgDurationMinutes: 35, order: 3 },
    ],
  },
  {
    id: "brasserie",
    name: "Brasserie",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "Inst.", color: "text-blue-500", avgDurationMinutes: 0, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "Cmd", color: "text-amber-500", avgDurationMinutes: 8, order: 1 },
      { id: "entree_servie", label: "Entrée servie", shortLabel: "Ent.", color: "text-yellow-500", avgDurationMinutes: 18, order: 2 },
      { id: "plat_servi", label: "Plat servi", shortLabel: "Plat", color: "text-orange-500", avgDurationMinutes: 35, order: 3 },
      { id: "dessert_servi", label: "Dessert servi", shortLabel: "Dess.", color: "text-pink-500", avgDurationMinutes: 55, order: 4 },
      { id: "addition", label: "Addition", shortLabel: "Add.", color: "text-emerald-500", avgDurationMinutes: 65, order: 5 },
    ],
  },
  {
    id: "gastronomique",
    name: "Gastronomique",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "Inst.", color: "text-blue-500", avgDurationMinutes: 0, order: 0 },
      { id: "aperitif", label: "Apéritif", shortLabel: "Apér.", color: "text-violet-500", avgDurationMinutes: 5, order: 1 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "Cmd", color: "text-amber-500", avgDurationMinutes: 15, order: 2 },
      { id: "amuse_bouche", label: "Amuse-bouche", shortLabel: "Am.B.", color: "text-cyan-500", avgDurationMinutes: 20, order: 3 },
      { id: "entree_servie", label: "Entrée servie", shortLabel: "Ent.", color: "text-yellow-500", avgDurationMinutes: 30, order: 4 },
      { id: "poisson", label: "Poisson", shortLabel: "Pois.", color: "text-sky-500", avgDurationMinutes: 50, order: 5 },
      { id: "plat_servi", label: "Plat servi", shortLabel: "Plat", color: "text-orange-500", avgDurationMinutes: 70, order: 6 },
      { id: "fromage", label: "Fromage", shortLabel: "From.", color: "text-amber-600", avgDurationMinutes: 90, order: 7 },
      { id: "dessert_servi", label: "Dessert servi", shortLabel: "Dess.", color: "text-pink-500", avgDurationMinutes: 105, order: 8 },
      { id: "addition", label: "Addition", shortLabel: "Add.", color: "text-emerald-500", avgDurationMinutes: 120, order: 9 },
    ],
  },
  {
    id: "bar",
    name: "Bar",
    stages: [
      { id: "installe", label: "Installé", shortLabel: "Inst.", color: "text-blue-500", avgDurationMinutes: 0, order: 0 },
      { id: "commande_passee", label: "Commande passée", shortLabel: "Cmd", color: "text-amber-500", avgDurationMinutes: 3, order: 1 },
      { id: "servi", label: "Servi", shortLabel: "Serv.", color: "text-orange-500", avgDurationMinutes: 8, order: 2 },
      { id: "addition", label: "Addition", shortLabel: "Add.", color: "text-emerald-500", avgDurationMinutes: 30, order: 3 },
    ],
  },
]

export function getTemplateById(id: string): PipelineTemplate | undefined {
  return PIPELINE_TEMPLATES.find((t) => t.id === id)
}

import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  Calendar03Icon,
  ChartLineData02Icon,
  Store04Icon,
} from "@hugeicons/core-free-icons"
import { Label } from "@/components/ui/label"
import { useOnboardingStore } from "../store"

const modules = [
  {
    id: "commandes",
    name: "Commandes fournisseurs",
    description: "Catalogues intégrés, historique, comparaison de prix et confirmation automatique.",
    icon: PackageIcon,
    recommended: true,
  },
  {
    id: "stocks",
    name: "Gestion des stocks",
    description: "Suivi en temps réel, alertes de seuil critique et dates de péremption.",
    icon: Store04Icon,
    recommended: true,
  },
  {
    id: "reservations",
    name: "Réservations",
    description: "Plan de salle interactif, confirmations SMS/email, widget pour votre site web.",
    icon: Calendar03Icon,
    recommended: false,
  },
  {
    id: "analytics",
    name: "Tableau de bord & Analytics",
    description: "CA du jour, marge brute, tendances de ventes, top produits rentables.",
    icon: ChartLineData02Icon,
    recommended: true,
  },
]

const recommendedDefaults = modules.filter((m) => m.recommended).map((m) => m.id)

export function ModulesContent() {
  const { data, updateModules } = useOnboardingStore()

  useEffect(() => {
    if (data.modules.length === 0) {
      updateModules(recommendedDefaults)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleModule = (moduleId: string) => {
    const next = data.modules.includes(moduleId)
      ? data.modules.filter((id) => id !== moduleId)
      : [...data.modules, moduleId]
    updateModules(next)
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Sélectionnez vos modules ({data.modules.length}/{modules.length})
      </Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="group" aria-label="Modules">
        {modules.map((mod) => {
          const isSelected = data.modules.includes(mod.id)
          return (
            <button
              key={mod.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleModule(mod.id)}
              className={`relative flex cursor-pointer items-start gap-4 rounded-xl p-4 text-left ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                isSelected
                  ? "ring-primary bg-primary/5"
                  : "ring-border bg-card"
              }`}
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={mod.icon} className="size-4.5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="font-semibold">{mod.name}</span>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {mod.description}
                </p>
              </div>
              <div
                className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 transition-all duration-150 ${
                  isSelected
                    ? "ring-primary bg-primary text-primary-foreground"
                    : "ring-border"
                }`}
              >
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3 transition-transform duration-150"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

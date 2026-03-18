import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { Label } from "@/components/ui/label"
import { useOnboardingStore } from "../store"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "49",
    period: "/mois",
    description: "L'essentiel pour démarrer",
    features: [
      "1 établissement",
      "Commandes fournisseurs",
      "Gestion des stocks",
      "Support par email",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "99",
    originalPrice: "149",
    period: "/mois",
    description: "Tout pour piloter votre restaurant",
    features: [
      "Tout du plan Starter",
      "Réservations + plan de salle",
      "Analytics avancés",
      "Multi-établissements",
      "Support prioritaire",
      "Widget de réservation",
    ],
    highlight: true,
  },
]

export function PlanContent() {
  const { data, updatePlan } = useOnboardingStore()

  useEffect(() => {
    if (!data.plan) {
      updatePlan("pro")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Votre plan
      </Label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="radiogroup" aria-label="Choix du plan">
        {plans.map((plan) => {
          const isSelected = data.plan === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => updatePlan(plan.id)}
              className={`relative flex cursor-pointer flex-col rounded-xl p-5 text-left ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                isSelected
                  ? "ring-primary bg-primary/5"
                  : "ring-border bg-card"
              } ${plan.highlight ? "ring-2 ring-primary" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 right-4 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground animate-in fade-in duration-300">
                  Populaire
                </span>
              )}
              <div className="mb-4">
                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}€</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
                {plan.originalPrice && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">
                    {plan.originalPrice}€
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon icon={Tick02Icon} className="size-4 shrink-0 text-primary" strokeWidth={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}

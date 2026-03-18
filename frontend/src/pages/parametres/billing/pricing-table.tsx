import { useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tick02Icon,
  Cancel01Icon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const features = [
  { label: "Établissements", starter: "1", pro: "Illimité" },
  { label: "Commandes fournisseurs", starter: true, pro: true },
  { label: "Gestion des stocks", starter: true, pro: true },
  { label: "Tableau de bord & KPIs", starter: true, pro: true },
  { label: "Réservations + plan de salle", starter: false, pro: true },
  { label: "Planning équipe", starter: false, pro: true },
  { label: "Analytics avancés", starter: false, pro: true },
  { label: "Widget de réservation", starter: false, pro: true },
  { label: "Support", starter: "Email", pro: "Prioritaire" },
]

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "L'essentiel pour démarrer",
    monthlyPrice: 49,
    yearlyPrice: 470,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Tout pour piloter votre restaurant",
    monthlyPrice: 99,
    yearlyPrice: 950,
    highlight: true,
  },
]

export default function PricingTable() {
  const [isYearly, setIsYearly] = useState(false)
  const navigate = useNavigate()

  const formatPrice = (price: number) => `${price}€`

  const calculateSavings = (monthly: number, yearly: number) => {
    const savings = ((monthly * 12 - yearly) / (monthly * 12)) * 100
    return Math.round(savings)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/settings/billing")}
          className="mb-4 gap-1.5 text-muted-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          Retour à la facturation
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Changer de plan</h1>
            <p className="mt-1 text-muted-foreground">
              Essai gratuit de 14 jours, sans engagement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!isYearly ? "font-semibold" : "text-muted-foreground"}`}>
              Mensuel
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              aria-label="Basculer en annuel"
            />
            <span className={`text-sm ${isYearly ? "font-semibold" : "text-muted-foreground"}`}>
              Annuel
            </span>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-xl p-6 ring-1 transition-all ${
              plan.highlight
                ? "ring-2 ring-primary bg-primary/5"
                : "ring-border bg-card"
            }`}
          >
            {plan.highlight && (
              <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground">
                Populaire
              </Badge>
            )}
            <div className="mb-4">
              <h3 className="font-display text-lg font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {formatPrice(isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice)}
              </span>
              <span className="text-sm text-muted-foreground">/mois</span>
              {isYearly && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatPrice(plan.yearlyPrice)}/an — {calculateSavings(plan.monthlyPrice, plan.yearlyPrice)}% d'économie)
                </span>
              )}
            </div>
            <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
              Choisir {plan.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Fonctionnalités
              </th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-4 py-3 text-center font-semibold">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.label}
                className={index < features.length - 1 ? "border-b" : ""}
              >
                <td className="px-4 py-3 font-medium">{feature.label}</td>
                <td className="px-4 py-3 text-center">
                  <FeatureValue value={feature.starter} />
                </td>
                <td className="px-4 py-3 text-center">
                  <FeatureValue value={feature.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span>{value}</span>
  }
  if (value) {
    return (
      <HugeiconsIcon
        icon={Tick02Icon}
        strokeWidth={2}
        className="mx-auto size-4 text-primary"
      />
    )
  }
  return (
    <HugeiconsIcon
      icon={Cancel01Icon}
      strokeWidth={2}
      className="mx-auto size-4 text-muted-foreground/40"
    />
  )
}

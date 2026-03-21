import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ONBOARDING } from "@/lib/copy/onboarding"
import { useWizardStore } from "../store"

const CUISINE_TYPES = [
  { value: "francaise", emoji: "\u{1F1EB}\u{1F1F7}", label: "Francaise" },
  { value: "italienne", emoji: "\u{1F1EE}\u{1F1F9}", label: "Italienne" },
  { value: "japonaise", emoji: "\u{1F1EF}\u{1F1F5}", label: "Japonaise" },
  { value: "mexicaine", emoji: "\u{1F1F2}\u{1F1FD}", label: "Mexicaine" },
  { value: "indienne", emoji: "\u{1F1EE}\u{1F1F3}", label: "Indienne" },
  { value: "mediterraneenne", emoji: "\u{1F33F}", label: "Mediterraneenne" },
  { value: "asiatique", emoji: "\u{1F962}", label: "Asiatique" },
  { value: "bistronomique", emoji: "\u{1F377}", label: "Bistronomique" },
  { value: "autre", emoji: "\u{1F374}", label: "Autre" },
]

const HOUR_PRESETS = [
  { label: "Midi + Soir", value: "11:30 \u2013 14:30, 19:00 \u2013 23:00" },
  { label: "Continu", value: "11:00 \u2013 23:00" },
  { label: "Soir uniquement", value: "18:00 \u2013 23:30" },
]

export function StepRestaurant() {
  const data = useWizardStore((s) => s.data)
  const update = useWizardStore((s) => s.updateRestaurant)

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{ONBOARDING.restaurant.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ONBOARDING.restaurant.description}
        </p>
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {ONBOARDING.restaurant.labels.name}
        </Label>
        <Input
          value={data.restaurantName}
          onChange={(e) => update({ restaurantName: e.target.value })}
          placeholder={ONBOARDING.restaurant.placeholders.name}
          className="h-10"
        />
      </div>

      {/* Cuisine type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {ONBOARDING.restaurant.labels.cuisineType}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {CUISINE_TYPES.map((ct) => {
            const selected = data.cuisineType === ct.value
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => update({ cuisineType: ct.value })}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ring-1",
                  selected
                    ? "ring-primary bg-primary/5 font-medium"
                    : "ring-border bg-card hover:bg-muted/50"
                )}
              >
                <span className="text-base">{ct.emoji}</span>
                <span className="truncate">{ct.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Capacite */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {ONBOARDING.restaurant.labels.capacity}
        </Label>
        <Input
          type="number"
          value={data.capacity}
          onChange={(e) => update({ capacity: e.target.value })}
          placeholder={ONBOARDING.restaurant.placeholders.capacity}
          className="h-10 w-32"
          min={1}
        />
      </div>

      {/* Horaires */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {ONBOARDING.restaurant.labels.openingHours}
        </Label>
        <div className="flex flex-wrap gap-2">
          {HOUR_PRESETS.map((preset) => {
            const selected = data.openingHours === preset.value
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => update({ openingHours: preset.value })}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ring-1",
                  selected
                    ? "ring-primary bg-primary/5 text-primary"
                    : "ring-border bg-card hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={2} />
                {preset.label}
              </button>
            )
          })}
        </div>
        <Input
          value={data.openingHours}
          onChange={(e) => update({ openingHours: e.target.value })}
          placeholder={ONBOARDING.restaurant.placeholders.openingHours}
          className="h-10 text-sm"
        />
      </div>
    </div>
  )
}

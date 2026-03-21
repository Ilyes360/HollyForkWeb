import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useWizardStore } from "../store"

const CUISINE_TYPES = [
  { value: "francaise", emoji: "🇫🇷", label: "Francaise" },
  { value: "italienne", emoji: "🇮🇹", label: "Italienne" },
  { value: "japonaise", emoji: "🇯🇵", label: "Japonaise" },
  { value: "mexicaine", emoji: "🇲🇽", label: "Mexicaine" },
  { value: "indienne", emoji: "🇮🇳", label: "Indienne" },
  { value: "mediterraneenne", emoji: "🌿", label: "Mediterraneenne" },
  { value: "asiatique", emoji: "🥢", label: "Asiatique" },
  { value: "bistronomique", emoji: "🍷", label: "Bistronomique" },
  { value: "autre", emoji: "🍴", label: "Autre" },
]

const HOUR_PRESETS = [
  { label: "Midi + Soir", value: "11:30 – 14:30, 19:00 – 23:00" },
  { label: "Continu", value: "11:00 – 23:00" },
  { label: "Soir uniquement", value: "18:00 – 23:30" },
]

export function StepRestaurant() {
  const data = useWizardStore((s) => s.data)
  const update = useWizardStore((s) => s.updateRestaurant)

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Votre restaurant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations de base sur votre etablissement
        </p>
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Nom du restaurant
        </Label>
        <Input
          value={data.restaurantName}
          onChange={(e) => update({ restaurantName: e.target.value })}
          placeholder="Ex : Le Petit Bistrot"
          className="h-10"
        />
      </div>

      {/* Cuisine type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Type de cuisine
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
          Capacite (couverts)
        </Label>
        <Input
          type="number"
          value={data.capacity}
          onChange={(e) => update({ capacity: e.target.value })}
          placeholder="Ex : 40"
          className="h-10 w-32"
          min={1}
        />
      </div>

      {/* Horaires */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Horaires d'ouverture
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
          placeholder="Ou saisissez vos horaires"
          className="h-10 text-sm"
        />
      </div>
    </div>
  )
}

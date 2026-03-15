import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChairBarberIcon,
  Restaurant01Icon,
  Home04Icon,
  Building03Icon,
  UserIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { Label } from "@/components/ui/label"
import { useOnboardingStore } from "../store"

const coversOptions = [
  { value: "1-30", label: "1 - 30", desc: "Petit établissement", icon: ChairBarberIcon },
  { value: "31-60", label: "31 - 60", desc: "Taille moyenne", icon: Restaurant01Icon },
  { value: "61-100", label: "61 - 100", desc: "Grand restaurant", icon: Home04Icon },
  { value: "100+", label: "100+", desc: "Très grande capacité", icon: Building03Icon },
]

const teamOptions = [
  { value: "1-5", label: "1 - 5", desc: "Petite équipe", icon: UserIcon },
  { value: "6-15", label: "6 - 15", desc: "Équipe moyenne", icon: UserGroupIcon },
  { value: "16-30", label: "16 - 30", desc: "Grande équipe", icon: UserGroupIcon },
  { value: "30+", label: "30+", desc: "Très grande équipe", icon: UserGroupIcon },
]

export function EstablishmentContent() {
  const { data, updateEstablishment } = useOnboardingStore()

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Nombre de couverts
        </Label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-label="Nombre de couverts">
          {coversOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={data.establishment.covers === option.value}
              onClick={() => updateEstablishment({ covers: option.value })}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl px-3 py-5 ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                data.establishment.covers === option.value
                  ? "ring-primary bg-primary/5"
                  : "ring-border bg-card"
              }`}
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={option.icon} className="size-4.5" strokeWidth={2} />
              </div>
              <span className="font-semibold">{option.label}</span>
              <span className="text-muted-foreground text-center text-xs">{option.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Taille de l'équipe
        </Label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-label="Taille de l'équipe">
          {teamOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={data.establishment.teamSize === option.value}
              onClick={() => updateEstablishment({ teamSize: option.value })}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl px-3 py-5 ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                data.establishment.teamSize === option.value
                  ? "ring-primary bg-primary/5"
                  : "ring-border bg-card"
              }`}
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={option.icon} className="size-4.5" strokeWidth={2} />
              </div>
              <span className="font-semibold">{option.label}</span>
              <span className="text-muted-foreground text-center text-xs">{option.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Vous gérez plusieurs établissements ? Vous pourrez les ajouter depuis votre tableau de bord.
      </p>
    </div>
  )
}

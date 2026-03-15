import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { useOnboardingStore } from "../store"
import type { LocationData } from "@/types/location"

const cuisineTypes = [
  { value: "francaise", label: "Cuisine française", icon: "🇫🇷" },
  { value: "italienne", label: "Italienne", icon: "🇮🇹" },
  { value: "japonaise", label: "Japonaise", icon: "🇯🇵" },
  { value: "mediterraneenne", label: "Méditerranéenne", icon: "🌿" },
  { value: "asiatique", label: "Asiatique", icon: "🥢" },
  { value: "bistrot", label: "Bistrot / Brasserie", icon: "🍷" },
  { value: "street-food", label: "Street food", icon: "🌮" },
  { value: "gastronomique", label: "Gastronomique", icon: "⭐" },
  { value: "autre", label: "Autre", icon: "🍴" },
]

export function WelcomeContent() {
  const { data, updateRestaurant } = useOnboardingStore()

  const handleLocationChange = (location: LocationData | null) => {
    updateRestaurant({
      location,
      city: location?.city ?? "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="restaurant-name">Nom du restaurant</Label>
        <Input
          id="restaurant-name"
          placeholder="Ex : Le Petit Bistrot"
          value={data.restaurant.name}
          onChange={(e) => updateRestaurant({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Adresse</Label>
        <AddressAutocomplete
          value={data.restaurant.location}
          onValueChange={handleLocationChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Type de cuisine</Label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type de cuisine">
          {cuisineTypes.map((cuisine) => (
            <button
              key={cuisine.value}
              type="button"
              role="radio"
              aria-checked={data.restaurant.cuisineType === cuisine.value}
              onClick={() => updateRestaurant({ cuisineType: cuisine.value })}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-4 py-3 text-sm ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                data.restaurant.cuisineType === cuisine.value
                  ? "ring-primary bg-primary/5 text-foreground"
                  : "ring-border bg-card text-muted-foreground"
              }`}
            >
              <span className="text-base">{cuisine.icon}</span>
              <span className="leading-tight">{cuisine.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Restaurant01Icon,
  Location01Icon,
  CreditCardIcon,
  UserGroupIcon,
  ChairBarberIcon,
  Tick02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../store"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { useAuthStore } from "@/stores/auth-store"
import { useCreateRestaurant } from "@/api/restaurants/mutations"
import { celebrationCheckmark } from "../animations"

function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function CompletionContent() {
  const navigate = useNavigate()
  const { data, reset } = useOnboardingStore()
  const completeTask = useGettingStartedStore((s) => s.completeTask)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const createRestaurant = useCreateRestaurant()

  const planName = data.plan === "pro" ? "Pro" : "Starter"

  const handleGoToDashboard = () => {
    createRestaurant.mutate(
      {
        name: data.restaurant.name,
        address: data.restaurant.city,
        postalCode: "",
        city: data.restaurant.city,
        phoneNumber: "",
        siret: "",
        pin: generateRandomPin(),
      },
      {
        onSuccess: (restaurant) => {
          // Sync the new restaurant into the auth store
          if (user) {
            setUser({
              ...user,
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            })
          }
          sessionStorage.removeItem("holy_pending_restaurant")
          completeTask("restaurant-profile")
          reset()
          navigate("/")
        },
        onError: () => {
          toast.error(
            "Erreur lors de la création du restaurant. Veuillez réessayer."
          )
        },
      }
    )
  }

  const summaryLines = [
    {
      icon: Restaurant01Icon,
      label: "Restaurant",
      value: data.restaurant.name,
    },
    { icon: Location01Icon, label: "Ville", value: data.restaurant.city },
    {
      icon: ChairBarberIcon,
      label: "Couverts",
      value: data.establishment.covers,
    },
    {
      icon: UserGroupIcon,
      label: "Équipe",
      value: `${data.establishment.teamSize} personnes`,
    },
    {
      icon: CreditCardIcon,
      label: "Offre",
      value: `${planName} — essai gratuit 14 jours`,
    },
  ]

  return (
    <div className="flex flex-col items-center space-y-8 text-center">
      <motion.div
        {...celebrationCheckmark}
        className="flex size-16 items-center justify-center rounded-full bg-primary/10"
      >
        <HugeiconsIcon
          icon={Tick02Icon}
          className="size-8 text-primary"
          strokeWidth={2}
        />
      </motion.div>

      <div>
        <h1 className="font-display text-2xl font-bold">
          C'est parti, {data.restaurant.name} !
        </h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Votre espace Holy Fork est prêt. Voici un récapitulatif.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {summaryLines.map((line) => (
          <div
            key={line.label}
            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  icon={line.icon}
                  className="size-4"
                  strokeWidth={2}
                />
              </div>
              <span className="text-muted-foreground">{line.label}</span>
            </div>
            <span className="font-medium">{line.value}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md pt-2">
        <Button
          size="lg"
          onClick={handleGoToDashboard}
          className="w-full"
          disabled={createRestaurant.isPending}
        >
          {createRestaurant.isPending ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
              Création en cours...
            </>
          ) : (
            "Accéder à mon tableau de bord"
          )}
        </Button>
      </div>
    </div>
  )
}

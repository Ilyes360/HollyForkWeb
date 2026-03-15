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
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../store"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { useAdminStore } from "@/stores/admin-store"
import { celebrationCheckmark } from "../animations"

export function CompletionContent() {
  const navigate = useNavigate()
  const { data, reset } = useOnboardingStore()
  const completeTask = useGettingStartedStore((s) => s.completeTask)
  const addEstablishment = useAdminStore((s) => s.addEstablishment)
  const setCurrentEstablishment = useAdminStore((s) => s.setCurrentEstablishment)

  const planName = data.plan === "pro" ? "Pro" : "Starter"

  const handleGoToDashboard = () => {
    const loc = data.restaurant.location
    const cap = data.establishment.covers === "100+" ? 120 : parseInt(data.establishment.covers.split("-").pop() ?? "30", 10)
    const now = new Date().toISOString()
    const id = `est-${Date.now()}`
    addEstablishment({
      id,
      name: data.restaurant.name,
      address: loc,
      phone: "",
      email: "",
      siret: "",
      tvaNumber: "",
      legalForm: "",
      totalCapacity: cap,
      openingDays: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
      services: [],
      storageZones: [],
      isActive: true,
      legalInfo: { licenseType: "", licenseNumber: "", insurance: "", erpCapacity: cap, notes: "" },
      createdAt: now,
      updatedAt: now,
    })
    setCurrentEstablishment(id)
    completeTask("restaurant-profile")
    reset()
    navigate("/")
  }

  const summaryLines = [
    { icon: Restaurant01Icon, label: "Restaurant", value: data.restaurant.name },
    { icon: Location01Icon, label: "Ville", value: data.restaurant.city },
    { icon: ChairBarberIcon, label: "Couverts", value: data.establishment.covers },
    { icon: UserGroupIcon, label: "Équipe", value: `${data.establishment.teamSize} personnes` },
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
        <HugeiconsIcon icon={Tick02Icon} className="size-8 text-primary" strokeWidth={2} />
      </motion.div>

      <div>
        <h1 className="text-2xl font-bold">C'est parti, {data.restaurant.name} !</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Votre espace Holly Fork est prêt. Voici un récapitulatif.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {summaryLines.map((line) => (
          <div
            key={line.label}
            className="flex items-center justify-between rounded-xl ring-1 ring-foreground/10 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={line.icon} className="size-4" strokeWidth={2} />
              </div>
              <span className="text-muted-foreground">{line.label}</span>
            </div>
            <span className="font-medium">{line.value}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md pt-2">
        <Button size="lg" onClick={handleGoToDashboard} className="w-full">
          Accéder à mon tableau de bord
        </Button>
      </div>
    </div>
  )
}

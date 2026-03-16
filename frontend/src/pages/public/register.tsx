import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  LockPasswordIcon,
  UserIcon,
  Loading03Icon,
  ForkIcon,
  Image01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { useRegister } from "@/api/auth/mutations"
import { CUISINE_TYPES } from "@/api/auth/constants"
import { ThemeSwitch } from "@/components/layout/header/theme-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import type { LocationData } from "@/types/location"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Admin Établissement — rôle par défaut à l'inscription
const DEFAULT_EMPLOYEE_TYPE_ID = 2
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const registerSchema = z.object({
  // Step 1 — Account
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
  password2: z.string(),
  firstName: z.string().min(1, "Requis"),
  lastName: z.string().min(1, "Requis"),

  // Step 2 — Restaurant
  restaurantName: z.string().min(1, "Requis"),
  cuisineType: z.string().min(1, "Requis"),
  city: z.string().min(1, "Requis"),

  // Step 3 — Establishment
  covers: z.string().min(1, "Requis"),
  teamSize: z.string().min(1, "Requis"),
}).refine((d) => d.password === d.password2, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password2"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

const STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  ["firstName", "lastName", "email", "password", "password2"],
  ["restaurantName", "cuisineType", "city"],
  ["covers", "teamSize"],
]

const STEP_LABELS = ["Compte", "Restaurant", "Établissement"]
const LAST_STEP = STEP_LABELS.length - 1

const coversOptions = [
  { value: "1-30", label: "< 30 couverts" },
  { value: "31-60", label: "30 - 60 couverts" },
  { value: "61-100", label: "60 - 100 couverts" },
  { value: "100+", label: "100+ couverts" },
]

const teamOptions = [
  { value: "1-5", label: "1 - 5 personnes" },
  { value: "6-15", label: "6 - 15 personnes" },
  { value: "16-30", label: "16 - 30 personnes" },
  { value: "30+", label: "30+ personnes" },
]

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [addressLocation, setAddressLocation] = useState<LocationData | null>(null)
  const registerMutation = useRegister()
  const navigate = useNavigate()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      password2: "",
      restaurantName: "",
      cuisineType: "",
      city: "",
      covers: "",
      teamSize: "",
    },
  })

  const goNext = async () => {
    const fields = STEP_FIELDS[step]
    const valid = await form.trigger(fields)
    if (!valid) return

    setDirection(1)
    setStep((s) => Math.min(s + 1, LAST_STEP))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleAddressChange = (location: LocationData | null) => {
    setAddressLocation(location)
    form.setValue("city", location?.city || location?.fullAddress || "", { shouldValidate: true })
  }

  const onSubmit = (data: RegisterFormValues) => {
    const username = data.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")

    sessionStorage.setItem(
      "holly_pending_restaurant",
      JSON.stringify({
        restaurantName: data.restaurantName,
        cuisineType: data.cuisineType,
        city: data.city,
        covers: data.covers,
        teamSize: data.teamSize,
        location: addressLocation,
      }),
    )

    registerMutation.mutate(
      {
        username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        firstName: data.firstName,
        lastName: data.lastName,
        employeeFirstName: data.firstName,
        employeeLastName: data.lastName,
        pinCode: generatePin(),
        typeEmployeId: DEFAULT_EMPLOYEE_TYPE_ID,
        restaurantId: 1, // TODO: backend should make this optional or provide combined endpoint
      },
      {
        onSuccess: () => {
          toast.success("Compte créé avec succès !")
          navigate("/login")
        },
        onError: async (err) => {
          if (err instanceof HTTPError) {
            try {
              const body = await err.response.json()
              const errors = body as Record<string, string[]>
              for (const [field, messages] of Object.entries(errors)) {
                const fieldName = field as keyof RegisterFormValues
                if (STEP_FIELDS.flat().includes(fieldName)) {
                  form.setError(fieldName, {
                    message: Array.isArray(messages) ? messages[0] : String(messages),
                  })
                }
              }
              for (let i = 0; i < STEP_FIELDS.length; i++) {
                if (STEP_FIELDS[i].some((f) => f in errors)) {
                  setStep(i)
                  break
                }
              }
            } catch {
              toast.error("Erreur lors de l'inscription")
            }
          } else {
            toast.error("Impossible de contacter le serveur")
          }
        },
      },
    )
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="relative flex h-svh overflow-hidden bg-muted/40 p-4">
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitch />
      </div>

      <div className="hidden w-1/2 items-center justify-center overflow-hidden rounded-3xl bg-muted dark:bg-muted lg:flex bg-stone-200">
        <HugeiconsIcon
          icon={Image01Icon}
          className="size-24 text-muted-foreground/30"
          strokeWidth={1}
        />
      </div>

      <div className="relative flex w-full items-center justify-center overflow-y-auto lg:w-1/2">
        <div className="absolute top-2 left-6 flex items-center gap-2">
          <HugeiconsIcon
            icon={ForkIcon}
            className="size-6 text-primary"
            strokeWidth={2}
          />
          <span className="text-lg font-semibold">Holly Fork</span>
        </div>

        <div className="w-full max-w-md space-y-5 px-6 py-14">
          {/* Stepper */}
          <nav className="flex gap-1.5">
            {STEP_LABELS.map((label, index) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`text-xs whitespace-nowrap transition-colors duration-300 ${
                    index === step
                      ? "text-primary font-semibold"
                      : index < step
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                <div
                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                    index <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </nav>

          <div className="text-center">
            <h2 className="text-3xl font-bold">Créer un compte</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 0 && "Renseignez vos informations de connexion"}
              {step === 1 && "Parlez-nous de votre restaurant"}
              {step === 2 && "Dernières informations sur votre établissement"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {form.formState.errors.root && (
                <p className="mb-4 text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="relative -mx-2 px-2 overflow-x-clip">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
                  >
                    {step === 0 && <StepAccount form={form} />}
                    {step === 1 && (
                      <StepRestaurant
                        form={form}
                        addressLocation={addressLocation}
                        onAddressChange={handleAddressChange}
                      />
                    )}
                    {step === 2 && <StepEstablishment form={form} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="mt-6 flex gap-3">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={goBack} className="gap-1">
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
                    Retour
                  </Button>
                )}
                {step < LAST_STEP ? (
                  <Button type="button" className="ml-auto gap-1" onClick={goNext}>
                    Suivant
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? (
                      <>
                        <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <div className="text-center text-sm">
            Déjà un compte ?{" "}
            <Link to="/login" className="underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step Components ─────────────────────────────────────────────────────────

type StepProps = { form: ReturnType<typeof useForm<RegisterFormValues>> }

function StepAccount({ form }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Prénom</FormLabel>
              <FormControl>
                <div className="relative">
                  <HugeiconsIcon
                    icon={UserIcon}
                    className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                  />
                  <Input {...field} type="text" className="pl-10" placeholder="Prénom" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Nom</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Nom" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Adresse email</FormLabel>
            <FormControl>
              <div className="relative">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                />
                <Input {...field} type="email" autoComplete="email" className="pl-10" placeholder="Adresse email" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Mot de passe</FormLabel>
            <FormControl>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30 z-10"
                />
                <PasswordInput {...field} autoComplete="new-password" className="pl-10" placeholder="Mot de passe" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password2"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Confirmer le mot de passe</FormLabel>
            <FormControl>
              <div className="relative">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30 z-10"
                />
                <PasswordInput {...field} autoComplete="new-password" className="pl-10" placeholder="Confirmer le mot de passe" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function StepRestaurant({
  form,
  addressLocation,
  onAddressChange,
}: StepProps & {
  addressLocation: LocationData | null
  onAddressChange: (location: LocationData | null) => void
}) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="restaurantName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du restaurant</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Ex : Le Petit Bistrot" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="city"
        render={() => (
          <FormItem>
            <FormLabel>Adresse</FormLabel>
            <FormControl>
              <AddressAutocomplete
                value={addressLocation}
                onValueChange={onAddressChange}
                placeholder="Rechercher une adresse..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="cuisineType"
        render={({ field }) => (
          <FormItem>
            <Label>Type de cuisine</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type de cuisine">
              {CUISINE_TYPES.map((cuisine) => (
                <button
                  key={cuisine.value}
                  type="button"
                  role="radio"
                  aria-checked={field.value === cuisine.value}
                  onClick={() => field.onChange(cuisine.value)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    field.value === cuisine.value
                      ? "ring-primary bg-primary/5 text-foreground"
                      : "ring-border bg-card text-muted-foreground"
                  }`}
                >
                  <span className="text-base">{cuisine.icon}</span>
                  <span className="leading-tight">{cuisine.label}</span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function StepEstablishment({ form }: StepProps) {
  return (
    <div className="space-y-5">
      <FormField
        control={form.control}
        name="covers"
        render={({ field }) => (
          <FormItem>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nombre de couverts
            </Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Nombre de couverts">
              {coversOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={field.value === option.value}
                  onClick={() => field.onChange(option.value)}
                  className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-medium ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    field.value === option.value
                      ? "ring-primary bg-primary/5 text-foreground"
                      : "ring-border bg-card text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="teamSize"
        render={({ field }) => (
          <FormItem>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Taille de l'équipe
            </Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Taille de l'équipe">
              {teamOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={field.value === option.value}
                  onClick={() => field.onChange(option.value)}
                  className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-medium ring-1 transition-all duration-200 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    field.value === option.value
                      ? "ring-primary bg-primary/5 text-foreground"
                      : "ring-border bg-card text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

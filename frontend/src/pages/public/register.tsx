import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  LockPasswordIcon,
  UserIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { useRegister } from "@/api/auth/mutations"
import { ThemeSwitch } from "@/components/layout/header/theme-switch"
import { AuthImagePanel } from "@/components/shared/auth-image-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { usePageTitle } from "@/hooks/use-page-title"

// Super Admin Groupe — un gérant qui s'inscrit doit avoir tous les droits
const DEFAULT_EMPLOYEE_TYPE_ID = 383

/**
 * Placeholder restaurant ID — backend requires restaurant_id on registration.
 * The real restaurant is created post-login via the onboarding wizard.
 * TODO: backend should make restaurant_id optional on /api/auth/register/
 */
const PLACEHOLDER_RESTAURANT_ID = 1

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const registerSchema = z
  .object({
    email: z.string().email("Adresse email invalide"),
    password: z.string().min(8, "Au moins 8 caractères"),
    password2: z.string(),
    firstName: z.string().min(1, "Requis"),
    lastName: z.string().min(1, "Requis"),
  })
  .refine((d) => d.password === d.password2, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password2"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  usePageTitle("Inscription")
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
    },
  })

  const onSubmit = (data: RegisterFormValues) => {
    const username = data.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")

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
        restaurantId: PLACEHOLDER_RESTAURANT_ID,
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
                form.setError(fieldName, {
                  message: Array.isArray(messages)
                    ? messages[0]
                    : String(messages),
                })
              }
            } catch {
              toast.error("Erreur lors de l'inscription")
            }
          } else {
            toast.error("Impossible de contacter le serveur")
          }
        },
      }
    )
  }

  return (
    <div className="relative flex h-svh overflow-hidden bg-muted/40 p-4">
      <AuthImagePanel />

      <div className="relative flex w-full items-center justify-center overflow-y-auto lg:w-1/2">
        <div className="absolute top-4 right-4 z-20">
          <ThemeSwitch />
        </div>
        <div className="absolute top-4 left-6 flex items-center gap-2 lg:hidden">
          <img src="/holyfork-logo.svg" alt="Holy Fork" className="h-8" />
        </div>

        <div className="w-full max-w-md space-y-8 px-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.08, delayChildren: 0.1 },
              },
            }}
          >
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <h2 className="font-display text-3xl font-bold">
                Créer un compte
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Renseignez vos informations pour commencer
              </p>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-8 space-y-6"
                >
                  {form.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  )}
                  <StepAccount form={form} />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          className="animate-spin"
                        />
                        Création...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>

            <motion.div
              className="mt-6 text-center text-sm"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            >
              Déjà un compte ?{" "}
              <Link to="/login" className="underline">
                Se connecter
              </Link>
            </motion.div>
          </motion.div>
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
                  <Input
                    {...field}
                    type="text"
                    className="pl-10"
                    placeholder="Prénom"
                  />
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
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  className="pl-10"
                  placeholder="Adresse email"
                />
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
                  className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 opacity-30"
                />
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  className="pl-10"
                  placeholder="Mot de passe"
                />
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
                  className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 opacity-30"
                />
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  className="pl-10"
                  placeholder="Confirmer le mot de passe"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

import { Link, useNavigate, useLocation } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  LockPasswordIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HTTPError } from "ky"
import { toast } from "sonner"
import { AuthImagePanel } from "@/components/shared/auth-image-panel"

import { useLogin } from "@/api/auth/mutations"
import { ThemeSwitch } from "@/components/layout/header/theme-switch"
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

const formSchema = z.object({
  username: z.string().min(1, "L'email ou identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  usePageTitle("Connexion")
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || "/"

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormValues) => {
    form.clearErrors("root")
    // If user typed an email, derive the username the same way register does
    const username = data.username.includes("@")
      ? data.username.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")
      : data.username
    loginMutation.mutate(
      { username, password: data.password },
      {
        onSuccess: () => {
          navigate(from, { replace: true })
        },
        onError: async (err) => {
          if (err instanceof HTTPError) {
            const status = err.response.status
            if (status === 401) {
              form.setError("root", {
                message: "Email ou mot de passe incorrect",
              })
            } else if (status === 400) {
              form.setError("root", {
                message: "Email ou mot de passe incorrect",
              })
            } else if (status === 429) {
              toast.error(
                "Trop de tentatives. Veuillez patienter avant de réessayer."
              )
            } else {
              toast.error("Erreur serveur, veuillez réessayer plus tard.")
            }
          } else {
            toast.error(
              "Impossible de contacter le serveur. Vérifiez votre connexion."
            )
          }
        },
      }
    )
  }

  return (
    <div className="relative flex h-svh overflow-hidden bg-muted/40 p-4">
      <AuthImagePanel />

      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute top-4 right-4 z-20">
          <ThemeSwitch />
        </div>
        <div className="absolute top-4 left-6 flex items-center gap-2 lg:hidden">
          <img src="/holyfork-logo.svg" alt="Holy Fork" className="h-8" />
        </div>

        <div className="w-full max-w-md space-y-8 px-6">
          <motion.div
            key="login"
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
                Bon retour parmi nous
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Connectez-vous à votre compte
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
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">
                            Email ou identifiant
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <HugeiconsIcon
                                icon={Mail01Icon}
                                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                              />
                              <Input
                                {...field}
                                type="text"
                                autoComplete="username"
                                className="pl-10"
                                placeholder="Email ou identifiant"
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
                          <FormLabel className="sr-only">
                            Mot de passe
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <HugeiconsIcon
                                icon={LockPasswordIcon}
                                className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 opacity-30"
                              />
                              <PasswordInput
                                {...field}
                                autoComplete="current-password"
                                className="pl-10"
                                placeholder="Mot de passe"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-end">
                      <Link to="/forgot-password" className="text-sm underline">
                        Mot de passe oublié ?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          className="animate-spin"
                        />
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>

            <motion.div
              className="mt-6 text-center text-sm"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            >
              Pas encore de compte ?{" "}
              <Link to="/register" className="underline">
                Créer un compte
              </Link>
            </motion.div>

            <motion.div
              className="text-center text-sm"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            >
              <Link
                to="/device"
                className="text-muted-foreground underline hover:text-foreground"
              >
                Connexion tablette
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

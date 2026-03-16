import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, LockPasswordIcon, Loading03Icon, ForkIcon, Image01Icon } from "@hugeicons/core-free-icons"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { useLogin } from "@/api/auth/mutations"
import { isMfaRequired } from "@/api/auth/types"
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
import { LoginMfaForm } from "./login-mfa-form"

const formSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type FormValues = z.infer<typeof formSchema>

type MfaState = { tempToken: string; email: string } | null

export default function LoginPage() {
  const [mfaState, setMfaState] = useState<MfaState>(null)
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || "/"

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleLoginSuccess = () => {
    navigate(from, { replace: true })
  }

  const onSubmit = (data: FormValues) => {
    form.clearErrors("root")
    loginMutation.mutate(data, {
      onSuccess: (result) => {
        if (isMfaRequired(result)) {
          setMfaState({ tempToken: result.tempToken, email: result.email })
          return
        }
        handleLoginSuccess()
      },
      onError: async (err) => {
        if (err instanceof HTTPError) {
          const status = err.response.status
          if (status === 401) {
            form.setError("root", { message: "Email ou mot de passe incorrect" })
          } else if (status === 429) {
            toast.error("Trop de tentatives. Veuillez patienter avant de réessayer.")
          } else {
            toast.error("Erreur serveur, veuillez réessayer plus tard.")
          }
        } else {
          toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
        }
      },
    })
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

      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute top-2 left-6 flex items-center gap-2">
          <HugeiconsIcon
            icon={ForkIcon}
            className="size-6 text-primary"
            strokeWidth={2}
          />
          <span className="text-lg font-semibold">Holly Fork</span>
        </div>

        <div className="w-full max-w-md space-y-8 px-6">
          <AnimatePresence mode="wait">
            {mfaState ? (
              <motion.div
                key="mfa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LoginMfaForm
                  tempToken={mfaState.tempToken}
                  onSuccess={handleLoginSuccess}
                  onBack={() => setMfaState(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold">Bon retour parmi nous</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Connectez-vous à votre compte
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                    {form.formState.errors.root && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.root.message}
                      </p>
                    )}
                    <div className="space-y-4">
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
                                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30 z-10"
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
                        <Link
                          to="/forgot-password"
                          className="text-sm underline"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        "Se connecter"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center text-sm">
                  Pas encore de compte ?{" "}
                  <Link to="/register" className="underline">
                    Créer un compte
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  LockPasswordIcon,
  UserIcon,
  Loading03Icon,
  ForkIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons"

import { useAuth } from "@/contexts/auth-context"
import { ThemeSwitch } from "@/components/layout/header/theme-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type FormValues = z.infer<typeof formSchema>

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await register(
        data.email,
        data.password,
        `${data.firstName} ${data.lastName}`
      )
      navigate("/onboarding")
    } catch {
      form.setError("root", {
        message: "Une erreur est survenue lors de l'inscription",
      })
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="text-center">
            <h2 className="text-3xl font-bold">Créer un compte</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Renseignez vos informations pour commencer
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
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
                            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                          />
                          <Input
                            {...field}
                            type="password"
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
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                    />
                    Inscription...
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>
          </Form>

          <div>
            <div className="flex items-center gap-3">
              <div className="w-full border-t" />
              <span className="shrink-0 text-sm text-muted-foreground">
                ou continuer avec
              </span>
              <div className="w-full border-t" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">
                <svg viewBox="0 0 24 24" className="size-4">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="w-full">
                <svg viewBox="0 0 24 24" className="size-4">
                  <path
                    fill="currentColor"
                    d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                  />
                </svg>
                Apple
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              Déjà un compte ?{" "}
              <Link to="/login" className="underline">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

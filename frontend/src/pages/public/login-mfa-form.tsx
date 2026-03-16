import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { HTTPError } from "ky"

import { useVerifyMfa } from "@/api/auth/mutations"
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

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres"),
})

type MfaFormValues = z.infer<typeof mfaSchema>

interface LoginMfaFormProps {
  tempToken: string
  onSuccess: () => void
  onBack: () => void
}

export function LoginMfaForm({ tempToken, onSuccess, onBack }: LoginMfaFormProps) {
  const verifyMfa = useVerifyMfa()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
  })

  const onSubmit = (data: MfaFormValues) => {
    setError(null)
    verifyMfa.mutate(
      { tempToken, code: data.code },
      {
        onSuccess: () => onSuccess(),
        onError: async (err) => {
          if (err instanceof HTTPError) {
            const status = err.response.status
            if (status === 400) {
              setError("Code invalide")
            } else if (status === 401) {
              toast.error("Session expirée, reconnectez-vous")
              onBack()
            } else {
              toast.error("Erreur serveur, veuillez réessayer")
            }
          } else {
            toast.error("Impossible de contacter le serveur")
          }
        },
      },
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="mfa-form"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold">Vérification en deux étapes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrez le code à 6 chiffres de votre application d'authentification
          </p>
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive text-center">{error}</p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Code TOTP</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      autoFocus
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={verifyMfa.isPending}>
              {verifyMfa.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Retour au formulaire de connexion
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

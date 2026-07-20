import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "motion/react"
import { HTTPError } from "ky"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, Store04Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Link } from "react-router"

import { useDeviceLogin } from "@/api/auth/mutations"
import type { DeviceLoginResponse } from "@/api/auth/types"
import { PinPad } from "@/components/ui/pin-pad"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  restaurantId: z.coerce.number().int("ID invalide").positive("ID invalide"),
})

type FormValues = z.infer<typeof schema>

type DeviceSetupStepProps = {
  onSuccess: (response: DeviceLoginResponse) => void
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function DeviceSetupStep({ onSuccess }: DeviceSetupStepProps) {
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const deviceLoginMutation = useDeviceLogin()

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod 4 + @hookform/resolvers type mismatch with z.coerce
    resolver: zodResolver(schema) as any,
    defaultValues: { restaurantId: undefined as unknown as number },
  })

  const handlePinComplete = (pinValue: string) => {
    const restaurantId = form.getValues("restaurantId")
    const result = schema.safeParse({ restaurantId })
    if (!result.success) {
      form.trigger("restaurantId")
      setPin("")
      return
    }

    setPinError("")
    deviceLoginMutation.mutate(
      { restaurantId: result.data.restaurantId, pinRestaurant: pinValue },
      {
        onSuccess: (response) => {
          onSuccess(response)
        },
        onError: async (err) => {
          setPin("")
          if (err instanceof HTTPError) {
            const status = err.response.status
            if (status === 400) {
              setPinError("ID ou PIN restaurant incorrect")
            } else if (status === 429) {
              toast.error("Trop de tentatives. Veuillez patienter.")
            } else {
              toast.error("Erreur serveur, veuillez réessayer.")
            }
          } else {
            toast.error("Impossible de contacter le serveur.")
          }
        },
      }
    )
  }

  return (
    <motion.div
      key="device-setup"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className="w-full max-w-md space-y-8 px-6"
    >
      <motion.div className="text-center" variants={fadeUp}>
        <h2 className="font-display text-3xl font-bold">
          Configurer l'appareil
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Associez cette tablette à votre restaurant
        </p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="restaurantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Restaurant</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Store04Icon}
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                      />
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        placeholder="Entrez l'ID du restaurant"
                        className="pl-10"
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">PIN Restaurant (6 chiffres)</p>
              <PinPad
                length={6}
                value={pin}
                onChange={setPin}
                onComplete={handlePinComplete}
                error={pinError}
                disabled={deviceLoginMutation.isPending}
              />
            </div>

            {deviceLoginMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="animate-spin"
                  size={16}
                />
                Vérification...
              </div>
            )}
          </div>
        </Form>
      </motion.div>

      <motion.div
        className="text-center text-sm"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      >
        <Link
          to="/login"
          className="text-muted-foreground underline hover:text-foreground"
        >
          Connexion classique
        </Link>
      </motion.div>
    </motion.div>
  )
}

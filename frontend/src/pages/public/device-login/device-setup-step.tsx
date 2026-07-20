import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "motion/react"
import { HTTPError } from "ky"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, Store04Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"

import { useDeviceLogin } from "@/api/auth/mutations"
import type { DeviceLoginResponse } from "@/api/auth/types"
import { getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"
import type { ApiRestaurant } from "@/hooks/use-establishments"
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

function useRestaurantOptions() {
  const hasToken = !!getAccessToken()

  const { data } = useQuery({
    queryKey: ["device-setup", "restaurants"],
    queryFn: () => fetchAllPages<ApiRestaurant>("restaurants/", {}),
    enabled: hasToken,
    staleTime: 5 * 60_000,
  })

  return useMemo(
    () =>
      (data ?? [])
        .filter((r) => r.pin && r.pin.length === 6)
        .map((r) => ({
          id: r.restaurantId,
          label: r.city ? `${r.name} — ${r.city}` : r.name,
        })),
    [data]
  )
}

export function DeviceSetupStep({ onSuccess }: DeviceSetupStepProps) {
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const deviceLoginMutation = useDeviceLogin()
  const restaurantOptions = useRestaurantOptions()

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
              setPinError("Restaurant ou PIN incorrect")
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
                  <FormLabel>Restaurant</FormLabel>
                  <FormControl>
                    {restaurantOptions.length > 0 ? (
                      <div className="relative">
                        <HugeiconsIcon
                          icon={Store04Icon}
                          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                        />
                        <select
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="h-9 w-full appearance-none rounded-lg border border-input bg-background py-1 pr-8 pl-10 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="" disabled>
                            Sélectionnez un restaurant
                          </option>
                          {restaurantOptions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="relative">
                        <HugeiconsIcon
                          icon={Store04Icon}
                          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                        />
                        <Input
                          {...field}
                          type="number"
                          inputMode="numeric"
                          placeholder="ID du restaurant"
                          className="pl-10"
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                  {restaurantOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Disponible dans Administration &gt; Etablissements
                    </p>
                  )}
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

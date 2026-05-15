import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useNotificationSettings, useUpsertNotificationSettings } from "@/hooks/use-settings"

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  stockAlerts: z.boolean(),
  reservationAlerts: z.boolean(),
  commandAlerts: z.boolean(),
})

type NotificationsValues = z.infer<typeof notificationsSchema>

const notificationItems: {
  name: keyof NotificationsValues
  label: string
  description: string
}[] = [
  {
    name: "emailNotifications",
    label: "Notifications par email",
    description: "Recevoir les notifications importantes par email.",
  },
  {
    name: "smsNotifications",
    label: "Notifications par SMS",
    description: "Recevoir les alertes urgentes par SMS.",
  },
  {
    name: "reservationAlerts",
    label: "Alertes réservations",
    description: "Être alerté pour chaque nouvelle réservation ou annulation.",
  },
  {
    name: "stockAlerts",
    label: "Alertes stock faible",
    description: "Alerte quand un produit passe sous le seuil minimum.",
  },
  {
    name: "commandAlerts",
    label: "Alertes commandes fournisseur",
    description: "Rappel avant les jours de commande planifiés.",
  },
]

export function NotificationsForm() {
  const { restaurantId } = useActiveRestaurant()
  const { data: settings } = useNotificationSettings(restaurantId)
  const upsert = useUpsertNotificationSettings(restaurantId)

  const form = useForm<NotificationsValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      stockAlerts: true,
      reservationAlerts: true,
      commandAlerts: false,
    },
  })

  // Populate form when settings load from API
  useEffect(() => {
    if (settings) {
      form.reset({
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        stockAlerts: settings.stockAlerts,
        reservationAlerts: settings.reservationAlerts,
        commandAlerts: settings.commandAlerts,
      })
    }
  }, [settings, form])

  async function onSubmit(data: NotificationsValues) {
    try {
      await upsert.mutateAsync({
        ...data,
        existingId: settings?.id,
      })
      toast.success("Notifications mises à jour")
      form.reset(data)
    } catch {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {notificationItems.map((item) => (
          <FormField
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-4 dark:bg-zinc-950">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">
                    {item.label}
                  </FormLabel>
                  <FormDescription>{item.description}</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
        <Button
          type="submit"
          variant={form.formState.isDirty ? "default" : "outline"}
          disabled={!form.formState.isDirty || upsert.isPending}
        >
          {upsert.isPending ? "Mise à jour…" : "Mettre à jour les notifications"}
        </Button>
      </form>
    </Form>
  )
}

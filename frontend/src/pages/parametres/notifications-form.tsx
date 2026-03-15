import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

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

const notificationsSchema = z.object({
  nouvellesReservations: z.boolean(),
  annulations: z.boolean(),
  stockFaible: z.boolean(),
  rappelCommandeFournisseur: z.boolean(),
  resumeQuotidien: z.boolean(),
})

type NotificationsValues = z.infer<typeof notificationsSchema>

const notificationItems = [
  {
    name: "nouvellesReservations" as const,
    label: "Nouvelles réservations",
    description: "Recevoir une notification pour chaque nouvelle réservation.",
  },
  {
    name: "annulations" as const,
    label: "Annulations",
    description: "Être alerté lorsqu'une réservation est annulée.",
  },
  {
    name: "stockFaible" as const,
    label: "Stock faible",
    description: "Alerte quand un produit passe sous le seuil minimum.",
  },
  {
    name: "rappelCommandeFournisseur" as const,
    label: "Rappels de commande fournisseur",
    description: "Rappel avant les jours de commande planifiés.",
  },
  {
    name: "resumeQuotidien" as const,
    label: "Résumé quotidien",
    description: "Recevoir un résumé par email chaque matin.",
  },
]

export function NotificationsForm() {
  const form = useForm<NotificationsValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      nouvellesReservations: true,
      annulations: true,
      stockFaible: true,
      rappelCommandeFournisseur: false,
      resumeQuotidien: false,
    },
  })

  function onSubmit(data: NotificationsValues) {
    console.log("notifications", data)
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
            disabled={!form.formState.isDirty}
          >
            Mettre à jour les notifications
          </Button>
      </form>
    </Form>
  )
}

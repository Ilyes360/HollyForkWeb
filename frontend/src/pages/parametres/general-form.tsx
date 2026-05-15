import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuthStore } from "@/stores/auth-store"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import {
  useProfile,
  useUpdateProfile,
  useRestaurantSettings,
  useUpdateRestaurantSettings,
} from "@/hooks/use-settings"

const accountSchema = z.object({
  restaurantName: z.string().min(1, "Le nom du restaurant est requis"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
})

type AccountValues = z.infer<typeof accountSchema>

export function GeneralForm() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { restaurantId } = useActiveRestaurant()

  const { data: profile } = useProfile()
  const { data: restaurantSettings } = useRestaurantSettings(restaurantId)
  const updateProfile = useUpdateProfile()
  const updateRestaurant = useUpdateRestaurantSettings(restaurantId)

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      restaurantName: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  })

  // Populate form once when data loads from API
  useEffect(() => {
    const firstName = profile?.firstName ?? user?.firstName ?? ""
    const lastName = profile?.lastName ?? user?.lastName ?? ""
    const email = profile?.email ?? user?.email ?? ""
    const name = restaurantSettings?.name ?? user?.restaurantName ?? ""

    form.reset({
      restaurantName: name,
      firstName,
      lastName,
      email,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, restaurantSettings, user])

  async function onSubmit(data: AccountValues) {
    try {
      // Update profile (first_name, last_name, email)
      await updateProfile.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      })

      // Update restaurant name via PATCH /api/settings/restaurant/?restaurant_id=X
      if (restaurantId && data.restaurantName !== restaurantSettings?.name) {
        await updateRestaurant.mutateAsync({ name: data.restaurantName })
      }

      // Update local auth store
      if (user) {
        setUser({
          ...user,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          restaurantName: data.restaurantName,
        })
      }
      toast.success("Profil mis à jour")
      form.reset(data)
    } catch {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const isPending = updateProfile.isPending || updateRestaurant.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="restaurantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du restaurant</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Le nom de votre établissement, affiché dans la barre latérale et les documents.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>
                Votre adresse email de connexion.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          variant={form.formState.isDirty ? "default" : "outline"}
          disabled={!form.formState.isDirty || isPending}
        >
          {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </form>
    </Form>
  )
}

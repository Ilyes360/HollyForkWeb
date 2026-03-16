import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { useAdminStore } from "@/stores/admin-store"

const accountSchema = z.object({
  groupName: z.string().min(1, "Le nom du groupe est requis"),
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
})

type AccountValues = z.infer<typeof accountSchema>

export function GeneralForm() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const groupName = useAdminStore((s) => s.groupName)
  const setGroupName = useAdminStore((s) => s.setGroupName)

  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      groupName,
      name,
      email: user?.email ?? "",
    },
  })

  function onSubmit(data: AccountValues) {
    setGroupName(data.groupName)
    // Update Zustand store locally — PATCH /api/auth/profile/ will be wired in settings integration
    if (user) {
      const [firstName, ...rest] = data.name.split(" ")
      setUser({
        ...user,
        firstName: firstName ?? "",
        lastName: rest.join(" "),
        email: data.email,
      })
    }
    form.reset(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="groupName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du groupe</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Le nom de votre enseigne, affiché dans la barre latérale et les documents.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Votre nom tel qu'il apparaît dans l'application.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          disabled={!form.formState.isDirty}
        >
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  )
}

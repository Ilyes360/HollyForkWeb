import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiPost } from "@/api/client"
import { useActiveRestaurantStore } from "@/hooks/use-active-restaurant"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FrenchAddressInput, type FrenchAddressResult } from "@/components/ui/french-address-input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  phoneNumber: z.string().min(1, "Le téléphone est requis"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres"),
  pin: z
    .string()
    .min(1, "Le code PIN est requis")
    .max(6, "6 caractères max"),
})

type FormValues = z.infer<typeof formSchema>

interface CreateRestaurantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRestaurantDialog({
  open,
  onOpenChange,
}: CreateRestaurantDialogProps) {
  const queryClient = useQueryClient()
  const setSelectedId = useActiveRestaurantStore((s) => s.setSelectedId)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      postalCode: "",
      city: "",
      phoneNumber: "",
      siret: "",
      pin: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiPost<{ restaurantId: number; name: string }>("restaurants/", data),
    onSuccess: (result) => {
      toast.success(`${result.name} créé avec succès`)
      queryClient.invalidateQueries({ queryKey: ["establishments"] })
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      queryClient.invalidateQueries({ queryKey: ["revenue-by-category"] })
      setSelectedId(result.restaurantId)
      form.reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Erreur lors de la création du restaurant")
    },
  })

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau restaurant</DialogTitle>
          <DialogDescription>
            Renseignez les informations du restaurant. Vous pourrez compléter les
            détails plus tard.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du restaurant</FormLabel>
                  <FormControl>
                    <Input placeholder="Holly Fork — Marais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <FrenchAddressInput
                        value={field.value}
                        onChange={field.onChange}
                        onSelect={(result: FrenchAddressResult) => {
                          form.setValue("postalCode", result.postalCode)
                          form.setValue("city", result.city)
                        }}
                        placeholder="12 rue des Rosiers"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input placeholder="75004" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+33 1 42 72 00 00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="siret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIRET</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345678901234"
                        maxLength={14}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code PIN</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Création..." : "Créer le restaurant"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

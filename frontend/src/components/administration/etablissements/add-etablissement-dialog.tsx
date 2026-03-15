import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import type { LocationData } from "@/types/location"

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  location: z
    .object({
      fullAddress: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string(),
      longitude: z.number(),
      latitude: z.number(),
      mapboxId: z.string(),
    })
    .nullable(),
  phone: z.string().min(10, "Le numéro de téléphone est requis"),
  email: z.string().email("Email invalide"),
})

export type AddEtablissementFormValues = z.infer<typeof schema>

interface AddEtablissementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddEtablissementFormValues) => void
}

export function AddEtablissementDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddEtablissementDialogProps) {
  const form = useForm<AddEtablissementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      location: null,
      phone: "",
      email: "",
    },
  })

  function handleSubmit(data: AddEtablissementFormValues) {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Ajouter un établissement</DialogTitle>
          <DialogDescription>
            Renseignez les informations de base. Vous pourrez compléter le reste ensuite.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'établissement</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Le Bistrot Parisien" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <AddressAutocomplete
                      value={field.value as LocationData | null}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+33 1 00 00 00 00" {...field} />
                    </FormControl>
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
                      <Input placeholder="contact@restaurant.fr" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer l'établissement</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

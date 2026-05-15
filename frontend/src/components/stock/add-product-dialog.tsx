import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  UNIT_LABELS,
} from "./types"
import type { ProductUnit } from "./types"
import { getIconsForCategory, PRODUCT_ICONS } from "./product-icons"
import { useInventoryStore } from "@/stores/inventory-store"

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  icon: z.string(),
  supplierId: z.string().min(1, "Le fournisseur est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  quantity: z.coerce.number().min(0, "Min. 0"),
  unit: z.enum(["kg", "L", "btl", "unites", "pieces"]),
  minStock: z.coerce.number().min(0, "Min. 0"),
  maxStock: z.coerce.number().min(1, "Min. 1"),
  unitPrice: z.coerce.number().min(0.01, "Min. 0,01 €"),
  storageZone: z.string().min(1, "La zone est requise"),
  expirationDate: z.string().min(1, "La date est requise"),
  notes: z.string(),
})

export type AddProductFormValues = z.infer<typeof schema>

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddProductFormValues) => void
}

export function AddProductDialog({ open, onOpenChange, onSubmit }: AddProductDialogProps) {
  const { suppliers, categories, storageZones } = useInventoryStore()
  const form = useForm<AddProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      icon: "",
      supplierId: "",
      category: "epicerie",
      quantity: 0,
      unit: "kg",
      minStock: 0,
      maxStock: 10,
      unitPrice: 1,
      storageZone: "reserve_seche",
      expirationDate: "",
      notes: "",
    },
  })

  const watchedCategory = useWatch({ control: form.control, name: "category" })
  void useWatch({ control: form.control, name: "icon" })
  const availableIcons = watchedCategory
    ? getIconsForCategory(watchedCategory)
    : PRODUCT_ICONS

  function handleSubmit(data: AddProductFormValues) {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Ajouter un produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour ajouter un produit au stock.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Filet de bœuf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icone</FormLabel>
                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {availableIcons.map((entry) => (
                      <button
                        key={entry.key}
                        type="button"
                        title={entry.label}
                        className={[
                          "flex size-9 items-center justify-center rounded-lg border transition-colors",
                          field.value === entry.key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
                        ].join(" ")}
                        onClick={() =>
                          field.onChange(field.value === entry.key ? "" : entry.key)
                        }
                      >
                        <HugeiconsIcon icon={entry.icon} className="size-4" strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner">
                            {field.value
                              ? suppliers.find((s) => s.id === field.value)?.name
                              : "Sélectionner"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {categories.find((c) => c.id === field.value)?.label ?? "Sélectionner"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {UNIT_LABELS[field.value as ProductUnit]}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(UNIT_LABELS) as ProductUnit[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {UNIT_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock minimum</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock maximum</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.01} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storageZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone de stockage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {storageZones.find((z) => z.id === field.value)?.label ?? "Sélectionner"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storageZones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'expiration</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes, remarques..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer le produit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

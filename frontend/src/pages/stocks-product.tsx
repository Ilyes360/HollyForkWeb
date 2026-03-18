import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
import { UNIT_LABELS } from "@/components/stocks/types"
import type { ProductUnit } from "@/components/stocks/types"
import { getIconsForCategory, PRODUCT_ICONS } from "@/components/stocks/product-icons"
import { useInventoryStore } from "@/stores/inventory-store"
import { usePageTitle } from "@/hooks/use-page-title"

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

type FormValues = z.infer<typeof schema>

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const TODAY = toLocalDateString(new Date())

export default function StocksProductPage() {
  usePageTitle("Stocks")
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { products, suppliers, categories, storageZones, addProduct, updateProduct } =
    useInventoryStore()

  const editProduct = id ? products.find((p) => p.id === id) ?? null : null
  const isEditing = !!editProduct

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name,
        icon: editProduct.icon ?? "",
        supplierId: editProduct.supplierId,
        category: editProduct.category,
        quantity: editProduct.quantity,
        unit: editProduct.unit,
        minStock: editProduct.minStock,
        maxStock: editProduct.maxStock,
        unitPrice: editProduct.unitPrice,
        storageZone: editProduct.storageZone,
        expirationDate: editProduct.expirationDate,
        notes: editProduct.notes,
      })
    }
  }, [editProduct, form])

  const watchedCategory = useWatch({ control: form.control, name: "category" })
  const availableIcons = watchedCategory
    ? getIconsForCategory(watchedCategory)
    : PRODUCT_ICONS

  function handleSubmit(data: FormValues) {
    if (isEditing && editProduct) {
      updateProduct(editProduct.id, {
        name: data.name,
        icon: data.icon || undefined,
        supplierId: data.supplierId,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        minStock: data.minStock,
        maxStock: data.maxStock,
        unitPrice: data.unitPrice,
        storageZone: data.storageZone,
        expirationDate: data.expirationDate,
        notes: data.notes,
      })
    } else {
      addProduct({
        id: `p-${Date.now()}`,
        name: data.name,
        icon: data.icon || undefined,
        supplierId: data.supplierId,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        minStock: data.minStock,
        maxStock: data.maxStock,
        unitPrice: data.unitPrice,
        rotation: 0,
        lastOrderDate: TODAY,
        expirationDate: data.expirationDate,
        storageZone: data.storageZone,
        notes: data.notes,
        orderHistory: [],
      })
    }

    navigate("/stocks")
  }

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex shrink-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/stocks")}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" strokeWidth={2} />
        </Button>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {isEditing ? "Modifier le produit" : "Nouveau produit"}
        </h1>
        <span className="text-sm text-muted-foreground">
          {isEditing
            ? "Modifiez les informations du produit."
            : "Remplissez les informations pour ajouter un produit au stock."}
        </span>
      </motion.div>

      {/* Form */}
      <motion.div variants={fadeUp} className="min-h-0 flex-1 overflow-y-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mx-auto max-w-2xl space-y-6 pb-8"
          >
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
                  <FormLabel>Icône</FormLabel>
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

            <Separator />

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

            <Separator />

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

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/stocks")}>
                Annuler
              </Button>
              <Button type="submit">
                {isEditing ? "Enregistrer" : "Créer le produit"}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  )
}

import { useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { UNIT_LABELS } from "@/components/stock/types"
import type { ProductUnit } from "@/components/stock/types"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useStocks, useUpdateStock, useCreateStock } from "@/hooks/use-stocks"
import { useCreateIngredient } from "@/hooks/use-ingredients"
import { toast } from "sonner"
import { usePageTitle } from "@/hooks/use-page-title"

// Only fields that exist in the backend API
// Ingredient: name, unit, unit_price
// Stock: restaurant_id, ingredient_id, quantity_in_stock, alert_threshold
const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  quantity: z.coerce.number().min(0, "Min. 0"),
  unit: z.string().min(1, "L'unité est requise"),
  minStock: z.coerce.number().min(0, "Min. 0"),
  unitPrice: z.coerce.number().min(0.01, "Min. 0,01 €"),
})

type FormValues = z.infer<typeof schema>

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export default function StocksProductPage() {
  usePageTitle("Stocks")
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { restaurantId } = useActiveRestaurant()
  const updateStock = useUpdateStock()
  const createStock = useCreateStock()
  const createIngredient = useCreateIngredient()

  const isEditing = !!id
  const { data: products } = useStocks(restaurantId)
  const existingProduct = isEditing
    ? (products.find((p) => p.id === id) ?? null)
    : null

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod 4 + @hookform/resolvers type mismatch with z.coerce
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "kg",
      minStock: 0,
      unitPrice: 1,
    },
  })

  // Pre-fill form when editing an existing product
  useEffect(() => {
    if (existingProduct) {
      form.reset({
        name: existingProduct.name,
        quantity: existingProduct.quantity,
        unit: existingProduct.unit,
        minStock: existingProduct.minStock,
        unitPrice: existingProduct.unitPrice,
      })
    }
  }, [existingProduct, form])

  function handleSubmit(data: FormValues) {
    const onSuccess = () => {
      toast.success(isEditing ? "Produit modifié" : "Produit créé")
      navigate("/stocks")
    }

    if (isEditing) {
      updateStock.mutate(
        {
          id: Number(id),
          restaurantId: restaurantId!,
          data: {
            quantityInStock: String(data.quantity),
            alertThreshold: String(data.minStock),
          },
        },
        { onSuccess }
      )
    } else {
      // Two-step creation: ingredient first, then stock entry
      createIngredient.mutate(
        {
          name: data.name,
          unit: data.unit as ProductUnit,
          unitPrice: String(data.unitPrice),
        },
        {
          onSuccess: (ingredient) => {
            createStock.mutate(
              {
                restaurantId: restaurantId!,
                ingredientId: ingredient.id,
                quantityInStock: String(data.quantity),
                alertThreshold: String(data.minStock),
              },
              { onSuccess }
            )
          },
        }
      )
    }
  }

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex shrink-0 items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/stocks")}
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            className="size-4"
            strokeWidth={2}
          />
        </Button>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {isEditing ? "Modifier le stock" : "Nouveau produit"}
        </h1>
        <span className="text-sm text-muted-foreground">
          {isEditing
            ? "Ajustez la quantité en stock et le seuil d'alerte."
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
            {isEditing ? (
              /* Edition mode: show product info read-only, only stock fields editable */
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Produit</p>
                  <p className="text-lg font-medium">
                    {existingProduct?.name ?? "Chargement..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {existingProduct
                      ? `${UNIT_LABELS[existingProduct.unit] ?? existingProduct.unit} · ${existingProduct.unitPrice.toFixed(2)} €/unité`
                      : ""}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité en stock</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock minimum (seuil d'alerte)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              /* Creation mode: all fields editable */
              <>
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {UNIT_LABELS[field.value as ProductUnit] ??
                                  field.value}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Object.keys(UNIT_LABELS) as ProductUnit[]).map(
                              (key) => (
                                <SelectItem key={key} value={key}>
                                  {UNIT_LABELS[key]}
                                </SelectItem>
                              )
                            )}
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
                        <FormLabel>Stock minimum (seuil d'alerte)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix unitaire (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0.01}
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/stocks")}
              >
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

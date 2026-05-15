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
import { apiPost, apiPatch } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
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
  const queryClient = useQueryClient()

  const isEditing = !!id

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "kg",
      minStock: 0,
      unitPrice: 1,
    },
  })

  async function handleSubmit(data: FormValues) {
    try {
      if (isEditing) {
        await apiPatch(`stocks/${id}/`, {
          quantityInStock: String(data.quantity),
          alertThreshold: String(data.minStock),
        })
      } else {
        const ingredient = await apiPost<{ id: number }>("ingredients/", {
          name: data.name,
          unit: data.unit as ProductUnit,
          unitPrice: String(data.unitPrice),
        })
        await apiPost("stocks/", {
          restaurantId: restaurantId!,
          ingredientId: ingredient.id,
          quantityInStock: String(data.quantity),
          alertThreshold: String(data.minStock),
        })
      }
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      toast.success(isEditing ? "Produit modifié" : "Produit créé")
      navigate("/stocks")
    } catch {
      toast.error("Erreur lors de l'enregistrement")
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
                            {UNIT_LABELS[field.value as ProductUnit] ?? field.value}
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
                      <Input type="number" min={0.01} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* TODO: champs commentés — pas de correspondance backend
            - Icône (cosmétique front-only)
            - Fournisseur (lien stock↔fournisseur n'existe pas dans l'API Stock)
            - Catégorie (pas de champ catégorie sur Stock/Ingredient)
            - Stock maximum (pas dans l'API)
            - Zone de stockage (pas dans l'API)
            - Date d'expiration (pas dans l'API)
            - Notes (pas dans l'API Stock)
            */}

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

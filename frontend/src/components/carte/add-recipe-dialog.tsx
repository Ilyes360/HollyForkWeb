import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
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
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import { formatCurrency } from "@/components/stock/utils"
import type { Recipe, RecipeCategory, RecipeIngredient } from "./types"
import { CATEGORY_LABELS, ALLERGEN_OPTIONS } from "./types"
import {
  getMaterialCost,
  getFoodCostPercent,
  getGrossMargin,
  getFoodCostColor,
} from "./utils"
import { IngredientCombobox } from "./ingredient-combobox"

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  category: z.enum(["entree", "plat", "dessert", "boisson"]),
  sellingPrice: z.coerce.number().min(0.01, "Min. 0,01 €"),
  portions: z.coerce.number().min(1, "Min. 1"),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface AddRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onSubmit: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
  editRecipe?: Recipe | null
}

interface IngredientLine {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  products,
  onSubmit,
  editRecipe,
}: AddRecipeDialogProps) {
  const [ingredients, setIngredients] = useState<IngredientLine[]>([])
  const [allergens, setAllergens] = useState<string[]>([])

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      category: "plat",
      sellingPrice: 0,
      portions: 4,
      notes: "",
    },
  })

  const watchedPrice = useWatch({ control: form.control, name: "sellingPrice" })

  useEffect(() => {
    if (open && editRecipe) {
      form.reset({
        name: editRecipe.name,
        category: editRecipe.category,
        sellingPrice: editRecipe.sellingPrice,
        portions: editRecipe.portions,
        notes: editRecipe.notes,
      })
      // Batch form-state sync from props — intentional setState in effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllergens(editRecipe.allergens)

      setIngredients(
        editRecipe.ingredients.map((ing) => {
          const product = products.find((p) => p.id === ing.productId)
          return {
            productId: ing.productId,
            productName: product?.name ?? "Produit inconnu",
            quantity: ing.quantity,
            unit: product?.unit ?? ing.unit,
            unitPrice: product?.unitPrice ?? 0,
          }
        })
      )
    } else if (open && !editRecipe) {
      form.reset()

      setIngredients([])

      setAllergens([])
    }
  }, [open, editRecipe, form, products])

  const handleAddIngredient = (product: Product) => {
    setIngredients((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 0.1,
        unit: product.unit,
        unitPrice: product.unitPrice,
      },
    ])
  }

  const handleRemoveIngredient = (productId: string) => {
    setIngredients((prev) => prev.filter((i) => i.productId !== productId))
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }

  const toggleAllergen = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    )
  }

  const recipeIngredients: RecipeIngredient[] = ingredients.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    unit: (products.find((p) => p.id === i.productId)?.unit ??
      i.unit) as RecipeIngredient["unit"],
  }))

  const materialCost = getMaterialCost(recipeIngredients, products)
  const foodCostPct = getFoodCostPercent(materialCost, watchedPrice || 0)
  const margin = getGrossMargin(watchedPrice || 0, materialCost)

  function handleSubmit(data: FormValues) {
    onSubmit({
      name: data.name,
      category: data.category,
      sellingPrice: data.sellingPrice,
      portions: data.portions,
      ingredients: recipeIngredients,
      allergens,
      isActive: editRecipe ? editRecipe.isActive : true,
      notes: data.notes,
    })
    form.reset()
    setIngredients([])
    setAllergens([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl!">
        <DialogHeader>
          <DialogTitle>
            {editRecipe ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
          <DialogDescription>
            {editRecipe
              ? "Modifiez les informations de la recette."
              : "Remplissez les informations pour créer une recette."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la recette</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Filet de bœuf sauce poivre"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                            {CATEGORY_LABELS[field.value as RecipeCategory]}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(CATEGORY_LABELS) as RecipeCategory[]).map(
                          (key) => (
                            <SelectItem key={key} value={key}>
                              {CATEGORY_LABELS[key]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.01} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portions</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ingrédients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ingrédients</span>
                <IngredientCombobox
                  products={products}
                  selectedProductIds={ingredients.map((i) => i.productId)}
                  onSelect={handleAddIngredient}
                />
              </div>

              {ingredients.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  {ingredients.map((ing) => (
                    <div
                      key={ing.productId}
                      className="flex items-center gap-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {ing.productName}
                      </span>
                      <Input
                        type="number"
                        min={0.001}
                        step="0.01"
                        value={ing.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            ing.productId,
                            Number(e.target.value)
                          )
                        }
                        className="h-8 w-20"
                      />
                      <span className="w-8 text-xs text-muted-foreground">
                        {UNIT_LABELS[ing.unit as keyof typeof UNIT_LABELS]}
                      </span>
                      <span className="w-16 text-right text-xs text-muted-foreground">
                        {formatCurrency(ing.quantity * ing.unitPrice)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveIngredient(ing.productId)}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          className="size-4"
                          strokeWidth={2}
                        />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Food cost summary */}
              {ingredients.length > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                  <div className="space-y-0.5">
                    <p>
                      Coût matière :{" "}
                      <span className="font-medium">
                        {formatCurrency(materialCost)}
                      </span>
                    </p>
                    <p>
                      Food Cost :{" "}
                      <span
                        className={`font-medium ${getFoodCostColor(foodCostPct)}`}
                      >
                        {foodCostPct.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Marge brute</p>
                    <p className="font-semibold">{formatCurrency(margin)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Allergènes */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Allergènes</span>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <button
                    key={allergen}
                    type="button"
                    className={[
                      "rounded-md border px-2 py-1 text-xs transition-colors",
                      allergens.includes(allergen)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
                    ].join(" ")}
                    onClick={() => toggleAllergen(allergen)}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>

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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editRecipe ? "Enregistrer" : "Créer la recette"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
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
import { MOCK_PRODUCTS } from "@/components/stock/data"
import { UNIT_LABELS } from "@/components/stock/types"
import { formatCurrency } from "@/components/stock/utils"
import type { RecipeCategory, RecipeIngredient } from "@/components/carte/types"
import { CATEGORY_LABELS } from "@/components/carte/types"
import {
  getMaterialCost,
  getFoodCostPercent,
  getGrossMargin,
  getFoodCostColor,
} from "@/components/carte/utils"
import { IngredientCombobox } from "@/components/carte/ingredient-combobox"
import { PRODUCT_ICONS } from "@/components/stock/product-icons"
import { useRecipeStore } from "@/stores/recipe-store"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useIngredients } from "@/hooks/use-ingredients"
import { apiPost, apiPatch } from "@/api/client"
import { usePageTitle } from "@/hooks/use-page-title"

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  category: z.enum(["entree", "plat", "dessert", "boisson"]),
  sellingPrice: z.coerce.number().min(0.01, "Min. 0,01 €"),
  portions: z.coerce.number().min(1).optional(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface IngredientLine {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
}

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

export default function CuisineRecipePage() {
  usePageTitle("Cuisine")
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isDevMode = useDevModeStore((s) => s.isDevMode)

  // In user mode, use API ingredients for the picker; in dev mode, use MOCK_PRODUCTS
  const { data: apiIngredients } = useIngredients()
  const products = isDevMode
    ? MOCK_PRODUCTS
    : apiIngredients.length > 0
      ? apiIngredients.map((ing) => ({
          id: String(ing.id),
          name: ing.name,
          unit: ing.unit,
          unitPrice: Number(ing.unitPrice),
          // Provide minimal fields needed by the ingredient combobox
          category: "" as string,
          supplierId: "",
          quantity: 0,
          minStock: 0,
          storageZone: "",
        }))
      : MOCK_PRODUCTS

  const recipes = useRecipeStore((s) => s.recipes)
  const addRecipe = useRecipeStore((s) => s.addRecipe)
  const updateRecipe = useRecipeStore((s) => s.updateRecipe)

  const editRecipe = id ? (recipes.find((r) => r.id === id) ?? null) : null
  const isEditing = !!editRecipe

  const [ingredients, setIngredients] = useState<IngredientLine[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [icon, setIcon] = useState<string>("")

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
  void PRODUCT_ICONS

  useEffect(() => {
    if (editRecipe) {
      form.reset({
        name: editRecipe.name,
        category: editRecipe.category,
        sellingPrice: editRecipe.sellingPrice,
        portions: editRecipe.portions,
        notes: editRecipe.notes,
      })
      setAllergens(editRecipe.allergens)
      setIcon(editRecipe.icon ?? "")
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
    }
  }, [editRecipe, form, products])

  const handleAddIngredient = (product: (typeof products)[number]) => {
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
  void toggleAllergen // will be used when allergen UI is added

  const recipeIngredients: RecipeIngredient[] = ingredients.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    unit: (products.find((p) => p.id === i.productId)?.unit ??
      i.unit) as RecipeIngredient["unit"],
  }))

  const materialCost = getMaterialCost(recipeIngredients, products as any)
  const foodCostPct = getFoodCostPercent(materialCost, watchedPrice || 0)
  const margin = getGrossMargin(watchedPrice || 0, materialCost)

  async function handleSubmit(data: FormValues) {
    if (!isDevMode) {
      try {
        const apiPayload = {
          name: data.name,
          categorieId: 1, // Default category — would need a category picker mapping
          price: String(data.sellingPrice),
          description: data.notes || null,
        }

        if (isEditing && editRecipe) {
          await apiPatch(`articles/${id}/`, apiPayload)
          toast.success("Article modifié")
        } else {
          await apiPost("articles/", apiPayload)
          toast.success("Article créé")
        }
        navigate("/cuisine")
        return
      } catch {
        toast.error("Erreur lors de l'enregistrement")
        return
      }
    }

    // Dev mode: use Zustand store
    const recipeData = {
      name: data.name,
      icon: icon || undefined,
      category: data.category,
      sellingPrice: data.sellingPrice,
      portions: data.portions ?? 1,
      ingredients: recipeIngredients,
      allergens,
      isActive: editRecipe ? editRecipe.isActive : true,
      notes: data.notes,
    }

    if (isEditing && editRecipe) {
      updateRecipe(editRecipe.id, recipeData)
    } else {
      addRecipe(recipeData)
    }

    navigate("/cuisine")
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
          onClick={() => navigate("/cuisine")}
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            className="size-4"
            strokeWidth={2}
          />
        </Button>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {isEditing ? "Modifier la recette" : "Nouvelle recette"}
        </h1>
        <span className="text-sm text-muted-foreground">
          {isEditing
            ? "Modifiez les informations de la recette."
            : "Remplissez les informations pour créer une recette."}
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

            {/* TODO: Icône — pas de champ backend */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {/* TODO: Portions — pas de champ backend */}
            </div>

            <Separator />

            {/* Ingrédients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Ingrédients</h2>
                <IngredientCombobox
                  products={products as any}
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

            <Separator />

            {/* TODO: Allergènes — pas de champ backend */}

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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/cuisine")}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {isEditing ? "Enregistrer" : "Créer la recette"}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  )
}

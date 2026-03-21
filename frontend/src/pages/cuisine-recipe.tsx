import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
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
import { CATEGORY_LABELS, ALLERGEN_OPTIONS } from "@/components/carte/types"
import {
  getMaterialCost,
  getFoodCostPercent,
  getGrossMargin,
  getFoodCostColor,
} from "@/components/carte/utils"
import { IngredientCombobox } from "@/components/carte/ingredient-combobox"
import { PRODUCT_ICONS } from "@/components/stock/product-icons"
import { useRecipeStore } from "@/stores/recipe-store"
import { usePageTitle } from "@/hooks/use-page-title"

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  category: z.enum(["entree", "plat", "dessert", "boisson"]),
  sellingPrice: z.coerce.number().min(0.01, "Min. 0,01 €"),
  portions: z.coerce.number().min(1, "Min. 1"),
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
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
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
  const products = MOCK_PRODUCTS

  const recipes = useRecipeStore((s) => s.recipes)
  const addRecipe = useRecipeStore((s) => s.addRecipe)
  const updateRecipe = useRecipeStore((s) => s.updateRecipe)

  const editRecipe = id ? (recipes.find((r) => r.id === id) ?? null) : null
  const isEditing = !!editRecipe

  const [ingredients, setIngredients] = useState<IngredientLine[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [icon, setIcon] = useState<string>("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "plat",
      sellingPrice: 0,
      portions: 4,
      notes: "",
    },
  })

  const watchedPrice = useWatch({ control: form.control, name: "sellingPrice" })
  const availableIcons = PRODUCT_ICONS

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
    const recipeData = {
      name: data.name,
      icon: icon || undefined,
      category: data.category,
      sellingPrice: data.sellingPrice,
      portions: data.portions,
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

            {/* Icône */}
            <div>
              <span className="text-sm font-medium">Icône</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {availableIcons.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    title={entry.label}
                    className={[
                      "flex size-9 items-center justify-center rounded-lg border transition-colors",
                      icon === entry.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
                    ].join(" ")}
                    onClick={() => setIcon(icon === entry.key ? "" : entry.key)}
                  >
                    <HugeiconsIcon
                      icon={entry.icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
            </div>

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

            <Separator />

            {/* Ingrédients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Ingrédients</h2>
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

            {/* Allergènes */}
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Allergènes</h2>
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

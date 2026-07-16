import { useState, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Add01Icon,
  Remove01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { Recipe, RecipeCategory } from "@/components/carte/types"
import { CATEGORY_LABELS_PLURAL } from "@/components/carte/types"
import { formatCurrency } from "@/components/stock/utils"
import { cn } from "@/lib/utils"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipes: Recipe[]
  onSubmit: (
    items: Array<{
      articleId: number
      quantity: number
      awaitingService: boolean
    }>
  ) => void
}

type CartItem = {
  articleId: number
  quantity: number
  awaitingService: boolean
}

const CATEGORY_ORDER: RecipeCategory[] = [
  "entree",
  "plat",
  "dessert",
  "boisson",
]

export function AddItemDialog({
  open,
  onOpenChange,
  recipes,
  onSubmit,
}: AddItemDialogProps) {
  const [search, setSearch] = useState("")
  const [categoryTab, setCategoryTab] = useState<string>("entree")
  const [cart, setCart] = useState<Map<number, CartItem>>(new Map())
  const [awaitingService, setAwaitingService] = useState(false)

  // Reset on open
  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (v) {
        setCart(new Map())
        setSearch("")
        setCategoryTab("entree")
        setAwaitingService(false)
      }
      onOpenChange(v)
    },
    [onOpenChange]
  )

  const filtered = useMemo(() => {
    let result = recipes.filter((r) => r.category === categoryTab && r.isActive)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(q))
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, "fr"))
  }, [recipes, categoryTab, search])

  const addToCart = useCallback(
    (recipe: Recipe) => {
      setCart((prev) => {
        const next = new Map(prev)
        const id = Number(recipe.id)
        const existing = next.get(id)
        if (existing) {
          next.set(id, { ...existing, quantity: existing.quantity + 1 })
        } else {
          next.set(id, {
            articleId: id,
            quantity: 1,
            awaitingService:
              categoryTab === "dessert" ? awaitingService : false,
          })
        }
        return next
      })
    },
    [categoryTab, awaitingService]
  )

  const removeFromCart = useCallback((articleId: number) => {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(articleId)
      if (existing && existing.quantity > 1) {
        next.set(articleId, { ...existing, quantity: existing.quantity - 1 })
      } else {
        next.delete(articleId)
      }
      return next
    })
  }, [])

  const totalItems = useMemo(
    () => Array.from(cart.values()).reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  )

  const handleSubmit = useCallback(() => {
    onSubmit(Array.from(cart.values()))
    handleOpenChange(false)
  }, [cart, onSubmit, handleOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Ajouter des articles</DialogTitle>
          <DialogDescription>
            Sélectionnez les articles à ajouter à la commande.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-4"
                strokeWidth={2}
              />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>

          <Tabs value={categoryTab} onValueChange={setCategoryTab}>
            <TabsList className="w-full">
              {CATEGORY_ORDER.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="flex-1">
                  {CATEGORY_LABELS_PLURAL[cat]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {categoryTab === "dessert" && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/[0.06] px-3 py-2">
              <Switch
                id="awaiting-service"
                checked={awaitingService}
                onCheckedChange={setAwaitingService}
              />
              <Label htmlFor="awaiting-service" className="text-sm">
                En attente de service
              </Label>
            </div>
          )}
        </div>

        <div className="-mx-6 min-h-0 flex-1 space-y-1 overflow-auto px-6 py-2">
          {filtered.map((recipe) => {
            const inCart = cart.get(Number(recipe.id))
            return (
              <div
                key={recipe.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  inCart ? "bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {recipe.name}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(recipe.sellingPrice)}
                </span>
                <div className="flex items-center gap-1">
                  {inCart && (
                    <>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeFromCart(Number(recipe.id))}
                      >
                        <HugeiconsIcon
                          icon={Remove01Icon}
                          className="size-3.5"
                          strokeWidth={2}
                        />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">
                        {inCart.quantity}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => addToCart(recipe)}
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="size-3.5"
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun article trouvé
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={totalItems === 0}>
            Ajouter {totalItems > 0 && `(${totalItems})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

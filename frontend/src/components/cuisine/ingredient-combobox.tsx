import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import type { Product } from "@/components/stocks/types"
import { UNIT_LABELS } from "@/components/stocks/types"
import { formatCurrency } from "@/components/stocks/utils"

interface IngredientComboboxProps {
  products: Product[]
  selectedProductIds: string[]
  onSelect: (product: Product) => void
}

export function IngredientCombobox({
  products,
  selectedProductIds,
  onSelect,
}: IngredientComboboxProps) {
  const [open, setOpen] = useState(false)

  const available = products.filter(
    (p) => !selectedProductIds.includes(p.id)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" type="button" />
        }
      >
        + Ajouter un ingrédient
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Rechercher un produit..." />
          <CommandList>
            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            <CommandGroup>
              {available.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product)
                    setOpen(false)
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(product.unitPrice)}/{UNIT_LABELS[product.unit]}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

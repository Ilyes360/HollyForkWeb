import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface TableInfo {
  id: number
  numero: number
  capacity: number
  salleName: string
  isOccupied: boolean
}

interface NewOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: TableInfo[]
  onSubmit: (tableId: number) => void
}

export function NewOrderDialog({
  open,
  onOpenChange,
  tables,
  onSubmit,
}: NewOrderDialogProps) {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, TableInfo[]>()
    for (const t of tables) {
      const key = t.salleName || "Salle"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tables])

  const handleSubmit = () => {
    if (selectedTableId !== null) {
      onSubmit(selectedTableId)
      onOpenChange(false)
      setSelectedTableId(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedTableId(null)
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md!">
        <DialogHeader>
          <DialogTitle>Nouvelle commande</DialogTitle>
          <DialogDescription>
            Sélectionnez une table pour ouvrir une commande.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-4 overflow-auto">
          {[...grouped.entries()].map(([salleName, salleTables]) => (
            <div key={salleName}>
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {salleName}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {salleTables
                  .sort((a, b) => a.numero - b.numero)
                  .map((table) => (
                    <button
                      key={table.id}
                      type="button"
                      disabled={table.isOccupied}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all",
                        table.isOccupied &&
                          "cursor-not-allowed border-border/40 opacity-40",
                        !table.isOccupied &&
                          selectedTableId !== table.id &&
                          "border-border hover:border-primary/50 hover:bg-primary/5",
                        selectedTableId === table.id &&
                          "border-primary bg-primary/10"
                      )}
                      onClick={() =>
                        !table.isOccupied && setSelectedTableId(table.id)
                      }
                    >
                      <span className="text-lg font-semibold">
                        {table.numero}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {table.capacity} pl.
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}

          {tables.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune table disponible
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={selectedTableId === null}>
            Ouvrir la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

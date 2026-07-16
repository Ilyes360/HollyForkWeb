import { useState, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/components/stock/utils"
import { cn } from "@/lib/utils"

interface PaymentMethod {
  id: number
  name: string
}

interface PaymentLine {
  methodId: number
  amount: number
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalAmount: number
  tableNumber: number | null
  paymentMethods: PaymentMethod[]
  onSubmit: (payments: PaymentLine[]) => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  tableNumber,
  paymentMethods,
  onSubmit,
}: PaymentDialogProps) {
  const [lines, setLines] = useState<PaymentLine[]>([])

  // Reset on open
  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (v) {
        setLines([
          {
            methodId: paymentMethods[0]?.id ?? 0,
            amount: totalAmount,
          },
        ])
      }
      onOpenChange(v)
    },
    [onOpenChange, paymentMethods, totalAmount]
  )

  const totalPaid = useMemo(
    () => lines.reduce((sum, l) => sum + l.amount, 0),
    [lines]
  )
  const remaining = Math.max(
    0,
    Math.round((totalAmount - totalPaid) * 100) / 100
  )

  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      { methodId: paymentMethods[0]?.id ?? 0, amount: remaining },
    ])
  }, [paymentMethods, remaining])

  const removeLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateLine = useCallback(
    (index: number, field: keyof PaymentLine, value: number) => {
      setLines((prev) =>
        prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
      )
    },
    []
  )

  const handleSubmit = useCallback(() => {
    onSubmit(lines.filter((l) => l.amount > 0))
    handleOpenChange(false)
  }, [lines, onSubmit, handleOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md!">
        <DialogHeader>
          <DialogTitle>
            Encaisser{tableNumber ? ` — Table ${tableNumber}` : ""}
          </DialogTitle>
          <DialogDescription>
            Total : {formatCurrency(totalAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={String(line.methodId)}
                onValueChange={(v) => updateLine(i, "methodId", Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.amount}
                onChange={(e) =>
                  updateLine(i, "amount", parseFloat(e.target.value) || 0)
                }
                className="flex-1 text-right tabular-nums"
              />
              <span className="text-sm text-muted-foreground">€</span>

              {lines.length > 1 && (
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeLine(i)}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="size-4"
                    strokeWidth={2}
                  />
                </button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addLine}
            className="w-full"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Ajouter un paiement (split)
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reste à payer</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                remaining > 0 ? "text-destructive" : "text-emerald-600"
              )}
            >
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={remaining > 0.01}>
            Encaisser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

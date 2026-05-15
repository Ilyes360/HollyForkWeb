import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { CATEGORY_LABELS } from "@/components/stock/types"
import type { SupplierFull } from "./types"

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: SupplierFull | null
  onSubmit: (data: Omit<SupplierFull, "id">) => void
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
)

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
}: SupplierDialogProps) {
  const isEditing = !!supplier

  const [name, setName] = useState("")
  const [category, setCategory] = useState("viandes")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [averageDeliveryDays, setAverageDeliveryDays] = useState(2)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open && supplier) {
      // Form-reset-on-open — intentional setState in effect
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(supplier.name)
      setCategory(supplier.category)
      setPhone(supplier.phone)
      setEmail(supplier.email)
      setAddress(supplier.address)
      setAverageDeliveryDays(supplier.averageDeliveryDays)
      setNotes(supplier.notes)
      /* eslint-enable react-hooks/set-state-in-effect */
    } else if (open && !supplier) {
      setName("")
      setCategory("viandes")
      setPhone("")
      setEmail("")
      setAddress("")
      setAverageDeliveryDays(2)
      setNotes("")
    }
  }, [open, supplier])

  const canSubmit = name.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      category,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      averageDeliveryDays,
      notes: notes.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du fournisseur."
              : "Renseignez les informations du nouveau fournisseur."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Nom *</Label>
            <Input
              id="supplier-name"
              placeholder="Ex : Boucherie Moderne"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Téléphone</Label>
              <Input
                id="supplier-phone"
                placeholder="01 23 45 67 89"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                placeholder="contact@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-address">Adresse</Label>
            <Input
              id="supplier-address"
              placeholder="12 rue du Marché, 75001 Paris"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-delivery">
              Délai de livraison moyen (jours)
            </Label>
            <Input
              id="supplier-delivery"
              type="number"
              min={1}
              max={30}
              value={averageDeliveryDays}
              onChange={(e) => setAverageDeliveryDays(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-notes">Notes</Label>
            <Textarea
              id="supplier-notes"
              placeholder="Remarques, conditions particulières..."
              className="min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ThermometerColdIcon,
  ContainerIcon,
  Cabinet01Icon,
  DrinkIcon,
  Delete02Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useInventoryStore } from "@/stores/inventory-store"
import type { StorageZoneConfig, CategoryConfig } from "@/stores/inventory-store"

const ZONE_ICON_MAP: Record<string, typeof ThermometerColdIcon> = {
  chambre_froide_a: ThermometerColdIcon,
  chambre_froide_b: ThermometerColdIcon,
  reserve_legumes: ContainerIcon,
  reserve_seche: Cabinet01Icon,
  cave: DrinkIcon,
}
const DEFAULT_ZONE_ICON = ContainerIcon

const CATEGORY_COLORS: Record<string, string> = {
  viandes: "bg-red-100 text-red-700",
  poissons: "bg-blue-100 text-blue-700",
  legumes: "bg-emerald-100 text-emerald-700",
  epicerie: "bg-amber-100 text-amber-700",
  boissons: "bg-violet-100 text-violet-700",
  autres: "bg-gray-100 text-gray-600",
}
const DEFAULT_CAT_COLOR = "bg-muted text-muted-foreground"

interface ZoneManagerPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DeleteTarget = { type: "zone"; item: StorageZoneConfig } | { type: "category"; item: CategoryConfig }

export function ZoneManagerPanel({ open, onOpenChange }: ZoneManagerPanelProps) {
  const {
    storageZones, categories, products,
    addStorageZone, updateStorageZone, deleteStorageZone,
    addCategory, updateCategory, deleteCategory,
  } = useInventoryStore()

  const [tab, setTab] = useState<"zones" | "categories">("zones")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newName, setNewName] = useState("")
  const [showNewInput, setShowNewInput] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const zoneProductCount = (zoneId: string) =>
    products.filter((p) => p.storageZone === zoneId).length
  const catProductCount = (catId: string) =>
    products.filter((p) => p.category === catId).length

  const deleteTargetCount = deleteTarget
    ? deleteTarget.type === "zone"
      ? zoneProductCount(deleteTarget.item.id)
      : catProductCount(deleteTarget.item.id)
    : 0

  const handleStartEdit = (id: string, label: string) => {
    setEditingId(id)
    setEditValue(label)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editValue.trim()) { setEditingId(null); return }
    if (tab === "zones") updateStorageZone(editingId, { label: editValue.trim() })
    else updateCategory(editingId, { label: editValue.trim() })
    setEditingId(null)
  }

  const generateId = (name: string) =>
    name.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")

  const handleAdd = () => {
    if (!newName.trim()) return
    const id = generateId(newName)
    if (tab === "zones") addStorageZone({ id, label: newName.trim() })
    else addCategory({ id, label: newName.trim() })
    setNewName("")
    setShowNewInput(false)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "zone") deleteStorageZone(deleteTarget.item.id)
    else deleteCategory(deleteTarget.item.id)
    setDeleteTarget(null)
  }

  const handleTabChange = (v: string) => {
    setTab(v as "zones" | "categories")
    setEditingId(null)
    setShowNewInput(false)
    setNewName("")
  }

  const renderZoneRow = (zone: StorageZoneConfig) => {
    const count = zoneProductCount(zone.id)
    const isEditing = editingId === zone.id
    const icon = ZONE_ICON_MAP[zone.id] ?? DEFAULT_ZONE_ICON

    return (
      <div
        key={zone.id}
        className="group flex items-center gap-2.5 border-b border-border/50 px-1 py-2.5 last:border-b-0"
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
          <HugeiconsIcon icon={icon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
        </div>

        {isEditing ? (
          <input
            className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit()
              if (e.key === "Escape") setEditingId(null)
            }}
            autoFocus
          />
        ) : (
          <span
            className="flex-1 cursor-pointer text-[13px] font-medium"
            onDoubleClick={() => handleStartEdit(zone.id, zone.label)}
          >
            {zone.label}
          </span>
        )}

        <span className="min-w-[20px] text-right text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>

        <button
          type="button"
          className="size-6 flex items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={() => setDeleteTarget({ type: "zone", item: zone })}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    )
  }

  const renderCategoryRow = (cat: CategoryConfig) => {
    const count = catProductCount(cat.id)
    const isEditing = editingId === cat.id
    const colorClass = CATEGORY_COLORS[cat.id] ?? DEFAULT_CAT_COLOR

    return (
      <div
        key={cat.id}
        className="group flex items-center gap-2.5 border-b border-border/50 px-1 py-2.5 last:border-b-0"
      >
        <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
          <span className="text-[11px] font-semibold">
            {cat.label.charAt(0).toUpperCase()}
          </span>
        </div>

        {isEditing ? (
          <input
            className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit()
              if (e.key === "Escape") setEditingId(null)
            }}
            autoFocus
          />
        ) : (
          <span
            className="flex-1 cursor-pointer text-[13px] font-medium"
            onDoubleClick={() => handleStartEdit(cat.id, cat.label)}
          >
            {cat.label}
          </span>
        )}

        <span className="min-w-[20px] text-right text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>

        <button
          type="button"
          className="size-6 flex items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={() => setDeleteTarget({ type: "category", item: cat })}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[360px] sm:max-w-[360px]!">
          <SheetHeader>
            <SheetTitle>Organisation du stock</SheetTitle>
            <SheetDescription>
              Zones de stockage et catégories de produits.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 px-6">
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList className="w-full">
                <TabsTrigger value="zones" className="flex-1">Zones</TabsTrigger>
                <TabsTrigger value="categories" className="flex-1">Catégories</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="mt-2 text-[10px] italic text-muted-foreground/60">
              Double-cliquez sur un nom pour le modifier
            </p>
          </div>

          <div className="mt-2 px-6">
            {tab === "zones"
              ? storageZones.map((z) => renderZoneRow(z))
              : categories.map((c) => renderCategoryRow(c))
            }

            {showNewInput ? (
              <div className="flex items-center gap-2 py-2.5">
                <input
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={tab === "zones" ? "Nom de la zone..." : "Nom de la catégorie..."}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd()
                    if (e.key === "Escape") { setShowNewInput(false); setNewName("") }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
                  Ajouter
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2.5 py-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowNewInput(true)}
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
                </div>
                {tab === "zones" ? "Ajouter une zone" : "Ajouter une catégorie"}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer « {deleteTarget.item.label} »</DialogTitle>
              <DialogDescription>
                {deleteTargetCount > 0
                  ? `${deleteTargetCount} produit${deleteTargetCount > 1 ? "s" : ""} utilise${deleteTargetCount > 1 ? "nt" : ""} ${deleteTarget.type === "zone" ? "cette zone" : "cette catégorie"}. ${deleteTarget.type === "zone" ? "Ils seront déplacés vers « Non assigné »." : "Ils passeront en « Autres »."}`
                  : "Êtes-vous sûr de vouloir supprimer cet élément ?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

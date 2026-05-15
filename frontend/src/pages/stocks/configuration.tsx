import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
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
import { usePageTitle } from "@/hooks/use-page-title"
import type { StorageZoneConfig, CategoryConfig } from "@/components/stock/types"
import { DEFAULT_STORAGE_ZONES, DEFAULT_CATEGORIES } from "@/components/stock/types"

// ── Schemas ──

const zoneSchema = z.object({
  label: z.string().min(2, "Le nom est requis"),
  description: z.string(),
})

const categorySchema = z.object({
  label: z.string().min(2, "Le nom est requis"),
})

type ZoneFormValues = z.infer<typeof zoneSchema>
type CategoryFormValues = z.infer<typeof categorySchema>

// ── Animation ──

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const as [number, number, number, number] },
  },
}

// ── Zone Dialog ──

function ZoneDialog({
  open,
  onOpenChange,
  zone,
  onAdd,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone: StorageZoneConfig | null
  onAdd: (zone: StorageZoneConfig) => void
  onUpdate: (id: string, updates: Partial<StorageZoneConfig>) => void
}) {
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    values: zone
      ? { label: zone.label, description: zone.description ?? "" }
      : { label: "", description: "" },
  })

  function handleSubmit(data: ZoneFormValues) {
    if (zone) {
      onUpdate(zone.id, data)
    } else {
      const id = data.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
      onAdd({ id, label: data.label, description: data.description || undefined })
    }
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md!">
        <DialogHeader>
          <DialogTitle>{zone ? "Modifier la zone" : "Ajouter une zone"}</DialogTitle>
          <DialogDescription>
            {zone
              ? "Modifiez les informations de la zone de stockage."
              : "Ajoutez une nouvelle zone de stockage."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Chambre froide C" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Description optionnelle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">{zone ? "Enregistrer" : "Ajouter"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Category Dialog ──

function CategoryDialog({
  open,
  onOpenChange,
  category,
  onAdd,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryConfig | null
  onAdd: (cat: CategoryConfig) => void
  onUpdate: (id: string, updates: Partial<CategoryConfig>) => void
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: category ? { label: category.label } : { label: "" },
  })

  function handleSubmit(data: CategoryFormValues) {
    if (category) {
      onUpdate(category.id, data)
    } else {
      const id = data.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
      onAdd({ id, label: data.label })
    }
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md!">
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Modifiez le nom de la catégorie."
              : "Ajoutez une nouvelle catégorie de produits."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Produits laitiers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">{category ? "Enregistrer" : "Ajouter"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Confirm Dialog ──

function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemLabel,
  productCount,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemLabel: string
  productCount: number
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer « {itemLabel} »</DialogTitle>
          <DialogDescription>
            {productCount > 0
              ? `Attention : ${productCount} produit${productCount > 1 ? "s" : ""} utilise${productCount > 1 ? "nt" : ""} encore cet élément. La suppression ne réassignera pas ces produits.`
              : "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ──

export default function StocksConfigurationPage() {
  usePageTitle("Configuration")
  // Local-only config — no backend API for zones/categories management yet
  const [storageZones, setStorageZones] = useState<StorageZoneConfig[]>(DEFAULT_STORAGE_ZONES)
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES)
  const products: { storageZone: string; category: string }[] = []

  const addStorageZone = (zone: StorageZoneConfig) => setStorageZones((prev) => [...prev, zone])
  const updateStorageZone = (id: string, updates: Partial<StorageZoneConfig>) =>
    setStorageZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updates } : z)))
  const deleteStorageZone = (id: string) => setStorageZones((prev) => prev.filter((z) => z.id !== id))
  const addCategory = (cat: CategoryConfig) => setCategories((prev) => [...prev, cat])
  const updateCategory = (id: string, updates: Partial<CategoryConfig>) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  const deleteCategory = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id))

  // Zone state
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<StorageZoneConfig | null>(null)
  const [deleteZoneTarget, setDeleteZoneTarget] = useState<StorageZoneConfig | null>(null)

  // Category state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryConfig | null>(null)
  const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryConfig | null>(null)

  const zoneProductCount = (zoneId: string) =>
    products.filter((p) => p.storageZone === zoneId).length

  const catProductCount = (catId: string) =>
    products.filter((p) => p.category === catId).length

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold tracking-tight">Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les zones de stockage et les catégories de produits.
        </p>
      </motion.div>

      {/* Zones de stockage */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Zones de stockage</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingZone(null)
                setZoneDialogOpen(true)
              }}
            >
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Produits</TableHead>
                    <TableHead className="w-[140px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {zone.description || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{zoneProductCount(zone.id)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingZone(zone)
                              setZoneDialogOpen(true)
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteZoneTarget(zone)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {storageZones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucune zone de stockage.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Catégories de produits */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Catégories de produits</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingCat(null)
                setCatDialogOpen(true)
              }}
            >
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="w-[100px]">Produits</TableHead>
                    <TableHead className="w-[140px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.label}</TableCell>
                      <TableCell className="text-sm">{catProductCount(cat.id)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCat(cat)
                              setCatDialogOpen(true)
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteCatTarget(cat)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Aucune catégorie.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <ZoneDialog
        open={zoneDialogOpen}
        onOpenChange={setZoneDialogOpen}
        zone={editingZone}
        onAdd={addStorageZone}
        onUpdate={updateStorageZone}
      />
      <CategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        category={editingCat}
        onAdd={addCategory}
        onUpdate={updateCategory}
      />
      {deleteZoneTarget && (
        <DeleteConfirmDialog
          open={!!deleteZoneTarget}
          onOpenChange={(v) => { if (!v) setDeleteZoneTarget(null) }}
          itemLabel={deleteZoneTarget.label}
          productCount={zoneProductCount(deleteZoneTarget.id)}
          onConfirm={() => deleteStorageZone(deleteZoneTarget.id)}
        />
      )}
      {deleteCatTarget && (
        <DeleteConfirmDialog
          open={!!deleteCatTarget}
          onOpenChange={(v) => { if (!v) setDeleteCatTarget(null) }}
          itemLabel={deleteCatTarget.label}
          productCount={catProductCount(deleteCatTarget.id)}
          onConfirm={() => deleteCategory(deleteCatTarget.id)}
        />
      )}
    </motion.div>
  )
}

import { useState, useCallback, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Sun02Icon, Moon02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useArticles } from "@/hooks/use-articles"
import { usePageTitle } from "@/hooks/use-page-title"
import { useAuthStore } from "@/stores/auth-store"
import {
  useCommandesActives,
  useCreateCommande,
  useUpdateCommande,
  useAnnulerCommande,
  useAddLigneCommande,
  useReclamerLigne,
} from "@/hooks/use-commandes-clients"
import { useSalles } from "@/hooks/use-salles"
import { usePaymentMethods } from "@/hooks/use-settings"
import { OrderCard } from "@/components/commandes-clients/order-card"
import { OrderDetail } from "@/components/commandes-clients/order-detail"
import { AddItemDialog } from "@/components/commandes-clients/add-item-dialog"
import { NewOrderDialog } from "@/components/commandes-clients/new-order-dialog"
import { PaymentDialog } from "@/components/commandes-clients/payment-dialog"
import { cn } from "@/lib/utils"

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

function getServiceType(): "midi" | "soir" {
  return new Date().getHours() < 15 ? "midi" : "soir"
}

export default function CommandesClientsPage() {
  usePageTitle("Commandes")

  const { restaurantId } = useActiveRestaurant()
  const user = useAuthStore((s) => s.user)
  const { data: commandes, isLoading } = useCommandesActives(restaurantId)
  const { data: recipes } = useArticles()
  const { data: sallesData } = useSalles(restaurantId)
  const { data: paymentMethods } = usePaymentMethods()

  const createCommande = useCreateCommande()
  const updateCommande = useUpdateCommande()
  const annulerCommande = useAnnulerCommande()
  const addLigne = useAddLigneCommande()
  const reclamerLigne = useReclamerLigne()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [service, setService] = useState<string>(getServiceType)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  // Build table number lookup
  const tableMap = useMemo(() => {
    const map = new Map<
      number,
      { numero: number; salleName: string; capacity: number }
    >()
    for (const salle of sallesData) {
      for (const table of salle.tables ?? []) {
        map.set(table.id, {
          numero: table.numero,
          salleName: salle.name,
          capacity: table.capacity,
        })
      }
    }
    return map
  }, [sallesData])

  // Sort commandes: READY first, then by age (oldest first)
  const sorted = useMemo(
    () =>
      [...commandes].sort((a, b) => {
        const statusOrder = { READY: 0, IN_PROGRESS: 1, PENDING: 2 }
        const sa = statusOrder[a.kitchenStatus] ?? 2
        const sb = statusOrder[b.kitchenStatus] ?? 2
        if (sa !== sb) return sa - sb
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }),
    [commandes]
  )

  const selected = useMemo(
    () => commandes.find((c) => c.id === selectedId) ?? null,
    [commandes, selectedId]
  )

  // Tables for new order dialog
  const availableTables = useMemo(() => {
    const occupiedTableIds = new Set(
      commandes.filter((c) => c.tableId).map((c) => c.tableId!)
    )
    const tables: Array<{
      id: number
      numero: number
      capacity: number
      salleName: string
      isOccupied: boolean
    }> = []
    for (const salle of sallesData) {
      for (const table of salle.tables ?? []) {
        tables.push({
          id: table.id,
          numero: table.numero,
          capacity: table.capacity,
          salleName: salle.name,
          isOccupied: occupiedTableIds.has(table.id),
        })
      }
    }
    return tables
  }, [sallesData, commandes])

  // Payment methods formatted
  const paymentMethodsList = useMemo(
    () => paymentMethods.map((m) => ({ id: m.id, name: m.name })),
    [paymentMethods]
  )

  // ── Handlers ──

  const handleNewOrder = useCallback(
    (tableId: number) => {
      if (!restaurantId || !user) return
      createCommande.mutate(
        {
          restaurantId,
          tableId,
          createdById: user.id,
        },
        {
          onSuccess: (data) => {
            toast.success("Commande créée")
            setSelectedId((data as { id: number }).id)
          },
        }
      )
    },
    [restaurantId, user, createCommande]
  )

  const handleAddItems = useCallback(
    (
      items: Array<{
        articleId: number
        quantity: number
        awaitingService: boolean
      }>
    ) => {
      if (!selectedId) return
      for (const item of items) {
        addLigne.mutate({
          commandeId: selectedId,
          articleId: item.articleId,
          quantity: item.quantity,
          awaitingService: item.awaitingService,
        })
      }
      toast.success(`${items.length} article(s) ajouté(s)`)
    },
    [selectedId, addLigne]
  )

  const handleReclaimLines = useCallback(
    (lineIds: number[]) => {
      for (const id of lineIds) {
        reclamerLigne.mutate(id)
      }
      toast.success("Desserts envoyés en cuisine")
    },
    [reclamerLigne]
  )

  const handleValidate = useCallback(() => {
    if (!selectedId) return
    updateCommande.mutate(
      { id: selectedId, data: { status: "VALIDEE" } },
      {
        onSuccess: () => {
          toast.success("Commande validée")
          setSelectedId(null)
        },
      }
    )
  }, [selectedId, updateCommande])

  const handleCancel = useCallback(() => {
    if (!selectedId) return
    annulerCommande.mutate(selectedId, {
      onSuccess: () => {
        toast.success("Commande annulée")
        setSelectedId(null)
      },
    })
  }, [selectedId, annulerCommande])

  const handlePayment = useCallback(
    (_payments: Array<{ methodId: number; amount: number }>) => {
      // TODO: POST /api/factures/ then POST /api/paiements/ for each payment
      // For now, just validate the order
      toast.success("Paiement enregistré")
      handleValidate()
    },
    [handleValidate]
  )

  const selectedTableNumber = selected?.tableId
    ? (tableMap.get(selected.tableId)?.numero ?? null)
    : null

  return (
    <motion.div
      className="flex h-full flex-col gap-4"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Commandes
          </h1>
          <p className="text-sm text-muted-foreground">
            {commandes.length} commande{commandes.length > 1 ? "s" : ""} active
            {commandes.length > 1 ? "s" : ""}
          </p>
        </div>

        <Tabs value={service} onValueChange={setService} className="ml-4">
          <TabsList>
            <TabsTrigger value="midi">
              <HugeiconsIcon
                icon={Sun02Icon}
                className="mr-1 size-3.5 text-amber-500"
                strokeWidth={2}
              />
              Midi
            </TabsTrigger>
            <TabsTrigger value="soir">
              <HugeiconsIcon
                icon={Moon02Icon}
                className="mr-1 size-3.5 text-indigo-400"
                strokeWidth={2}
              />
              Soir
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
          <Button onClick={() => setNewOrderOpen(true)}>
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Nouvelle commande
          </Button>
        </div>
      </motion.div>

      {/* Split view */}
      <motion.div variants={fadeUp} className="flex min-h-0 flex-1 gap-4">
        {/* Left panel — orders list */}
        <div
          className={cn(
            "w-[340px] shrink-0 space-y-2 overflow-auto rounded-xl border border-border bg-card p-3",
            !selected && "max-w-none flex-1"
          )}
        >
          {sorted.map((commande) => {
            const tableInfo = commande.tableId
              ? tableMap.get(commande.tableId)
              : null
            return (
              <OrderCard
                key={commande.id}
                commande={commande}
                tableNumber={tableInfo?.numero ?? null}
                isSelected={commande.id === selectedId}
                onClick={() => setSelectedId(commande.id)}
              />
            )
          })}

          {sorted.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium">Aucune commande active</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ouvrez une commande sur une table pour commencer.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setNewOrderOpen(true)}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  className="size-4"
                  strokeWidth={2}
                />
                Nouvelle commande
              </Button>
            </div>
          )}
        </div>

        {/* Right panel — order detail */}
        {selected && (
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
            <OrderDetail
              commande={selected}
              tableNumber={selectedTableNumber}
              recipes={recipes}
              onAddItem={() => setAddItemOpen(true)}
              onReclaimLines={handleReclaimLines}
              onValidate={handleValidate}
              onCancel={handleCancel}
              onEncaisser={() => setPaymentOpen(true)}
            />
          </div>
        )}
      </motion.div>

      {/* Dialogs */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        recipes={recipes}
        onSubmit={handleAddItems}
      />

      <NewOrderDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        tables={availableTables}
        onSubmit={handleNewOrder}
      />

      {selected && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          totalAmount={selected.amount}
          tableNumber={selectedTableNumber}
          paymentMethods={paymentMethodsList}
          onSubmit={handlePayment}
        />
      )}
    </motion.div>
  )
}

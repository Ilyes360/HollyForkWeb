import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { FloorElement, TableShape, ZoneShape } from "./types"
import { RoomMiniMap } from "./room-mini-map"
import { RoomTableCard } from "./room-table-card"

interface RoomSectionProps {
  zone: ZoneShape
  tables: TableShape[]
  allElements: FloorElement[]
  onEdit: (roomId: string) => void
  onDelete: (roomId: string) => void
}

export function RoomSection({ zone, tables, allElements, onEdit, onDelete }: RoomSectionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0)

  return (
    <>
      <Collapsible defaultOpen>
        <div className="rounded-xl bg-card ring-1 ring-border/60">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left group">
            <div className="flex items-center gap-1.5">
              <div
                className="size-3 shrink-0 rounded"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {zone.name}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                · {tables.length} table{tables.length > 1 ? "s" : ""} · {totalSeats} place{totalSeats > 1 ? "s" : ""}
              </span>
            </div>

            <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(zone.id) }}
                className="rounded p-0.5 hover:bg-muted"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5 text-muted-foreground hover:text-foreground" strokeWidth={2} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
                className="rounded p-0.5 hover:bg-muted"
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5 text-muted-foreground hover:text-destructive" strokeWidth={2} />
              </button>
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="flex gap-3 px-3 pb-3 pt-0.5">
              {/* Mini-map */}
              <div className="hidden w-[200px] shrink-0 sm:block">
                <RoomMiniMap elements={allElements} />
              </div>

              {/* Table cards grid */}
              <motion.div
                layout
                className="flex-1 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {tables.map((table, i) => (
                    <RoomTableCard key={table.id} table={table} index={i} />
                  ))}
                </AnimatePresence>
                {tables.length === 0 && (
                  <p className="col-span-full py-4 text-center text-xs text-muted-foreground">
                    Aucune table dans cette salle
                  </p>
                )}
              </motion.div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {zone.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La salle et ses {tables.length} table(s) seront supprimées.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => onDelete(zone.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

import { useMemo } from "react"
import { motion, type Variants } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, FloorPlanIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import type { FloorPlan, FloorElement, TableShape, ZoneShape } from "./types"
import { findRoomForPoint } from "./utils"
import { RoomSection } from "./room-section"

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
}

interface RoomData {
  zone: ZoneShape
  tables: TableShape[]
  elements: FloorElement[]
}

interface PlanCardViewProps {
  plan: FloorPlan
  onEdit: (roomId: string | null) => void
  onDelete: (roomId: string) => void
}

export function PlanCardView({ plan, onEdit, onDelete }: PlanCardViewProps) {
  const { rooms, unassignedTables } = useMemo(() => {
    const zones: ZoneShape[] = []
    const tables: TableShape[] = []
    const otherElements: FloorElement[] = []

    for (const el of plan.elements) {
      if (el.kind === "zone") zones.push(el)
      else if (el.kind === "table") tables.push(el)
      else otherElements.push(el)
    }

    const roomMap = new Map<string, RoomData>()
    for (const zone of zones) {
      roomMap.set(zone.id, { zone, tables: [], elements: [zone] })
    }

    // Assign walls/decorations to rooms
    for (const el of otherElements) {
      if (el.kind === "wall") {
        // Assign wall to the first zone whose polygon it touches
        const midX = el.x + (el.points[0] + el.points[2]) / 2
        const midY = el.y + (el.points[1] + el.points[3]) / 2
        const roomId = findRoomForPoint(midX, midY, zones)
        if (roomId && roomMap.has(roomId)) {
          roomMap.get(roomId)!.elements.push(el)
        }
      }
    }

    const unassignedTables: TableShape[] = []
    for (const table of [...tables].sort((a, b) => a.number - b.number)) {
      const roomId = findRoomForPoint(table.x, table.y, zones)
      if (roomId && roomMap.has(roomId)) {
        const room = roomMap.get(roomId)!
        room.tables.push(table)
        room.elements.push(table)
      } else {
        unassignedTables.push(table)
      }
    }

    return { rooms: Array.from(roomMap.values()), unassignedTables }
  }, [plan.elements])

  if (rooms.length === 0 && unassignedTables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FloorPlanIcon}
          title="Aucune salle configurée"
          description="Créez votre première salle pour commencer à organiser votre plan."
          actionLabel="Créer une salle"
          onAction={() => onEdit(null)}
        />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-3"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {rooms.map((room) => (
        <motion.div key={room.zone.id} variants={fadeUp}>
          <RoomSection
            zone={room.zone}
            tables={room.tables}
            allElements={room.elements}
            onEdit={(id) => onEdit(id)}
            onDelete={onDelete}
          />
        </motion.div>
      ))}

      {unassignedTables.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-xl bg-card ring-1 ring-border/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Hors zone · {unassignedTables.length} table{unassignedTables.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
              {unassignedTables.map((table, _i) => (
                <div key={table.id} className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{table.label}</span>
                  <span className="text-[11px] text-muted-foreground">{table.seats}p</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => onEdit(null)}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
          Nouvelle salle
        </Button>
      </motion.div>
    </motion.div>
  )
}

import { useState, useCallback, useRef } from "react"
import { motion, type Variants } from "motion/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FloorPlan, FloorElement, ZoneShape } from "@/components/salle/types"
import { findRoomForPoint, pointInPolygon } from "@/components/salle/utils"
import { ConsultationView } from "@/components/salle/consultation-view"
import { PlanCardView } from "@/components/salle/plan-card-view"
import { EditionOverlay } from "@/components/salle/edition-overlay"
import { useSalleEdition } from "@/components/salle/salle-context"
import { useSalleStore } from "@/components/salle/store"
import { useFloorPlanStore } from "@/stores/floor-plan-store"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { usePageTitle } from "@/hooks/use-page-title"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

/**
 * Find which room (zone) an element belongs to.
 * Handles tables, decorations (center point), and walls (midpoint nudged
 * toward zone centroid to handle boundary walls where ray-casting is ambiguous).
 */
function findRoomForElement(
  el: FloorElement,
  zones: ZoneShape[]
): string | null {
  if (el.kind === "zone") return el.id

  // Tables & decorations: simple center point test
  if (el.kind === "table" || el.kind === "decoration") {
    return findRoomForPoint(el.x, el.y, zones)
  }

  // Walls: midpoint test, then nudge toward each zone centroid for boundary walls
  if (el.kind === "wall" && el.points.length >= 4) {
    const midX = el.x + (el.points[0] + el.points[2]) / 2
    const midY = el.y + (el.points[1] + el.points[3]) / 2

    // Quick test: exact midpoint
    const mid = findRoomForPoint(midX, midY, zones)
    if (mid) return mid

    // Boundary walls: nudge midpoint 2px toward each zone centroid and test
    for (const zone of zones) {
      const n = zone.points.length / 2
      let cx = 0, cy = 0
      for (let i = 0; i < zone.points.length; i += 2) {
        cx += zone.points[i]
        cy += zone.points[i + 1]
      }
      cx = zone.x + cx / n
      cy = zone.y + cy / n

      const dx = cx - midX
      const dy = cy - midY
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d === 0) continue

      const nudgedX = midX + (dx / d) * 2
      const nudgedY = midY + (dy / d) * 2

      if (pointInPolygon(nudgedX, nudgedY, zone.points, zone.x, zone.y)) {
        return zone.id
      }
    }
  }

  return null
}

export default function SallePage() {
  usePageTitle("Salle")
  const plan = useFloorPlanStore((s) => s.plan)
  const setPlan = useFloorPlanStore((s) => s.setPlan)
  const [activeTab, setActiveTab] = useState("plan")
  const { isEditing, startEditing, stopEditing } = useSalleEdition()
  const completeTask = useGettingStartedStore((s) => s.completeTask)
  const editingRoomIdRef = useRef<string | null>(null)
  const fullPlanRef = useRef<FloorPlan>(plan)

  /** Helper: extract a single room's elements from the full plan */
  const extractRoomElements = useCallback((fullPlan: FloorPlan, roomId: string): FloorElement[] | null => {
    const zones = fullPlan.elements.filter((el): el is ZoneShape => el.kind === "zone")
    const targetZone = zones.find((z) => z.id === roomId)
    if (!targetZone) return null

    const roomElements: FloorElement[] = [targetZone]
    for (const el of fullPlan.elements) {
      if (el.kind === "zone") continue
      if (findRoomForElement(el, zones) === roomId) {
        roomElements.push(el)
      }
    }
    return roomElements
  }, [])

  const handleOpenEditor = useCallback((roomId: string | null) => {
    fullPlanRef.current = plan
    editingRoomIdRef.current = roomId

    let editorPlan: FloorPlan

    if (roomId) {
      // Edit existing room: load only that room's elements
      const roomElements = extractRoomElements(plan, roomId)
      if (roomElements) {
        editorPlan = { ...plan, elements: roomElements }
      } else {
        // Room not found — treat as new room
        editorPlan = { ...plan, elements: [] }
        editingRoomIdRef.current = null
      }
    } else {
      // New room: empty canvas
      editorPlan = { ...plan, elements: [] }
    }

    const handleSave = (editedPlan: FloorPlan) => {
      const rid = editingRoomIdRef.current
      const full = fullPlanRef.current

      let finalElements: FloorElement[]

      if (rid) {
        // Editing existing room: remove old room elements, add new ones
        const allZones = full.elements.filter((el): el is ZoneShape => el.kind === "zone")
        const oldRoomElementIds = new Set<string>()
        oldRoomElementIds.add(rid)
        for (const el of full.elements) {
          if (el.kind === "zone") continue
          if (findRoomForElement(el, allZones) === rid) {
            oldRoomElementIds.add(el.id)
          }
        }
        const keptElements = full.elements.filter((el) => !oldRoomElementIds.has(el.id))
        finalElements = [...keptElements, ...editedPlan.elements]
      } else {
        // New room: append new elements to the existing plan
        finalElements = [...full.elements, ...editedPlan.elements]
      }

      setPlan({ ...full, elements: finalElements })

      // Complete getting-started task if plan has at least one table
      if (finalElements.some((el) => el.kind === "table")) {
        completeTask("floor-plan")
      }
    }

    startEditing({
      initialPlan: editorPlan,
      onSave: handleSave,
      onClose: stopEditing,
    })

    // Set initial step based on room content
    const hasWalls = editorPlan.elements.some((el) => el.kind === "wall")
    const hasTables = editorPlan.elements.some((el) => el.kind === "table")
    if (hasTables) {
      useSalleStore.getState().setEditorStep("tables")
    } else if (hasWalls) {
      useSalleStore.getState().setEditorStep("doors")
    }
    // else stays on "walls" (default from loadPlan)
  }, [plan, startEditing, stopEditing, extractRoomElements, completeTask])

  const handleDeleteRoom = useCallback((roomId: string) => {
    const zones = plan.elements.filter((el): el is ZoneShape => el.kind === "zone")
    const idsToRemove = new Set<string>()
    idsToRemove.add(roomId)
    for (const el of plan.elements) {
      if (el.kind === "zone") continue
      if (findRoomForElement(el, zones) === roomId) {
        idsToRemove.add(el.id)
      }
    }
    setPlan({
      ...plan,
      elements: plan.elements.filter((el) => !idsToRemove.has(el.id)),
    })
  }, [plan])

  if (isEditing) {
    return <EditionOverlay />
  }

  return (
    <motion.div
      className="flex h-full flex-col gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={fadeUp}
        className="flex shrink-0 items-center justify-between"
      >
        <h1 className="font-display text-lg font-semibold tracking-tight">Plan de salle</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="service" className="text-xs px-3">
              Service
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs px-3">
              Plan
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        {activeTab === "service" ? (
          <ConsultationView plan={plan} />
        ) : (
          <PlanCardView plan={plan} onEdit={handleOpenEditor} onDelete={handleDeleteRoom} />
        )}
      </motion.div>
    </motion.div>
  )
}

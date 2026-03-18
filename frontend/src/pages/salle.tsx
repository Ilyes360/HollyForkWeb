import { useState, useCallback, useRef } from "react"
import { motion, type Variants } from "motion/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FloorPlan, FloorElement, ZoneShape } from "@/components/salle/types"
import { DEFAULT_PLAN } from "@/components/salle/constants"
import { findRoomForPoint } from "@/components/salle/utils"
import { ConsultationView } from "@/components/salle/consultation-view"
import { PlanView } from "@/components/salle/plan-view"
import { EditionOverlay } from "@/components/salle/edition-overlay"
import { useSalleEdition } from "@/components/salle/salle-context"
import { useSalleStore } from "@/components/salle/store"
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

export default function SallePage() {
  usePageTitle("Salle")
  const [plan, setPlan] = useState<FloorPlan>(DEFAULT_PLAN)
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
      const elRoomId =
        el.kind === "table"
          ? findRoomForPoint(el.x, el.y, zones)
          : findRoomForPoint(
              el.x + (el.points[0] + el.points[2]) / 2,
              el.y + (el.points[1] + el.points[3]) / 2,
              zones
            )
      if (elRoomId === roomId) roomElements.push(el)
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
          const elRoomId =
            el.kind === "table"
              ? findRoomForPoint(el.x, el.y, allZones)
              : findRoomForPoint(
                  el.x + (el.points[0] + el.points[2]) / 2,
                  el.y + (el.points[1] + el.points[3]) / 2,
                  allZones
                )
          if (elRoomId === rid) oldRoomElementIds.add(el.id)
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
  }, [plan, startEditing, stopEditing, extractRoomElements])

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
          <PlanView plan={plan} onEdit={handleOpenEditor} />
        )}
      </motion.div>
    </motion.div>
  )
}

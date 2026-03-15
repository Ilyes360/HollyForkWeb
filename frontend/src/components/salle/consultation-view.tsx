import { useState, useCallback, useMemo } from "react"
import type { FloorPlan, TableShape, ZoneShape } from "./types"
import { FloorSidebar } from "./consultation/floor-sidebar"
import { FloorPlanView } from "./consultation/floor-plan-view"

interface ConsultationViewProps {
  plan: FloorPlan
}

export function ConsultationView({ plan }: ConsultationViewProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  const tables = useMemo(
    () => plan.elements.filter((el): el is TableShape => el.kind === "table"),
    [plan.elements]
  )

  const zones = useMemo(
    () => plan.elements.filter((el): el is ZoneShape => el.kind === "zone"),
    [plan.elements]
  )

  const handleSelect = useCallback((id: string) => {
    setSelectedTableId((prev) => (prev === id || id === "" ? null : id))
  }, [])

  const handleHover = useCallback((id: string | null) => {
    setHoveredTableId(id)
  }, [])

  const handleActiveRoom = useCallback((id: string | null) => {
    setActiveRoomId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="flex h-full rounded-lg border bg-background overflow-hidden">
      <FloorSidebar
        tables={tables}
        zones={zones}
        activeRoomId={activeRoomId}
        selectedTableId={selectedTableId}
        hoveredTableId={hoveredTableId}
        onSelect={handleSelect}
        onHover={handleHover}
        onActiveRoom={handleActiveRoom}
      />
      <FloorPlanView
        plan={plan}
        activeRoomId={activeRoomId}
        selectedTableId={selectedTableId}
        hoveredTableId={hoveredTableId}
        onSelectTable={handleSelect}
        onHoverTable={handleHover}
      />
    </div>
  )
}

import React, { useEffect } from "react"
import { Outlet } from "react-router"
import { DragDropProvider } from "@dnd-kit/react"
import { toast } from "sonner"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { SiteHeader } from "@/components/layout/header"
import {
  PlanningEditionProvider,
  usePlanningEdition,
} from "@/components/planning/planning-context"
import { EmployeePanel } from "@/components/planning/employee-panel"
import { EditionToolbar } from "@/components/planning/edition-toolbar"
import {
  SalleEditionProvider,
  useSalleEdition,
} from "@/components/salle/salle-context"
import { EditorStepper } from "@/components/salle/editor-stepper"
import { SalleToolbar } from "@/components/salle/salle-toolbar"
import { useSalleStore } from "@/components/salle/store"

function getSidebarDefaultOpen(): boolean {
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]*)/)
  if (match) return match[1] === "true"
  return true
}

function LayoutInner() {
  const planning = usePlanningEdition()
  const salle = useSalleEdition()
  const salleIsDirty = useSalleStore((s) => s.isDirty)
  const salleExportPlan = useSalleStore((s) => s.exportPlan)
  const salleZoomToFit = useSalleStore((s) => s.zoomToFit)

  const isEditing = planning.isEditing || salle.isEditing

  const handlePlanningCancel = React.useCallback(() => {
    if (planning.state.isDirty) {
      window.dispatchEvent(new CustomEvent("planning-cancel"))
    } else {
      planning.onCloseRef.current?.()
    }
  }, [planning.state.isDirty, planning.onCloseRef])

  const handlePlanningSave = React.useCallback(() => {
    planning.onSaveRef.current?.(planning.state.shifts)
    planning.onCloseRef.current?.()
  }, [planning.state.shifts, planning.onSaveRef, planning.onCloseRef])

  const handleSalleCancel = React.useCallback(() => {
    if (salleIsDirty) {
      window.dispatchEvent(new CustomEvent("salle-cancel"))
    } else {
      salle.onCloseRef.current?.()
    }
  }, [salleIsDirty, salle.onCloseRef])

  const handleSalleSave = React.useCallback(() => {
    salle.onSaveRef.current?.(salleExportPlan())
    salle.onCloseRef.current?.()
  }, [salleExportPlan, salle.onSaveRef, salle.onCloseRef])

  const handleZoomToFit = React.useCallback(() => {
    salleZoomToFit(window.innerWidth, window.innerHeight)
  }, [salleZoomToFit])

  const layout = (
    <SidebarProvider
      defaultOpen={getSidebarDefaultOpen()}
      open={isEditing ? true : undefined}
      className={isEditing ? "!h-svh !min-h-0 overflow-hidden" : undefined}
      style={
        {
          "--sidebar-width": isEditing
            ? "calc(var(--spacing) * 80)"
            : "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
          "--content-padding": isEditing ? "0px" : "calc(var(--spacing) * 4)",
          "--content-margin": "calc(var(--spacing) * 1.5)",
        } as React.CSSProperties
      }
    >
      {planning.isEditing ? (
        <EmployeePanel employees={planning.employees} shifts={planning.state.shifts} />
      ) : salle.isEditing ? (
        <EditorStepper />
      ) : (
        <AppSidebar variant="inset" />
      )}
      <SidebarInset className={isEditing ? "min-h-0 overflow-hidden" : undefined}>
        {planning.isEditing ? (
          <EditionToolbar
            isDirty={planning.state.isDirty}
            onCancel={handlePlanningCancel}
            onSave={handlePlanningSave}
          />
        ) : salle.isEditing ? (
          <SalleToolbar
            isDirty={salleIsDirty}
            onCancel={handleSalleCancel}
            onSave={handleSalleSave}
            onZoomToFit={handleZoomToFit}
          />
        ) : (
          <SiteHeader />
        )}
        <div className={cn(
          "flex min-h-0 flex-1 flex-col bg-muted/40",
          isEditing ? "overflow-hidden" : "overflow-y-auto"
        )}>
          {isEditing ? (
            <Outlet />
          ) : (
            <div className="@container/main flex min-h-0 flex-1 flex-col p-(--content-padding)">
              <Outlet />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )

  if (planning.isEditing) {
    return (
      <DragDropProvider onDragEnd={planning.handleDragEnd as (event: { operation: Record<string, unknown> }) => void}>
        {layout}
      </DragDropProvider>
    )
  }

  return layout
}

export default function RootLayout() {
  // Listen for 403 events from the API client
  useEffect(() => {
    const handler = () => {
      toast.error("Vous n'avez pas la permission d'effectuer cette action.")
    }
    window.addEventListener("api:forbidden", handler)
    return () => window.removeEventListener("api:forbidden", handler)
  }, [])

  return (
    <PlanningEditionProvider>
      <SalleEditionProvider>
        <LayoutInner />
      </SalleEditionProvider>
    </PlanningEditionProvider>
  )
}

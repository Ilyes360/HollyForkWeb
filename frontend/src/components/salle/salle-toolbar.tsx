import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  CursorIcon,
  HandGrabIcon,
  PenToolIcon,
  DoorIcon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
  ArrowExpandIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useSalleStore, type EditorStep } from "./store"
import { ZOOM_STEP } from "./constants"

const STEP_ORDER: EditorStep[] = ["walls", "doors", "tables", "decoration"]
const STEP_LABELS: Record<EditorStep, string> = {
  walls: "Murs",
  doors: "Portes",
  tables: "Tables",
  decoration: "Déco",
}

interface SalleToolbarProps {
  isDirty: boolean
  onCancel: () => void
  onSave: () => void
  onZoomToFit?: () => void
}

export function SalleToolbar({ isDirty, onCancel, onSave, onZoomToFit }: SalleToolbarProps) {
  const tool = useSalleStore((s) => s.tool)
  const editorStep = useSalleStore((s) => s.editorStep)
  const zoom = useSalleStore((s) => s.zoom)
  const past = useSalleStore((s) => s.past)
  const future = useSalleStore((s) => s.future)
  const setTool = useSalleStore((s) => s.setTool)
  const setEditorStep = useSalleStore((s) => s.setEditorStep)
  const wallDrawing = useSalleStore((s) => s.wallDrawing)
  const setZoom = useSalleStore((s) => s.setZoom)
  const undo = useSalleStore((s) => s.undo)
  const redo = useSalleStore((s) => s.redo)

  const isDrawing = !!(wallDrawing && wallDrawing.points.length > 0)
  const stepIndex = STEP_ORDER.indexOf(editorStep)
  const canPrev = stepIndex > 0 && !isDrawing
  const canNext = stepIndex < STEP_ORDER.length - 1 && !isDrawing

  return (
    <TooltipProvider delay={300}>
      <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b px-4 backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl">
        {/* Left: Step label + step navigation */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">
            {STEP_LABELS[editorStep]}
          </h2>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={!canPrev}
                  onClick={() => setEditorStep(STEP_ORDER[stepIndex - 1])}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Étape précédente</TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground tabular-nums">
              {stepIndex + 1}/{STEP_ORDER.length}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={!canNext}
                  onClick={() => setEditorStep(STEP_ORDER[stepIndex + 1])}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Étape suivante</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Center: Context-aware tools */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-md border bg-background p-0.5">
            {/* Select + Pan — disabled during active wall drawing */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === "select" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7"
                  disabled={isDrawing}
                  onClick={() => setTool("select")}
                >
                  <HugeiconsIcon icon={CursorIcon} className="size-3.5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sélectionner (V)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === "pan" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7"
                  disabled={isDrawing}
                  onClick={() => setTool("pan")}
                >
                  <HugeiconsIcon icon={HandGrabIcon} className="size-3.5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Déplacer (H)</TooltipContent>
            </Tooltip>

            {/* Wall tool — visible on walls step */}
            {editorStep === "walls" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "wall" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-7"
                    onClick={() => setTool("wall")}
                  >
                    <HugeiconsIcon icon={PenToolIcon} className="size-3.5" strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tracer murs (W)</TooltipContent>
              </Tooltip>
            )}

            {/* Door tool — visible on doors step */}
            {editorStep === "doors" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "door" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-7"
                    onClick={() => setTool("door")}
                  >
                    <HugeiconsIcon icon={DoorIcon} className="size-3.5" strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Porte (D)</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="mx-2 h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={past.length === 0}
                onClick={undo}
              >
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} className="size-3.5" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Annuler (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={future.length === 0}
                onClick={redo}
              >
                <HugeiconsIcon icon={ArrowTurnForwardIcon} className="size-3.5" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refaire (⌘⇧Z)</TooltipContent>
          </Tooltip>

          <div className="mx-2 h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setZoom(zoom - ZOOM_STEP)}
              >
                <HugeiconsIcon icon={ZoomOutAreaIcon} className="size-3.5" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom -</TooltipContent>
          </Tooltip>
          <span className="min-w-10 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setZoom(zoom + ZOOM_STEP)}
              >
                <HugeiconsIcon icon={ZoomInAreaIcon} className="size-3.5" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom +</TooltipContent>
          </Tooltip>
          {onZoomToFit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={onZoomToFit}
                >
                  <HugeiconsIcon icon={ArrowExpandIcon} className="size-3.5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajuster à l'écran</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Right: Cancel / Save */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            Annuler
          </Button>
          <Button onClick={onSave} disabled={!isDirty}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" strokeWidth={2} />
            Enregistrer
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}

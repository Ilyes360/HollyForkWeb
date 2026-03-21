import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { useSalleStore, type EditorStep } from "./store"
import { TABLE_PRESETS, TABLE_TYPE_LABELS } from "./constants"
import { PaletteItem } from "./palette-item"
import { getDecorationsByCategory } from "./decoration-presets"

const STEPS: { key: EditorStep; label: string; description: string }[] = [
  { key: "walls", label: "Murs", description: "Tracez les murs de la pièce" },
  { key: "doors", label: "Portes", description: "Placez les ouvertures" },
  { key: "tables", label: "Tables", description: "Disposez les tables" },
  { key: "decoration", label: "Déco", description: "Ajoutez les éléments décoratifs" },
]

function useStepCompletion() {
  const elements = useSalleStore((s) => s.plan.elements)
  return useMemo(() => {
    const hasWalls = elements.some((el) => el.kind === "wall")
    const hasZone = elements.some((el) => el.kind === "zone")
    const hasTables = elements.some((el) => el.kind === "table")
    return {
      walls: hasWalls && hasZone,
      doors: hasWalls, // doors are optional, mark done if walls exist
      tables: hasTables,
      decoration: elements.some((el) => el.kind === "decoration"),
    }
  }, [elements])
}

export function EditorStepper() {
  const editorStep = useSalleStore((s) => s.editorStep)
  const wallDrawing = useSalleStore((s) => s.wallDrawing)
  const setEditorStep = useSalleStore((s) => s.setEditorStep)
  const completion = useStepCompletion()
  const isDrawing = !!(wallDrawing && wallDrawing.points.length > 0)

  return (
    <Sidebar collapsible="none" variant="sidebar" className="!bg-background !text-foreground border-r">
      <SidebarHeader>
        <h3 className="text-sm font-semibold text-foreground">Créer une salle</h3>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="py-3 px-4">
            {/* Step navigation */}
            <nav className="space-y-1 mb-4">
              {STEPS.map((step, index) => {
                const isActive = editorStep === step.key
                const isDone = completion[step.key]
                const isDisabled = isDrawing

                return (
                  <button
                    key={step.key}
                    onClick={() => !isDisabled && setEditorStep(step.key)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                      ${isActive ? "bg-accent ring-1 ring-border" : isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/50"}
                    `}
                  >
                    <div
                      className={`
                        flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold
                        ${isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}
                      `}
                    >
                      {isDone && !isActive ? (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" strokeWidth={2} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{step.label}</div>
                      <div className="text-[10px] text-muted-foreground/80 truncate">{step.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>

            <Separator className="mb-4" />

            {/* Step-specific content */}
            <StepContent step={editorStep} />
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}

function StepContent({ step }: { step: EditorStep }) {
  switch (step) {
    case "walls":
      return <WallsStepContent />
    case "doors":
      return <DoorsStepContent />
    case "tables":
      return <TablesStepContent />
    case "decoration":
      return <DecorationStepContent />
  }
}

function WallsStepContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cliquez point par point sur le canevas pour tracer les murs.
          <strong className="text-foreground"> Fermez le polygone</strong> (cliquez sur le premier point) pour créer la pièce.
        </p>
      </div>
      <div className="space-y-1.5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">Clic</kbd>
          <span>Poser un point</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">Dbl-clic</kbd>
          <span>Terminer (mur ouvert)</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">Esc</kbd>
          <span>Annuler le tracé</span>
        </div>
      </div>
    </div>
  )
}

function DoorsStepContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cliquez sur un mur pour y placer une porte.
          <strong className="text-foreground"> Un espace</strong> sera automatiquement créé dans le mur.
        </p>
      </div>
      <div className="space-y-1.5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">Clic</kbd>
          <span>Placer une porte sur un mur</span>
        </div>
      </div>
    </div>
  )
}

function TablesStepContent() {
  const roundPresets = TABLE_PRESETS.filter((p) => p.kind === "table" && p.type === "round")
  const squarePresets = TABLE_PRESETS.filter((p) => p.kind === "table" && p.type === "square")
  const rectPresets = TABLE_PRESETS.filter((p) => p.kind === "table" && p.type === "rectangle")
  const barPresets = TABLE_PRESETS.filter((p) => p.kind === "table" && p.type === "bar")

  const groups = [
    { label: "Rondes", presets: roundPresets },
    { label: "Carrées", presets: squarePresets },
    { label: "Rectangles", presets: rectPresets },
    { label: "Comptoir", presets: barPresets },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Glissez-déposez les tables depuis la palette vers la pièce.
        </p>
      </div>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          {group.presets.map((preset, i) => {
            if (preset.kind !== "table") return null
            const label = `${TABLE_TYPE_LABELS[preset.type]} ${preset.seats}p`
            return <PaletteItem key={`${group.label}-${i}`} preset={preset} label={label} />
          })}
        </div>
      ))}
    </div>
  )
}

function DecorationStepContent() {
  const categories = getDecorationsByCategory()

  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Glissez-déposez les éléments depuis la palette vers le plan.
        </p>
      </div>
      {categories.map(({ category, label, items }, catIndex) => (
        <Collapsible key={category} defaultOpen={catIndex === 0}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            {label}
            <svg width={12} height={12} viewBox="0 0 12 12" className="shrink-0 transition-transform [[data-state=open]_&]:rotate-180">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 pb-2">
              {items.map((item, i) => (
                <PaletteItem
                  key={`${category}-${i}`}
                  preset={item.preset}
                  label={item.label}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}

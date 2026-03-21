import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { ONBOARDING } from "@/lib/copy/onboarding"
import { useWizardStore } from "../store"

type Template = {
  value: "small" | "medium" | "large" | "scratch"
  label: string
  description: string
  tables: number
  seats: number
  layout: number[][] // rows of table sizes (visual dots)
}

const TEMPLATES: Template[] = [
  {
    value: "small",
    label: "Petit restaurant",
    description: "Cadre intime, service personnalise",
    tables: 5,
    seats: 20,
    layout: [[2, 2, 1], [2, 2]],
  },
  {
    value: "medium",
    label: "Restaurant moyen",
    description: "Capacite equilibree, polyvalent",
    tables: 10,
    seats: 40,
    layout: [[2, 2, 2], [2, 2, 2], [2, 2]],
  },
  {
    value: "large",
    label: "Grand restaurant",
    description: "Grande capacite, plusieurs zones",
    tables: 16,
    seats: 65,
    layout: [[2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]],
  },
]

export function StepSalle() {
  const selected = useWizardStore((s) => s.data.salleTemplate)
  const setTemplate = useWizardStore((s) => s.setSalleTemplate)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{ONBOARDING.salle.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ONBOARDING.salle.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.value
          return (
            <button
              key={tpl.value}
              type="button"
              onClick={() => setTemplate(tpl.value)}
              className={cn(
                "flex flex-col items-start rounded-xl p-5 text-left transition-all ring-1",
                isSelected
                  ? "ring-primary bg-primary/5"
                  : "ring-border bg-card hover:bg-muted/50"
              )}
            >
              {/* Mini floor plan visual */}
              <div className="mb-4 flex flex-col gap-2 self-center">
                {tpl.layout.map((row, ri) => (
                  <div key={ri} className="flex items-center justify-center gap-2">
                    {row.map((seats, ci) => (
                      <div
                        key={ci}
                        className={cn(
                          "rounded-full transition-colors",
                          seats > 1 ? "size-6" : "size-4",
                          isSelected
                            ? "bg-primary/30 ring-1 ring-primary/40"
                            : "bg-muted ring-1 ring-border"
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold">{tpl.label}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tpl.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium tabular-nums">{tpl.tables} tables</span>
                <span>·</span>
                <span className="font-medium tabular-nums">{tpl.seats} places</span>
              </div>
            </button>
          )
        })}

        {/* From scratch option */}
        <button
          type="button"
          onClick={() => setTemplate("scratch")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl p-5 text-center transition-all ring-1",
            selected === "scratch"
              ? "ring-primary bg-primary/5"
              : "ring-border bg-card hover:bg-muted/50"
          )}
        >
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-colors",
              selected === "scratch"
                ? "bg-primary/10"
                : "bg-muted"
            )}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              className={cn(
                "size-5",
                selected === "scratch" ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
          </div>
          <h3 className="mt-3 text-sm font-semibold">{ONBOARDING.salle.scratchTitle}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ONBOARDING.salle.scratchDescription}
          </p>
        </button>
      </div>
    </div>
  )
}

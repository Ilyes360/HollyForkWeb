import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  GridTableIcon,
} from "@hugeicons/core-free-icons"
import { ONBOARDING } from "@/lib/copy/onboarding"

const FEATURE_ICONS = [Calendar03Icon, Clock01Icon, GridTableIcon]

export function StepWelcome() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center text-center">
      {/* Logo */}
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <img src="/holyfork-logo.svg" alt="Holy Fork" className="h-8" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        {ONBOARDING.welcome.title}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {ONBOARDING.welcome.description}
      </p>

      {/* Feature cards */}
      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {ONBOARDING.welcome.features.map((feature, i) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon
                icon={FEATURE_ICONS[i]}
                className="size-5 text-primary"
                strokeWidth={2}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

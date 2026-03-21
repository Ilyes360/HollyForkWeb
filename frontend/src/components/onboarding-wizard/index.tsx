import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TOAST } from "@/lib/copy/toasts"
import { ONBOARDING } from "@/lib/copy/onboarding"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { useWizardStore } from "./store"
import { StepWelcome } from "./steps/step-welcome"
import { StepRestaurant } from "./steps/step-restaurant"
import { StepSalle } from "./steps/step-salle"
import { StepTeam } from "./steps/step-team"

const PANEL_TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
}

const stepSlideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

const stepSlideTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  opacity: { duration: 0.2 },
}

const STEPS = [
  { label: ONBOARDING.steps.welcome, component: StepWelcome },
  { label: ONBOARDING.steps.restaurant, component: StepRestaurant },
  { label: ONBOARDING.steps.salle, component: StepSalle },
  { label: ONBOARDING.steps.team, component: StepTeam },
]

interface OnboardingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const currentStep = useWizardStore((s) => s.currentStep)
  const direction = useWizardStore((s) => s.direction)
  const data = useWizardStore((s) => s.data)
  const nextStep = useWizardStore((s) => s.nextStep)
  const prevStep = useWizardStore((s) => s.prevStep)
  const reset = useWizardStore((s) => s.reset)
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0
  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100)

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Reset store when closing
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const handleComplete = useCallback(() => {
    // Mark getting-started tasks based on filled data
    if (data.restaurantName.trim()) {
      completeTask("restaurant-profile")
    }
    if (data.salleTemplate && data.salleTemplate !== "") {
      completeTask("floor-plan")
    }
    if (data.teamMembers.some((m) => m.firstName.trim())) {
      completeTask("team-member")
    }

    toast.success(TOAST.onboardingComplete)
    onOpenChange(false)
  }, [data, completeTask, onOpenChange])

  const CurrentStepComponent = STEPS[currentStep].component

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-y-6 inset-x-10 z-[61] flex flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={PANEL_TRANSITION}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <img src="/hollyfork-logo.svg" alt="" className="h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{ONBOARDING.header.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {ONBOARDING.header.stepOf(currentStep + 1, STEPS.length)}
                  </p>
                </div>
              </div>

              {/* Step pills */}
              <div className="hidden sm:flex items-center gap-1.5">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        i === currentStep
                          ? "bg-primary text-primary-foreground"
                          : i < currentStep
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i < currentStep ? (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={2} />
                      ) : (
                        <span className="text-[10px] font-semibold">{i + 1}</span>
                      )}
                      <span className="hidden md:inline">{step.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        "h-px w-4 transition-colors",
                        i < currentStep ? "bg-primary/30" : "bg-border"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="shrink-0 px-6">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            <Separator className="mt-4" />

            {/* Step content */}
            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepSlideTransition}
                  className="px-6 py-8"
                >
                  <CurrentStepComponent />
                </motion.div>
              </AnimatePresence>
            </div>

            <Separator />

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4">
              <div>
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="gap-1.5"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={2} />
                    {ONBOARDING.footer.back}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!isFirstStep && !isLastStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextStep}
                    className="text-muted-foreground"
                  >
                    {ONBOARDING.footer.skip}
                  </Button>
                )}

                {isFirstStep ? (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="gap-1.5"
                  >
                    {ONBOARDING.footer.start}
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2} />
                  </Button>
                ) : isLastStep ? (
                  <Button
                    size="sm"
                    onClick={handleComplete}
                    className="gap-1.5"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" strokeWidth={2} />
                    {ONBOARDING.footer.finish}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="gap-1.5"
                  >
                    {ONBOARDING.footer.next}
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2} />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../store"
import { stepSlideVariants, stepSlideTransition } from "../animations"
import { WelcomeContent } from "./welcome-content"
import { EstablishmentContent } from "./establishment-content"
import { PlanContent } from "./plan-content"
import { ModulesContent } from "./modules-content"
import { CompletionContent } from "./completion-content"

const steps = [
  {
    component: WelcomeContent,
    label: "Restaurant",
    title: "Bienvenue sur Holy Fork",
    subtitle:
      "Configurons votre espace en quelques étapes. Parlez-nous de votre restaurant.",
    nextLabel: "Continuer",
  },
  {
    component: EstablishmentContent,
    label: "Établissement",
    title: "Votre établissement",
    subtitle:
      "Ces informations nous aident à configurer votre espace de manière optimale.",
    nextLabel: "Continuer",
  },
  {
    component: PlanContent,
    label: "Offre",
    title: "Choisissez votre offre",
    subtitle:
      "Essai gratuit de 14 jours, sans engagement. Mise en place en 48h.",
    nextLabel: "Continuer",
  },
  {
    component: ModulesContent,
    label: "Modules",
    title: "Activez vos modules",
    subtitle:
      "Sélectionnez les fonctionnalités dont vous avez besoin. Vous pourrez les modifier à tout moment.",
    nextLabel: "Démarrer l'essai gratuit",
  },
  {
    component: CompletionContent,
    label: "Terminé",
    title: "",
    subtitle: "",
    nextLabel: "",
  },
]

const progressSteps = steps.slice(0, 4)

export default function Onboarding() {
  const {
    currentStep,
    totalSteps,
    direction,
    data,
    nextStep,
    prevStep,
    goToStep,
    hydrateFromSession,
  } = useOnboardingStore()
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      hydrateFromSession()
    }
  }, [hydrateFromSession])

  const isCompletion = currentStep === totalSteps - 1
  const CurrentStepComponent = steps[currentStep].component
  const currentConfig = steps[currentStep]

  // Centralized validation
  const validators = [
    () =>
      !!(
        data.restaurant.name.trim() &&
        data.restaurant.cuisineType &&
        data.restaurant.location
      ),
    () => !!(data.establishment.covers && data.establishment.teamSize),
    () => !!data.plan,
    () => data.modules.length > 0,
    () => true,
  ]
  const isCurrentStepValid = validators[currentStep]()

  if (isCompletion) {
    return (
      <div className="flex min-h-svh flex-col">
        <header className="fixed top-0 right-0 left-0 z-10 border-b bg-background">
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              HF
            </div>
            <span className="font-semibold">Holy Fork</span>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pt-16">
          <CompletionContent />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* HEADER */}
      <header className="fixed top-0 right-0 left-0 z-10 border-b bg-background">
        <div className="relative flex items-center justify-center px-6 py-4">
          <div className="absolute left-6 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              HF
            </div>
            <span className="hidden font-semibold sm:block">Holy Fork</span>
          </div>

          <nav
            aria-label="Progression"
            className="flex w-full max-w-2xl gap-1.5 px-4"
          >
            {progressSteps.map((step, index) => {
              const isCompleted = index < currentStep
              const isActive = index === currentStep
              const isClickable = index < currentStep

              return (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => isClickable && goToStep(index)}
                  aria-current={isActive ? "step" : undefined}
                  aria-disabled={!isClickable}
                  className={`flex flex-1 flex-col items-center gap-1.5 ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span
                    className={`text-xs whitespace-nowrap transition-colors duration-300 ${
                      isActive
                        ? "font-semibold text-primary"
                        : isCompleted
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  <div
                    className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </button>
              )
            })}
          </nav>

          <span className="absolute right-6 text-xs text-muted-foreground tabular-nums">
            {currentStep + 1}/{totalSteps - 1}
          </span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-24 pb-24">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">
            {currentConfig.title}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {currentConfig.subtitle}
          </p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepSlideTransition}
            >
              <CurrentStepComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="fixed right-0 bottom-0 left-0 z-10 border-t bg-background">
        <div className="mx-auto max-w-2xl px-4 py-4">
          {currentStep > 0 ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                aria-label="Retour à l'étape précédente"
                className="mr-auto"
              >
                Retour
              </Button>
              <Button
                size="lg"
                onClick={nextStep}
                disabled={!isCurrentStepValid}
                className="gap-2"
              >
                {currentConfig.nextLabel}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-4"
                  strokeWidth={2}
                />
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={nextStep}
              disabled={!isCurrentStepValid}
              className="w-full gap-2"
            >
              {currentConfig.nextLabel}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4"
                strokeWidth={2}
              />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

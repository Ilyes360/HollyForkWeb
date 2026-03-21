import { useState } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen02Icon,
  Tick02Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons"

import { useGettingStartedStore } from "@/stores/getting-started-store"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { OnboardingWizard } from "@/components/onboarding-wizard"

export function GettingStartedButton() {
  const { tasks, dismissed, dismiss } = useGettingStartedStore()
  const isMobile = useIsMobile()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (dismissed) return null

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)
  const remainingCount = totalCount - completedCount

  const handleOpenWizard = () => {
    setDropdownOpen(false)
    setTimeout(() => setWizardOpen(true), 100)
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <span className="relative">
            <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
            {remainingCount > 0 && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
            )}
          </span>
          <span className="sr-only">Guide de demarrage</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isMobile ? "center" : "end"}
          className="w-80"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Premiers pas</span>
              <button
                type="button"
                onClick={dismiss}
                className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Masquer le guide"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
              </button>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {/* Launch wizard button */}
          <div className="px-2 py-2">
            <button
              onClick={handleOpenWizard}
              className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <HugeiconsIcon icon={Rocket01Icon} className="size-4 text-primary" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">Lancer l'assistant</p>
                <p className="text-[10px] text-muted-foreground">Configuration guidee en 4 etapes</p>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-primary" strokeWidth={2} />
            </button>
          </div>

          <Separator className="my-1" />

          <div className="px-2 py-2">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedCount}/{totalCount} terminees</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>

          <div className="flex flex-col px-1 pb-1">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={task.to}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
                    task.completed
                      ? "bg-primary ring-primary text-primary-foreground"
                      : "ring-border"
                  }`}
                >
                  {task.completed && (
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-tight ${
                      task.completed
                        ? "text-muted-foreground line-through"
                        : "font-medium"
                    }`}
                  >
                    {task.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.description}
                  </p>
                </div>
                {!task.completed && (
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                )}
              </Link>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  )
}

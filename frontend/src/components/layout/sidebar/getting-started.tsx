import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Tick02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { GETTING_STARTED } from "@/lib/copy/onboarding"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"

export function GettingStarted() {
  const { tasks, dismissed, dismiss } = useGettingStartedStore()

  if (dismissed) return null

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)
  const allDone = completedCount === totalCount

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span>{GETTING_STARTED.title}</span>
        <button
          type="button"
          onClick={dismiss}
          className="flex size-4 items-center justify-center rounded-sm text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
          aria-label={GETTING_STARTED.dismissAriaLabel}
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
        </button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="px-2 pb-2">
          <Progress value={progressPercent}>
            <ProgressLabel className="text-xs text-sidebar-foreground/50">
              {allDone ? GETTING_STARTED.done : GETTING_STARTED.progress(completedCount, totalCount)}
            </ProgressLabel>
            <ProgressValue className="text-xs" />
          </Progress>
        </div>

        <SidebarMenu>
          {tasks.map((task) => (
            <SidebarMenuItem key={task.id}>
              <SidebarMenuButton
                render={
                  <Link to={task.to} />
                }
                tooltip={task.label}
                className="h-auto py-1.5"
              >
                <div
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
                    task.completed
                      ? "bg-sidebar-primary ring-sidebar-primary text-sidebar-primary-foreground"
                      : "ring-sidebar-border"
                  }`}
                >
                  {task.completed && (
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-2.5" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <span
                    className={`truncate text-xs leading-tight ${
                      task.completed
                        ? "text-sidebar-foreground/40 line-through"
                        : "text-sidebar-foreground"
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
                {!task.completed && (
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto size-3 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
                  />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

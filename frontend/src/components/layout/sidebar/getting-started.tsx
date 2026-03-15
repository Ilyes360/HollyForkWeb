import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Tick02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { useGettingStartedStore } from "@/stores/getting-started-store"
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
        <span>Premiers pas</span>
        <button
          type="button"
          onClick={dismiss}
          className="flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Masquer les premiers pas"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
        </button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="px-2 pb-2">
          <Progress value={progressPercent}>
            <ProgressLabel className="text-xs text-muted-foreground">
              {allDone ? "Terminé !" : `${completedCount}/${totalCount}`}
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
                      ? "bg-primary ring-primary text-primary-foreground"
                      : "ring-border"
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
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
                {!task.completed && (
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto size-3 text-muted-foreground group-data-[collapsible=icon]:hidden"
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

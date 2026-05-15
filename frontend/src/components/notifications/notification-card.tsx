import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  UserMultiple02Icon,
  Clock01Icon,
  Alert02Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  Notification,
  ReservationContent,
  StockContent,
  PlanningContent,
} from "./data"
import { CATEGORY_META } from "./data"
import { NOTIFICATION_EVENT_LABELS } from "@/lib/copy/notifications"

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  onAction: (id: string, actionType: string) => void
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDismiss,
  onAction,
}: NotificationCardProps) {
  const { id, category, title, description, richContent, time, read, actions } =
    notification
  const meta = CATEGORY_META[category]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex gap-3 rounded-xl border p-4 transition-colors",
        read
          ? "bg-card/50"
          : "bg-card ring-1 ring-primary/10"
      )}
      onClick={() => !read && onMarkAsRead(id)}
    >
      {/* Unread dot + Category icon */}
      <div className="flex flex-col items-center gap-2 pt-0.5">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            read ? "bg-muted" : "bg-primary/10"
          )}
        >
          <HugeiconsIcon
            icon={meta.icon}
            className={cn("size-4", read ? "text-muted-foreground" : "text-primary")}
            strokeWidth={2}
          />
        </div>
        {!read && (
          <span className="size-1.5 rounded-full bg-primary" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                "text-sm leading-tight",
                read ? "font-medium" : "font-semibold"
              )}
            >
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {time}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-0.5 hover:bg-muted"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Rich content */}
        {richContent.type === "reservation" && (
          <ReservationInfo content={richContent} />
        )}
        {richContent.type === "stock" && (
          <StockInfo content={richContent} />
        )}
        {richContent.type === "planning" && (
          <PlanningInfo content={richContent} />
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {actions.map((action) => (
              <Button
                key={action.actionType}
                variant={action.variant}
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onAction(id, action.actionType)
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Rich content components ──

function ReservationInfo({ content }: { content: ReservationContent }) {
  const eventColors: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    cancel: "bg-destructive/10 text-destructive",
    modify: "bg-amber-500/10 text-amber-600",
    arrival: "bg-emerald-500/10 text-emerald-600",
  }

  const eventLabels = NOTIFICATION_EVENT_LABELS

  return (
    <div className="flex flex-wrap items-center gap-2">
      {content.eventType && (
        <Badge
          variant="secondary"
          className={cn("text-[10px] h-5", eventColors[content.eventType])}
        >
          {eventLabels[content.eventType]}
        </Badge>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={UserMultiple02Icon} className="size-3" strokeWidth={2} />
          {content.covers} pers.
        </span>
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={2} />
          {content.time}
        </span>
        {content.tableNumber && (
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Calendar03Icon} className="size-3" strokeWidth={2} />
            {content.tableNumber}
          </span>
        )}
      </div>
    </div>
  )
}

function StockInfo({ content }: { content: StockContent }) {
  const isCritical = content.severity === "critical"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {isCritical && (
            <HugeiconsIcon icon={Alert02Icon} className="size-3 text-destructive" strokeWidth={2} />
          )}
          {content.ingredientName}
        </span>
        <span
          className={cn(
            "font-medium tabular-nums",
            isCritical ? "text-destructive" : "text-amber-600"
          )}
        >
          {content.currentLevel}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isCritical ? "bg-destructive" : "bg-amber-500"
          )}
          style={{ width: `${content.currentLevel}%` }}
        />
      </div>
    </div>
  )
}

function PlanningInfo({ content }: { content: PlanningContent }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-[10px] h-5">
        {content.day} — {content.service}
      </Badge>
      <span className="flex items-center gap-1 text-xs text-destructive font-medium">
        <HugeiconsIcon icon={Alert02Icon} className="size-3" strokeWidth={2} />
        {content.missingStaff} poste{content.missingStaff > 1 ? "s" : ""} non pourvu{content.missingStaff > 1 ? "s" : ""}
      </span>
    </div>
  )
}

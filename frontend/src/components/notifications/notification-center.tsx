import { useState, useMemo, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Notification03Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { NotificationCard } from "./notification-card"
import {
  MOCK_NOTIFICATIONS,
  CATEGORY_META,
  CATEGORY_ORDER,
  type Notification,
  type NotificationCategory,
} from "./data"

const EXPAND_TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
}

type FilterTab = "all" | "unread" | NotificationCategory

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "reservations", label: "Reservations" },
  { value: "stocks", label: "Stocks" },
  { value: "planning", label: "Planning" },
]

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationCenter({
  open,
  onOpenChange,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    () => [...MOCK_NOTIFICATIONS]
  )
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

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

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications
    if (activeTab === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.category === activeTab)
  }, [notifications, activeTab])

  const grouped = useMemo(() => {
    const map = new Map<NotificationCategory, Notification[]>()
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter((n) => n.category === cat)
      if (items.length > 0) map.set(cat, items)
    }
    return map
  }, [filtered])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success("Toutes les notifications ont ete marquees comme lues.")
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleAction = useCallback(
    (id: string, actionType: string) => {
      // Mark as read on action
      markAsRead(id)

      // Action feedback
      const notification = notifications.find((n) => n.id === id)
      if (!notification) return

      switch (actionType) {
        case "confirm":
          toast.success(`Reservation de ${(notification.richContent as { clientName?: string }).clientName ?? ""} confirmee.`)
          dismiss(id)
          break
        case "refuse":
          toast.error(`Reservation de ${(notification.richContent as { clientName?: string }).clientName ?? ""} refusee.`)
          dismiss(id)
          break
        case "approve":
          toast.success("Demande de conge approuvee.")
          dismiss(id)
          break
        case "order":
          toast.success(`Commande lancee pour ${(notification.richContent as { ingredientName?: string }).ingredientName ?? ""}.`)
          break
        default:
          toast.info("Action en cours de developpement.")
          break
      }
    },
    [notifications, markAsRead, dismiss]
  )

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
            transition={EXPAND_TRANSITION}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon
                    icon={Notification03Icon}
                    className="size-5 text-primary"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={markAllAsRead}
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-3.5"
                      strokeWidth={2}
                    />
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onOpenChange(false)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Filter tabs */}
            <div className="shrink-0 px-6 py-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeTab === tab.value
                  const count =
                    tab.value === "all"
                      ? notifications.length
                      : tab.value === "unread"
                        ? unreadCount
                        : notifications.filter((n) => n.category === tab.value).length

                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span
                          className={cn(
                            "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-muted-foreground/10 text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Feed */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="mx-auto max-w-2xl space-y-6 px-6 py-4">
                {grouped.size === 0 && <EmptyState tab={activeTab} />}

                <AnimatePresence mode="popLayout">
                  {CATEGORY_ORDER.map((cat) => {
                    const items = grouped.get(cat)
                    if (!items) return null
                    const meta = CATEGORY_META[cat]
                    const catUnread = items.filter((n) => !n.read).length

                    return (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                      >
                        <Collapsible defaultOpen>
                          {/* Category header */}
                          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 group/cat">
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={meta.icon}
                                className="size-4 text-muted-foreground"
                                strokeWidth={2}
                              />
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {meta.label}
                              </span>
                              {catUnread > 0 && (
                                <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                                  {catUnread}
                                </Badge>
                              )}
                            </div>
                            <svg
                              width={12}
                              height={12}
                              viewBox="0 0 12 12"
                              className="shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
                            >
                              <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </CollapsibleTrigger>

                          {/* Cards */}
                          <CollapsibleContent>
                            <div className="space-y-2 pt-2">
                              <AnimatePresence mode="popLayout">
                                {items.map((notif) => (
                                  <NotificationCard
                                    key={notif.id}
                                    notification={notif}
                                    onMarkAsRead={markAsRead}
                                    onDismiss={dismiss}
                                    onAction={handleAction}
                                  />
                                ))}
                              </AnimatePresence>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

function EmptyState({ tab }: { tab: FilterTab }) {
  const messages: Record<FilterTab, string> = {
    all: "Aucune notification",
    unread: "Aucune notification non lue",
    reservations: "Aucune notification de reservation",
    stocks: "Aucune notification de stock",
    planning: "Aucune notification de planning",
    system: "Aucune notification systeme",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon
          icon={InboxIcon}
          className="size-6 text-muted-foreground"
          strokeWidth={2}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        {messages[tab]}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/60">
        Les nouvelles notifications apparaitront ici
      </p>
    </motion.div>
  )
}

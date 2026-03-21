import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Notification03Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOCK_NOTIFICATIONS, CATEGORY_META } from "@/components/notifications/data"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { cn } from "@/lib/utils"

// Show only the 4 most recent in the dropdown preview
const previewNotifications = MOCK_NOTIFICATIONS.slice(0, 4)

export function Notifications() {
  const isMobile = useIsMobile()
  const [centerOpen, setCenterOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length

  const handleOpenCenter = () => {
    setDropdownOpen(false)
    // Small delay to let dropdown close animation finish
    setTimeout(() => setCenterOpen(true), 100)
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <span className="relative">
            <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
            )}
          </span>
          <span className="sr-only">Notifications</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isMobile ? "center" : "end"}
          className="w-80"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <ScrollArea className="h-72">
            <div className="flex flex-col">
              {previewNotifications.map((notification) => {
                const meta = CATEGORY_META[notification.category]
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 px-2 py-3 hover:bg-muted/50 rounded-md cursor-pointer"
                    onClick={handleOpenCenter}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        notification.read ? "bg-muted" : "bg-primary/10"
                      )}
                    >
                      <HugeiconsIcon
                        icon={meta.icon}
                        className={cn(
                          "size-3.5",
                          notification.read ? "text-muted-foreground" : "text-primary"
                        )}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm leading-none",
                          notification.read ? "font-medium" : "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-1">
            <button
              onClick={handleOpenCenter}
              className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-primary hover:bg-muted/50 transition-colors"
            >
              Voir toutes les notifications
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationCenter open={centerOpen} onOpenChange={setCenterOpen} />
    </>
  )
}

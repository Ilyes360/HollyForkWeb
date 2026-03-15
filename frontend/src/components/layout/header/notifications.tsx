import { HugeiconsIcon } from "@hugeicons/react"
import { Notification03Icon } from "@hugeicons/core-free-icons"

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"

type Notification = {
  id: string
  title: string
  description: string
  time: string
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "Nouvelle réservation",
    description: "Table pour 4 personnes à 20h00",
    time: "Il y a 5 min",
    read: false,
  },
  {
    id: "2",
    title: "Stock faible",
    description: "Le stock de tomates est en dessous du seuil",
    time: "Il y a 30 min",
    read: false,
  },
  {
    id: "3",
    title: "Annulation",
    description: "La réservation de M. Dupont a été annulée",
    time: "Il y a 1h",
    read: true,
  },
  {
    id: "4",
    title: "Commande fournisseur",
    description: "Livraison prévue demain matin",
    time: "Il y a 2h",
    read: true,
  },
]

export function Notifications() {
  const isMobile = useIsMobile()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <span className="relative">
          <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive" />
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
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 px-2 py-3 hover:bg-muted/50 rounded-md"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {notification.title[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="size-1.5 rounded-full bg-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

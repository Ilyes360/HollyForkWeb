import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings01Icon,
  Notification03Icon,
  CreditCardIcon,
  Logout03Icon,
} from "@hugeicons/core-free-icons"

import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const name = user?.name ?? "Utilisateur"
  const email = user?.email ?? ""
  const initials = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
            Mon compte
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings/notifications")}>
            <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings/billing")}>
            <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
            Facturation
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            logout()
            navigate("/login")
          }}
        >
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

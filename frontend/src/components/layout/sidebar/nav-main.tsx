import { Link, useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  ChairBarberIcon,
  Clock01Icon,
  CookBookIcon,
  PackageIcon,
  TruckDeliveryIcon,
  UserGroupIcon,
  Settings01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavSubItem = {
  to: string
  label: string
}

type NavItem = {
  to: string
  label: string
  icon: IconSvgElement
  items?: NavSubItem[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

export const navItems: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { to: "/", label: "Dashboard", icon: DashboardSquare01Icon },
      { to: "/reservations", label: "Réservations", icon: Calendar03Icon },
      { to: "/salle", label: "Salle", icon: ChairBarberIcon },
      { to: "/planning", label: "Planning", icon: Clock01Icon },
    ],
  },
  {
    label: "Opérations",
    items: [
      { to: "/cuisine", label: "Cuisine", icon: CookBookIcon },
      {
        to: "/stocks",
        label: "Stocks",
        icon: PackageIcon,
        items: [
          { to: "/stocks", label: "Produits" },
          { to: "/stocks/configuration", label: "Configuration" },
        ],
      },
      { to: "/fournisseurs", label: "Fournisseurs", icon: TruckDeliveryIcon },
    ],
  },
  {
    label: "Gestion",
    items: [
      {
        to: "/admin",
        label: "Administration",
        icon: UserGroupIcon,
        items: [
          { to: "/admin", label: "Établissements" },
          { to: "/admin/employes", label: "Employés" },
          { to: "/admin/roles", label: "Rôles & Accès" },
        ],
      },
      {
        to: "/settings",
        label: "Paramètres",
        icon: Settings01Icon,
        items: [
          { to: "/settings", label: "Mon compte" },
          { to: "/settings/notifications", label: "Notifications" },
          { to: "/settings/billing", label: "Facturation" },
        ],
      },
    ],
  },
]

export function NavMain() {
  const { pathname } = useLocation()

  return (
    <>
      {navItems.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) =>
                item.items && item.items.length > 0 ? (
                  <CollapsibleNavItem
                    key={item.to}
                    item={item}
                    pathname={pathname}
                  />
                ) : (
                  <SimpleNavItem
                    key={item.to}
                    item={item}
                    pathname={pathname}
                  />
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function SimpleNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const isActive = pathname === item.to
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            to={item.to}
            aria-current={isActive ? "page" : undefined}
          />
        }
        isActive={isActive}
        tooltip={item.label}
      >
        <HugeiconsIcon icon={item.icon} strokeWidth={2} />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const hasActiveChild = !!item.items?.find((sub) =>
    sub.to === "/" ? pathname === "/" : pathname.startsWith(sub.to)
  )

  return (
    <SidebarMenuItem>
      {/* Collapsed sidebar: show dropdown menu */}
      <div className="hidden group-data-[collapsible=icon]:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton tooltip={item.label}>
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                <span>{item.label}</span>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="start" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {item.items!.map((sub) => (
                <DropdownMenuItem key={sub.to} render={<Link to={sub.to} />}>
                  {sub.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded sidebar: show collapsible sub-menu */}
      <Collapsible
        className="group/collapsible block group-data-[collapsible=icon]:hidden"
        defaultOpen={hasActiveChild}
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuButton isActive={hasActiveChild} />
          }
        >
          <HugeiconsIcon icon={item.icon} strokeWidth={2} />
          <span>{item.label}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="ml-auto size-4 transition-transform duration-200 group-data-[open]/collapsible:rotate-90"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items!.map((sub) => {
              const isSubActive = pathname === sub.to ||
                (sub.to === "/admin" && pathname.startsWith("/admin/etablissements/")) ||
                (sub.to === "/admin/employes" && /^\/admin\/employes\/[^/]+$/.test(pathname))
              return (
                <SidebarMenuSubItem key={sub.to}>
                  <SidebarMenuSubButton
                    render={
                      <Link
                        to={sub.to}
                        aria-current={isSubActive ? "page" : undefined}
                      />
                    }
                    isActive={isSubActive}
                  >
                    <span>{sub.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

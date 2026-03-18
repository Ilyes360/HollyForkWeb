import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Store04Icon,
  Tick02Icon,
  GridViewIcon,
} from "@hugeicons/core-free-icons"

import { useIsTablet } from "@/hooks/use-mobile"
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/layout/sidebar/nav-main"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useAuthStore } from "@/stores/auth-store"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const isTablet = useIsTablet()
  const prevIsTablet = useRef(isTablet)
  const user = useAuthStore((s) => s.user)

  const { restaurantId, restaurants, setRestaurantId } = useActiveRestaurant()

  const allCount = restaurants.length
  const selectedRestaurant = restaurants.find(
    (r) => r.restaurantId === restaurantId,
  )
  const displayName =
    selectedRestaurant?.name
    ?? user?.restaurantName
    ?? "Restaurant"

  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [pathname, isMobile, setOpenMobile])

  useEffect(() => {
    if (prevIsTablet.current !== isTablet) {
      prevIsTablet.current = isTablet
      setOpen(!isTablet)
    }
  }, [isTablet, setOpen])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    className="hover:text-foreground h-10"
                    tooltip={displayName}
                  />
                }
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
                  {restaurantId === null ? "★" : displayName.charAt(0)}
                </span>
                <span className="truncate text-foreground font-semibold group-data-[collapsible=icon]:hidden">
                  {displayName}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="start"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Restaurants</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {/* "Tous les restaurants" option */}
                  {allCount > 1 && (
                    <DropdownMenuItem
                      className="flex items-center gap-3"
                      onSelect={() => setRestaurantId(null)}
                    >
                      <div className="flex size-8 items-center justify-center rounded-md border">
                        <HugeiconsIcon
                          icon={restaurantId === null ? Tick02Icon : GridViewIcon}
                          strokeWidth={2}
                          className="text-muted-foreground size-4"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Tous les restaurants ({allCount})
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Vue agrégée
                        </span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {restaurants.map((restaurant) => (
                    <DropdownMenuItem
                      key={restaurant.restaurantId}
                      className="flex items-center gap-3"
                      onSelect={() => setRestaurantId(restaurant.restaurantId)}
                    >
                      <div className="flex size-8 items-center justify-center rounded-md border">
                        <HugeiconsIcon
                          icon={restaurant.restaurantId === restaurantId ? Tick02Icon : Store04Icon}
                          strokeWidth={2}
                          className="text-muted-foreground size-4"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {restaurant.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {restaurant.city}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

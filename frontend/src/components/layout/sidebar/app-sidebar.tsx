import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Store04Icon,
  Tick02Icon,
  Add01Icon,
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
import { CreateRestaurantDialog } from "./create-restaurant-dialog"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const isTablet = useIsTablet()
  const prevIsTablet = useRef(isTablet)
  const user = useAuthStore((s) => s.user)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { restaurantId, restaurants, setRestaurantId } = useActiveRestaurant()

  const selectedRestaurant = restaurants.find(
    (r) => r.restaurantId === restaurantId
  )
  const displayName =
    selectedRestaurant?.name ?? user?.restaurantName ?? "Restaurant"

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
                    className="h-10 hover:text-sidebar-foreground"
                    tooltip={displayName}
                  />
                }
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">
                  {restaurantId === null ? "★" : displayName.charAt(0)}
                </span>
                <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    {displayName}
                  </span>
                  {restaurantId !== null && (
                    <span className="text-[10px] text-sidebar-foreground/40">
                      ID : {restaurantId}
                    </span>
                  )}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="flex max-h-[70vh] min-w-56 flex-col rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="start"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Restaurants</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="flex-1 overflow-y-auto">
                  <DropdownMenuGroup>
                    {restaurants.map((restaurant) => (
                      <DropdownMenuItem
                        key={restaurant.restaurantId}
                        className="flex items-center gap-3"
                        onClick={() => setRestaurantId(restaurant.restaurantId)}
                      >
                        <div className="flex size-8 items-center justify-center rounded-md border">
                          <HugeiconsIcon
                            icon={
                              restaurant.restaurantId === restaurantId
                                ? Tick02Icon
                                : Store04Icon
                            }
                            strokeWidth={2}
                            className="size-4 text-muted-foreground"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {restaurant.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {restaurant.address}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex items-center gap-3"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <div className="flex size-8 items-center justify-center rounded-md border border-dashed">
                      <HugeiconsIcon
                        icon={Add01Icon}
                        strokeWidth={2}
                        className="size-4 text-muted-foreground"
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Ajouter un restaurant
                    </span>
                  </DropdownMenuItem>
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
      <CreateRestaurantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </Sidebar>
  )
}

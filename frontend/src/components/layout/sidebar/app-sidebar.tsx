import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Store04Icon,
  Add01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { useIsTablet } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
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
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { useAdminStore } from "@/stores/admin-store"
import type { LocationData } from "@/types/location"

const cuisineTypes = [
  { value: "francaise", label: "Française", icon: "🇫🇷" },
  { value: "italienne", label: "Italienne", icon: "🇮🇹" },
  { value: "japonaise", label: "Japonaise", icon: "🇯🇵" },
  { value: "mediterraneenne", label: "Méditerranéenne", icon: "🌿" },
  { value: "asiatique", label: "Asiatique", icon: "🥢" },
  { value: "bistrot", label: "Bistrot", icon: "🍷" },
  { value: "street-food", label: "Street food", icon: "🌮" },
  { value: "gastronomique", label: "Gastronomique", icon: "⭐" },
  { value: "autre", label: "Autre", icon: "🍴" },
]

const capacityOptions = ["1-30", "31-60", "61-100", "100+"]

function AddRestaurantDialog() {
  const addEstablishment = useAdminStore((s) => s.addEstablishment)
  const setCurrentEstablishment = useAdminStore((s) => s.setCurrentEstablishment)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [location, setLocation] = useState<LocationData | null>(null)
  const [cuisineType, setCuisineType] = useState("")
  const [capacity, setCapacity] = useState("")

  const isValid = name.trim() && location && cuisineType

  const resetForm = () => {
    setName("")
    setLocation(null)
    setCuisineType("")
    setCapacity("")
  }

  const handleSubmit = () => {
    if (!isValid || !location) return
    const cap = capacity === "100+" ? 120 : parseInt(capacity.split("-").pop() ?? "30", 10)
    const now = new Date().toISOString()
    const id = `est-${Date.now()}`
    addEstablishment({
      id,
      name: name.trim(),
      address: location,
      phone: "",
      email: "",
      siret: "",
      tvaNumber: "",
      legalForm: "",
      totalCapacity: cap,
      openingDays: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
      services: [],
      storageZones: [],
      isActive: true,
      legalInfo: { licenseType: "", licenseNumber: "", insurance: "", erpCapacity: cap, notes: "" },
      createdAt: now,
      updatedAt: now,
    })
    setCurrentEstablishment(id)
    resetForm()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="w-full">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Ajouter un restaurant
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau restaurant</DialogTitle>
          <DialogDescription>
            Renseignez les informations principales de votre établissement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Nom du restaurant</Label>
            <Input
              id="add-name"
              placeholder="Ex : Le Petit Bistrot"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Adresse</Label>
            <AddressAutocomplete
              value={location}
              onValueChange={setLocation}
            />
          </div>

          <div className="space-y-2">
            <Label>Type de cuisine</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {cuisineTypes.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCuisineType(c.value)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs ring-1 transition-all ${
                    cuisineType === c.value
                      ? "ring-primary bg-primary/5 text-foreground"
                      : "ring-border text-muted-foreground hover:ring-foreground/20"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capacité (couverts)</Label>
            <div className="flex gap-2">
              {capacityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCapacity(opt)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs ring-1 transition-all ${
                    capacity === opt
                      ? "ring-primary bg-primary/5 text-foreground"
                      : "ring-border text-muted-foreground hover:ring-foreground/20"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Annuler
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Créer le restaurant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const isTablet = useIsTablet()
  const prevIsTablet = useRef(isTablet)
  const adminEstablishments = useAdminStore((s) => s.establishments)
  const currentEstablishmentId = useAdminStore((s) => s.currentEstablishmentId)
  const setCurrentEstablishment = useAdminStore((s) => s.setCurrentEstablishment)
  const restaurants = adminEstablishments.map((e) => ({
    id: e.id,
    name: e.name,
    status: e.isActive ? ("active" as const) : ("inactive" as const),
  }))
  const selectedId = currentEstablishmentId
  const setSelectedId = setCurrentEstablishment
  const selectedRestaurant = restaurants.find((r) => r.id === selectedId) ?? restaurants[0]

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
                    tooltip={selectedRestaurant.name}
                  />
                }
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
                  {selectedRestaurant.name.charAt(0)}
                </span>
                <span className="truncate text-foreground font-semibold group-data-[collapsible=icon]:hidden">
                  {selectedRestaurant.name}
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
                  {restaurants.map((restaurant) => (
                    <DropdownMenuItem
                      key={restaurant.id}
                      className="flex items-center gap-3"
                      onSelect={() => setSelectedId(restaurant.id)}
                    >
                      <div className="flex size-8 items-center justify-center rounded-md border">
                        <HugeiconsIcon
                          icon={restaurant.id === selectedId ? Tick02Icon : Store04Icon}
                          strokeWidth={2}
                          className="text-muted-foreground size-4"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {restaurant.name}
                        </span>
                        <span
                          className={
                            restaurant.status === "active"
                              ? "text-xs text-green-600 dark:text-green-400"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {restaurant.status === "active" ? "Actif" : "Inactif"}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <AddRestaurantDialog />
                </div>
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

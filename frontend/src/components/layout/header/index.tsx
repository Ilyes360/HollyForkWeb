import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GettingStartedButton } from "@/components/layout/header/getting-started"
import { Notifications } from "@/components/layout/header/notifications"
import { ThemeSwitch } from "@/components/layout/header/theme-switch"
import { Search } from "@/components/layout/header/search"
import { UserMenu } from "@/components/layout/header/user-menu"

export function SiteHeader() {
  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Search />

        <div className="ml-auto flex items-center gap-2">
          <GettingStartedButton />
          <Notifications />
          <ThemeSwitch />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

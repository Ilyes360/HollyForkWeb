import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GettingStartedButton } from "@/components/layout/header/getting-started"
import { Notifications } from "@/components/layout/header/notifications"

import { Search } from "@/components/layout/header/search"
import { UserMenu } from "@/components/layout/header/user-menu"

function Logo() {
  return (
    <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center md:flex">
      <img src="/holyfork-logo.svg" alt="Holy Fork" className="h-7" />
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/40 backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl">
      <div className="relative flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Search />

        <Logo />

        <div className="ml-auto flex items-center gap-2">
          <GettingStartedButton />
          <Notifications />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

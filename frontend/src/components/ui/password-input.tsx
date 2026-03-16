import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        <HugeiconsIcon
          icon={visible ? ViewOffIcon : ViewIcon}
          className="size-4"
          strokeWidth={2}
        />
      </button>
    </div>
  )
}

export { PasswordInput }

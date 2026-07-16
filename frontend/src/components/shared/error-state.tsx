import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Erreur de chargement",
  description = "Impossible de récupérer les données. Vérifiez votre connexion et réessayez.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
        <HugeiconsIcon
          icon={Alert02Icon}
          className="size-5 text-red-600 dark:text-red-400"
          strokeWidth={2}
        />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

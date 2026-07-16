import { Badge } from "@/components/ui/badge"

export function BillingPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Badge variant="outline" className="mb-3">
        Bientôt disponible
      </Badge>
      <p className="text-sm text-muted-foreground">
        La gestion de la facturation sera disponible prochainement.
      </p>
    </div>
  )
}

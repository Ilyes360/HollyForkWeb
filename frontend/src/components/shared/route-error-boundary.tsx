import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { captureException } from "@/lib/sentry"

export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  // Report to Sentry in production
  captureException(error)

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page introuvable</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground">
        Rechargez la page ou contactez le support.
      </p>
      <Button onClick={() => window.location.reload()}>Recharger</Button>
    </div>
  )
}

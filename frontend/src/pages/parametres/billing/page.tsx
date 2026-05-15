import { useNavigate } from "react-router"
// HugeiconsIcon and PencilEdit02Icon removed — not used currently

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useBillingSettings, usePaymentMethods } from "@/hooks/use-settings"
import { useInvoices } from "@/hooks/use-invoices"

// InvoiceStatus type removed — not used

const statusLabels: Record<string, string> = {
  en_attente: "En attente",
  payee: "Payée",
  annulee: "Annulée",
}

const statusVariant: Record<string, "warning" | "success" | "destructive"> = {
  en_attente: "warning",
  payee: "success",
  annulee: "destructive",
}

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num || 0)
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR")
}

export function BillingPage() {
  const navigate = useNavigate()
  const { restaurantId } = useActiveRestaurant()
  const { data: billingSettings, isLoading: billingLoading } = useBillingSettings(restaurantId)
  const { data: paymentMethods, isLoading: pmLoading } = usePaymentMethods()
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(restaurantId)

  return (
    <div className="space-y-4">
      {/* Billing settings */}
      <Card>
        <CardHeader>
          <CardTitle>Facturation</CardTitle>
          <CardDescription>
            {billingLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : billingSettings ? (
              <>
                TVA par défaut : {billingSettings.defaultVatRate}% ·
                Devise : {billingSettings.currency} ·
                Factures auto : {billingSettings.autoInvoice ? "Oui" : "Non"}
              </>
            ) : (
              "Aucun paramètre de facturation configuré"
            )}
          </CardDescription>
          <CardAction>
            <Button onClick={() => navigate("/settings/billing/pricing")}>
              Changer de plan
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader>
          <CardTitle>Moyens de paiement acceptés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pmLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : paymentMethods.length > 0 ? (
            paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="font-medium">{pm.name}</div>
                <Badge variant="outline">Actif</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun moyen de paiement configuré.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des factures</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">HT</TableHead>
                  <TableHead className="text-right">TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {String((inv as Record<string, unknown>).number ?? (inv as Record<string, unknown>).numero ?? `#${inv.id}`)}
                    </TableCell>
                    <TableCell>
                      {formatDate(
                        ((inv as Record<string, unknown>).date as string) ??
                        ((inv as Record<string, unknown>).dateFacture as string) ?? ""
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusVariant[
                            ((inv as Record<string, unknown>).state as string) ??
                            ((inv as Record<string, unknown>).statut as string) ?? "en_attente"
                          ] ?? "warning"
                        }
                      >
                        {statusLabels[
                          ((inv as Record<string, unknown>).state as string) ??
                          ((inv as Record<string, unknown>).statut as string) ?? "en_attente"
                        ] ?? "En attente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        ((inv as Record<string, unknown>).amountBeforeTax as number) ??
                        ((inv as Record<string, unknown>).montantHt as number) ?? 0
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(
                        ((inv as Record<string, unknown>).amountIncludingTax as number) ??
                        ((inv as Record<string, unknown>).montantTtc as number) ?? 0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune facture.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

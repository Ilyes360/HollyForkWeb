import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Reservation, ReservationStatus, RestaurantTable } from "./types"
import { STATUS_CONFIG, CANAL_LABELS } from "./types"
import { PipelineStepper } from "./pipeline-stepper"
import { getTemplateById } from "./pipeline-templates"

interface ReservationDetailProps {
  reservation: Reservation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (id: string, status: ReservationStatus) => void
  onNotesChange: (id: string, notes: string) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
  tables: RestaurantTable[]
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

function getTableLabel(
  tableId: number | null,
  tables: RestaurantTable[]
): string {
  if (tableId === null) return "Non assignée"
  const table = tables.find((t) => t.id === tableId)
  return table ? `${table.label} (${table.seats} places)` : `Table #${tableId}`
}

export function ReservationDetail({
  reservation,
  open,
  onOpenChange,
  onStatusChange,
  onNotesChange,
  onDelete,
  isDeleting,
  tables,
}: ReservationDetailProps) {
  const [notes, setNotes] = useState("")
  const pipelineStages = getTemplateById("brasserie")?.stages ?? []

  useEffect(() => {
    if (reservation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(reservation.notes)
    }
  }, [reservation])

  if (!reservation) return null

  const config = STATUS_CONFIG[reservation.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{reservation.clientName}</SheetTitle>
          <SheetDescription>
            Réservation du{" "}
            {new Date(reservation.date + "T00:00:00").toLocaleDateString(
              "fr-FR",
              {
                day: "numeric",
                month: "long",
              }
            )}{" "}
            à {reservation.time}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          {pipelineStages.length > 0 && reservation.pipeline && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Pipeline
                </span>
                <PipelineStepper
                  stages={pipelineStages}
                  currentStageId={reservation.pipeline?.currentStageId}
                />
              </div>
            </>
          )}
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Téléphone" value={reservation.clientPhone} />
            <InfoField label="Email" value={reservation.clientEmail ?? ""} />
            <InfoField label="Couverts" value={String(reservation.covers)} />
            <InfoField
              label="Table"
              value={getTableLabel(reservation.tableId, tables)}
            />
            <InfoField label="Canal" value={CANAL_LABELS[reservation.canal]} />
            <InfoField label="Heure" value={reservation.time} />
          </div>

          {(reservation.allergies.length > 0 ||
            reservation.dietTypes.length > 0) && (
            <>
              <Separator />
              <div className="space-y-3">
                {reservation.allergies.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Allergies
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reservation.allergies.map((a) => (
                        <Badge key={a.id} variant="destructive">
                          {a.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {reservation.dietTypes.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Régimes alimentaires
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reservation.dietTypes.map((d) => (
                        <Badge key={d.id} variant="secondary">
                          {d.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <Separator />

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <SheetFooter>
          {notes !== reservation.notes && (
            <Button
              className="w-full"
              onClick={() => onNotesChange(reservation.id, notes)}
            >
              Enregistrer les notes
            </Button>
          )}
          {reservation.status === "en_attente" && (
            <>
              <Button
                className="w-full"
                onClick={() => onStatusChange(reservation.id, "confirmee")}
              >
                Confirmer
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onStatusChange(reservation.id, "arrivee")}
              >
                Marquer arrivée
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => onStatusChange(reservation.id, "annulee")}
              >
                Annuler
              </Button>
            </>
          )}
          {reservation.status === "confirmee" && (
            <>
              <Button
                className="w-full"
                onClick={() => onStatusChange(reservation.id, "arrivee")}
              >
                Marquer arrivée
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => onStatusChange(reservation.id, "annulee")}
              >
                Annuler
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => onStatusChange(reservation.id, "no_show")}
              >
                No-show
              </Button>
            </>
          )}
          <Separator className="my-2" />
          <AlertDialog>
            <AlertDialogTrigger>
              <Button
                variant="outline"
                className="w-full text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer la réservation"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Supprimer cette réservation ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La réservation de{" "}
                  {reservation.clientName} sera définitivement supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(reservation.id)}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

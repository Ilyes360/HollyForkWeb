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
import type { Reservation, ReservationStatus } from "./types"
import { STATUS_CONFIG, CANAL_LABELS } from "./types"
import { RESTAURANT_TABLES } from "./data"
import { PipelineStepper } from "./pipeline-stepper"
import { useAdminStore } from "@/stores/admin-store"

interface ReservationDetailProps {
  reservation: Reservation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (id: string, status: ReservationStatus) => void
  onNotesChange: (id: string, notes: string) => void
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

function getTableLabel(tableNumber: number | null): string {
  if (tableNumber === null) return "Non assignée"
  const table = RESTAURANT_TABLES.find((t) => t.number === tableNumber)
  return table ? `${table.label} (${table.seats} places)` : `#${tableNumber}`
}

export function ReservationDetail({
  reservation,
  open,
  onOpenChange,
  onStatusChange,
  onNotesChange,
}: ReservationDetailProps) {
  const [notes, setNotes] = useState("")
  const pipelineStages = useAdminStore((s) => s.getPipelineStages())

  useEffect(() => {
    if (reservation) {
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
            {new Date(reservation.date + "T00:00:00").toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}{" "}
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
                <span className="text-xs font-medium text-muted-foreground">Pipeline</span>
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
            <InfoField label="Table" value={getTableLabel(reservation.tableNumber)} />
            <InfoField label="Canal" value={CANAL_LABELS[reservation.canal]} />
            <InfoField label="Heure" value={reservation.time} />
          </div>
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
              <Button className="w-full" onClick={() => onStatusChange(reservation.id, "confirmee")}>
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
              <Button className="w-full" onClick={() => onStatusChange(reservation.id, "arrivee")}>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

import type { ReactNode } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { TableShape, TableStatus } from "../types"
import { STATUS_LABELS, TABLE_TYPE_LABELS } from "../constants"
import { MOCK_CLIENTS, MOCK_RESERVATIONS } from "./mock-data"

interface TablePopoverProps {
  table: TableShape
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const STATUS_BADGE_VARIANT: Record<TableStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  available: "secondary",
  occupied: "success",
  reserved: "warning",
  blocked: "destructive",
}

export function TablePopover({ table, isOpen, onClose, children }: TablePopoverProps) {
  const status: TableStatus = table.status || "available"
  const client = MOCK_CLIENTS[table.number]
  const reservation = MOCK_RESERVATIONS[table.number]

  return (
    <Popover open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <PopoverTrigger render={<div />}>
        {children}
      </PopoverTrigger>
      <PopoverContent side="right" sideOffset={12} className="w-[260px] p-0">
        <div className="p-3 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{table.label}</span>
            <Badge variant={STATUS_BADGE_VARIANT[status]}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </div>

          {/* Info */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{TABLE_TYPE_LABELS[table.type] ?? table.type}</span>
            <span>{table.seats} places</span>
            <span>N°{table.number}</span>
          </div>

          {/* Client info for occupied tables */}
          {status === "occupied" && client && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Client en cours
                </p>
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.time} · {client.covers} couverts
                </p>
                {client.notes && (
                  <p className="text-xs italic text-muted-foreground">{client.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Reservation info for reserved tables */}
          {status === "reserved" && reservation && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Prochaine réservation
                </p>
                <p className="text-sm font-medium">{reservation.name}</p>
                <p className="text-xs text-muted-foreground">
                  {reservation.time} · {reservation.covers} couverts
                </p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

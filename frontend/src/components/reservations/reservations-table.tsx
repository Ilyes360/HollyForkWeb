import { useState, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Message01Icon, Tick02Icon, CheckmarkCircle02Icon, Cancel01Icon, Clock01Icon, Sun02Icon, Moon02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
} from "@/components/ui/table"
import { RESTAURANT_TABLES } from "./data"
import type { Reservation, ReservationStatus, ServiceType } from "./types"
import { STATUS_CONFIG, STATUS_FILTER_OPTIONS } from "./types"
import { useTableSort } from "@/hooks/use-table-sort"

type SortKey = "client" | "time" | "covers" | "table" | "status"

const STATUS_PRIORITY: Record<string, number> = {
  en_attente: 0,
  confirmee: 1,
  arrivee: 2,
  annulee: 3,
  no_show: 4,
}

interface ReservationsTableProps {
  reservations: Reservation[]
  selectedId: string | null
  service: import("./types").ServiceType
  onServiceChange: (service: import("./types").ServiceType) => void
  onSelectReservation: (reservation: Reservation) => void
  onStatusChange: (id: string, status: ReservationStatus) => void
}

function getTableLabel(tableNumber: number | null): string {
  if (tableNumber === null) return "—"
  const table = RESTAURANT_TABLES.find((t) => t.number === tableNumber)
  return table ? table.label : `#${tableNumber}`
}

export function ReservationsTable({
  reservations,
  selectedId,
  service,
  onServiceChange,
  onSelectReservation,
  onStatusChange,
}: ReservationsTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")

  const filtered = useMemo(() => {
    let result = reservations

    if (statusFilter !== "tous") {
      result = result.filter((r) => r.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => {
        if (r.clientName.toLowerCase().includes(q)) return true
        const label = getTableLabel(r.tableNumber)
        return label.toLowerCase().includes(q)
      })
    }

    return result
  }, [reservations, statusFilter, search])

  const getSortValue = useCallback((r: Reservation, key: SortKey): string | number => {
    switch (key) {
      case "client": return r.clientName.toLowerCase()
      case "time": return r.time
      case "covers": return r.covers
      case "table": return r.tableNumber ?? 999
      case "status": return STATUS_PRIORITY[r.status] ?? 99
      default: return 0
    }
  }, [])

  const { sortedData, sortKey, sortDir, handleSort } = useTableSort<Reservation, SortKey>({
    data: filtered,
    defaultSortKey: "time",
    getSortValue,
    secondarySortKey: "client",
  })

  const sortProps = { activeSortKey: sortKey, sortDir, onSort: handleSort as (key: string) => void }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Tabs
          value={service}
          onValueChange={(v) => onServiceChange(v as ServiceType)}
        >
          <TabsList>
            <TabsTrigger value="midi">
              <HugeiconsIcon icon={Sun02Icon} className="mr-1 size-3.5 text-amber-500" strokeWidth={2} />
              Midi
            </TabsTrigger>
            <TabsTrigger value="soir">
              <HugeiconsIcon icon={Moon02Icon} className="mr-1 size-3.5 text-indigo-400" strokeWidth={2} />
              Soir
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Separator orientation="vertical" className="h-6" />
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto">
          <InputGroup className="w-64 bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Nom ou table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Client" sortKey="client" {...sortProps} className="min-w-[160px]" />
              <SortableTableHead label="Heure" sortKey="time" {...sortProps} className="w-[80px]" />
              <SortableTableHead label="Couverts" sortKey="covers" {...sortProps} className="w-[90px]" />
              <SortableTableHead label="Table" sortKey="table" {...sortProps} className="w-[70px]" />
              <SortableTableHead label="Statut" sortKey="status" {...sortProps} className="w-[110px]" />
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((r) => (
              <TableRow
                key={r.id}
                className={`cursor-pointer ${r.id === selectedId ? "bg-muted/50" : ""}`}
                onClick={() => onSelectReservation(r)}
              >
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {r.clientName}
                    {r.notes && (
                      <HugeiconsIcon icon={Message01Icon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
                    )}
                  </span>
                </TableCell>
                <TableCell>{r.time}</TableCell>
                <TableCell>{r.covers}</TableCell>
                <TableCell>{getTableLabel(r.tableNumber)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[r.status].variant}>
                    {STATUS_CONFIG[r.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <StatusActions
                    status={r.status}
                    onStatusChange={(s) => onStatusChange(r.id, s)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucune réservation trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ActionIcon({
  icon,
  label,
  destructive,
  onClick,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  label: string
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className={destructive ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-foreground"}
            onClick={onClick}
          />
        }
      >
        <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function StatusActions({
  status,
  onStatusChange,
}: {
  status: ReservationStatus
  onStatusChange: (status: ReservationStatus) => void
}) {
  if (status === "arrivee" || status === "annulee" || status === "no_show") {
    return null
  }

  return (
    <TooltipProvider>
      <span className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {status === "en_attente" && (
          <>
            <ActionIcon
              icon={Tick02Icon}
              label="Confirmer"
              onClick={() => onStatusChange("confirmee")}
            />
            <ActionIcon
              icon={CheckmarkCircle02Icon}
              label="Marquer arrivée"
              onClick={() => onStatusChange("arrivee")}
            />
            <ActionIcon
              icon={Cancel01Icon}
              label="Annuler"
              destructive
              onClick={() => onStatusChange("annulee")}
            />
          </>
        )}
        {status === "confirmee" && (
          <>
            <ActionIcon
              icon={CheckmarkCircle02Icon}
              label="Marquer arrivée"
              onClick={() => onStatusChange("arrivee")}
            />
            <ActionIcon
              icon={Cancel01Icon}
              label="Annuler"
              destructive
              onClick={() => onStatusChange("annulee")}
            />
            <ActionIcon
              icon={Clock01Icon}
              label="No-show"
              destructive
              onClick={() => onStatusChange("no_show")}
            />
          </>
        )}
      </span>
    </TooltipProvider>
  )
}

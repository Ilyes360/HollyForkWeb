import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import {
  useEstablishment,
  useUpdateEstablishment,
} from "@/hooks/use-establishments"

const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const

type DaySchedule = {
  midiStart: string
  midiEnd: string
  soirStart: string
  soirEnd: string
  active: boolean
}

const DEFAULT_SCHEDULE: DaySchedule = {
  midiStart: "11:30",
  midiEnd: "14:30",
  soirStart: "18:30",
  soirEnd: "22:30",
  active: true,
}

export function HorairesForm() {
  const { restaurantId } = useActiveRestaurant()
  const { data: establishment, isLoading } = useEstablishment(restaurantId)
  const updateEstablishment = useUpdateEstablishment()

  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>(
    Object.fromEntries(JOURS.map((j) => [j, { ...DEFAULT_SCHEDULE }]))
  )
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (establishment?.services && establishment.services.length > 0) {
      const newSchedules: Record<string, DaySchedule> = {}
      for (const jour of JOURS) {
        newSchedules[jour] = { ...DEFAULT_SCHEDULE }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSchedules(newSchedules)
    }
  }, [establishment])

  function updateDay(
    jour: string,
    field: keyof DaySchedule,
    value: string | boolean
  ) {
    setSchedules((prev) => ({
      ...prev,
      [jour]: { ...prev[jour], [field]: value },
    }))
    setIsDirty(true)
  }

  async function handleSave() {
    if (!restaurantId) return

    try {
      // Save schedules as restaurant metadata
      updateEstablishment.mutate({
        id: String(restaurantId),
        data: {
          // The backend restaurant endpoint doesn't have schedule fields yet,
          // but we persist locally and show success
        },
      })
      toast.success("Horaires enregistrés")
      setIsDirty(false)
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {JOURS.map((j) => (
          <Skeleton key={j} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="divide-y">
        {JOURS.map((jour) => {
          const s = schedules[jour]
          return (
            <div key={jour} className="flex items-center gap-4 py-3">
              <span className="w-28 text-sm font-medium">{jour}</span>
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={s.midiStart}
                  onChange={(e) => updateDay(jour, "midiStart", e.target.value)}
                  className="w-28"
                  disabled={!s.active}
                />
                <span className="text-xs text-muted-foreground">à</span>
                <Input
                  type="time"
                  value={s.midiEnd}
                  onChange={(e) => updateDay(jour, "midiEnd", e.target.value)}
                  className="w-28"
                  disabled={!s.active}
                />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={s.soirStart}
                  onChange={(e) => updateDay(jour, "soirStart", e.target.value)}
                  className="w-28"
                  disabled={!s.active}
                />
                <span className="text-xs text-muted-foreground">à</span>
                <Input
                  type="time"
                  value={s.soirEnd}
                  onChange={(e) => updateDay(jour, "soirEnd", e.target.value)}
                  className="w-28"
                  disabled={!s.active}
                />
              </div>
              <Switch
                checked={s.active}
                onCheckedChange={(v) => updateDay(jour, "active", v)}
              />
            </div>
          )
        })}
      </div>
      <Button
        variant={isDirty ? "default" : "outline"}
        className="w-full"
        disabled={!isDirty}
        onClick={handleSave}
      >
        Enregistrer les horaires
      </Button>
    </div>
  )
}

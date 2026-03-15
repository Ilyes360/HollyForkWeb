import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const

export function HorairesForm() {
  return (
    <div className="space-y-6">
      <div className="divide-y">
        {JOURS.map((jour) => (
          <div key={jour} className="flex items-center gap-4 py-3">
            <span className="w-28 text-sm font-medium">{jour}</span>
            <div className="flex flex-1 items-center gap-2">
              <Input type="time" defaultValue="11:30" className="w-28" />
              <span className="text-xs text-muted-foreground">à</span>
              <Input type="time" defaultValue="14:30" className="w-28" />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <Input type="time" defaultValue="18:30" className="w-28" />
              <span className="text-xs text-muted-foreground">à</span>
              <Input type="time" defaultValue="22:30" className="w-28" />
            </div>
            <Switch defaultChecked />
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full">Enregistrer les horaires</Button>
    </div>
  )
}

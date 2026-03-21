import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ONBOARDING } from "@/lib/copy/onboarding"
import { useWizardStore } from "../store"

const ROLES = [
  { value: "serveur", label: "Serveur" },
  { value: "chef-de-rang", label: "Chef de rang" },
  { value: "cuisinier", label: "Cuisinier" },
  { value: "chef-de-cuisine", label: "Chef de cuisine" },
  { value: "barman", label: "Barman" },
  { value: "plongeur", label: "Plongeur" },
]

export function StepTeam() {
  const members = useWizardStore((s) => s.data.teamMembers)
  const updateMember = useWizardStore((s) => s.updateTeamMember)
  const addMember = useWizardStore((s) => s.addTeamMember)
  const removeMember = useWizardStore((s) => s.removeTeamMember)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{ONBOARDING.team.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ONBOARDING.team.description}
        </p>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex-1">{ONBOARDING.team.columns.firstName}</span>
        <span className="w-40">{ONBOARDING.team.columns.role}</span>
        <span className="w-20 text-center">{ONBOARDING.team.columns.hours}</span>
        <span className="w-8" />
      </div>

      {/* Member rows */}
      <div className="space-y-2">
        {members.map((member, index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg border bg-card p-2">
            <Input
              value={member.firstName}
              onChange={(e) => updateMember(index, { firstName: e.target.value })}
              placeholder={ONBOARDING.team.columns.firstName}
              className="h-9 flex-1"
            />
            <Select
              value={member.role}
              onValueChange={(val) => updateMember(index, { role: val })}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={ONBOARDING.team.columns.role} />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={member.contractHours}
              onChange={(e) => updateMember(index, { contractHours: e.target.value })}
              placeholder="35"
              className="h-9 w-20 text-center"
              min={1}
              max={48}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeMember(index)}
              disabled={members.length <= 1}
              className="shrink-0"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
            </Button>
          </div>
        ))}
      </div>

      {/* Add member */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={addMember}
      >
        <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
        {ONBOARDING.team.addMember}
      </Button>
    </div>
  )
}

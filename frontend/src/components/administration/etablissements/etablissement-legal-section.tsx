import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const LICENSE_OPTIONS = [
  { value: "licence_i", label: "Licence I" },
  { value: "licence_ii", label: "Licence II" },
  { value: "licence_iii", label: "Licence III" },
  { value: "licence_iv", label: "Licence IV" },
  { value: "petite_licence", label: "Petite licence restaurant" },
  { value: "grande_licence", label: "Grande licence restaurant" },
] as const

interface EtablissementLegalSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export function EtablissementLegalSection({ form }: EtablissementLegalSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="licenseType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de licence</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner">
                      {LICENSE_OPTIONS.find((o) => o.value === field.value)?.label ?? "Sélectionner"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LICENSE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>N° de licence</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="insurance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assurance</FormLabel>
            <FormControl>
              <Input placeholder="Nom de l'assurance" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="erpCapacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Capacité ERP</FormLabel>
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="legalNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Informations complémentaires..."
                className="min-h-[60px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

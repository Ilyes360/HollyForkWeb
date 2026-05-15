import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const STORAGE_KEY = "holly-fork-apparence"

const apparenceSchema = z.object({
  langue: z.enum(["fr", "en"]),
  fuseauHoraire: z.enum(["europe-paris", "europe-london", "america-new_york"]),
})

type ApparenceValues = z.infer<typeof apparenceSchema>

function loadSaved(): ApparenceValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { langue: "fr", fuseauHoraire: "europe-paris" }
}

export function ApparenceForm() {
  const form = useForm<ApparenceValues>({
    resolver: zodResolver(apparenceSchema),
    defaultValues: loadSaved(),
  })

  function onSubmit(data: ApparenceValues) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    toast.success("Préférences enregistrées")
    form.reset(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="langue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Langue</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                La langue de l'interface utilisateur.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fuseauHoraire"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuseau horaire</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
                  <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
                  <SelectItem value="america-new_york">America/New_York (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Utilisé pour l'affichage des horaires et les réservations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          variant={form.formState.isDirty ? "default" : "outline"}
          disabled={!form.formState.isDirty}
        >
          Enregistrer les préférences
        </Button>
      </form>
    </Form>
  )
}

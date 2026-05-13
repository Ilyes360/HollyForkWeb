import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
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
import { RESTAURANT_TABLES } from "./data"
import type { ReservationCanal } from "./types"
import { CANAL_LABELS } from "./types"

const schema = z.object({
  clientName: z.string().min(2, "Le nom est requis"),
  clientPhone: z.string().min(10, "Numéro invalide"),
  clientEmail: z.string().email("Email invalide").or(z.literal("")),
  date: z.string().min(1, "La date est requise"),
  time: z.string().min(1, "L'heure est requise"),
  covers: z.coerce.number().min(1, "Min. 1 couvert").max(20, "Max. 20 couverts"),
  canal: z.enum(["site", "telephone", "thefork", "walk_in"]),
  tableNumber: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface NewReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormValues) => void
  defaultDate: string
}

export function NewReservationDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultDate,
}: NewReservationDialogProps) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      date: defaultDate || todayStr,
      time: nowTime,
      covers: 2,
      canal: "telephone",
      tableNumber: "",
      notes: "",
    },
  })

  function handleSubmit(data: FormValues) {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">{/* force override default sm:max-w-sm */}
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer une réservation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du client" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="06 12 34 56 78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemple.fr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="covers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couverts</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="canal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner">
                            {CANAL_LABELS[field.value as ReservationCanal]}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(CANAL_LABELS) as ReservationCanal[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {CANAL_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tableNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une table">
                          {field.value
                            ? (() => {
                                const t = RESTAURANT_TABLES.find(
                                  (t) => String(t.number) === field.value
                                )
                                return t ? `${t.label} (${t.seats} places)` : "Aucune"
                              })()
                            : "Aucune"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucune</SelectItem>
                      {RESTAURANT_TABLES.map((t) => (
                        <SelectItem key={t.number} value={String(t.number)}>
                          {t.label} ({t.seats} places)
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes spéciales, allergies, demandes..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer la réservation</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

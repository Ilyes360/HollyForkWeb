import { Link, useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowDown01Icon,
  Delete02Icon,
  UserIcon,
  Briefcase01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useEmployees, useEmployeeTypes } from "@/hooks/use-employees"
import { apiPost, apiPatch, apiDelete } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePageTitle } from "@/hooks/use-page-title"
import { getInitials } from "@/components/administration/utils"

// Only fields that exist in the backend API
const schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phoneNumber: z.string().optional(),
  typeEmployeId: z.string().min(1, "Type d'employé requis"),
  salary: z.string().optional(),
  hireDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

export default function EmployeDetailPage() {
  usePageTitle("Administration")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: allEmployees } = useEmployees()
  const { data: employeeTypes } = useEmployeeTypes()

  const isNew = !id
  // Find employee from API data or store
  const employee = !isNew
    ? (allEmployees as unknown as Array<Record<string, unknown>>).find(
        (e) => String(e.id) === id
      )
    : null

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: employee
      ? {
          firstName: String(employee.firstName ?? ""),
          lastName: String(employee.lastName ?? ""),
          phoneNumber: String(employee.phone ?? employee.phoneNumber ?? ""),
          typeEmployeId: String(employee.roleId ?? employee.typeEmployeId ?? ""),
          salary: String(employee.salary ?? "0.00"),
          hireDate: String(employee.hireDate ?? ""),
        }
      : {
          firstName: "",
          lastName: "",
          phoneNumber: "",
          typeEmployeId: "",
          salary: "0.00",
          hireDate: new Date().toISOString().split("T")[0],
        },
  })

  if (!isNew && !employee) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Employé introuvable.</p>
        <Button variant="outline" render={<Link to="/admin/employes" />}>
          Retour
        </Button>
      </div>
    )
  }

  function onSubmit(data: FormValues) {
    const apiData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || undefined,
      typeEmployeId: Number(data.typeEmployeId),
      salary: data.salary || "0.00",
      hireDate: data.hireDate || undefined,
    }

    const promise = isNew
      ? apiPost("employes/", apiData)
      : apiPatch(`employes/${id}/`, apiData)

    promise
      .then(() => {
        toast.success(isNew ? "Employé créé" : "Employé modifié")
        queryClient.invalidateQueries({ queryKey: ["employees"] })
        navigate("/admin/employes")
      })
      .catch(() => toast.error("Erreur lors de l'enregistrement"))
  }

  function handleDelete() {
    apiDelete(`employes/${id}/`)
      .then(() => {
        toast.success("Employé supprimé")
        queryClient.invalidateQueries({ queryKey: ["employees"] })
        navigate("/admin/employes")
      })
      .catch(() => toast.error("Erreur lors de la suppression"))
  }

  // Get type name for header
  const typeName = employee
    ? String(employee.position ?? "")
    : ""

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={fadeUp}>
        <Link
          to="/admin/employes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          Employés
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-3">
        {employee ? (
          <>
            <div
              className={`flex size-10 items-center justify-center rounded-full text-sm font-medium text-white ${(employee.avatarColor as string) ?? "bg-gray-400"}`}
            >
              {getInitials(String(employee.firstName), String(employee.lastName))}
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight">
                {String(employee.firstName)} {String(employee.lastName)}
              </h1>
              <p className="text-sm text-muted-foreground">{typeName}</p>
            </div>
          </>
        ) : (
          <h1 className="font-display text-lg font-semibold tracking-tight">Nouvel employé</h1>
        )}
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Identité */}
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Identité" icon={UserIcon} defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl><Input {...field} placeholder="+33 6 12 34 56 78" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* Poste & Contrat */}
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Poste & contrat" icon={Briefcase01Icon} defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="typeEmployeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'employé</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {field.value
                                ? (employeeTypes as Array<Record<string, unknown>>).find(
                                    (t) => String(t.id) === field.value
                                  )?.typeName as string ?? field.value
                                : "Sélectionner"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(employeeTypes as Array<Record<string, unknown>>).map((t) => (
                            <SelectItem key={String(t.id)} value={String(t.id)}>
                              {String(t.typeName ?? t.id)}
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
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salaire (€/mois)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'embauche</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* TODO: sections commentées — pas de champs correspondants dans l'API backend
          - Établissement (assignment via /api/restaurant-employes/)
          - Type de contrat (CDI/CDD/etc.)
          - Heures/semaine, taux horaire
          - Rôle & permissions
          - Email de connexion, statut compte
          */}

          {/* Footer */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={!isNew && !form.formState.isDirty} className="flex-1">
              {isNew ? "Créer" : "Enregistrer"}
            </Button>
            {!isNew && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                title="Supprimer"
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
              </Button>
            )}
          </motion.div>
        </form>
      </Form>
    </motion.div>
  )
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon?: IconSvgElement
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border bg-background">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
        <span className="flex items-center gap-2">
          {icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 text-muted-foreground" />}
          {title}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pt-4 pb-4 [&_label]:text-xs [&_label]:text-muted-foreground">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

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
  Building06Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
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
import {
  useEmployees,
  useEmployeeTypes,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  type ApiTypeEmploye,
} from "@/hooks/use-employees"
import { useEstablishments } from "@/hooks/use-establishments"
import {
  useAllRestaurantAssignments,
  useAssignEmployee,
  useUnassignEmployee,
} from "@/hooks/use-restaurant-employees"
import type { Employee } from "@/stores/admin-types"
import { toast } from "sonner"
import { handleMutationError } from "@/lib/mutation-error-handler"
import { usePageTitle } from "@/hooks/use-page-title"
import { getInitials } from "@/components/administration/utils"

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phoneNumber: z.string().optional(),
  typeEmployeId: z.string().min(1, "Type d'employé requis"),
  salary: z.string().optional(),
  hireDate: z.string().optional(),
  establishmentId: z.string().optional(),
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

  const { data: allEmployees } = useEmployees()
  const { data: employeeTypes } = useEmployeeTypes()
  const { data: establishments } = useEstablishments()
  const { data: assignments } = useAllRestaurantAssignments()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()
  const assignEmployee = useAssignEmployee()
  const unassignEmployee = useUnassignEmployee()

  const isNew = !id
  const employee: Employee | null | undefined = !isNew
    ? (allEmployees.find((e) => e.id === id) ?? null)
    : null

  // Find current assignment for this employee
  const currentAssignment = !isNew
    ? assignments.find((a) => String(a.employeId) === id)
    : undefined
  const currentEstablishmentId = currentAssignment
    ? String(currentAssignment.restaurantId)
    : ""

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: employee
      ? {
          firstName: employee.firstName ?? "",
          lastName: employee.lastName ?? "",
          phoneNumber: employee.phone ?? "",
          typeEmployeId: String(employee.typeEmployeId ?? ""),
          salary: employee.salary ? String(employee.salary) : "0.00",
          hireDate: employee.hireDate ?? "",
          establishmentId: currentEstablishmentId,
        }
      : {
          firstName: "",
          lastName: "",
          phoneNumber: "",
          typeEmployeId: "",
          salary: "0.00",
          hireDate: new Date().toISOString().split("T")[0],
          establishmentId: "",
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

  function handleAssignment(employeId: number, newEstablishmentId: string) {
    // Remove old assignment if exists
    if (
      currentAssignment &&
      String(currentAssignment.restaurantId) !== newEstablishmentId
    ) {
      unassignEmployee.mutate(currentAssignment.id)
    }
    // Create new assignment if selected
    if (newEstablishmentId) {
      assignEmployee.mutate({
        restaurantId: Number(newEstablishmentId),
        employeId,
      })
    }
  }

  function onSubmit(data: FormValues) {
    const apiData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || null,
      typeEmployeId: Number(data.typeEmployeId),
      salary: data.salary || "0.00",
      hireDate: data.hireDate || new Date().toISOString().split("T")[0],
    }

    const onSuccess = (result: { id: number } | unknown) => {
      // Handle establishment assignment
      const newEstId = data.establishmentId ?? ""
      if (isNew && result && typeof result === "object" && "id" in result) {
        // For creation, assign to establishment after employee is created
        if (newEstId) {
          assignEmployee.mutate({
            restaurantId: Number(newEstId),
            employeId: (result as { id: number }).id,
          })
        }
      } else if (!isNew) {
        // For edit, update assignment if changed
        if (newEstId !== currentEstablishmentId) {
          handleAssignment(Number(id), newEstId)
        }
      }
      toast.success(isNew ? "Employé créé" : "Employé modifié")
      navigate("/admin/employes")
    }

    const onError = (err: unknown) =>
      handleMutationError(err, { setError: form.setError })

    if (isNew) {
      createEmployee.mutate(apiData, { onSuccess, onError })
    } else {
      updateEmployee.mutate(
        { id: Number(id), data: apiData },
        { onSuccess, onError }
      )
    }
  }

  function handleDelete() {
    deleteEmployee.mutate(Number(id), {
      onSuccess: () => {
        toast.success("Employé supprimé")
        navigate("/admin/employes")
      },
      onError: () => toast.error("Erreur lors de la suppression"),
    })
  }

  const typeName = employee?.typeEmployeName ?? ""

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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            className="size-4"
          />
          Employés
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-3">
        {employee ? (
          <>
            <div
              className="flex size-10 items-center justify-center rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: employee.avatarColor || "#9ca3af" }}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{typeName}</p>
            </div>
          </>
        ) : (
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Nouvel employé
          </h1>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} placeholder="+33 6 12 34 56 78" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* Poste & Contrat */}
          <motion.div variants={fadeUp}>
            <CollapsibleSection
              title="Poste & contrat"
              icon={Briefcase01Icon}
              defaultOpen
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="typeEmployeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'employé</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {field.value
                                ? (employeeTypes.find(
                                    (t: ApiTypeEmploye) =>
                                      String(t.id) === field.value
                                  )?.typeName ?? field.value)
                                : "Sélectionner"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employeeTypes.map((t: ApiTypeEmploye) => (
                            <SelectItem key={String(t.id)} value={String(t.id)}>
                              {t.typeName ?? String(t.id)}
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
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* Établissement */}
          <motion.div variants={fadeUp}>
            <CollapsibleSection
              title="Établissement"
              icon={Building06Icon}
              defaultOpen
            >
              <FormField
                control={form.control}
                name="establishmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rattacher à un établissement</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {field.value
                              ? (establishments.find(
                                  (e) => e.id === field.value
                                )?.name ?? "Sélectionner")
                              : "Aucun"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Aucun</SelectItem>
                        {establishments.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleSection>
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2 border-t pt-4"
          >
            <Button
              type="submit"
              disabled={!isNew && !form.formState.isDirty}
              className="flex-1"
            >
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
                <HugeiconsIcon
                  icon={Delete02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
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
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-lg border bg-background"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
        <span className="flex items-center gap-2">
          {icon && (
            <HugeiconsIcon
              icon={icon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          )}
          {title}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pt-4 pb-4 [&_label]:text-xs [&_label]:text-muted-foreground">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

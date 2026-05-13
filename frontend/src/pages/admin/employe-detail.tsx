import { Link, useParams, useNavigate } from "react-router"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Delete02Icon,
  UserIcon,
  Briefcase01Icon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
import { useAdminStore } from "@/stores/admin-store"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { apiPost, apiPatch, apiDelete } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  POSITION_LABELS,
  CONTRACT_LABELS,
  ACCOUNT_STATUS_CONFIG,
} from "@/components/administration/types"
import type { PositionType, ContractType } from "@/components/administration/types"
import { getInitials } from "@/components/administration/utils"
import { usePageTitle } from "@/hooks/use-page-title"

const schema = z
  .object({
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(10, "Téléphone requis"),
    position: z.string().min(1, "Poste requis"),
    establishmentId: z.string().min(1, "Établissement requis"),
    contractType: z.string().min(1, "Type de contrat requis"),
    weeklyHours: z.coerce.number().min(1).max(48),
    hourlyRate: z.coerce.number().min(0.01),
    hireDate: z.string().min(1, "Date d'embauche requise"),
    endDate: z.string().optional(),
    roleId: z.string().min(1, "Rôle requis"),
    loginEmail: z.string().email("Email de connexion invalide"),
    accountStatus: z.enum(["active", "disabled"]),
  })
  .superRefine((data, ctx) => {
    if (["cdd", "stage", "apprenti"].includes(data.contractType) && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date de fin requise pour ce type de contrat",
        path: ["endDate"],
      })
    }
  })

type FormValues = z.infer<typeof schema>

const POSITION_DEPARTMENTS: Record<string, string> = {
  chef_de_rang: "salle",
  serveur: "salle",
  chef_cuisinier: "cuisine",
  second_de_cuisine: "cuisine",
  commis: "cuisine",
  barman: "bar",
  plongeur: "plonge",
  responsable_salle: "salle",
  gerant: "administration",
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-emerald-500",
  "bg-purple-500", "bg-rose-500", "bg-amber-500", "bg-teal-500",
  "bg-indigo-500", "bg-violet-500",
]

export default function EmployeDetailPage() {
  usePageTitle("Administration")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const employees = useAdminStore((s) => s.employees)
  const establishments = useAdminStore((s) => s.establishments)
  const roles = useAdminStore((s) => s.roles)
  const addEmployee = useAdminStore((s) => s.addEmployee)
  const updateEmployee = useAdminStore((s) => s.updateEmployee)
  const removeEmployee = useAdminStore((s) => s.removeEmployee)
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const queryClient = useQueryClient()

  const isNew = !id
  const employee = isNew ? null : employees.find((e) => e.id === id)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          position: employee.position,
          establishmentId: employee.establishmentId,
          contractType: employee.contractType,
          weeklyHours: employee.weeklyHours,
          hourlyRate: employee.hourlyRate,
          hireDate: employee.hireDate,
          endDate: employee.endDate ?? "",
          roleId: employee.roleId,
          loginEmail: employee.loginEmail,
          accountStatus: employee.accountStatus,
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          position: "",
          establishmentId: establishments[0]?.id ?? "",
          contractType: "cdi",
          weeklyHours: 35,
          hourlyRate: 11.65,
          hireDate: new Date().toISOString().split("T")[0],
          endDate: "",
          roleId: "",
          loginEmail: "",
          accountStatus: "active" as const,
        },
  })

  const contractType = useWatch({ control: form.control, name: "contractType" })
  const showEndDate = ["cdd", "stage", "apprenti"].includes(contractType ?? "")

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

  const statusConfig = employee ? ACCOUNT_STATUS_CONFIG[employee.accountStatus] : null

  function onSubmit(data: FormValues) {
    if (isDevMode) {
      // Dev mode: local store
      if (isNew) {
        const now = new Date().toISOString()
        const newId = `emp-${Date.now()}`
        addEmployee({
          id: newId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: "",
          address: "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          position: data.position as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          department: (POSITION_DEPARTMENTS[data.position] ?? "salle") as any,
          establishmentId: data.establishmentId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contractType: data.contractType as any,
          hireDate: data.hireDate,
          endDate: data.endDate || undefined,
          weeklyHours: data.weeklyHours,
          hourlyRate: data.hourlyRate,
          roleId: data.roleId,
          loginEmail: data.loginEmail,
          accountStatus: data.accountStatus,
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          createdAt: now,
          updatedAt: now,
        })
      } else {
        updateEmployee(id!, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          position: data.position as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          department: (POSITION_DEPARTMENTS[data.position] ?? "salle") as any,
          establishmentId: data.establishmentId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contractType: data.contractType as any,
          weeklyHours: data.weeklyHours,
          hourlyRate: data.hourlyRate,
          hireDate: data.hireDate,
          endDate: data.endDate || undefined,
          roleId: data.roleId,
          loginEmail: data.loginEmail,
          accountStatus: data.accountStatus,
        })
      }
      navigate("/admin/employes")
    } else {
      // User mode: API call
      const apiData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone,
        salary: String(data.hourlyRate * data.weeklyHours * 4.33),
        hireDate: data.hireDate,
        typeEmployeId: 8, // TODO: map position to type_employe_id
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
  }

  function handleToggleStatus() {
    if (isDevMode) {
      updateEmployee(id!, {
        accountStatus: employee!.accountStatus === "active" ? "disabled" : "active",
      })
    }
    // Backend doesn't have account status — local only
  }

  function handleDelete() {
    if (isDevMode) {
      removeEmployee(id!)
      navigate("/admin/employes")
    } else {
      apiDelete(`employes/${id}/`)
        .then(() => {
          toast.success("Employé supprimé")
          queryClient.invalidateQueries({ queryKey: ["employees"] })
          navigate("/admin/employes")
        })
        .catch(() => toast.error("Erreur lors de la suppression"))
    }
  }

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
              className={`flex size-10 items-center justify-center rounded-full text-sm font-medium text-white ${employee.avatarColor}`}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{POSITION_LABELS[employee.position]}</p>
            </div>
            {statusConfig && (
              <Badge variant={statusConfig.variant} className="ml-auto">
                {statusConfig.label}
              </Badge>
            )}
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
              <div className="grid grid-cols-2 gap-3 mt-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* Contrat */}
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Contrat" icon={Briefcase01Icon} defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {field.value ? POSITION_LABELS[field.value as PositionType] : "Sélectionner"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(POSITION_LABELS) as PositionType[]).map((key) => (
                            <SelectItem key={key} value={key}>{POSITION_LABELS[key]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="establishmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Établissement</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {field.value ? establishments.find((e) => e.id === field.value)?.name : "Sélectionner"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {establishments.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {CONTRACT_LABELS[field.value as ContractType] ?? "Sélectionner"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(CONTRACT_LABELS) as ContractType[]).map((key) => (
                            <SelectItem key={key} value={key}>{CONTRACT_LABELS[key]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heures/sem</FormLabel>
                      <FormControl><Input type="number" min={1} max={48} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux horaire (€/h)</FormLabel>
                      <FormControl><Input type="number" min={0.01} step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              {showEndDate && (
                <div className="mt-3">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CollapsibleSection>
          </motion.div>

          {/* Accès */}
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Accès" icon={SecurityLockIcon} defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {field.value ? roles.find((r) => r.id === field.value)?.label : "Sélectionner"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loginEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de connexion</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="accountStatus"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="!text-sm !text-foreground">Compte actif</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          L'employé pourra se connecter à l'application.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === "active"}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? "active" : "disabled")
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={!isNew && !form.formState.isDirty} className="flex-1">
              {isNew ? "Créer" : "Enregistrer"}
            </Button>
            {!isNew && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleToggleStatus}
                  title={employee?.accountStatus === "active" ? "Désactiver" : "Activer"}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  title="Supprimer"
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                </Button>
              </>
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

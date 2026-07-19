import { useState } from "react"
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
  Mail01Icon,
  Tick02Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  useInviteUser,
  type ApiTypeEmploye,
} from "@/hooks/use-employees"
import { useEstablishments } from "@/hooks/use-establishments"
import {
  useAllRestaurantAssignments,
  useAssignEmployee,
  useUnassignEmployee,
} from "@/hooks/use-restaurant-employees"
import { usePermissions } from "@/hooks/use-permissions"
import type { Employee } from "@/stores/admin-types"
import { toast } from "sonner"
import { handleMutationError } from "@/lib/mutation-error-handler"
import { usePageTitle } from "@/hooks/use-page-title"
import { getInitials } from "@/components/administration/utils"

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let pw = ""
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

const schema = z
  .object({
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    phoneNumber: z.string().optional(),
    typeEmployeId: z.string().min(1, "Type d'employé requis"),
    salary: z.string().optional(),
    hireDate: z.string().optional(),
    establishmentId: z.string().optional(),
    createAccount: z.boolean(),
    email: z.string().optional(),
  })
  .refine((d) => !d.createAccount || (d.email && d.email.includes("@")), {
    message: "Email requis pour créer un accès",
    path: ["email"],
  })
  .refine((d) => !d.createAccount || d.establishmentId, {
    message: "Établissement requis pour créer un accès",
    path: ["establishmentId"],
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
  const inviteUser = useInviteUser()
  const assignEmployee = useAssignEmployee()
  const unassignEmployee = useUnassignEmployee()
  const { can } = usePermissions()
  const canManageStaff = can("manage_staff")

  // Stores the generated credentials after successful invitation
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  )
  const [generatedPin, setGeneratedPin] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
          createAccount: false,
          email: "",
        }
      : {
          firstName: "",
          lastName: "",
          phoneNumber: "",
          typeEmployeId: "",
          salary: "0.00",
          hireDate: new Date().toISOString().split("T")[0],
          establishmentId: "",
          createAccount: true,
          email: "",
        },
  })

  const createAccount = form.watch("createAccount")

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
    if (
      currentAssignment &&
      String(currentAssignment.restaurantId) !== newEstablishmentId
    ) {
      unassignEmployee.mutate(currentAssignment.id)
    }
    if (newEstablishmentId) {
      assignEmployee.mutate({
        restaurantId: Number(newEstablishmentId),
        employeId,
      })
    }
  }

  function onSubmit(data: FormValues) {
    const onError = (err: unknown) =>
      handleMutationError(err, { setError: form.setError })

    // New employee WITH account → use invite endpoint
    if (isNew && data.createAccount && data.email && data.establishmentId) {
      const password = generatePassword()
      inviteUser.mutate(
        {
          email: data.email,
          password,
          firstName: data.firstName,
          lastName: data.lastName,
          typeEmployeId: Number(data.typeEmployeId),
          restaurantId: Number(data.establishmentId),
          salary: data.salary || "0.00",
          hireDate: data.hireDate || new Date().toISOString().split("T")[0],
          phoneNumber: data.phoneNumber || undefined,
        },
        {
          onSuccess: (result) => {
            setGeneratedPassword(password)
            setGeneratedPin(result.pinCode)
            toast.success("Compte créé avec succès")
          },
          onError,
        }
      )
      return
    }

    // Employee without account (or edit mode)
    const apiData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || null,
      typeEmployeId: Number(data.typeEmployeId),
      salary: data.salary || "0.00",
      hireDate: data.hireDate || new Date().toISOString().split("T")[0],
    }

    const onSuccess = (result: { id: number } | unknown) => {
      const newEstId = data.establishmentId ?? ""
      if (isNew && result && typeof result === "object" && "id" in result) {
        if (newEstId) {
          assignEmployee.mutate({
            restaurantId: Number(newEstId),
            employeId: (result as { id: number }).id,
          })
        }
      } else if (!isNew) {
        if (newEstId !== currentEstablishmentId) {
          handleAssignment(Number(id), newEstId)
        }
      }
      toast.success(isNew ? "Employé créé" : "Employé modifié")
      navigate("/admin/employes")
    }

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

  function handleCopyCredentials() {
    const email = form.getValues("email")
    let text = `Email : ${email}\nMot de passe : ${generatedPassword}`
    if (generatedPin) {
      text += `\nPIN caisse : ${generatedPin}`
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const typeName = employee?.typeEmployeName ?? ""
  const isPending = inviteUser.isPending || createEmployee.isPending

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

      {/* Success state — show credentials after invitation */}
      {generatedPassword ? (
        <motion.div
          variants={fadeUp}
          className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon
              icon={Tick02Icon}
              strokeWidth={2}
              className="size-5"
            />
            <h3 className="font-medium">Compte créé avec succès</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Transmettez ces identifiants à l'employé. Le mot de passe ne sera
            plus affiché après avoir quitté cette page.
          </p>
          <div className="space-y-2 rounded-md bg-background p-4 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">Email : </span>
              <span className="font-medium">{form.getValues("email")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mot de passe : </span>
              <span className="font-medium">{generatedPassword}</span>
            </div>
            {generatedPin && (
              <div>
                <span className="text-muted-foreground">PIN caisse : </span>
                <span className="font-medium">{generatedPin}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCredentials}>
              <HugeiconsIcon
                icon={copied ? Tick02Icon : Copy01Icon}
                strokeWidth={2}
                className="size-4"
              />
              {copied ? "Copié" : "Copier"}
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/employes")}>
              Retour aux employés
            </Button>
          </div>
        </motion.div>
      ) : (
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

            {/* Accès Dashboard — only for new employees */}
            {isNew && (
              <motion.div variants={fadeUp}>
                <CollapsibleSection
                  title="Accès dashboard"
                  icon={Mail01Icon}
                  defaultOpen
                >
                  <FormField
                    control={form.control}
                    name="createAccount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <div>
                            <FormLabel className="text-sm! font-medium! text-foreground!">
                              Créer un accès dashboard
                            </FormLabel>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              L'employé pourra se connecter avec un email et un
                              mot de passe.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  {createAccount && (
                    <div className="mt-3">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de connexion</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="prenom.nom@restaurant.fr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Un mot de passe temporaire sera généré automatiquement.
                      </p>
                    </div>
                  )}
                </CollapsibleSection>
              </motion.div>
            )}

            {/* Existing account indicator — for edit mode */}
            {!isNew && employee && (
              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground"
                  />
                  <span className="text-sm text-muted-foreground">
                    Accès dashboard
                  </span>
                  <Badge
                    variant={employee.hasAccount ? "default" : "secondary"}
                    className="ml-auto"
                  >
                    {employee.hasAccount ? "Compte actif" : "Pas de compte"}
                  </Badge>
                </div>
              </motion.div>
            )}

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
                              <SelectItem
                                key={String(t.id)}
                                value={String(t.id)}
                              >
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
                      <FormLabel>
                        Rattacher à un établissement
                        {createAccount && (
                          <span className="text-destructive"> *</span>
                        )}
                      </FormLabel>
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
                          {!createAccount && (
                            <SelectItem value="">Aucun</SelectItem>
                          )}
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
                disabled={
                  isPending ||
                  !canManageStaff ||
                  (!isNew && !form.formState.isDirty)
                }
                className="flex-1"
              >
                {isPending
                  ? "Envoi..."
                  : isNew
                    ? createAccount
                      ? "Créer le compte"
                      : "Créer"
                    : "Enregistrer"}
              </Button>
              {!isNew && canManageStaff && (
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
      )}
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

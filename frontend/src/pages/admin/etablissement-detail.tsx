import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowDown01Icon,
  Delete02Icon,
  Building06Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
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
  FrenchAddressInput,
  type FrenchAddressResult,
} from "@/components/ui/french-address-input"
import { cn } from "@/lib/utils"
import {
  useEstablishment,
  useUpdateEstablishment,
  useDeleteEstablishment,
} from "@/hooks/use-establishments"
import { toast } from "sonner"
import { handleMutationError } from "@/lib/mutation-error-handler"
import { DeleteEtablissementDialog } from "@/components/administration/etablissements/delete-etablissement-dialog"
import { usePageTitle } from "@/hooks/use-page-title"
import type { Establishment } from "@/stores/admin-types"

// Backend accepts: name, address, postal_code, city, phone_number, siret, naf_code, pin, logo_url
const schema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  phoneNumber: z.string().optional(),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres")
    .or(z.literal("")),
  pin: z.string().max(6).optional(),
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

function extractFromEstablishment(
  est: Establishment,
  pin?: string
): FormValues {
  return {
    name: est.name ?? "",
    address: est.address?.fullAddress?.split(",")[0]?.trim() ?? "",
    postalCode: est.address?.postalCode ?? "",
    city: est.address?.city ?? "",
    phoneNumber: est.phone ?? "",
    siret: est.siret ?? "",
    pin: pin ?? "",
  }
}

export default function EtablissementDetailPage() {
  usePageTitle("Administration")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    data: establishment,
    raw: rawRestaurant,
    isLoading,
  } = useEstablishment(id ? Number(id) : null)
  const { mutate: updateEstablishment, isPending: isUpdating } =
    useUpdateEstablishment()
  const { mutate: deleteEstablishment } = useDeleteEstablishment()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      postalCode: "",
      city: "",
      phoneNumber: "",
      siret: "",
      pin: "",
    },
  })

  // Populate form when establishment data loads
  useEffect(() => {
    if (establishment) {
      form.reset(extractFromEstablishment(establishment, rawRestaurant?.pin))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishment, rawRestaurant])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Chargement…
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Établissement introuvable.</p>
        <Button variant="outline" render={<Link to="/admin" />}>
          Retour
        </Button>
      </div>
    )
  }

  function onSubmit(data: FormValues) {
    // PATCH /api/restaurants/{id}/ — only send changed fields
    updateEstablishment(
      { id: id!, data },
      {
        onSuccess: () => {
          toast.success("Établissement modifié")
          form.reset(data)
        },
        onError: (err) => handleMutationError(err, { setError: form.setError }),
      }
    )
  }

  function handleDelete() {
    deleteEstablishment(id!, {
      onSuccess: () => {
        toast.success("Établissement supprimé")
        navigate("/admin")
      },
      onError: () => {
        toast.error("Erreur lors de la suppression")
      },
    })
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
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            className="size-4"
          />
          Établissements
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {establishment.name}
        </h1>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={fadeUp}>
            <CollapsibleSection
              title="Informations générales"
              icon={Building06Icon}
              defaultOpen
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <FrenchAddressInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onSelect={(result: FrenchAddressResult) => {
                            form.setValue("postalCode", result.postalCode, {
                              shouldDirty: true,
                            })
                            form.setValue("city", result.city, {
                              shouldDirty: true,
                            })
                          }}
                          placeholder="12 rue des Rosiers"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="75004" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Paris" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+33 1 42 72 00 00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="siret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIRET</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={14}
                          placeholder="12345678901234"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code PIN</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={6} placeholder="000000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2 border-t pt-4"
          >
            <Button
              type="submit"
              disabled={!form.formState.isDirty || isUpdating}
              className="flex-1"
            >
              {isUpdating ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              title="Supprimer"
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </motion.div>
        </form>
      </Form>

      <DeleteEtablissementDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        establishmentName={establishment.name}
        onConfirm={handleDelete}
      />
    </motion.div>
  )
}

function CollapsibleSection({
  title,
  icon,
  children,
}: {
  title: string
  icon?: IconSvgElement
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
      >
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
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t px-4 pt-4 pb-4 [&_label]:text-xs [&_label]:text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  )
}

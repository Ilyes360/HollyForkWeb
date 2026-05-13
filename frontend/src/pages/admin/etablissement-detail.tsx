import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Delete02Icon,
  Building06Icon,
  Settings01Icon,
  PackageIcon,
  LicenseIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAdminStore } from "@/stores/admin-store"
import { useEstablishments } from "@/hooks/use-establishments"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { apiPatch, apiDelete } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { EtablissementGeneralSection } from "@/components/administration/etablissements/etablissement-general-section"
import { EtablissementOperationsSection } from "@/components/administration/etablissements/etablissement-operations-section"
import { EtablissementZonesSection } from "@/components/administration/etablissements/etablissement-zones-section"
import { EtablissementLegalSection } from "@/components/administration/etablissements/etablissement-legal-section"
import { DeleteEtablissementDialog } from "@/components/administration/etablissements/delete-etablissement-dialog"
import { usePageTitle } from "@/hooks/use-page-title"

// Only fields that exist in the backend API
const schema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  siret: z.string().regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres").or(z.literal("")),
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

export default function EtablissementDetailPage() {
  usePageTitle("Administration")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const queryClient = useQueryClient()
  const { data: apiEstablishments } = useEstablishments()
  const storeEstablishments = useAdminStore((s) => s.establishments)
  const updateEstablishmentStore = useAdminStore((s) => s.updateEstablishment)
  const removeEstablishmentStore = useAdminStore((s) => s.removeEstablishment)

  // Find establishment: try API data first (id as number), then store (id as string)
  const establishment = (apiEstablishments as Array<Record<string, unknown>>).find(
    (e) => String(e.id ?? e.restaurantId) === id
  ) as Record<string, unknown> | undefined
    ?? storeEstablishments.find((e) => e.id === id)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: establishment
      ? {
          name: String((establishment as Record<string, unknown>).name ?? ""),
          address: String((establishment as Record<string, unknown>).address ?? ""),
          postalCode: String((establishment as Record<string, unknown>).postalCode ?? ""),
          city: String((establishment as Record<string, unknown>).city ?? ""),
          phone: String((establishment as Record<string, unknown>).phone ?? (establishment as Record<string, unknown>).phoneNumber ?? ""),
          siret: String((establishment as Record<string, unknown>).siret ?? ""),
          pin: String((establishment as Record<string, unknown>).pin ?? ""),
        }
      : {
          name: "",
          address: "",
          postalCode: "",
          city: "",
          phone: "",
          siret: "",
          pin: "",
        },
  })

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
    if (isDevMode) {
      updateEstablishmentStore(id!, { name: data.name, phone: data.phone, siret: data.siret })
      navigate("/admin")
    } else {
      apiPatch(`restaurants/${id}/`, {
        name: data.name,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        phoneNumber: data.phone,
        siret: data.siret,
        pin: data.pin,
      })
        .then(() => {
          toast.success("Établissement modifié")
          queryClient.invalidateQueries({ queryKey: ["establishments"] })
          queryClient.invalidateQueries({ queryKey: ["restaurants"] })
          navigate("/admin")
        })
        .catch(() => toast.error("Erreur lors de la modification"))
    }
  }

  function handleToggleActive() {
    if (isDevMode) {
      updateEstablishmentStore(id!, { isActive: !(establishment as Record<string, unknown>).isActive })
    }
  }

  function handleDelete() {
    if (isDevMode) {
      removeEstablishmentStore(id!)
      navigate("/admin")
    } else {
      apiDelete(`restaurants/${id}/`)
        .then(() => {
          toast.success("Établissement supprimé")
          queryClient.invalidateQueries({ queryKey: ["establishments"] })
          navigate("/admin")
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
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          Établissements
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <h1 className="font-display text-lg font-semibold tracking-tight">{establishment.name}</h1>
        {/* Badge actif/inactif masqué — pas de champ isActive dans l'API */}
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Informations générales" icon={Building06Icon} defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nom</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
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
                      <FormControl><Input {...field} placeholder="12 rue des Rosiers" /></FormControl>
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
                      <FormControl><Input {...field} placeholder="75004" /></FormControl>
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
                      <FormControl><Input {...field} placeholder="Paris" /></FormControl>
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
                      <FormControl><Input {...field} placeholder="+33 1 42 72 00 00" /></FormControl>
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
                      <FormControl><Input {...field} maxLength={14} placeholder="12345678901234" /></FormControl>
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
                      <FormControl><Input {...field} maxLength={6} placeholder="000000" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleSection>
          </motion.div>

          {/* TODO: sections masquées — pas de champs correspondants dans l'API backend
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Configuration opérationnelle" icon={Settings01Icon} defaultOpen>
              <EtablissementOperationsSection form={form} />
            </CollapsibleSection>
          </motion.div>

          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Zones de stockage" icon={PackageIcon} defaultOpen>
              <EtablissementZonesSection form={form} />
            </CollapsibleSection>
          </motion.div>

          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Informations légales" icon={LicenseIcon} defaultOpen>
              <EtablissementLegalSection form={form} />
            </CollapsibleSection>
          </motion.div>
          */}

          <motion.div variants={fadeUp} className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={!form.formState.isDirty} className="flex-1">
              Enregistrer
            </Button>
            {/* TODO: toggle actif/inactif — pas de champ isActive dans l'API backend */}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              title="Supprimer"
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
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

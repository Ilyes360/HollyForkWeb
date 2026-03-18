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
import { EtablissementGeneralSection } from "@/components/administration/etablissements/etablissement-general-section"
import { EtablissementOperationsSection } from "@/components/administration/etablissements/etablissement-operations-section"
import { EtablissementZonesSection } from "@/components/administration/etablissements/etablissement-zones-section"
import { EtablissementLegalSection } from "@/components/administration/etablissements/etablissement-legal-section"
import { DeleteEtablissementDialog } from "@/components/administration/etablissements/delete-etablissement-dialog"
import { usePageTitle } from "@/hooks/use-page-title"

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  location: z
    .object({
      fullAddress: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string(),
      longitude: z.number(),
      latitude: z.number(),
      mapboxId: z.string(),
    })
    .nullable(),
  phone: z.string(),
  email: z.string().email("Email invalide").or(z.literal("")),
  siret: z.string().regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres").or(z.literal("")),
  tvaNumber: z.string(),
  legalForm: z.string(),
  capacity: z.coerce.number().min(1, "Minimum 1 couvert"),
  services: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Nom requis"),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
      })
    )
    .min(1, "Au moins un service requis"),
  openingDays: z.array(z.string()).min(1, "Au moins un jour requis"),
  storageZones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      type: z.string(),
      targetTemperature: z.coerce.number().optional(),
    })
  ),
  licenseType: z.string(),
  licenseNumber: z.string(),
  insurance: z.string(),
  erpCapacity: z.coerce.number().min(0),
  legalNotes: z.string(),
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
  const establishments = useAdminStore((s) => s.establishments)
  const updateEstablishment = useAdminStore((s) => s.updateEstablishment)
  const removeEstablishment = useAdminStore((s) => s.removeEstablishment)

  const establishment = establishments.find((e) => e.id === id)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: establishment
      ? {
          name: establishment.name,
          location: establishment.address,
          phone: establishment.phone,
          email: establishment.email,
          siret: establishment.siret,
          tvaNumber: establishment.tvaNumber,
          legalForm: establishment.legalForm,
          capacity: establishment.totalCapacity,
          services: establishment.services,
          openingDays: establishment.openingDays,
          storageZones: establishment.storageZones,
          licenseType: establishment.legalInfo.licenseType,
          licenseNumber: establishment.legalInfo.licenseNumber,
          insurance: establishment.legalInfo.insurance,
          erpCapacity: establishment.legalInfo.erpCapacity,
          legalNotes: establishment.legalInfo.notes,
        }
      : undefined,
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
    updateEstablishment(id!, {
      name: data.name,
      address: data.location,
      phone: data.phone,
      email: data.email,
      siret: data.siret,
      tvaNumber: data.tvaNumber,
      legalForm: data.legalForm,
      totalCapacity: data.capacity,
      services: data.services,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      openingDays: data.openingDays as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storageZones: data.storageZones as any,
      legalInfo: {
        licenseType: data.licenseType,
        licenseNumber: data.licenseNumber,
        insurance: data.insurance,
        erpCapacity: data.erpCapacity,
        notes: data.legalNotes,
      },
    })
    navigate("/admin")
  }

  function handleToggleActive() {
    updateEstablishment(id!, { isActive: !establishment!.isActive })
  }

  function handleDelete() {
    removeEstablishment(id!)
    navigate("/admin")
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
        <Badge variant={establishment.isActive ? "success" : "outline"}>
          {establishment.isActive ? "Actif" : "Inactif"}
        </Badge>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={fadeUp}>
            <CollapsibleSection title="Informations générales" icon={Building06Icon} defaultOpen>
              <EtablissementGeneralSection form={form} />
            </CollapsibleSection>
          </motion.div>

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

          <motion.div variants={fadeUp} className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={!form.formState.isDirty} className="flex-1">
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleToggleActive}
              title={establishment.isActive ? "Désactiver" : "Activer"}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            </Button>
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

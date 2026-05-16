import type { Meta, StoryObj } from "@storybook/react"

import { DetailModalLayout } from "./detail-modal-layout"

const meta = {
  title: "Shared/DetailModalLayout",
  component: DetailModalLayout,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full rounded-xl border bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetailModalLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Fiche produit",
    subtitle: "Tomates cerises bio",
    onClose: () => alert("Close"),
    left: (
      <div className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Panneau gauche</p>
          <p className="text-xs text-muted-foreground">
            Informations principales
          </p>
        </div>
      </div>
    ),
    right: (
      <div className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Panneau droit</p>
          <p className="text-xs text-muted-foreground">
            Détails complémentaires
          </p>
        </div>
      </div>
    ),
    footer: (
      <>
        <button className="rounded bg-secondary px-3 py-1.5 text-sm">
          Annuler
        </button>
        <button className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">
          Enregistrer
        </button>
      </>
    ),
  },
}

export const WithoutFooter: Story = {
  args: {
    title: "Détail commande",
    onClose: () => {},
    left: <div className="rounded-lg bg-muted p-4 text-sm">Panneau gauche</div>,
    right: <div className="rounded-lg bg-muted p-4 text-sm">Panneau droit</div>,
  },
}

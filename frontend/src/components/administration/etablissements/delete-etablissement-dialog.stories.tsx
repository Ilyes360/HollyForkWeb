import type { Meta, StoryObj } from "@storybook/react"

import { DeleteEtablissementDialog } from "./delete-etablissement-dialog"

const meta = {
  title: "Feature/Administration/DeleteEtablissementDialog",
  component: DeleteEtablissementDialog,
  tags: ["autodocs"],
} satisfies Meta<typeof DeleteEtablissementDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    establishmentName: "Le Petit Bistrot",
    onConfirm: () => alert("Supprimé!"),
  },
}

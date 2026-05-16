import type { Meta, StoryObj } from "@storybook/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"

import { EmptyState } from "./empty-state"

const meta = {
  title: "Shared/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Aucun résultat",
    description: "Aucun élément ne correspond à vos critères.",
  },
}

export const WithAction: Story = {
  args: {
    title: "Aucun fournisseur",
    description:
      "Commencez par ajouter un fournisseur pour gérer vos commandes.",
    actionLabel: "Ajouter un fournisseur",
    onAction: () => alert("Action clicked"),
  },
}

export const WithIcon: Story = {
  args: {
    title: "Stock vide",
    description: "Aucun produit en stock pour le moment.",
    icon: AlertCircleIcon,
    actionLabel: "Ajouter un produit",
    onAction: () => alert("Action clicked"),
  },
}

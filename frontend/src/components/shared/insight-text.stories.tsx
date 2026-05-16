import type { Meta, StoryObj } from "@storybook/react"

import { InsightText } from "./insight-text"

const meta = {
  title: "Shared/InsightText",
  component: InsightText,
  tags: ["autodocs"],
} satisfies Meta<typeof InsightText>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    insight: {
      text: "Stock optimal, aucune action requise.",
      variant: "success",
    },
  },
}

export const Warning: Story = {
  args: {
    insight: { text: "Stock faible, pensez à commander.", variant: "warning" },
  },
}

export const Danger: Story = {
  args: {
    insight: { text: "Rupture imminente sur 3 produits.", variant: "danger" },
  },
}

export const Info: Story = {
  args: {
    insight: { text: "Dernière commande il y a 5 jours.", variant: "info" },
  },
}

export const Neutral: Story = {
  args: { insight: { text: "Aucune donnée disponible.", variant: "neutral" } },
}

export const Null: Story = {
  args: { insight: null },
}

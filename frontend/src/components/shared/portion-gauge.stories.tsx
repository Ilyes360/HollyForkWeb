import type { Meta, StoryObj } from "@storybook/react"

import { PortionGauge } from "./portion-gauge"

const meta = {
  title: "Shared/PortionGauge",
  component: PortionGauge,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PortionGauge>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {
  args: { maxPortions: 50, threshold: 50 },
}

export const Half: Story = {
  args: { maxPortions: 25, threshold: 50 },
}

export const Low: Story = {
  args: { maxPortions: 3, threshold: 10 },
}

export const Empty: Story = {
  args: { maxPortions: 0, threshold: 20 },
}

export const WithLimitingIngredient: Story = {
  args: {
    maxPortions: 8,
    threshold: 20,
    limitingIngredient: {
      productId: "1",
      productName: "Tomates",
      portionsAllowed: 8,
      isLimiting: true,
    },
  },
}

export const HiddenValue: Story = {
  args: { maxPortions: 15, threshold: 30, showValue: false },
}

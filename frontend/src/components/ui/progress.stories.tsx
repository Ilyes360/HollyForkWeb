import type { Meta, StoryObj } from "@storybook/react"

import { Progress } from "./progress"

const meta = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Zero: Story = {
  args: { value: 0 },
}

export const Half: Story = {
  args: { value: 50 },
}

export const Full: Story = {
  args: { value: 100 },
}

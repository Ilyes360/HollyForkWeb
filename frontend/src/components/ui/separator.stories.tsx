import type { Meta, StoryObj } from "@storybook/react"

import { Separator } from "./separator"

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  decorators: [
    (Story) => (
      <div className="w-64">
        <p>Above</p>
        <Story />
        <p>Below</p>
      </div>
    ),
  ],
}

export const Vertical: Story = {
  args: { orientation: "vertical" },
  decorators: [
    (Story) => (
      <div className="flex h-8 items-center gap-2">
        <span>Left</span>
        <Story />
        <span>Right</span>
      </div>
    ),
  ],
}

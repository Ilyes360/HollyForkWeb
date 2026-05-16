import type { Meta, StoryObj } from "@storybook/react"

import { ScrollArea, ScrollBar } from "./scroll-area"

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-md border p-4">
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} className="py-1 text-sm">
          Item {i + 1}
        </p>
      ))}
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-64 rounded-md border">
      <div className="flex gap-4 p-4" style={{ width: "800px" }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="flex size-24 shrink-0 items-center justify-center rounded-md bg-muted"
          >
            {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}

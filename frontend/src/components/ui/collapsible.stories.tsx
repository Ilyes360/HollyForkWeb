import type { Meta, StoryObj } from "@storybook/react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"
import { Button } from "./button"

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-64 space-y-2">
      <CollapsibleTrigger
        render={<Button variant="outline" className="w-full" />}
      >
        Toggle Content
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-md border p-4 text-sm">
          This content is visible by default.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const DefaultClosed: Story = {
  render: () => (
    <Collapsible className="w-64 space-y-2">
      <CollapsibleTrigger
        render={<Button variant="outline" className="w-full" />}
      >
        Toggle Content
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-md border p-4 text-sm">
          This content is hidden by default.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}

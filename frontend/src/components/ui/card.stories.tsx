import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          A short description of this card content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content area of the card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Card With Action</CardTitle>
        <CardDescription>
          This card has an action button in the header.
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Content goes here.</p>
      </CardContent>
    </Card>
  ),
}

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>Compact variant with less padding.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Smaller gaps and padding.</p>
      </CardContent>
    </Card>
  ),
}

export const ContentOnly: Story = {
  render: (args) => (
    <Card {...args}>
      <CardContent>
        <p>A card with only content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
}

import type { Meta, StoryObj } from "@storybook/react"

import { Badge } from "./badge"

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: "Default" },
}

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
}

export const Destructive: Story = {
  args: { variant: "destructive", children: "Destructive" },
}

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
}

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
}

export const LinkVariant: Story = {
  args: { variant: "link", children: "Link" },
}

export const Success: Story = {
  args: { variant: "success", children: "Success" },
}

export const Warning: Story = {
  args: { variant: "warning", children: "Warning" },
}

export const Info: Story = {
  args: { variant: "info", children: "Info" },
}

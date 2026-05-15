import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Variants

export const Default: Story = {
  args: { children: "Button" },
}

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
}

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
}

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
}

export const Destructive: Story = {
  args: { variant: "destructive", children: "Destructive" },
}

export const Link: Story = {
  args: { variant: "link", children: "Link" },
}

// Sizes

export const SizeXs: Story = {
  args: { size: "xs", children: "Extra Small" },
}

export const SizeSm: Story = {
  args: { size: "sm", children: "Small" },
}

export const SizeDefault: Story = {
  args: { size: "default", children: "Default" },
}

export const SizeLg: Story = {
  args: { size: "lg", children: "Large" },
}

export const SizeIcon: Story = {
  args: { size: "icon", children: "+" },
}

// States

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
}

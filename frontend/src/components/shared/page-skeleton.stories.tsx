import type { Meta, StoryObj } from "@storybook/react"

import { PageSkeleton } from "./page-skeleton"

const meta = {
  title: "Shared/PageSkeleton",
  component: PageSkeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof PageSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

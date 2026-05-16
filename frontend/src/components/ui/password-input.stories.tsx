import type { Meta, StoryObj } from "@storybook/react"

import { PasswordInput } from "./password-input"

const meta = {
  title: "UI/PasswordInput",
  component: PasswordInput,
  tags: ["autodocs"],
} satisfies Meta<typeof PasswordInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: "Enter password" },
}

export const WithValue: Story = {
  args: { defaultValue: "mysecretpassword" },
}

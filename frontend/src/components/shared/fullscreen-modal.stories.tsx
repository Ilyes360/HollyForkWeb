import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"

import { FullscreenModal } from "./fullscreen-modal"

const meta = {
  title: "Shared/FullscreenModal",
  component: FullscreenModal,
  tags: ["autodocs"],
} satisfies Meta<typeof FullscreenModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-lg font-medium">Contenu de la modale plein écran</p>
      </div>
    ),
  },
}

export const Interactive: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    children: null,
  },
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button
          className="rounded bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          Ouvrir la modale
        </button>
        <FullscreenModal open={open} onOpenChange={setOpen}>
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <p className="text-lg font-medium">Modale plein écran</p>
            <button
              className="rounded bg-secondary px-4 py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
        </FullscreenModal>
      </>
    )
  },
}

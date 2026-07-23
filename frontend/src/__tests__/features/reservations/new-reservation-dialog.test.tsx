import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { axe } from "vitest-axe"
import { NewReservationDialog } from "@/components/reservations/new-reservation-dialog"
import type { RestaurantTable } from "@/components/reservations/types"

const tables: RestaurantTable[] = [
  { id: 1, number: 1, label: "T1", seats: 4 },
  { id: 2, number: 2, label: "T2", seats: 2 },
  { id: 3, number: 3, label: "T3", seats: 6 },
]

function renderDialog(
  props: Partial<React.ComponentProps<typeof NewReservationDialog>> = {}
) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    defaultDate: "2026-07-23",
    tables,
  }
  return {
    ...render(<NewReservationDialog {...defaultProps} {...props} />),
    ...defaultProps,
  }
}

// ── Rendering ──

describe("NewReservationDialog", () => {
  it("renders form fields when open", () => {
    renderDialog()

    expect(screen.getByText("Nouvelle réservation")).toBeInTheDocument()
    expect(screen.getByLabelText("Nom")).toBeInTheDocument()
    expect(screen.getByLabelText("Téléphone")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Date")).toBeInTheDocument()
    expect(screen.getByLabelText("Heure")).toBeInTheDocument()
    expect(screen.getByLabelText("Couverts")).toBeInTheDocument()
    expect(screen.getByLabelText("Notes")).toBeInTheDocument()
  })

  it("does not render content when closed", () => {
    renderDialog({ open: false })

    expect(screen.queryByText("Nouvelle réservation")).not.toBeInTheDocument()
  })

  // ── Validation ──

  it("shows validation error for short client name", async () => {
    const user = userEvent.setup()
    renderDialog()

    const nameInput = screen.getByLabelText("Nom")
    await user.type(nameInput, "A")

    await user.click(
      screen.getByRole("button", { name: "Créer la réservation" })
    )

    await waitFor(() => {
      expect(screen.getByText("Le nom est requis")).toBeInTheDocument()
    })
  })

  it("shows validation error for invalid phone", async () => {
    const user = userEvent.setup()
    renderDialog()

    const nameInput = screen.getByLabelText("Nom")
    await user.type(nameInput, "Jean Dupont")

    const phoneInput = screen.getByLabelText("Téléphone")
    await user.type(phoneInput, "06")

    await user.click(
      screen.getByRole("button", { name: "Créer la réservation" })
    )

    await waitFor(() => {
      expect(screen.getByText("Numéro invalide")).toBeInTheDocument()
    })
  })

  it("does not submit with invalid email", async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderDialog()

    await user.type(screen.getByLabelText("Nom"), "Jean Dupont")
    await user.type(screen.getByLabelText("Téléphone"), "06 12 34 56 78")
    await user.type(screen.getByLabelText("Email"), "not-an-email")

    await user.click(
      screen.getByRole("button", { name: "Créer la réservation" })
    )

    // Wait a tick for async validation
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  // ── Submission ──

  it("calls onSubmit with form data when valid", async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderDialog()

    await user.type(screen.getByLabelText("Nom"), "Jean Dupont")
    await user.type(screen.getByLabelText("Téléphone"), "06 12 34 56 78")

    await user.click(
      screen.getByRole("button", { name: "Créer la réservation" })
    )

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: "Jean Dupont",
        clientPhone: "06 12 34 56 78",
        date: "2026-07-23",
      })
    )
  })

  it("resets form and closes dialog after successful submit", async () => {
    const user = userEvent.setup()
    const { onSubmit, onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText("Nom"), "Jean Dupont")
    await user.type(screen.getByLabelText("Téléphone"), "06 12 34 56 78")

    await user.click(
      screen.getByRole("button", { name: "Créer la réservation" })
    )

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ── Cancel ──

  it("calls onOpenChange(false) on cancel", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole("button", { name: "Annuler" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  // ── Default values ──

  it("uses defaultDate for the date field", () => {
    renderDialog({ defaultDate: "2026-12-25" })

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement
    expect(dateInput.value).toBe("2026-12-25")
  })

  it("defaults covers to 2", () => {
    renderDialog()

    const coversInput = screen.getByLabelText("Couverts") as HTMLInputElement
    expect(coversInput.value).toBe("2")
  })

  // ── a11y ──

  it("has no axe violations", async () => {
    const { container } = renderDialog()

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { axe } from "vitest-axe"
import { ReservationDetail } from "@/components/reservations/reservation-detail"
import type {
  Reservation,
  RestaurantTable,
} from "@/components/reservations/types"

const tables: RestaurantTable[] = [
  { id: 1, number: 1, label: "T1", seats: 4 },
  { id: 2, number: 2, label: "T2", seats: 2 },
  { id: 3, number: 3, label: "T3", seats: 6 },
]

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "r1",
    clientName: "Martin Dupont",
    clientPhone: "06 12 34 56 78",
    clientEmail: "martin@email.fr",
    date: "2026-07-23",
    time: "12:00",
    service: "midi",
    covers: 2,
    tableId: 1,
    tableNumber: 1,
    canal: "telephone",
    status: "en_attente",
    notes: "Anniversaire",
    allergies: [],
    dietTypes: [],
    createdAt: "2026-07-23T10:00:00Z",
    ...overrides,
  }
}

function renderDetail(
  props: Partial<React.ComponentProps<typeof ReservationDetail>> = {}
) {
  const defaultProps = {
    reservation: makeReservation(),
    open: true,
    onOpenChange: vi.fn(),
    onStatusChange: vi.fn(),
    onNotesChange: vi.fn(),
    onDelete: vi.fn(),
    isDeleting: false,
    tables,
  }
  return {
    ...render(<ReservationDetail {...defaultProps} {...props} />),
    ...defaultProps,
  }
}

// ── Rendering ──

describe("ReservationDetail", () => {
  it("renders nothing when reservation is null", () => {
    const { container } = render(
      <ReservationDetail
        reservation={null}
        open={true}
        onOpenChange={vi.fn()}
        onStatusChange={vi.fn()}
        onNotesChange={vi.fn()}
        onDelete={vi.fn()}
        tables={tables}
      />
    )
    // Sheet renders nothing because reservation is null (early return)
    expect(container.querySelector("[data-slot='sheet']")).toBeNull()
  })

  it("displays client name as title", () => {
    renderDetail()
    expect(screen.getByText("Martin Dupont")).toBeInTheDocument()
  })

  it("displays reservation info fields", () => {
    renderDetail()

    expect(screen.getByText("06 12 34 56 78")).toBeInTheDocument()
    expect(screen.getByText("martin@email.fr")).toBeInTheDocument()
    expect(screen.getByText("T1 (4 places)")).toBeInTheDocument()
    // "Téléphone" appears twice: as info field label and as canal value
    expect(screen.getAllByText("Téléphone").length).toBeGreaterThanOrEqual(2)
    // "12:00" appears as time value
    expect(screen.getByText("12:00")).toBeInTheDocument()
  })

  it("shows status badge", () => {
    renderDetail()
    expect(screen.getByText("En attente")).toBeInTheDocument()
  })

  it('shows "Non assignée" when table is null', () => {
    renderDetail({
      reservation: makeReservation({ tableId: null, tableNumber: null }),
    })
    expect(screen.getByText("Non assignée")).toBeInTheDocument()
  })

  // ── Allergies & Diet types ──

  it("shows allergies and diet types when present", () => {
    renderDetail({
      reservation: makeReservation({
        allergies: [
          { id: 1, code: "PEANUT", label: "Arachides" },
          { id: 2, code: "GLUTEN", label: "Gluten" },
        ],
        dietTypes: [{ id: 1, code: "VEGETARIAN", label: "Végétarien" }],
      }),
    })

    expect(screen.getByText("Arachides")).toBeInTheDocument()
    expect(screen.getByText("Gluten")).toBeInTheDocument()
    expect(screen.getByText("Végétarien")).toBeInTheDocument()
  })

  it("hides allergy section when arrays are empty", () => {
    renderDetail()
    expect(screen.queryByText("Allergies")).not.toBeInTheDocument()
    expect(screen.queryByText("Régimes alimentaires")).not.toBeInTheDocument()
  })

  // ── Notes editing ──

  it("shows notes textarea with current value", () => {
    renderDetail()

    const textarea = screen.getByPlaceholderText("Ajouter une note...")
    expect(textarea).toHaveValue("Anniversaire")
  })

  it("shows save button when notes change", async () => {
    const user = userEvent.setup()
    renderDetail()

    // Initially no save button
    expect(
      screen.queryByRole("button", { name: "Enregistrer les notes" })
    ).not.toBeInTheDocument()

    const textarea = screen.getByPlaceholderText("Ajouter une note...")
    await user.clear(textarea)
    await user.type(textarea, "Nouvelle note")

    expect(
      screen.getByRole("button", { name: "Enregistrer les notes" })
    ).toBeInTheDocument()
  })

  it("calls onNotesChange on save", async () => {
    const user = userEvent.setup()
    const { onNotesChange } = renderDetail()

    const textarea = screen.getByPlaceholderText("Ajouter une note...")
    await user.clear(textarea)
    await user.type(textarea, "Nouvelle note")

    await user.click(
      screen.getByRole("button", { name: "Enregistrer les notes" })
    )

    expect(onNotesChange).toHaveBeenCalledWith("r1", "Nouvelle note")
  })

  // ── Status actions ──

  it("shows confirm/arrive/cancel buttons for en_attente status", () => {
    renderDetail()

    expect(
      screen.getByRole("button", { name: "Confirmer" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Marquer arrivée" })
    ).toBeInTheDocument()
    // There are 2 "Annuler" buttons: one in the status actions, one in the delete AlertDialog
    const cancelButtons = screen.getAllByRole("button", { name: "Annuler" })
    expect(cancelButtons.length).toBeGreaterThanOrEqual(1)
  })

  it("calls onStatusChange when confirm is clicked", async () => {
    const user = userEvent.setup()
    const { onStatusChange } = renderDetail()

    await user.click(screen.getByRole("button", { name: "Confirmer" }))

    expect(onStatusChange).toHaveBeenCalledWith("r1", "confirmee")
  })

  it("shows arrive/cancel/no-show buttons for confirmee status", () => {
    renderDetail({ reservation: makeReservation({ status: "confirmee" }) })

    expect(
      screen.getByRole("button", { name: "Marquer arrivée" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "No-show" })).toBeInTheDocument()
  })

  it("shows no status action buttons for arrivee status", () => {
    renderDetail({ reservation: makeReservation({ status: "arrivee" }) })

    expect(
      screen.queryByRole("button", { name: "Confirmer" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Marquer arrivée" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "No-show" })
    ).not.toBeInTheDocument()
  })

  // ── Delete flow ──

  it("shows delete trigger button", () => {
    renderDetail()

    const deleteButtons = screen.getAllByRole("button", {
      name: "Supprimer la réservation",
    })
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1)
  })

  it("opens confirmation dialog and calls onDelete", async () => {
    const user = userEvent.setup()
    const { onDelete } = renderDetail()

    const deleteButtons = screen.getAllByRole("button", {
      name: "Supprimer la réservation",
    })
    await user.click(deleteButtons[0])

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(
        screen.getByText("Supprimer cette réservation ?")
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/sera définitivement supprimée/)
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Supprimer" }))

    expect(onDelete).toHaveBeenCalledWith("r1")
  })

  it("shows loading state when isDeleting", () => {
    renderDetail({ isDeleting: true })

    const deleteButtons = screen.getAllByRole("button", {
      name: "Suppression...",
    })
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1)
    // The inner Button has disabled, but the AlertDialogTrigger wrapper may not.
    // Find the one with the disabled attribute.
    const disabledButton = deleteButtons.find((b) => b.hasAttribute("disabled"))
    expect(disabledButton).toBeTruthy()
  })

  // ── a11y ──

  it("has no axe violations", async () => {
    const { container } = renderDetail()

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

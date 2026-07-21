import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { axe } from "vitest-axe"
import { PinPad } from "@/components/ui/pin-pad"

describe("PinPad", () => {
  const defaultProps = {
    length: 4 as const,
    value: "",
    onChange: vi.fn(),
    onComplete: vi.fn(),
  }

  it("renders 10 digit buttons and a delete button", () => {
    render(<PinPad {...defaultProps} />)

    for (let i = 0; i <= 9; i++) {
      expect(
        screen.getByRole("button", { name: String(i) })
      ).toBeInTheDocument()
    }
    expect(
      screen.getByRole("button", { name: "Supprimer" })
    ).toBeInTheDocument()
  })

  it("calls onChange with appended digit on press", async () => {
    const onChange = vi.fn()
    render(<PinPad {...defaultProps} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "5" }))

    expect(onChange).toHaveBeenCalledWith("5")
  })

  it("calls onComplete when all digits are entered", async () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    // Simulate value at length-1
    render(
      <PinPad
        {...defaultProps}
        value="123"
        onChange={onChange}
        onComplete={onComplete}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "4" }))

    expect(onChange).toHaveBeenCalledWith("1234")
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("calls onChange to remove last digit on delete", async () => {
    const onChange = vi.fn()
    render(<PinPad {...defaultProps} value="12" onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }))

    expect(onChange).toHaveBeenCalledWith("1")
  })

  it("disables delete button when value is empty", () => {
    render(<PinPad {...defaultProps} value="" />)

    expect(screen.getByRole("button", { name: "Supprimer" })).toBeDisabled()
  })

  it("displays error message when error prop is set", () => {
    render(<PinPad {...defaultProps} error="PIN incorrect" />)

    expect(screen.getByText("PIN incorrect")).toBeInTheDocument()
  })

  it("disables all digit buttons when disabled", () => {
    render(<PinPad {...defaultProps} disabled />)

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole("button", { name: String(i) })).toBeDisabled()
    }
  })

  it("announces digit count via aria-live region", () => {
    render(<PinPad {...defaultProps} value="12" />)

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("2 chiffres saisis sur 4")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<PinPad {...defaultProps} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

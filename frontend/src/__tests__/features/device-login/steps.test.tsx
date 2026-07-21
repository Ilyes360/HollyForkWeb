import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { axe } from "vitest-axe"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import type { ReactNode } from "react"
import { DeviceSetupStep } from "@/pages/public/device-login/device-setup-step"
import { EmployeeSelectStep } from "@/pages/public/device-login/employee-select-step"
import { PinLoginStep } from "@/pages/public/device-login/pin-login-step"
import type { RestaurantEmployee } from "@/api/auth/types"
import { setTokens } from "@/api/client"

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockEmployee: RestaurantEmployee = {
  employeeId: 1,
  employeeName: "Jean Dupont",
  employeeFirstName: "Jean",
  employeeLastName: "Dupont",
  employeeType: "Manager Salle",
  employeeTypeId: 384,
  hasPin: true,
}

// ── Step 1: DeviceSetupStep ──

describe("DeviceSetupStep", () => {
  it("renders restaurant field and PIN pad", () => {
    render(<DeviceSetupStep onSuccess={vi.fn()} />, { wrapper: Wrapper })

    // NOTE: "Restaurant" label targets a <div> wrapper, not the input/select
    // directly. This is an A11Y DEBT — the label is non-labellable.
    expect(screen.getByText("Restaurant")).toBeInTheDocument()
    expect(screen.getByText("PIN Restaurant (6 chiffres)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument()
  })

  it("calls onSuccess after valid ID + PIN", async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<DeviceSetupStep onSuccess={onSuccess} />, { wrapper: Wrapper })

    // Fill restaurant ID in the input (fallback mode, not logged in)
    const input = screen.getByPlaceholderText("ID du restaurant")
    await user.type(input, "1")

    // Tap 6-digit PIN
    for (const d of ["1", "2", "3", "4", "5", "6"]) {
      await user.click(screen.getByRole("button", { name: d }))
    }

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceToken: "mock-device-token-abc123",
        restaurantName: "Les Ombres et Bar",
      })
    )
  })

  it("shows error on invalid restaurant PIN", async () => {
    const user = userEvent.setup()
    render(<DeviceSetupStep onSuccess={vi.fn()} />, { wrapper: Wrapper })

    const input = screen.getByPlaceholderText("ID du restaurant")
    await user.type(input, "999")

    for (const d of ["0", "0", "0", "0", "0", "0"]) {
      await user.click(screen.getByRole("button", { name: d }))
    }

    await waitFor(() => {
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })
  })

  it("shows Connexion classique link", () => {
    render(<DeviceSetupStep onSuccess={vi.fn()} />, { wrapper: Wrapper })

    expect(
      screen.getByRole("link", { name: /connexion classique/i })
    ).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<DeviceSetupStep onSuccess={vi.fn()} />, {
      wrapper: Wrapper,
    })
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ── Step 2: EmployeeSelectStep ──

describe("EmployeeSelectStep", () => {
  it("renders employee list after loading", async () => {
    render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Jean Dupont")).toBeInTheDocument()
    })

    expect(screen.getByText("Les Ombres et Bar")).toBeInTheDocument()
    expect(screen.getByText("Marie Martin")).toBeInTheDocument()
  })

  it("calls onSelect when clicking an employee with PIN", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={onSelect}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Jean Dupont")).toBeInTheDocument()
    })

    // Click Jean Dupont (has PIN)
    const jeanButton = screen.getByText("Jean Dupont").closest("button")!
    await user.click(jeanButton)

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 1,
        employeeFirstName: "Jean",
        hasPin: true,
      })
    )
  })

  it("disables employees without PIN", async () => {
    render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Marie Martin")).toBeInTheDocument()
    })

    const marieButton = screen.getByText("Marie Martin").closest("button")!
    expect(marieButton).toBeDisabled()
  })

  it("calls onBack when clicking 'Changer d'établissement'", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={vi.fn()}
        onBack={onBack}
      />,
      { wrapper: Wrapper }
    )

    await user.click(screen.getByRole("button", { name: /changer/i }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("shows empty message when no employees", async () => {
    render(
      <EmployeeSelectStep
        deviceToken="empty-restaurant"
        restaurantName="Restaurant Vide"
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText(/aucun employé/i)).toBeInTheDocument()
    })
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Jean Dupont")).toBeInTheDocument()
    })

    expect(await axe(container)).toHaveNoViolations()
  })
})

// ── Step 3: PinLoginStep ──

describe("PinLoginStep", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test", "test")
  })

  it("renders employee name and PIN pad", () => {
    render(
      <PinLoginStep
        deviceToken="mock-device-token-abc123"
        employee={mockEmployee}
        onBack={vi.fn()}
        onSessionExpired={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    expect(
      screen.getByRole("heading", { name: /jean dupont/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/PIN pour vous connecter/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument()
  })

  it("calls onBack when clicking Retour", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(
      <PinLoginStep
        deviceToken="mock-device-token-abc123"
        employee={mockEmployee}
        onBack={onBack}
        onSessionExpired={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    await user.click(screen.getByRole("button", { name: /retour/i }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("shows error on wrong PIN (0000)", async () => {
    const user = userEvent.setup()
    render(
      <PinLoginStep
        deviceToken="mock-device-token-abc123"
        employee={mockEmployee}
        onBack={vi.fn()}
        onSessionExpired={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    for (const d of ["0", "0", "0", "0"]) {
      await user.click(screen.getByRole("button", { name: d }))
    }

    await waitFor(() => {
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })
  })

  it("calls onSessionExpired on 401 expired token", async () => {
    const onSessionExpired = vi.fn()
    const user = userEvent.setup()
    render(
      <PinLoginStep
        deviceToken="expired-token"
        employee={mockEmployee}
        onBack={vi.fn()}
        onSessionExpired={onSessionExpired}
      />,
      { wrapper: Wrapper }
    )

    for (const d of ["1", "2", "3", "4"]) {
      await user.click(screen.getByRole("button", { name: d }))
    }

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PinLoginStep
        deviceToken="mock-device-token-abc123"
        employee={mockEmployee}
        onBack={vi.fn()}
        onSessionExpired={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

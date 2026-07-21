import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
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
    // Using getByText as workaround; the component should be fixed.
    expect(screen.getByText("Restaurant")).toBeInTheDocument()
    expect(screen.getByText("PIN Restaurant (6 chiffres)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument()
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

  it("renders heading 'Qui êtes-vous ?'", async () => {
    render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByRole("heading", { name: /qui/i })).toBeInTheDocument()
  })

  it("renders 'Changer d'établissement' button", async () => {
    render(
      <EmployeeSelectStep
        deviceToken="mock-device-token-abc123"
        restaurantName="Les Ombres et Bar"
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByRole("button", { name: /changer/i })).toBeInTheDocument()
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
  it("renders employee name and PIN pad", () => {
    setTokens("test", "test")
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

  it("renders back button", () => {
    render(
      <PinLoginStep
        deviceToken="mock-device-token-abc123"
        employee={mockEmployee}
        onBack={vi.fn()}
        onSessionExpired={vi.fn()}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByRole("button", { name: /retour/i })).toBeInTheDocument()
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

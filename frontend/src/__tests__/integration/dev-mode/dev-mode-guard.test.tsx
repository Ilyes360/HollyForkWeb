import { screen } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router"
import AuthGuard from "@/guards/auth-guard"
import GuestGuard from "@/guards/guest-guard"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createTestApp(
  guard: "auth" | "guest",
  initialEntries: string[],
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  if (guard === "auth") {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route path="/app" element={<div>Protected Content</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<div>Login Form</div>} />
          </Route>
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("AuthGuard with dev mode", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
  })

  it("bypasses auth check in dev mode (no token needed)", () => {
    useDevModeStore.setState({ isDevMode: true })
    createTestApp("auth", ["/app"])
    expect(screen.getByText("Protected Content")).toBeInTheDocument()
  })

  it("requires token in user mode", () => {
    useDevModeStore.setState({ isDevMode: false })
    createTestApp("auth", ["/app"])
    expect(screen.getByText("Login Page")).toBeInTheDocument()
  })
})

describe("GuestGuard with dev mode", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
  })

  it("redirects to / in dev mode (user considered logged in)", () => {
    useDevModeStore.setState({ isDevMode: true })
    createTestApp("guest", ["/login"])
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("shows login form in user mode when not authenticated", () => {
    useDevModeStore.setState({ isDevMode: false })
    createTestApp("guest", ["/login"])
    expect(screen.getByText("Login Form")).toBeInTheDocument()
  })
})

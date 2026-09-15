import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"

import AuthGuard from "@/guards/auth-guard"
import GuestGuard from "@/guards/guest-guard"
import PermissionGuard from "@/guards/permission-guard"
import { useAuthStore } from "@/stores/auth-store"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { clearTokens, getAccessToken, setTokens } from "@/api/client"
import {
  ensureBackendReachable,
  loginReal,
  passthroughReal,
} from "@/test/real-backend"

/**
 * These tests hit the REAL backend (see .env.local API_PROXY_TARGET) instead
 * of MSW mocks — see docs/testing/auth.md. Requires the backend running
 * locally. Test account: root/root ("compte test, tout est permis").
 *
 * The "require fails" / "requireAny fails" PermissionGuard cases use real
 * permissions that `root` genuinely does NOT have on this backend
 * ("manage_stocks", "manage_suppliers") rather than fabricated ones — no
 * MSW override needed for those, the negative case is real.
 *
 * A real JWT (signed by the actual backend) is required for the guard
 * tests that reach `/auth/profile/` or `/staff/permissions/me/` — a
 * fabricated token would fail real signature verification, so an "invalid
 * token" scenario uses a genuinely garbage string (not a fabricated
 * "expired" one, which would require the backend's signing secret).
 */

const REAL_PERMISSION_PRESENT = "manage_staff"
const REAL_PERMISSION_ABSENT = "manage_stocks"
const REAL_PERMISSION_ABSENT_2 = "manage_suppliers"

let realAccessToken: string

beforeAll(async () => {
  await ensureBackendReachable()
  const tokens = await loginReal("root", "root")
  realAccessToken = tokens.accessToken
})

function LoginPageStub() {
  const location = useLocation()
  const from = (location.state as { from?: string })?.from
  return (
    <div>
      <h1>Login Page</h1>
      {from && <p>from: {from}</p>}
    </div>
  )
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderAuthGuardApp(initialEntry: string | { pathname: string }) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/app" element={<div>Protected Content</div>} />
            <Route
              path="/reservations"
              element={<div>Protected Content</div>}
            />
            <Route path="/onboarding" element={<h1>Onboarding Page</h1>} />
          </Route>
          <Route path="/login" element={<LoginPageStub />} />
          <Route path="/device" element={<h1>Device Page</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function renderGuestGuardApp(initialEntry: string) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<div>Login Form</div>} />
          </Route>
          <Route path="/" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function renderPermissionGuardApp(
  props: {
    require?: string | string[]
    requireAny?: string[]
    fallback?: string
  } = {}
) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<PermissionGuard {...props} />}>
            <Route path="/admin" element={<div>Admin Content</div>} />
          </Route>
          <Route path="/" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  clearTokens()
  useAuthStore.getState().clearUser()
  useDevModeStore.setState({ isDevMode: false })
  passthroughReal(
    { method: "get", path: "*/api/auth/profile/" },
    { method: "get", path: "*/api/staff/permissions/me/" }
  )
})

afterEach(() => {
  sessionStorage.clear()
})

// ── AuthGuard ────────────────────────────────────────────────────────────

describe("AuthGuard", () => {
  it("redirects to /login with the current path in state.from when there is no token", () => {
    renderAuthGuardApp("/reservations")

    expect(
      screen.getByRole("heading", { name: "Login Page" })
    ).toBeInTheDocument()
    expect(screen.getByText("from: /reservations")).toBeInTheDocument()
  })

  it("renders the protected outlet when the token is valid and the real profile loads", async () => {
    setTokens(realAccessToken, "refresh")
    renderAuthGuardApp("/app")

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument()
    })
  })

  it("shows a loading spinner while the real profile request is pending", () => {
    setTokens(realAccessToken, "refresh")
    renderAuthGuardApp("/app")

    // TanStack Query starts isLoading=true synchronously on mount, before
    // the real network round-trip resolves — no artificial delay needed.
    expect(
      screen.getByRole("status", { name: /chargement/i })
    ).toBeInTheDocument()
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
  })

  it("clears tokens and redirects to /login when the token is invalid (real 401)", async () => {
    setTokens("garbage-invalid-token", "refresh")
    renderAuthGuardApp("/app")

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Login Page" })
      ).toBeInTheDocument()
    })
    expect(getAccessToken()).toBeNull()
  })

  it("redirects when a cross-tab auth:logout event fires", async () => {
    setTokens(realAccessToken, "refresh")
    useAuthStore.getState().setUser({
      id: 1,
      username: "root",
      email: "root@hollypi.com",
      firstName: "Admin",
      lastName: "System",
      employeeId: 307,
      employeeName: "Admin System",
      employeeType: "Super Admin Groupe",
      employeeTypeId: 25,
      restaurantId: 1,
      restaurantName: "Les Ombres et Bar",
    })
    renderAuthGuardApp("/app")

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument()
    })

    act(() => {
      window.dispatchEvent(new CustomEvent("auth:logout"))
    })

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Login Page" })
      ).toBeInTheDocument()
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("redirects to /onboarding when a pending restaurant flag is set", async () => {
    setTokens(realAccessToken, "refresh")
    sessionStorage.setItem("holy_pending_restaurant", "1")
    renderAuthGuardApp("/app")

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Onboarding Page" })
      ).toBeInTheDocument()
    })
  })

  it("bypasses the auth check entirely in dev mode, even without a token", () => {
    useDevModeStore.setState({ isDevMode: true })
    renderAuthGuardApp("/app")

    expect(screen.getByText("Protected Content")).toBeInTheDocument()
  })
})

// ── GuestGuard ───────────────────────────────────────────────────────────
// No network calls at all — reads only the Zustand store and token presence.

describe("GuestGuard", () => {
  it("redirects to / when authenticated with a token", () => {
    setTokens(realAccessToken, "refresh")
    useAuthStore.setState({ isAuthenticated: true })
    renderGuestGuardApp("/login")

    expect(
      screen.getByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument()
  })

  it("renders the outlet when not authenticated", () => {
    renderGuestGuardApp("/login")

    expect(screen.getByText("Login Form")).toBeInTheDocument()
  })

  it("redirects to / in dev mode regardless of auth state", () => {
    useDevModeStore.setState({ isDevMode: true })
    renderGuestGuardApp("/login")

    expect(
      screen.getByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument()
  })
})

// ── PermissionGuard ──────────────────────────────────────────────────────
// `root` genuinely has REAL_PERMISSION_PRESENT and genuinely lacks both
// REAL_PERMISSION_ABSENT and REAL_PERMISSION_ABSENT_2 on this backend — the
// negative cases are real, not fabricated.

describe("PermissionGuard", () => {
  beforeEach(() => {
    setTokens(realAccessToken, "refresh")
  })

  it("shows a loading spinner while permissions are being fetched", () => {
    renderPermissionGuardApp({ require: REAL_PERMISSION_PRESENT })

    expect(
      screen.getByRole("status", { name: /chargement/i })
    ).toBeInTheDocument()
  })

  it("redirects to the fallback when the required permission is genuinely missing", async () => {
    renderPermissionGuardApp({ require: REAL_PERMISSION_ABSENT })

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Dashboard" })
      ).toBeInTheDocument()
    })
  })

  it("renders the outlet when the required permission is genuinely present", async () => {
    renderPermissionGuardApp({ require: REAL_PERMISSION_PRESENT })

    await waitFor(() => {
      expect(screen.getByText("Admin Content")).toBeInTheDocument()
    })
  })

  it("redirects to the fallback when none of requireAny permissions match", async () => {
    renderPermissionGuardApp({
      requireAny: [REAL_PERMISSION_ABSENT, REAL_PERMISSION_ABSENT_2],
    })

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Dashboard" })
      ).toBeInTheDocument()
    })
  })

  it("renders the outlet when at least one requireAny permission matches", async () => {
    renderPermissionGuardApp({
      requireAny: [REAL_PERMISSION_ABSENT, REAL_PERMISSION_PRESENT],
    })

    await waitFor(() => {
      expect(screen.getByText("Admin Content")).toBeInTheDocument()
    })
  })
})

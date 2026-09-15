import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest"
import { axe } from "vitest-axe"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route } from "react-router"
import { toast } from "sonner"

import LoginPage from "@/pages/public/login"
import RegisterPage from "@/pages/public/register"
import ForgotPasswordPage from "@/pages/public/forgot-password"
import { ThemeProvider } from "@/components/theme-provider"
import { server } from "@/test/server"
import { clearTokens, getAccessToken } from "@/api/client"
import { useAuthStore } from "@/stores/auth-store"
import { ensureBackendReachable, passthroughReal } from "@/test/real-backend"

/**
 * These tests hit the REAL backend (see .env.local API_PROXY_TARGET) instead
 * of MSW mocks — see docs/testing/auth.md and
 * docs/testing/BUG-register-employee-type-id.md. Requires the backend
 * running locally. Test account: root/root ("compte test, tout est permis").
 *
 * Scenarios that cannot be safely or deterministically reproduced against a
 * shared real account are NOT tested here (documented, not silently
 * skipped):
 * - 429 rate limiting: would require spamming failed logins on the shared
 *   `root` account, risking a real lockout for every other test relying on
 *   it. Dropped.
 * - Login mutation hooks also fire a default onError toast (see
 *   `useMutationWithDefaults`) IN ADDITION to the component's own onError —
 *   both run on every error. Assertions target the component-specific
 *   outcome, not "only one toast fired".
 */

const TEST_USERNAME = "root"
const TEST_PASSWORD = "root"

beforeAll(async () => {
  await ensureBackendReachable()
})

beforeEach(() => {
  localStorage.clear()
  clearTokens()
  useAuthStore.getState().clearUser()
  passthroughReal(
    { method: "post", path: "*/api/auth/login/" },
    { method: "post", path: "*/api/auth/register/" }
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

function countRequestsTo(pathFragment: string) {
  let count = 0
  const listener = ({ request }: { request: Request }) => {
    if (request.url.includes(pathFragment)) count++
  }
  server.events.on("request:start", listener)
  return {
    get count() {
      return count
    },
    unsubscribe: () => server.events.removeListener("request:start", listener),
  }
}

/** Captures the JSON body of the first real request matching pathFragment. */
function captureRequestBody(pathFragment: string) {
  let body: Record<string, unknown> | undefined
  const listener = ({ request }: { request: Request }) => {
    if (request.url.includes(pathFragment)) {
      request
        .clone()
        .json()
        .then((json) => {
          body = json as Record<string, unknown>
        })
        .catch(() => {})
    }
  }
  server.events.on("request:start", listener)
  return {
    get body() {
      return body
    },
    unsubscribe: () => server.events.removeListener("request:start", listener),
  }
}

// ── LoginPage ─────────────────────────────────────────────────────────────

function renderLoginPage(locationState?: { from?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter
          initialEntries={[{ pathname: "/login", state: locationState }]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<h1>Dashboard</h1>} />
            <Route path="/register" element={<h1>Register Page</h1>} />
            <Route path="/device" element={<h1>Device Page</h1>} />
            <Route path="/reservations" element={<h1>Reservations Page</h1>} />
            <Route path="/forgot-password" element={<h1>Forgot Page</h1>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe("LoginPage", () => {
  it("renders initial form with no accessibility violations", async () => {
    const { container } = renderLoginPage()

    expect(
      screen.getByRole("heading", { name: /bon retour parmi nous/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email ou identifiant/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /se connecter/i })
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it("shows validation errors on empty submit and makes no API call", async () => {
    const user = userEvent.setup()
    const requests = countRequestsTo("/auth/login/")
    renderLoginPage()

    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    expect(
      await screen.findByText("L'email ou identifiant est requis")
    ).toBeInTheDocument()
    expect(screen.getByText("Le mot de passe est requis")).toBeInTheDocument()
    expect(requests.count).toBe(0)
    requests.unsubscribe()
  })

  it("redirects to the `from` location on successful login against the real backend", async () => {
    const user = userEvent.setup()
    renderLoginPage({ from: "/reservations" })

    await user.type(
      screen.getByLabelText(/email ou identifiant/i),
      TEST_USERNAME
    )
    await user.type(screen.getByLabelText(/^mot de passe$/i), TEST_PASSWORD)
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reservations Page" })
      ).toBeInTheDocument()
    })
    expect(getAccessToken()).toBeTruthy()
  })

  it("redirects to / when no `from` location is provided", async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(
      screen.getByLabelText(/email ou identifiant/i),
      TEST_USERNAME
    )
    await user.type(screen.getByLabelText(/^mot de passe$/i), TEST_PASSWORD)
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Dashboard" })
      ).toBeInTheDocument()
    })
  })

  it("derives username from a typed email address before submitting", async () => {
    // "root@holyfork.fr" has no characters the transform would strip, so a
    // successful login here proves the derived value ("root") was sent —
    // submitting the literal email string as username would fail against
    // the real backend (no such account exists).
    const user = userEvent.setup()
    const capture = captureRequestBody("/auth/login/")
    renderLoginPage()

    await user.type(
      screen.getByLabelText(/email ou identifiant/i),
      "root@holyfork.fr"
    )
    await user.type(screen.getByLabelText(/^mot de passe$/i), TEST_PASSWORD)
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Dashboard" })
      ).toBeInTheDocument()
    })
    expect(capture.body?.username).toBe("root")
    capture.unsubscribe()
  })

  it("shows a root form error on real 400 (wrong password) and does not navigate", async () => {
    const user = userEvent.setup()
    const { container } = renderLoginPage()

    await user.type(
      screen.getByLabelText(/email ou identifiant/i),
      TEST_USERNAME
    )
    await user.type(screen.getByLabelText(/^mot de passe$/i), "wrong-password")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    expect(
      await screen.findByText("Email ou mot de passe incorrect")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Dashboard" })
    ).not.toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it("has links to register and to device (tablet) login", async () => {
    const user = userEvent.setup()
    renderLoginPage()

    expect(
      screen.getByRole("link", { name: /créer un compte/i })
    ).toHaveAttribute("href", "/register")

    const deviceLink = screen.getByRole("link", { name: /connexion tablette/i })
    expect(deviceLink).toHaveAttribute("href", "/device")

    await user.click(deviceLink)
    expect(
      screen.getByRole("heading", { name: "Device Page" })
    ).toBeInTheDocument()
  })

  it("disables the submit button while the login mutation is pending", async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(
      screen.getByLabelText(/email ou identifiant/i),
      TEST_USERNAME
    )
    await user.type(screen.getByLabelText(/^mot de passe$/i), TEST_PASSWORD)
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    // TanStack Query flips isPending synchronously on mutate(), before the
    // real network round-trip resolves — no artificial delay needed.
    expect(screen.getByRole("button", { name: /connexion/i })).toBeDisabled()

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Dashboard" })
      ).toBeInTheDocument()
    })
  })
})

// ── RegisterPage ──────────────────────────────────────────────────────────

function renderRegisterPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<h1>Login Page</h1>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

async function fillValidRegisterForm(
  user: ReturnType<typeof userEvent.setup>,
  email: string
) {
  await user.type(screen.getByLabelText(/prénom/i), "Test")
  await user.type(screen.getByLabelText(/^nom$/i), "User")
  await user.type(screen.getByLabelText(/adresse email/i), email)
  await user.type(screen.getByLabelText(/^mot de passe$/i), "SecurePass1!")
  await user.type(
    screen.getByLabelText(/confirmer le mot de passe/i),
    "SecurePass1!"
  )
}

describe("RegisterPage", () => {
  it("renders initial form with no accessibility violations", async () => {
    const { container } = renderRegisterPage()

    expect(
      screen.getByRole("heading", { name: /créer un compte/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it("shows Zod validation errors and makes no API call on empty submit", async () => {
    // Note: the email input uses type="email", so a *non-empty* malformed
    // value is caught by native HTML5 constraint validation before the
    // submit event ever reaches React Hook Form — submitting empty avoids
    // that native short-circuit and exercises the actual Zod resolver path.
    const user = userEvent.setup()
    const requests = countRequestsTo("/auth/register/")
    renderRegisterPage()

    await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

    expect(await screen.findAllByText("Requis")).toHaveLength(2)
    expect(screen.getByText("Adresse email invalide")).toBeInTheDocument()
    expect(screen.getByText("Au moins 8 caractères")).toBeInTheDocument()
    expect(requests.count).toBe(0)
    requests.unsubscribe()
  })

  it("shows a mismatch error when the password confirmation differs", async () => {
    const user = userEvent.setup()
    const requests = countRequestsTo("/auth/register/")
    renderRegisterPage()

    await user.type(screen.getByLabelText(/prénom/i), "Test")
    await user.type(screen.getByLabelText(/^nom$/i), "User")
    await user.type(
      screen.getByLabelText(/adresse email/i),
      "test.user@holyfork.fr"
    )
    await user.type(screen.getByLabelText(/^mot de passe$/i), "SecurePass1!")
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "Different1!"
    )
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

    expect(
      await screen.findByText("Les mots de passe ne correspondent pas")
    ).toBeInTheDocument()
    expect(requests.count).toBe(0)
    requests.unsubscribe()
  })

  it("maps a real 400 duplicate-email error onto the email field", async () => {
    // root@hollypi.com is the real, already-registered email for the root
    // test account — the backend genuinely rejects this as non-unique.
    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidRegisterForm(user, "root@hollypi.com")
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

    expect(
      await screen.findByText("Ce champ doit être unique.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Login Page" })
    ).not.toBeInTheDocument()
  })

  it("KNOWN BUG (see docs/testing/BUG-register-employee-type-id.md): a fully valid new registration silently fails", async () => {
    // register.tsx hardcodes type_employe_id=383, which does not exist on
    // this backend (local seed only has ids 25-32). The real backend
    // rejects the request, but type_employe_id isn't a form field, so no
    // error message reaches the user at all. This test pins that actual
    // (broken) behavior — it must be updated, not deleted, once the bug is
    // fixed, since a real fix would make the registration succeed.
    const user = userEvent.setup()
    const toastErrorSpy = vi.spyOn(toast, "error")
    const uniqueEmail = `qa.register.${Date.now()}@holyfork.fr`
    renderRegisterPage()

    await fillValidRegisterForm(user, uniqueEmail)
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /créer mon compte/i })
      ).not.toBeDisabled()
    })
    expect(
      screen.queryByRole("heading", { name: "Login Page" })
    ).not.toBeInTheDocument()
    // No form field exists for type_employe_id, so register.tsx's own
    // onError can't surface it. The only visible trace is the *generic*
    // fallback toast fired by useMutationWithDefaults's default onError —
    // a raw ky/HTTP message, not the actual "type_employe_id invalide"
    // reason. The user sees no actionable explanation of what went wrong.
    expect(toastErrorSpy).toHaveBeenCalledWith(expect.stringContaining("400"))
  })
})

// ── ForgotPasswordPage ────────────────────────────────────────────────────
//
// NOTE: this page is a non-functional placeholder in production (disabled
// input, disabled submit button, form has no onSubmit handler — see
// src/pages/public/forgot-password.tsx). There is no API call to exercise
// against the real backend either way.

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<h1>Login Page</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("ForgotPasswordPage", () => {
  it("renders the placeholder message with no accessibility violations", async () => {
    const { container } = renderForgotPasswordPage()

    expect(screen.getByText(/mot de passe oublié/i)).toBeInTheDocument()
    expect(
      screen.getByText(/cette fonctionnalité sera bientôt disponible/i)
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it("disables the email input and submit button (feature not implemented)", () => {
    renderForgotPasswordPage()

    expect(screen.getByLabelText(/adresse email/i)).toBeDisabled()
    expect(
      screen.getByRole("button", { name: /envoyer les instructions/i })
    ).toBeDisabled()
  })

  it("links back to the login page", async () => {
    const user = userEvent.setup()
    renderForgotPasswordPage()

    const link = screen.getByRole("link", { name: /se connecter/i })
    expect(link).toHaveAttribute("href", "/login")

    await user.click(link)
    expect(
      screen.getByRole("heading", { name: "Login Page" })
    ).toBeInTheDocument()
  })
})

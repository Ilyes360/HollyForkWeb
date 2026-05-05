import { screen, waitFor } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router"
import AuthGuard from "@/guards/auth-guard"

function renderWithAuth(token?: string) {
  if (token) {
    localStorage.setItem("holly_access_token", token)
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("AuthGuard", () => {
  it("redirects to /login when no token", () => {
    renderWithAuth()
    expect(screen.getByText("Login Page")).toBeInTheDocument()
  })

  it("renders protected content with valid token", async () => {
    renderWithAuth("valid-token")

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument()
    })
  })

  it("redirects to /login when profile returns 401 (expired token)", async () => {
    renderWithAuth("expired-token")

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument()
    })
  })
})

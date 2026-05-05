import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes, useNavigate } from "react-router"
import { useLogout } from "@/api/auth/mutations"
import { setTokens } from "@/api/client"
import { useAuthStore } from "@/stores/auth-store"

function LogoutButton() {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <button
      onClick={() =>
        logout.mutate(undefined, {
          onSettled: () => navigate("/login"),
        })
      }
    >
      Déconnexion
    </button>
  )
}

function renderLogoutTest() {
  // Setup authenticated state
  setTokens("test-access", "test-refresh")
  useAuthStore.getState().setUser({
    id: 1,
    username: "test",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    employeeId: null,
    employeeName: null,
    employeeType: null,
    employeeTypeId: null,
    restaurantId: null,
    restaurantName: null,
  })

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/app" element={<LogoutButton />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Logout", () => {
  it("clears tokens, clears store, and redirects to login", async () => {
    const user = userEvent.setup()
    renderLogoutTest()

    await user.click(screen.getByRole("button", { name: /déconnexion/i }))

    await waitFor(() => {
      expect(localStorage.getItem("holly_access_token")).toBeNull()
      expect(localStorage.getItem("holly_refresh_token")).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(screen.getByText("Login Page")).toBeInTheDocument()
    })
  })
})

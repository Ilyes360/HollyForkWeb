import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { renderWithProviders } from "@/test/render"
import LoginPage from "@/pages/public/login"

describe("Login page", () => {
  it("logs in successfully and stores tokens", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, {
      routerProps: { initialEntries: ["/login"] },
    })

    await user.type(screen.getByPlaceholderText("Identifiant"), "marie.dupont")
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(localStorage.getItem("holy_access_token")).toBeTruthy()
      expect(localStorage.getItem("holy_refresh_token")).toBeTruthy()
    })
  })

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, {
      routerProps: { initialEntries: ["/login"] },
    })

    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText(/l'identifiant est requis/i)).toBeInTheDocument()
    })
  })

  it("shows error message on 401", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, {
      routerProps: { initialEntries: ["/login"] },
    })

    await user.type(screen.getByPlaceholderText("Identifiant"), "bad")
    await user.type(
      screen.getByPlaceholderText("Mot de passe"),
      "wrongpassword"
    )
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(
        screen.getByText("Email ou mot de passe incorrect")
      ).toBeInTheDocument()
    })
  })

  it("shows toast on 429 rate limit", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, {
      routerProps: { initialEntries: ["/login"] },
    })

    await user.type(screen.getByPlaceholderText("Identifiant"), "rate_limited")
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(localStorage.getItem("holy_access_token")).toBeNull()
    })
  })

  it("shows toast on 500 server error", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, {
      routerProps: { initialEntries: ["/login"] },
    })

    await user.type(screen.getByPlaceholderText("Identifiant"), "error")
    await user.type(screen.getByPlaceholderText("Mot de passe"), "password123")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    await waitFor(() => {
      expect(localStorage.getItem("holy_access_token")).toBeNull()
    })
  })
})

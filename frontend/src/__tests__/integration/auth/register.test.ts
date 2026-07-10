import { describe, it, expect, beforeEach, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { useRegister } from "@/api/auth/mutations"

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Register mutation", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    // Default handler for register
    server.use(
      http.post("*/api/auth/register/", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          {
            message: "Compte créé",
            id_user: 100,
            username: body.username,
            email: body.email,
            first_name: body.first_name ?? "",
            last_name: body.last_name ?? "",
            verification_token: null,
            next_step: null,
            employee_id: 50,
            employee_name: `${body.employee_first_name} ${body.employee_last_name}`,
            employee_first_name: body.employee_first_name,
            employee_last_name: body.employee_last_name,
            employee_type: "Admin Établissement",
            employee_type_id: 2,
          },
          { status: 201 }
        )
      })
    )
  })

  it("registers a new user via POST", async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      username: "test_user",
      email: "test@example.com",
      password: "Secure123!",
      password2: "Secure123!",
      firstName: "Test",
      lastName: "User",
      employeeFirstName: "Test",
      employeeLastName: "User",
      pinCode: "1234",
      typeEmployeId: 2,
      restaurantId: 1,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toMatchObject({
      idUser: 100,
      username: "test_user",
      email: "test@example.com",
    })
  })

  it("handles 400 validation error (duplicate email)", async () => {
    server.use(
      http.post("*/api/auth/register/", () => {
        return HttpResponse.json(
          { email: ["Un utilisateur avec cet email existe déjà."] },
          { status: 400 }
        )
      })
    )

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      username: "dupe_user",
      email: "existing@example.com",
      password: "Secure123!",
      password2: "Secure123!",
      firstName: "Test",
      lastName: "User",
      employeeFirstName: "Test",
      employeeLastName: "User",
      pinCode: "1234",
      typeEmployeId: 2,
      restaurantId: 1,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("handles 400 password mismatch", async () => {
    server.use(
      http.post("*/api/auth/register/", () => {
        return HttpResponse.json(
          { password2: ["Les mots de passe ne correspondent pas."] },
          { status: 400 }
        )
      })
    )

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      username: "test_user",
      email: "test@example.com",
      password: "Secure123!",
      password2: "Different456!",
      firstName: "Test",
      lastName: "User",
      employeeFirstName: "Test",
      employeeLastName: "User",
      pinCode: "1234",
      typeEmployeId: 2,
      restaurantId: 1,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

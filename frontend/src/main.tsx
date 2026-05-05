import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import "./index.css"
import { queryClient } from "@/api/query-client"
import { ensureCsrfCookie } from "@/api/client"
import { ThemeProvider } from "@/components/theme-provider"
import { DevModeToggle } from "@/components/dev-mode-toggle"
import { router } from "@/router"

// Fetch CSRF cookie early so POST requests (login, register) have it available
ensureCsrfCookie()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
        {import.meta.env.DEV && <DevModeToggle />}
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)

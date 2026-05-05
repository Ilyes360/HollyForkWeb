import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useAdminStore } from "@/stores/admin-store"

type ApiRole = {
  id: number
  name: string
  description: string
  permissions: string[]
}

const keys = {
  all: ["roles"] as const,
  list: () => [...keys.all, "list"] as const,
}

/**
 * List all roles.
 * Dev mode: reads from admin store. User mode: fetches from API.
 */
export function useRoles() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const storeData = useAdminStore((s) => s.roles)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = await apiGet<{ roles: ApiRole[] }>("staff/roles/all/")
      return res.roles
    },
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: storeData,
      isLoading: false,
      isError: false,
      source: "mock" as const,
    }
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    source: "api" as const,
  }
}
